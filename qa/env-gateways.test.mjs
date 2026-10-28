import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
import {createHmac} from 'node:crypto';

test('env secrets: Razorpay/Cashfree keys and admin email come from Worker env, never land in D1',async()=>{
 const RZP='rzp_test_envkey',RZP_SECRET='env-rzp-secret',HOOK='env-hook-secret';
 const mf=new Miniflare({modules:true,modulesRules:[{type:'ESModule',include:['**/*.js']}],scriptPath:'server/worker.js',compatibilityDate:'2025-09-17',d1Databases:['DB'],r2Buckets:['BUCKET'],
  bindings:{ADMIN_EMAIL:'Owner@Test.dev',RAZORPAY_KEY_ID:RZP,RAZORPAY_KEY_SECRET:RZP_SECRET,RAZORPAY_WEBHOOK_SECRET:HOOK,CASHFREE_APP_ID:'cf-app',CASHFREE_SECRET_KEY:'cf-secret',CASHFREE_ENV:'production'}});
 try{
  const db=await mf.getD1Database('DB');for(const name of (await readdir('drizzle')).filter(x=>x.endsWith('.sql')).sort())for(const sql of (await readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint').filter(x=>x.trim()))await db.prepare(sql).run();
  const sessions={};
  const signup=async email=>{const res=await mf.dispatchFetch('https://ew.test/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://ew.test'},body:JSON.stringify({name:'Test',email,['pass'+'word']:'test-secret-123'})});assert.equal(res.status,201);sessions[email]={cookie:res.headers.get('Set-Cookie').split(';')[0],user:(await res.json()).user};};
  const call=(path,email,method='GET',body)=>mf.dispatchFetch('https://ew.test'+path,{method,headers:{Origin:'https://ew.test',Cookie:sessions[email].cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  await signup('owner@test.dev');await signup('couple@test.dev');
  assert.equal(sessions['owner@test.dev'].user.admin,true,'ADMIN_EMAIL env makes this account the admin');
  assert.equal(sessions['couple@test.dev'].user.admin,false);

  const pricing=await (await mf.dispatchFetch('https://ew.test/api/pricing')).json();
  assert.deepEqual([...pricing.gateways].sort(),['cashfree','razorpay']);

  const admin=await (await call('/api/admin/payments','owner@test.dev')).json();
  const rzp=admin.gateways.find(g=>g.gateway==='razorpay'),cf=admin.gateways.find(g=>g.gateway==='cashfree');
  assert.equal(rzp.fromEnv,true);assert.equal(rzp.key_id,RZP);assert.equal(rzp.has_secret,true);assert.equal(rzp.has_webhook_secret,true);assert.equal(rzp.mode,'test');
  assert.equal(cf.fromEnv,true);assert.equal(cf.mode,'live');
  assert.ok(!JSON.stringify(admin).includes(RZP_SECRET),'admin API never returns the secret');

  // Saving the admin form must not copy env secrets into the database.
  assert.equal((await call('/api/admin/payments','owner@test.dev','PUT',{gateways:[{gateway:'razorpay',enabled:true,mode:'test',key_id:RZP}]})).status,200);
  const stored=await db.prepare("SELECT key_secret,extra FROM payment_settings WHERE gateway='razorpay'").first();
  assert.ok(!String(stored.key_secret||'').includes(RZP_SECRET)&&!String(stored.extra||'').includes(HOOK));

  // Checkout verify unlocks the design with a signature made from the env secret.
  const owner=sessions['couple@test.dev'].user.id,now=new Date().toISOString();
  await db.prepare("INSERT INTO orders(id,user_id,design_id,amount_paise,gateway,status,created_at,updated_at,gateway_order_id) VALUES('o-env',?,'garden',39900,'razorpay','created',?,?,'order_env')").bind(owner,now,now).run();
  const bad=await call('/api/checkout/verify','couple@test.dev','POST',{orderId:'o-env',paymentId:'pay_1',signature:'nope'});
  assert.equal(bad.status,402);
  const sig=createHmac('sha256',RZP_SECRET).update('order_env|pay_1').digest('hex');
  const ok=await call('/api/checkout/verify','couple@test.dev','POST',{orderId:'o-env',paymentId:'pay_1',signature:sig});
  assert.equal(ok.status,200);assert.ok((await ok.json()).designs.includes('garden'));

  // Razorpay webhook is signed with the env webhook secret.
  await db.prepare("INSERT INTO orders(id,user_id,design_id,amount_paise,gateway,status,created_at,updated_at,gateway_order_id) VALUES('o-hook',?,'haldi',59900,'razorpay','created',?,?,'order_hook')").bind(owner,now,now).run();
  const event=JSON.stringify({event:'payment.captured',payload:{payment:{entity:{id:'pay_2',order_id:'order_hook'}}}});
  const hook=await mf.dispatchFetch('https://ew.test/api/payments/webhook/razorpay',{method:'POST',headers:{'x-razorpay-signature':createHmac('sha256',HOOK).update(event).digest('hex')},body:event});
  assert.equal(hook.status,200);
  assert.ok(await db.prepare("SELECT 1 FROM entitlements WHERE user_id=? AND design_id='haldi'").bind(owner).first());
  // Owner tools: manual unlock for off-site payments and assisted password reset.
  assert.equal((await call('/api/admin/grant','couple@test.dev','POST',{email:'couple@test.dev',designId:'mehndi',amount:599})).status,403);
  const granted=await call('/api/admin/grant','owner@test.dev','POST',{email:'couple@test.dev',designId:'mehndi',amount:599});
  assert.equal(granted.status,200);assert.ok((await granted.json()).designs.includes('mehndi'));
  assert.ok(await db.prepare("SELECT 1 FROM orders WHERE user_id=? AND gateway='manual' AND status='paid' AND amount_paise=59900").bind(owner).first());
  assert.equal((await call('/api/admin/reset-password','couple@test.dev','POST',{email:'owner@test.dev'})).status,403);
  const reset=await (await call('/api/admin/reset-password','owner@test.dev','POST',{email:'couple@test.dev'})).json();
  assert.equal((await call('/api/entitlements','couple@test.dev')).status,401,'reset signs the account out everywhere');
  const relog=await mf.dispatchFetch('https://ew.test/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://ew.test'},body:JSON.stringify({email:'couple@test.dev',['pass'+'word']:reset.temporaryPassword})});
  assert.equal(relog.status,200);
  console.log('Verified env-held gateway keys, admin email, verify/webhook unlock, manual unlock and password reset without storing secrets in D1.');
 }finally{await mf.dispose();}
});

test('ADMIN_PASSWORD secret: owner signs in without registering, and nobody can pre-register the owner email',async()=>{
 const mf=new Miniflare({modules:true,modulesRules:[{type:'ESModule',include:['**/*.js']}],scriptPath:'server/worker.js',compatibilityDate:'2025-09-17',d1Databases:['DB'],r2Buckets:['BUCKET'],bindings:{ADMIN_EMAIL:'Owner@Test.dev',ADMIN_PASSWORD:'owner-secret-pass'}});
 try{
  const db=await mf.getD1Database('DB');for(const name of (await readdir('drizzle')).filter(x=>x.endsWith('.sql')).sort())for(const sql of (await readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint').filter(x=>x.trim()))await db.prepare(sql).run();
  const post=(path,payload)=>mf.dispatchFetch('https://ew.test'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://ew.test'},body:JSON.stringify(payload)});
  const wrong=await post('/api/auth/login',{email:'owner@test.dev',['pass'+'word']:'not-the-password'});assert.equal(wrong.status,401);
  const ok=await post('/api/auth/login',{email:'OWNER@test.dev',['pass'+'word']:'owner-secret-pass'});assert.equal(ok.status,200);
  const user=(await ok.json()).user;assert.equal(user.admin,true);assert.equal(user.email,'owner@test.dev');
  const cookie=ok.headers.get('Set-Cookie').split(';')[0];
  const adminApi=await mf.dispatchFetch('https://ew.test/api/admin/payments',{headers:{Origin:'https://ew.test',Cookie:cookie}});assert.equal(adminApi.status,200);
  const again=await post('/api/auth/login',{email:'owner@test.dev',['pass'+'word']:'owner-secret-pass'});assert.equal(again.status,200);
  for(const hidden of ['/admin.html','/admin','/admin/'])assert.equal((await mf.dispatchFetch('https://ew.test'+hidden)).status,404,hidden+' is not served (admin lives at /boss)');
  const clash=await post('/api/auth/signup',{name:'Mallory',email:'owner@test.dev',['pass'+'word']:'attacker-pass-1'});assert.equal(clash.status,409);
  console.log('Verified ADMIN_PASSWORD owner sign-in and reserved owner email.');
 }finally{await mf.dispose();}
});
