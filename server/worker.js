import {normalizeConfig} from '../public/config.js';
import {validAudioHeader,AUDIO_TYPES} from '../public/audio-upload.js';
import {exportAccountZip,eraseAccountData} from './account-data.js';
import {inviteProgress} from './invite-progress.js';
import {catalogPayload,SUPPORT,CATALOG_DESIGNS} from './catalog.js';
const EW_ORIGIN='EW-ORIGIN-2026-369eafc22a98';
/* Sign-in lifetime, the owner's rule: 15 quiet minutes brings a warning
   with a 2-minute countdown on screen (auth.js), and no answer signs the
   visitor out. The server enforces the same clock — a session untouched
   for IDLE_MAX_MS (15 minutes + the 2-minute warning) is ended here, so a
   tab left open or closed cannot keep a session alive. SESSION_DAYS is
   only the absolute backstop on top of that. */
const SESSION_DAYS=7;
const SESSION_MS=SESSION_DAYS*86400000;
const SESSION_COOKIE_AGE=SESSION_MS/1000;
const IDLE_MAX_MS=17*60*1000;
let sessionColsReady=false;
async function ensureSessionColumns(env){
 if(sessionColsReady||!env.DB)return;sessionColsReady=true;
 try{await env.DB.prepare('ALTER TABLE sessions ADD COLUMN last_seen_at TEXT').run();}catch(e){/* column already there */}
 try{await env.DB.prepare('ALTER TABLE sessions ADD COLUMN kind TEXT').run();}catch(e){/* column already there */}
}
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-EW-Origin':EW_ORIGIN,'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Strict-Transport-Security':'max-age=31536000; includeSubDomains',...headers}});
/* Security-pass helpers (2026-11): HTML escaping for the worker-rendered
   receipt pages, per-account login lockout, the boss audit log, outgoing
   mail (used by boss two-step login), and the random vendor identity code. */
const escHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LOGIN_FAIL_WINDOW=900,LOGIN_FAIL_MAX=8;
async function loginFailBucket(env,email){const now=Math.floor(Date.now()/1000),win=Math.floor(now/LOGIN_FAIL_WINDOW);return{bucket:'lf:'+(await sha256hex(String(email||'').toLowerCase())).slice(0,24)+':'+win,win};}
async function loginLocked(env,email){try{const{bucket}=await loginFailBucket(env,email);const row=await db(env).prepare('SELECT count FROM rate_limits WHERE bucket=?').bind(bucket).first();return!!(row&&row.count>=LOGIN_FAIL_MAX);}catch{return false;}}
async function noteLoginFail(env,email){try{const{bucket,win}=await loginFailBucket(env,email);await db(env).prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,?,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1').bind(bucket,1,(win+1)*LOGIN_FAIL_WINDOW).run();}catch{}}
async function clearLoginFails(env,email){try{const h=(await sha256hex(String(email||'').toLowerCase())).slice(0,24);await db(env).prepare("DELETE FROM rate_limits WHERE bucket LIKE ?").bind('lf:'+h+':%').run();}catch{}}
/* Session rotation on sign-in: a fresh login ends the account's other
   sessions of the same kind, so a stolen old cookie dies the moment the
   real owner signs in again. */
async function rotateSessions(env,userId,kind){if(!userId)return;try{await db(env).prepare('DELETE FROM sessions WHERE user_id=? AND kind=?').bind(userId,kind).run();}catch{}}
let auditReady=false;
async function audit(env,admin,action,target='',detail=''){
 try{
  if(!auditReady){auditReady=true;await db(env).prepare('CREATE TABLE IF NOT EXISTS admin_audit(id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL DEFAULT \'\',detail TEXT NOT NULL DEFAULT \'\',created_at TEXT NOT NULL)').run().catch(()=>{});}
  await db(env).prepare('INSERT INTO admin_audit(id,actor,action,target,detail,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),String(admin?.email||'owner').slice(0,120),String(action).slice(0,60),String(target).slice(0,160),String(detail).slice(0,300),new Date().toISOString()).run();
 }catch{}
}
/* Outgoing mail. Transports, in order: Resend (RESEND_API_KEY + MAIL_FROM),
   else a generic JSON webhook (MAIL_WEBHOOK_URL). With neither configured
   the function reports not-configured — callers must fail honestly rather
   than pretend a code was sent. */
async function sendMail(env,{to,subject,text}){
 try{
  if(env.RESEND_API_KEY){const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.MAIL_FROM||'Easy Wedding <no-reply@easywedding.in>',to:[to],subject,text})});if(r.ok)return{ok:true,via:'resend'};return{ok:false,reason:'provider-'+r.status};}
  if(env.MAIL_WEBHOOK_URL){const r=await fetch(env.MAIL_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to,subject,text})});if(r.ok)return{ok:true,via:'webhook'};return{ok:false,reason:'webhook-'+r.status};}
  return{ok:false,reason:'not-configured'};
 }catch(e){return{ok:false,reason:'send-failed'};}
}
async function siteSetting(env,key){try{const r=await db(env).prepare('SELECT value FROM site_settings WHERE key=?').bind(key).first();return r?.value??null;}catch{return null;}}
async function setSiteSetting(env,key,value){await db(env).prepare('INSERT INTO site_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,String(value)).run();}
/* Vendor identity: EW-VND- + a crypto-random 6-digit number. The column is
   UNIQUE, and assignment retries on collision, so two vendors can never
   share a code and a code, once given, never changes and is never reused. */
function randomVendorCode(){return 'EW-VND-'+(100000+(crypto.getRandomValues(new Uint32Array(1))[0]%900000));}
async function ensureVendorCode(env,row){
 if(!row||!row.id)return null;
 if(row.vendor_code)return row.vendor_code;
 for(let i=0;i<15;i++){
  const code=randomVendorCode();
  try{
   const r=await db(env).prepare("UPDATE vendors SET vendor_code=? WHERE id=? AND (vendor_code IS NULL OR vendor_code='')").bind(code,row.id).run();
   if(r.meta&&r.meta.changes){row.vendor_code=code;return code;}
   const fresh=await db(env).prepare('SELECT vendor_code FROM vendors WHERE id=?').bind(row.id).first();
   if(fresh&&fresh.vendor_code){row.vendor_code=fresh.vendor_code;return fresh.vendor_code;}
  }catch(e){/* UNIQUE collision with another vendor: draw a new number */}
 }
 return row.vendor_code||null;
}
/* Album share PIN: the owner may protect a shared album with a 4-digit PIN
   (stored only as a hash). A correct entry earns a per-album cookie whose
   value is derived from the share token + the current PIN hash, so changing
   or removing the PIN immediately invalidates every earlier unlock. */
const albumPinCookieName=id=>'ew_apin_'+String(id).slice(0,8);
async function albumPinProof(album){return sha256hex(String(album.share_token)+':'+String(album.share_pin_hash));}
async function albumPinOk(request,album){
 if(!album||!album.share_pin_hash)return true;
 const want=albumPinCookieName(album.id)+'='+await albumPinProof(album);
 return (request.headers.get('Cookie')||'').split(';').some(c=>c.trim()===want);
}
function receiptPage(title,inner){return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escHtml(title)+' · Easy Wedding</title><style>body{font-family:Georgia,serif;background:#faf6ef;color:#33272b;margin:0;padding:24px}main{max-width:640px;margin:0 auto;background:#fff;border:1px solid #e7d9c4;border-radius:16px;padding:28px}h1{font-size:22px;color:#75152e;margin:0 0 4px}p.sub{color:#8a6d3b;margin:0 0 18px}table{width:100%;border-collapse:collapse;font-size:15px}td{padding:8px 4px;border-bottom:1px solid #f0e7d8;vertical-align:top}td.k{color:#7a6a58;width:42%}td.v{text-align:right;font-weight:600}.total td{font-size:17px;color:#75152e;border-bottom:0}button{margin-top:20px;background:#75152e;color:#fff;border:0;border-radius:999px;padding:12px 22px;font-size:15px;cursor:pointer}@media print{button{display:none}body{background:#fff}}</style><script defer src="/receipt.js"></script></head><body><main>'+inner+'</main></body></html>';}
function receiptResponse(html){return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'no-referrer','Strict-Transport-Security':'max-age=31536000; includeSubDomains','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'self'; base-uri 'self'"}});}
const inrHtml=p=>'₹'+(Math.round(Number(p)||0)/100).toLocaleString('en-IN',{maximumFractionDigits:2});
async function rateHit(env,name,request,limit,windowSec){
 const ip=(request.headers.get('CF-Connecting-IP')||'unknown').slice(0,64);
 const now=Math.floor(Date.now()/1000),win=Math.floor(now/windowSec),bucket=name+':'+ip+':'+win,expires=(win+1)*windowSec;
 try{
  await db(env).prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,?,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1').bind(bucket,1,expires).run();
  if(Math.random()<0.02)await db(env).prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(now).run();
  const row=await db(env).prepare('SELECT count FROM rate_limits WHERE bucket=?').bind(bucket).first();
  if(row&&row.count>limit)fail('Too many attempts. Please wait a little and try again.',429);
 }catch(e){if(e&&e.status===429)throw e;}
}
async function emailHit(env,email,limit,windowSec){
 const now=Math.floor(Date.now()/1000),win=Math.floor(now/windowSec),bucket='fe:'+(await sha256hex(email)).slice(0,24)+':'+win;
 try{
  await db(env).prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,?,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1').bind(bucket,1,(win+1)*windowSec).run();
  const row=await db(env).prepare('SELECT count FROM rate_limits WHERE bucket=?').bind(bucket).first();
  if(row&&row.count>limit)fail('Too many attempts for this email. Please try again in an hour.',429);
 }catch(e){if(e&&e.status===429)throw e;}
}
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const db=env=>{if(!env.DB)fail('Wedding storage is unavailable. Please try again.',503);return env.DB;};
const textEnc=new TextEncoder();
const b64encode=bytes=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);};
const b64decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function sha256hex(text){const digest=await crypto.subtle.digest('SHA-256',textEnc.encode(text));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function hashPassword(password,saltB64,iterations){const key=await crypto.subtle.importKey('raw',textEnc.encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:b64decode(saltB64),iterations},key,256);return b64encode(new Uint8Array(bits));}
async function makePasswordRecord(password){const salt=b64encode(crypto.getRandomValues(new Uint8Array(16)));return 'pbkdf2$100000$'+salt+'$'+await hashPassword(password,salt,100000);}
async function verifyPassword(password,record){const parts=String(record||'').split('$');if(parts.length!==4||parts[0]!=='pbkdf2')return false;const actual=await hashPassword(password,parts[2],Number(parts[1]));if(actual.length!==parts[3].length)return false;let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^parts[3].charCodeAt(i);return diff===0;}
function sessionToken(request){const match=/(?:^|;\s*)ew_session=([a-f0-9]{64})/.exec(request.headers.get('Cookie')||'');return match?match[1]:null;}
function sessionCookie(token,maxAge){return 'ew_session='+token+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age='+maxAge;}
async function currentUser(request,env){const token=sessionToken(request);if(!token||!env.DB)return null;await ensureSessionColumns(env);const hash=await sha256hex(token);const row=await env.DB.prepare('SELECT u.id,u.email,u.name,s.created_at AS s_created,s.last_seen_at AS s_seen FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>? AND s.created_at>? AND (s.kind IS NULL OR s.kind=?)').bind(hash,new Date().toISOString(),new Date(Date.now()-SESSION_MS).toISOString(),'user').first();if(!row)return null;const nowMs=Date.now(),seenMs=Date.parse(row.s_seen||row.s_created);if(!isNaN(seenMs)){if(nowMs-seenMs>IDLE_MAX_MS){await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(hash).run().catch(()=>{});return null;}if(nowMs-seenMs>60000)await env.DB.prepare('UPDATE sessions SET last_seen_at=? WHERE id=?').bind(new Date(nowMs).toISOString(),hash).run().catch(()=>{});}return{id:row.id,email:row.email,name:row.name};}
async function startSession(env,userId,kind){await ensureSessionColumns(env);const token=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');const now=new Date();await db(env).prepare('INSERT INTO sessions(id,user_id,created_at,expires_at,last_seen_at,kind) VALUES(?,?,?,?,?,?)').bind(await sha256hex(token),userId,now.toISOString(),new Date(now.getTime()+SESSION_MS).toISOString(),now.toISOString(),kind||'user').run();return token;}
/* The admin console (/boss) has its OWN session, fully separate from the
   website's: it lives in a different cookie (ew_admin) and a different
   session kind, so signing in to the console never signs the browser in
   to the website, and a website sign-in never opens the console. */
function adminToken(request){const match=/(?:^|;\s*)ew_admin=([a-f0-9]{64})/.exec(request.headers.get('Cookie')||'');return match?match[1]:null;}
function adminCookie(token,maxAge){return 'ew_admin='+token+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age='+maxAge;}
async function currentAdmin(request,env){const token=adminToken(request);if(!token||!env.DB)return null;await ensureSessionColumns(env);const hash=await sha256hex(token);const row=await env.DB.prepare('SELECT u.id,u.email,u.name,s.created_at AS s_created,s.last_seen_at AS s_seen FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>? AND s.created_at>? AND s.kind=?').bind(hash,new Date().toISOString(),new Date(Date.now()-SESSION_MS).toISOString(),'admin').first();if(!row)return null;const nowMs=Date.now(),seenMs=Date.parse(row.s_seen||row.s_created);if(!isNaN(seenMs)){if(nowMs-seenMs>IDLE_MAX_MS){await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(hash).run().catch(()=>{});return null;}if(nowMs-seenMs>60000)await env.DB.prepare('UPDATE sessions SET last_seen_at=? WHERE id=?').bind(new Date(nowMs).toISOString(),hash).run().catch(()=>{});}return{id:row.id,email:row.email,name:row.name};}
const hexOf=buf=>[...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function hmacHex(secret,data){const key=await crypto.subtle.importKey('raw',textEnc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hexOf(await crypto.subtle.sign('HMAC',key,textEnc.encode(data)));}
async function hmacB64(secret,data){const key=await crypto.subtle.importKey('raw',textEnc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64encode(new Uint8Array(await crypto.subtle.sign('HMAC',key,textEnc.encode(data))));}
async function sha512hex(text){return hexOf(await crypto.subtle.digest('SHA-512',textEnc.encode(text)));}
function safeEq(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
const GATEWAYS=['razorpay','cashfree','phonepe','payu'];
// Keys set as Worker secrets (Cloudflare dashboard / `wrangler secret put`) win
// over keys typed into the admin panel, so live secrets never have to sit in D1.
function envGateway(env,g){
 if(g==='razorpay'&&env.RAZORPAY_KEY_ID&&env.RAZORPAY_KEY_SECRET)return {gateway:g,enabled:1,mode:String(env.RAZORPAY_KEY_ID).startsWith('rzp_live_')?'live':'test',key_id:env.RAZORPAY_KEY_ID,key_secret:env.RAZORPAY_KEY_SECRET,extra:JSON.stringify({['webhook_'+'secret']:env.RAZORPAY_WEBHOOK_SECRET||''}),fromEnv:true};
 if(g==='cashfree'&&env.CASHFREE_APP_ID&&env.CASHFREE_SECRET_KEY)return {gateway:g,enabled:1,mode:/^(prod|production|live)$/i.test(String(env.CASHFREE_ENV||''))?'live':'test',key_id:env.CASHFREE_APP_ID,key_secret:env.CASHFREE_SECRET_KEY,extra:'{}',fromEnv:true};
 return null;
}
async function gatewayRow(env,g){return envGateway(env,g)||db(env).prepare('SELECT gateway,enabled,mode,key_id,key_secret,extra FROM payment_settings WHERE gateway=?').bind(g).first();}
function extraOf(row){try{return JSON.parse(row?.extra||'{}')||{}}catch{return{}}}
function usable(row){return !!(row&&row.enabled&&row.key_id&&row.key_secret);}
async function adminEmail(env){if(env.ADMIN_EMAIL)return String(env.ADMIN_EMAIL).trim().toLowerCase();try{const row=await db(env).prepare("SELECT value FROM site_settings WHERE key='admin_email'").first();return row?.value?String(row.value).toLowerCase():'';}catch{return '';}}
async function isAdminUser(env,user){if(!user)return false;const e=await adminEmail(env);return !!e&&user.email.toLowerCase()===e;}
async function entitledDesigns(env,userId){const rows=await db(env).prepare('SELECT design_id FROM entitlements WHERE user_id=?').bind(userId).all();return (rows.results||[]).map(r=>r.design_id);}
async function hasEntitlement(env,userId,designId){const list=await entitledDesigns(env,userId);return list.includes(designId)||list.includes('ALL');}
async function completeOrder(env,order,paymentId){
 if(!order||order.status==='paid')return;
 const now=new Date().toISOString();let userId=order.user_id;
 // Guest checkout: the account is created only now that the payment has succeeded.
 if(String(userId).startsWith('pending-')&&order.signup_hash&&order.signup_email){
  await db(env).prepare('INSERT OR IGNORE INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),order.signup_email,order.signup_name||'Customer',order.signup_hash,now).run();
  userId=(await db(env).prepare('SELECT id FROM users WHERE email=?').bind(order.signup_email).first()).id;
 }
 await db(env).prepare("UPDATE orders SET status='paid',gateway_payment_id=?,updated_at=?,user_id=? WHERE id=?").bind(paymentId||null,now,userId,order.id).run();
 await db(env).prepare('INSERT OR IGNORE INTO entitlements(user_id,design_id,order_id,granted_at) VALUES(?,?,?,?)').bind(userId,order.design_id,order.id,now).run();
 if(order.coupon)await db(env).prepare('UPDATE coupons SET used=used+1 WHERE code=?').bind(order.coupon).run().catch(()=>{});
 // Album "Save Forever" orders carry the album id in ref_id: a confirmed
 // payment makes that album permanent at the price actually paid.
 if(order.design_id==='album-storage'&&order.ref_id){try{await db(env).prepare("UPDATE albums SET storage='permanent',storage_order_id=?,storage_price_paise=?,updated_at=? WHERE id=? AND user_id=?").bind(order.id,order.amount_paise,new Date().toISOString(),order.ref_id,userId).run();}catch(e){}}
}
// ---- Analytics + coupons helpers ----
const AI_HOSTS=[['chatgpt.com','chatgpt'],['chat.openai.com','chatgpt'],['openai.com','chatgpt'],['perplexity.ai','ai_chat'],['gemini.google.com','ai_chat'],['claude.ai','ai_chat'],['copilot.microsoft.com','ai_chat'],['you.com','ai_chat'],['deepseek.com','ai_chat'],['poe.com','ai_chat'],['grok.com','ai_chat']];
const UTM_SOURCES={fb:'facebook',facebook:'facebook',ig:'instagram',instagram:'instagram',google:'google',chatgpt:'chatgpt','chatgpt.com':'chatgpt',openai:'chatgpt',whatsapp:'whatsapp',wa:'whatsapp',youtube:'youtube',twitter:'twitter',x:'twitter'};
function classifyHost(h){
 if(!h)return '';
 for(const [d,s] of AI_HOSTS)if(h===d||h.endsWith('.'+d))return s;
 if(/(^|\.)google\.[a-z.]+$/.test(h))return 'google';
 if(/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(h))return 'facebook';
 if(/(^|\.)instagram\.com$/.test(h))return 'instagram';
 if(/(^|\.)(whatsapp\.com|wa\.me)$/.test(h))return 'whatsapp';
 if(/(^|\.)(youtube\.com|youtu\.be)$/.test(h))return 'youtube';
 if(/(^|\.)(twitter\.com|x\.com|t\.co)$/.test(h))return 'twitter';
 if(/(^|\.)(bing\.com|duckduckgo\.com|yahoo\.com|ecosia\.org|baidu\.com)$|(^|\.)yandex\.[a-z]+$/.test(h))return 'search_other';
 return 'referral';
}
function deviceOf(ua){return /iPad|Tablet|SM-T|Nexus 7/i.test(ua)?'tablet':/Mobi|Android|iPhone/i.test(ua)?'mobile':'desktop';}
const istNow=()=>new Date(Date.now()+19800000);
const istDay=(back=0)=>new Date(Date.now()+19800000-back*86400000).toISOString().slice(0,10);
const istStart=day=>new Date(day+'T00:00:00+05:30').toISOString();
/* ---- Visitor Intelligence: first-party anonymous visitor analytics ----
   Hardening rules (loophole sweep, 2026-11-07):
   - The vid is a server-issued UUID. A client-supplied vid is only ever
     READ as a lookup key; an unknown one is ignored, never adopted.
   - The fingerprint may re-link ONLY a request with no known vid, and only
     when it matches exactly one stored visitor. Two known vids never merge.
   - Scores come from event EXISTENCE (30-day window) plus the returning
     bonus — clicking 100 times scores the same as clicking once — and the
     number of stored events per visitor/type/day is capped, so floods and
     click-spam cannot manufacture hot leads. Bots never score.
   - The raw IP is never stored or logged: only a salted SHA-256 hash. */
const VI_TYPES=['pageview','preview','whatsapp','studio','pricing'];
const VI_POINTS={preview:15,studio:30,pricing:25,whatsapp:40};
const VI_TYPE_CAPS={pageview:80,preview:25,whatsapp:25,studio:25,pricing:25};
const VI_DC_ASNS=new Set([14061,16509,14618,8075,24940,16276,9009,26496,47583,132203,396986,63949,215238,210644]);
const VI_BOT_UA=/bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|monitor|curl|wget|python|node-fetch|axios|go-http|scrapy|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|ccbot|dataforseo|yandex|duckduckbot|baiduspider|sogou|exabot/i;
const VI_TEMPLATES=new Set(CATALOG_DESIGNS.map(d=>d.id));
const VI_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let viReady=false,viSaltCache='';
async function ensureVi(env){
 if(viReady)return;viReady=true;const d=db(env);
 await d.prepare("CREATE TABLE IF NOT EXISTS vi_visitors(vid TEXT PRIMARY KEY,fp TEXT,ip_hash TEXT,first_seen TEXT NOT NULL,last_seen TEXT NOT NULL,visits INTEGER NOT NULL DEFAULT 1,last_session TEXT,city TEXT,region TEXT,country TEXT,asn INTEGER,network TEXT,device TEXT,browser TEXT,os TEXT,screen TEXT,timezone TEXT,language TEXT,first_source TEXT NOT NULL DEFAULT 'direct',last_source TEXT NOT NULL DEFAULT 'direct',first_touch TEXT,last_touch TEXT,interest TEXT,score INTEGER NOT NULL DEFAULT 0,is_bot INTEGER NOT NULL DEFAULT 0)").run().catch(()=>{});
 await d.prepare("CREATE TABLE IF NOT EXISTS vi_events(id INTEGER PRIMARY KEY AUTOINCREMENT,vid TEXT NOT NULL,type TEXT NOT NULL,path TEXT,template TEXT,detail TEXT,ts TEXT NOT NULL,day TEXT NOT NULL)").run().catch(()=>{});
 for(const ix of ['CREATE INDEX IF NOT EXISTS vi_visitors_last_seen_idx ON vi_visitors(last_seen)','CREATE INDEX IF NOT EXISTS vi_visitors_score_idx ON vi_visitors(score)','CREATE INDEX IF NOT EXISTS vi_visitors_fp_idx ON vi_visitors(fp)','CREATE INDEX IF NOT EXISTS vi_events_vid_idx ON vi_events(vid, ts)','CREATE INDEX IF NOT EXISTS vi_events_day_idx ON vi_events(day, type)','CREATE INDEX IF NOT EXISTS vi_events_template_idx ON vi_events(template)'])
  await d.prepare(ix).run().catch(()=>{});
 await d.prepare('ALTER TABLE orders ADD COLUMN visitor_id TEXT').run().catch(()=>{});
}
async function viSalt(env){
 if(viSaltCache)return viSaltCache;
 try{
  const row=await db(env).prepare("SELECT value FROM site_settings WHERE key='vi_salt'").first();
  if(row&&row.value){viSaltCache=String(row.value);return viSaltCache;}
  const s=[...crypto.getRandomValues(new Uint8Array(24))].map(x=>x.toString(16).padStart(2,'0')).join('');
  await db(env).prepare("INSERT OR IGNORE INTO site_settings(key,value) VALUES('vi_salt',?)").bind(s).run();
  const again=await db(env).prepare("SELECT value FROM site_settings WHERE key='vi_salt'").first();
  viSaltCache=String((again&&again.value)||s);
 }catch{viSaltCache='ew-vi-fallback';}
 return viSaltCache;
}
function viCookieVid(request){const m=/(?:^|;\s*)ew_vid=([0-9a-f-]{36})/i.exec(request.headers.get('Cookie')||'');const v=m?m[1].toLowerCase():'';return VI_UUID.test(v)?v:'';}
function viUaParse(ua){
 let browser='Other';
 if(/Edg\//.test(ua))browser='Edge';else if(/OPR\/|Opera/.test(ua))browser='Opera';else if(/SamsungBrowser\//.test(ua))browser='Samsung Internet';else if(/Firefox\//.test(ua))browser='Firefox';else if(/Chrome\//.test(ua))browser='Chrome';else if(/Safari\//.test(ua)&&/Version\//.test(ua))browser='Safari';
 let os='Other';
 if(/Windows NT/.test(ua))os='Windows';else if(/Android/.test(ua))os='Android';else if(/iPhone|iPad|iPod/.test(ua))os='iOS';else if(/Mac OS X/.test(ua))os='macOS';else if(/Linux/.test(ua))os='Linux';
 return{browser,os};
}
function viTouchSource(touch,referrer,ownHost){
 /* One touch's source from campaign params first, then the referrer host.
    '' means "no information" (direct visit or internal navigation). */
 if(touch&&typeof touch==='object'){
  const src=String(touch.utm_source||'').toLowerCase().slice(0,40);
  if(src)return UTM_SOURCES[src]||'campaign';
  if(touch.fbclid)return 'facebook';
  if(touch.gclid)return 'google';
 }
 if(referrer){
  try{const h=new URL(referrer).hostname.toLowerCase().replace(/^www\./,'');if(h&&h!==ownHost){const c=classifyHost(h);return c==='referral'?'other':c;}}catch{}
 }
 return '';
}
async function viRescore(env,vid){
 const d=db(env);
 const v=await d.prepare('SELECT visits,is_bot FROM vi_visitors WHERE vid=?').bind(vid).first();if(!v)return;
 let score=0;
 if(!v.is_bot){
  if(Number(v.visits)>=2)score+=20;
  const since=new Date(Date.now()-30*86400000).toISOString();
  const rows=await d.prepare('SELECT DISTINCT type FROM vi_events WHERE vid=? AND ts>=?').bind(vid,since).all();
  for(const r of rows.results||[])score+=VI_POINTS[r.type]||0;
  score=Math.min(100,score);
 }
 await d.prepare('UPDATE vi_visitors SET score=? WHERE vid=?').bind(score,vid).run();
}
async function viBossData(env){
 await ensureVi(env);const d=db(env);
 const one=async(sql,...b)=>d.prepare(sql).bind(...b).first();
 const all=async(sql,...b)=>(await d.prepare(sql).bind(...b).all()).results||[];
 const today=istDay(),w7=istStart(istDay(6)),w7day=istDay(6);
 const [t,s7,ret,hot,bots]=[
  (await one("SELECT COUNT(*) AS n FROM vi_visitors WHERE is_bot=0 AND date(last_seen,'+330 minutes')=?",today)).n,
  (await one('SELECT COUNT(*) AS n FROM vi_visitors WHERE is_bot=0 AND last_seen>=?',w7)).n,
  (await one('SELECT COUNT(*) AS n FROM vi_visitors WHERE is_bot=0 AND last_seen>=? AND visits>=2',w7)).n,
  (await one('SELECT COUNT(*) AS n FROM vi_visitors WHERE is_bot=0 AND last_seen>=? AND score>=60',w7)).n,
  (await one('SELECT COUNT(*) AS n FROM vi_visitors WHERE is_bot=1 AND last_seen>=?',w7)).n];
 return{today:t,week:s7,returning:ret,returningPct:s7?Math.round(ret/s7*100):0,hot,bots,
  cities:await all("SELECT city,COUNT(*) AS n FROM vi_visitors WHERE is_bot=0 AND last_seen>=? AND city IS NOT NULL AND city<>'' GROUP BY city ORDER BY n DESC LIMIT 10",w7),
  networks:await all("SELECT network,COUNT(*) AS n FROM vi_visitors WHERE is_bot=0 AND last_seen>=? AND network IS NOT NULL AND network<>'' GROUP BY network ORDER BY n DESC LIMIT 10",w7),
  devices:await all('SELECT device,COUNT(*) AS n FROM vi_visitors WHERE is_bot=0 AND last_seen>=? GROUP BY device ORDER BY n DESC',w7),
  sources:await all('SELECT first_source AS s,COUNT(*) AS n FROM vi_visitors WHERE is_bot=0 AND last_seen>=? GROUP BY first_source ORDER BY n DESC',w7),
  templates:await all("SELECT template,COUNT(*) AS n FROM vi_events WHERE day>=? AND type='preview' AND template IS NOT NULL GROUP BY template ORDER BY n DESC LIMIT 10",w7day),
  hotList:await all("SELECT v.vid,v.city,v.network,v.device,v.visits,v.last_seen,v.interest,v.first_source,v.last_source,v.score,(SELECT e.template FROM vi_events e WHERE e.vid=v.vid AND e.type='preview' GROUP BY e.template ORDER BY COUNT(*) DESC LIMIT 1) AS top_template FROM vi_visitors v WHERE v.is_bot=0 AND v.score>0 ORDER BY v.score DESC,v.last_seen DESC LIMIT 25")};
}
async function couponFor(env,code,amount){
 const c=String(code||'').trim().toUpperCase().slice(0,30);if(!c)return null;
 const row=await db(env).prepare('SELECT * FROM coupons WHERE code=?').bind(c).first();
 if(!row||!row.active)fail('This coupon code is not valid.');
 if(row.expires_on&&row.expires_on<istDay())fail('This coupon has expired.');
 if(row.max_uses>0&&row.used>=row.max_uses)fail('This coupon has been fully used.');
 let discount=row.kind==='percent'?Math.floor(amount*row.value/100):row.value*100;
 discount=Math.min(discount,Math.max(amount-100,0));
 if(discount<=0)fail('This coupon does not apply to this item.');
 return {code:row.code,discount,final:amount-discount};
}
async function razorpayCreate(cfg,order){
 const res=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{'Authorization':'Basic '+btoa(cfg.key_id+':'+cfg.key_secret),'Content-Type':'application/json'},body:JSON.stringify({amount:order.amount_paise,currency:'INR',receipt:order.id})});
 const data=await res.json().catch(()=>null);
 if(!res.ok||!data?.id)fail('Payment could not be started. Please try another option.',502);
 return {gateway_order_id:data.id,payload:{gateway:'razorpay',key_id:cfg.key_id,order_id:data.id,amount:order.amount_paise,currency:'INR'}};
}
async function cashfreeCreate(cfg,order,user,phone,origin){
 const base=cfg.mode==='live'?'https://api.cashfree.com/pg':'https://sandbox.cashfree.com/pg';
 const res=await fetch(base+'/orders',{method:'POST',headers:{'x-client-id':cfg.key_id,'x-client-secret':cfg.key_secret,'x-api-version':'2023-08-01','Content-Type':'application/json'},body:JSON.stringify({order_id:order.id,order_amount:order.amount_paise/100,order_currency:'INR',customer_details:{customer_id:user.id,customer_name:user.name||'Customer',customer_email:user.email,customer_phone:phone},order_meta:{return_url:origin+'/register?order_id='+order.id}})});
 const data=await res.json().catch(()=>null);
 if(!res.ok||!data?.payment_session_id)fail('Payment could not be started. Please try another option.',502);
 return {gateway_order_id:order.id,payload:{gateway:'cashfree',payment_session_id:data.payment_session_id,mode:cfg.mode}};
}
async function phonepeToken(cfg){
 const host=cfg.mode==='live'?'https://api.phonepe.com':'https://api-preprod.phonepe.com';
 const extra=extraOf(cfg);
 const form=new URLSearchParams({client_id:cfg.key_id,client_version:String(extra.client_version||'1'),client_secret:cfg.key_secret,grant_type:'client_credentials'});
 const res=await fetch(host+'/apis/identity-manager/v1/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form.toString()});
 const data=await res.json().catch(()=>null);
 if(!res.ok||!data?.access_token)fail('Payment could not be started. Please try another option.',502);
 return {host,token:data.access_token};
}
async function phonepeCreate(cfg,order,origin){
 const {host,token}=await phonepeToken(cfg);
 const res=await fetch(host+'/apis/hermes/checkout/v2/pay',{method:'POST',headers:{'Authorization':'O-Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({merchantOrderId:order.id,amount:order.amount_paise,paymentFlow:{type:'PG_CHECKOUT',merchantUrls:{redirectUrl:origin+'/register?order_id='+order.id}}})});
 const data=await res.json().catch(()=>null);
 if(!res.ok||!data?.redirectUrl)fail('Payment could not be started. Please try another option.',502);
 return {gateway_order_id:order.id,payload:{gateway:'phonepe',redirect_url:data.redirectUrl}};
}
async function payuCreate(cfg,order,user,phone,origin){
 const amount=(order.amount_paise/100).toFixed(2);
 const productinfo='Easy Wedding invitation design '+order.design_id;
 const firstname=(user.name||'Customer').split(' ')[0].slice(0,60);
 const parts=[cfg.key_id,order.id,amount,productinfo,firstname,user.email,'','','','','','','','','','',cfg.key_secret];
 const hash=await sha512hex(parts.join('|'));
 const back=origin+'/api/payments/payu-return';
 return {gateway_order_id:order.id,payload:{gateway:'payu',action:cfg.mode==='live'?'https://secure.payu.in/_payment':'https://test.payu.in/_payment',fields:{key:cfg.key_id,txnid:order.id,amount,productinfo,firstname,email:user.email,phone:phone||'',surl:back,furl:back,hash}}};
}
const bounded=(x,max=150)=>typeof x==='string'&&x.length<=max;
function validateState(s){
 if(!s||typeof s!=='object'||Array.isArray(s)||!s.profile)fail('Wedding details are required.');
 const p=s.profile;
 if(!bounded(p.partner1,70)||!p.partner1.trim()||!bounded(p.partner2,70)||!p.partner2.trim()||!bounded(p.city,120)||!bounded(p.date,10)||!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!Number.isFinite(Date.parse(p.date)))fail('Please check the couple names, city and date.');
 for(const k of ['guests','budget','contingency'])if(!Number.isFinite(Number(p[k]))||Number(p[k])<0||Number(p[k])>(k==='contingency'?100:k==='guests'?100000:1e10))fail('Please check your guest count and budget.');
 for(const key of ['events','tasks','budget','vendors','shopping','designs']){if(!Array.isArray(s[key])||s[key].length>500)fail('Too many '+key+' entries.');for(const row of s[key])if(!row||!bounded(row.id,80)||!row.id)fail('Invalid entry.');}
 for(const b of s.budget)for(const k of ['quantity','rate','paid'])if(!Number.isFinite(Number(b[k]))||Number(b[k])<0||Number(b[k])>1e9)fail('Budget amounts must be positive numbers.');
 return s;
}
async function body(req,max=800000){const t=await req.text();if(t.length>max)fail('This wedding plan is too large.',413);try{return JSON.parse(t)}catch{fail('Invalid request.')}}
const MAINTENANCE_HTML='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Easy Wedding — Opening Very Soon</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#571c24,#3d1119);color:#f7ead2;font-family:Georgia,serif;text-align:center;padding:24px}main{max-width:520px}h1{font-size:2.4rem;margin:.2em 0;color:#e9c979}p{line-height:1.6;font-family:system-ui,sans-serif}a{color:#e9c979}.ring{font-size:2rem;letter-spacing:.3em}</style></head><body><main><div class="ring" aria-hidden="true">&#128141;</div><h1>Easy Wedding</h1><p>We are putting the final touches on something beautiful.</p><p><strong>Opening very soon.</strong></p><p>Questions in the meantime? Call or WhatsApp us on <a href="https://wa.me/918789991983?text=Namaste%20Easy%20Wedding!%20%F0%9F%99%8F%20Meri%20shaadi%20ke%20liye%20mujhe%20ek%20sundar%20sa%20digital%20invitation%20banana%20hai.%20Kripya%20mujhe%20designs%20aur%20daam%20ki%20jaankari%20dijiye.%20Dhanyavaad!%20%F0%9F%92%90">+91 87899 91983</a> — any day between 10 AM and 8 PM.</p></main><a href=\"/boss\" aria-label=\"Admin\" title=\"Admin\" style=\"position:fixed;right:14px;bottom:14px;width:38px;height:38px;border-radius:50%;background:#571c24;border:1px solid #c9a24b;display:flex;align-items:center;justify-content:center;opacity:.85;text-decoration:none\"><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#e8cf9a\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z\"/></svg></a></body></html>';
async function maintenanceState(env){
 try{
  const rows=await db(env).prepare("SELECT key,value FROM site_settings WHERE key IN ('maintenance','maint_secret')").all();
  const map={};for(const r of rows.results||[])map[r.key]=r.value;
  return {on:map.maintenance==='1',secret:typeof map.maint_secret==='string'?map.maint_secret:''};
 }catch{return {on:false,secret:''};}
}
async function appLinks(env){const none={playStore:'',groupUrl:'',testingUrl:'',testerUrl:'',testerOn:false};try{const row=await db(env).prepare("SELECT value FROM site_settings WHERE key='app_links'").first();const v=row?JSON.parse(row.value):null;if(!v||typeof v.playStore!=='string')return none;let group=typeof v.groupUrl==='string'?v.groupUrl:'',testing=typeof v.testingUrl==='string'?v.testingUrl:'';const legacy=typeof v.testerUrl==='string'?v.testerUrl:'';if(legacy&&!group&&!testing){if(legacy.includes('groups.google.com'))group=legacy;else if(legacy.includes('play.google.com/apps/'))testing=legacy;}else if(legacy&&!group&&legacy.includes('groups.google.com'))group=legacy;else if(legacy&&!testing&&legacy.includes('play.google.com/apps/'))testing=legacy;return{playStore:v.playStore,groupUrl:group,testingUrl:testing,testerUrl:group||testing,testerOn:v.testerOn===true};}catch{return none;}}
const TESTER_URL=/^https:\/\/(groups\.google\.com\/(g\/[A-Za-z0-9_.-]+|forum\/[A-Za-z0-9_.\/#!-]+)|play\.google\.com\/apps\/(testing|internaltest)\/[A-Za-z0-9_.\/-]+)$/;
const GROUP_URL=/^https:\/\/groups\.google\.com\/(g\/[A-Za-z0-9_.-]+|forum\/[A-Za-z0-9_.\/#!-]+)$/;
const TESTING_URL=/^https:\/\/play\.google\.com\/apps\/(testing|internaltest)\/[A-Za-z0-9_.\/-]+$/;
const PLAY_URL=/^https:\/\/play\.google\.com\/store\/apps\/details\?id=[A-Za-z0-9_.]+(&[A-Za-z0-9_.=%&-]*)?$/;
async function previewMusicRow(env){try{const row=await db(env).prepare("SELECT value FROM site_settings WHERE key='preview_music'").first();return row?JSON.parse(row.value):null;}catch{return null;}}
/* Feature settings, all editable in /boss and stored in site_settings.
   The defaults below are only fallbacks for a database that has not been
   migrated yet — the live values always come from the settings rows. */
const ALBUM_STORAGE_DEFAULT={price_paise:49900,draft_days:7};
const COMMISSION_DEFAULT=10;
const VENDOR_CATEGORY_DEFAULTS=[['photographer','Photographer'],['videographer','Videographer'],['makeup','Makeup Artist'],['mehndi','Mehndi Artist'],['decorator','Decorator'],['caterer','Caterer'],['dj','DJ & Music'],['venue','Wedding Venue'],['pandit','Pandit'],['car','Car Rental']].map(([id,label])=>({id,label}));
async function settingJson(env,key){try{const row=await db(env).prepare('SELECT value FROM site_settings WHERE key=?').bind(key).first();return row?JSON.parse(row.value):null;}catch{return null;}}
async function albumSettings(env){const v=await settingJson(env,'album_storage');return {price_paise:v&&Number.isFinite(v.price_paise)?Math.max(0,Math.round(v.price_paise)):ALBUM_STORAGE_DEFAULT.price_paise,draft_days:v&&Number.isFinite(v.draft_days)?Math.min(90,Math.max(1,Math.round(v.draft_days))):ALBUM_STORAGE_DEFAULT.draft_days};}
async function commissionPercent(env){const v=await settingJson(env,'vendor_commission');const p=v&&Number.isFinite(v.percent)?Number(v.percent):COMMISSION_DEFAULT;return Math.min(50,Math.max(0,Math.round(p*100)/100));}
async function vendorCategories(env){const v=await settingJson(env,'vendor_categories');if(Array.isArray(v)&&v.length){const list=v.filter(c=>c&&typeof c.id==='string'&&typeof c.label==='string').map(c=>({id:c.id.slice(0,40),label:c.label.slice(0,60)}));if(list.length)return list;}return VENDOR_CATEGORY_DEFAULTS;}
const phone10=v=>{let p=String(v||'').replace(/\D/g,'');if(p.length===12&&p.startsWith('91'))p=p.slice(2);else if(p.length===11&&p.startsWith('0'))p=p.slice(1);return /^[6-9]\d{9}$/.test(p)?p:null;};
/* Platform commission on a confirmed vendor booking: round-half-up on exact
   paise math, at the percentage snapshotted when the booking was confirmed.
   Basis points keep the arithmetic integer-exact even for a percent like 2.5. */
const commissionOf=(finalPaise,percent)=>{const num=finalPaise*Math.round(percent*100);return Math.floor(num/10000)+(num%10000>=5000?1:0);};
async function albumShape(env,row,full=true){
 if(row.storage==='permanent'&&!row.share_token){row.share_token=[...crypto.getRandomValues(new Uint8Array(24))].map(x=>x.toString(16).padStart(2,'0')).join('');await db(env).prepare('UPDATE albums SET share_token=? WHERE id=?').bind(row.share_token,row.id).run().catch(()=>{});}
 const photos=full?(await db(env).prepare('SELECT id,position,caption FROM album_photos WHERE album_id=? ORDER BY position,id').bind(row.id).all()).results||[]:[];
 const expired=row.storage!=='permanent'&&row.expires_at&&row.expires_at<new Date().toISOString();
 return {id:row.id,title:row.title,partner1:row.partner1||'',partner2:row.partner2||'',weddingDate:row.wedding_date||'',storage:row.storage,expired:!!expired,expiresAt:row.expires_at||null,isPublic:!!row.is_public,shareToken:row.storage==='permanent'&&row.is_public?row.share_token:null,shareUrl:row.storage==='permanent'&&row.is_public&&row.share_token?'/album?s='+row.share_token:null,storagePricePaise:row.storage_price_paise,storageOrderId:row.storage_order_id||null,hasSharePin:!!row.share_pin_hash,createdAt:row.created_at,photos:photos.map(p=>({id:p.id,position:p.position,caption:p.caption||'',url:'/api/album-photo/'+p.id}))};
}
async function vendorShape(env,row,cats,withPrivate=false){
 const photos=(await db(env).prepare('SELECT id,position FROM vendor_photos WHERE vendor_id=? ORDER BY position,id').bind(row.id).all()).results||[];
 const cat=(cats||[]).find(c=>c.id===row.category);
 const out={id:row.id,vendorCode:row.vendor_code||null,businessName:row.business_name,ownerName:row.owner_name,category:row.category,categoryLabel:cat?cat.label:row.category,city:row.city,startingPricePaise:row.starting_price_paise,about:row.about||'',status:row.status,verified:row.verified===1,rating:row.rating_count?{average:Number(row.rating_avg)||0,count:row.rating_count}:null,coverUrl:photos.length?'/api/vendor-photo/'+photos[0].id:null,photos:photos.map(p=>({id:p.id,position:p.position,url:'/api/vendor-photo/'+p.id})),createdAt:row.created_at};
 if(withPrivate){out.phone=row.phone;out.whatsapp=row.whatsapp;out.email=row.email;out.statusReason=row.status_reason||'';
  out.agreement={acceptedAt:row.agreement_accepted_at||null,version:row.agreement_version||null,text:row.agreement_text||null};
  /* Payout details are private: only the vendor themselves and /boss ever
     receive them (this branch), never the public directory or profile. */
  out.payout={holder:row.payout_holder||'',account:row.payout_account||'',ifsc:row.payout_ifsc||'',upi:row.payout_upi||'',pan:row.payout_pan||''};
  out.hasPayoutDetails=!!(row.payout_holder&&row.payout_account&&row.payout_ifsc);}
 return out;
}
function vendorBookingShape(r){return {id:r.id,vendorId:r.vendor_id,vendorCode:r.vendor_code||null,vendorName:r.business_name||'',customerId:r.customer_id,customerName:r.customer_name||'',eventDate:r.event_date||'',eventType:r.event_type||'',city:r.city||'',phone:r.phone,message:r.message||'',budgetPaise:r.budget_paise,status:r.status,settlementMode:r.settlement_mode||'manual',finalPaise:r.final_paise,commissionPercent:r.commission_percent,commissionPaise:r.commission_paise,netPaise:r.net_paise,payoutId:r.payout_id||null,reviewed:!!r.reviewed,createdAt:r.created_at,updatedAt:r.updated_at};}
/* Vendor agreement: the platform terms a vendor accepts at registration.
   Version + text are editable in /boss; {commission} in the text is filled
   with the commission % in force when it is shown or accepted, and the
   exact text shown is snapshotted onto the vendor record at acceptance. */
const AGREEMENT_DEFAULT={version:'v1',text:'Easy Wedding Vendor Agreement\n\n1. Listing is free. Easy Wedding charges a platform commission of {commission}% only on bookings that are confirmed and completed through Easy Wedding, calculated on the final amount you confirm with the customer.\n2. No commission is charged on enquiries, cancelled bookings, or bookings refunded to the customer.\n3. If you cancel a confirmed booking, or do not deliver the service you confirmed, the customer is entitled to a full refund of any amount collected for that booking, and no commission is earned on it.\n4. If a customer does not show up for a confirmed booking, tell Easy Wedding within 48 hours so the booking can be closed fairly for both sides.\n5. Payments collected by Easy Wedding stay protected and are released to you after the event, minus the commission above, through the payout details you provide. Keep your payout details correct and private.\n6. Your prices, photos and description must be your own and must be honest. Easy Wedding may remove a listing that misleads customers.\n7. The "Easy Wedding Verified" badge is given only after our own checks; it is not for sale.\n8. Either side may end this agreement at any time; bookings already confirmed stay governed by the terms above.'};
async function vendorAgreement(env){const v=await settingJson(env,'vendor_agreement');const version=v&&typeof v.version==='string'&&v.version.trim()?v.version.trim().slice(0,20):AGREEMENT_DEFAULT.version;const raw=v&&typeof v.text==='string'&&v.text.trim()?v.text.slice(0,8000):AGREEMENT_DEFAULT.text;const pct=await commissionPercent(env);return {version,text:raw.replaceAll('{commission}',String(pct))};}
/* Boss sign-in completion: with two-step login ON (a /boss setting, default
   off) the password only earns an emailed 6-digit code; the session is
   issued by /api/admin/verify-code. If the code cannot be emailed, sign-in
   stops with honest instructions instead of silently skipping the step. */
async function finishAdminLogin(env,owner){
 await clearLoginFails(env,owner.email);
 if((await siteSetting(env,'boss_2fa'))==='on'){
  const code=String(100000+(crypto.getRandomValues(new Uint32Array(1))[0]%900000));
  const id=crypto.randomUUID(),nowS=Math.floor(Date.now()/1000);
  await db(env).prepare('CREATE TABLE IF NOT EXISTS admin_login_codes(id TEXT PRIMARY KEY,email TEXT NOT NULL,code_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL)').run().catch(()=>{});
  await db(env).prepare('DELETE FROM admin_login_codes WHERE email=?').bind(owner.email).run();
  await db(env).prepare('INSERT INTO admin_login_codes(id,email,code_hash,expires_at,attempts,created_at) VALUES(?,?,?,?,0,?)').bind(id,owner.email,await sha256hex(code+':'+owner.email),nowS+600,nowS).run();
  const sent=await sendMail(env,{to:owner.email,subject:'Your Easy Wedding boss sign-in code',text:'Your one-time Easy Wedding boss sign-in code is '+code+'.\n\nIt expires in 10 minutes. If you did not try to sign in just now, ignore this email and consider changing your boss password.'});
  if(!sent.ok){await db(env).prepare('DELETE FROM admin_login_codes WHERE id=?').bind(id).run().catch(()=>{});fail('Two-step sign-in is switched on, but the code email could not be sent ('+sent.reason+'). Email delivery is not configured on the server yet. To get back in: open Cloudflare → D1 → the Easy Wedding database → site_settings and delete the boss_2fa row (or set it to off), then sign in and set up email before switching it on again.',503);}
  return json({ok:true,twoFactor:true,challengeId:id});
 }
 await rotateSessions(env,owner.id,'admin');
 return json({user:{id:owner.id,email:owner.email,name:owner.name,admin:true}},200,{'Set-Cookie':adminCookie(await startSession(env,owner.id,'admin'),SESSION_COOKIE_AGE)});
}
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 const maint=await maintenanceState(env);
 if(maint.on){
  if(path==='/__open'){
   if(maint.secret&&url.searchParams.get('k')===maint.secret){const to=url.searchParams.get('to')||'/';const dest=/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/.test(to)&&!to.startsWith('//')?to:'/';return new Response(null,{status:302,headers:{'Location':dest,'Set-Cookie':'ew_open='+maint.secret+'; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax'}});}
   return new Response('Not found.',{status:404});
  }
  const cookieOk=!!maint.secret&&(request.headers.get('Cookie')||'').split(';').some(c=>c.trim()==='ew_open='+maint.secret);
  const callback=path.startsWith('/api/payments/webhook/')||path==='/api/payments/payu-return';
  const adminPath=path==='/boss'||path==='/boss/'||path==='/admin.js'||path==='/admin.css'||path==='/auth.js'||path==='/brand.css'||path==='/assets/fonts/fonts.css'||path==='/api/auth/login'||path==='/api/auth/logout'||path==='/api/session'||path.startsWith('/api/admin/');
  let adminOk=false;
  if(!cookieOk&&!adminPath){try{const u=await currentAdmin(request,env);adminOk=!!u&&u.email.toLowerCase()===(await adminEmail(env));}catch{adminOk=false;}}
  if(!cookieOk&&!callback&&!adminPath&&!adminOk){
   if(path.startsWith('/api/'))return json({error:'Easy Wedding is opening very soon.'},503);
   return new Response(MAINTENANCE_HTML,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
  }
 }
 if(request.method==='GET'&&/^\/[a-z0-9][a-z0-9-]{2,40}$/.test(path)){
  try{const row=await db(env).prepare('SELECT invitation_id FROM short_links WHERE slug=?').bind(path.slice(1)).first();if(row)return new Response(null,{status:302,headers:{'Location':'/invite?id='+row.invitation_id,'X-EW-Origin':EW_ORIGIN}});}catch{}
 }
 // Clean URLs: the .html pages redirect to their extension-less address.
 const CLEAN={'/studio.html':'/studio','/invite.html':'/invite','/guests.html':'/guests','/rsvps.html':'/rsvps','/pdf.html':'/pdf','/landing.html':'/','/index.html':'/dashboard','/index':'/dashboard','/workspace':'/dashboard','/workspace/':'/dashboard','/dashboard/':'/dashboard','/login.html':'/login','/bookings.html':'/bookings','/about.html':'/about','/contact.html':'/contact','/faq.html':'/faq','/privacy.html':'/privacy','/terms.html':'/terms','/refund.html':'/refund','/copyright.html':'/copyright','/register.html':'/register','/forgot-password.html':'/forgot-password'};
 if(request.method==='GET'&&CLEAN[path])return new Response(null,{status:301,headers:{'Location':CLEAN[path]+url.search,'X-EW-Origin':EW_ORIGIN}});
 // /dashboard is the signed-in customer's planner (public/index.html); /workspace and /index redirect here via CLEAN.
 if(path==='/dashboard')return env.ASSETS.fetch(new Request(new URL('/index.html',url),request));
 if(path==='/')return env.ASSETS.fetch(new Request(new URL('/landing.html',url),request));
 // Admin lives at /boss only; the default /admin and /admin.html paths are not served.
 if(path==='/boss'||path==='/boss/')return env.ASSETS.fetch(new Request(new URL('/admin.html',url),request));
 if(path==='/admin'||path==='/admin/'||path==='/admin.html')return new Response('Not found.',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','X-EW-Origin':EW_ORIGIN}});
 if(!path.startsWith('/api/')){
  if(!/\.[a-zA-Z0-9]+$/.test(path))return env.ASSETS.fetch(new Request(new URL(path.replace(/\/+$/,'')+'.html',url),request));
  return env.ASSETS.fetch(request);
 }
 try{
 if(path.startsWith('/api/invitations/')&&request.method==='GET'){
  await rateHit(env,'snap',request,600,300);
  const id=path.slice('/api/invitations/'.length);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))fail('Invitation not found.',404);
  const object=await env.BUCKET?.get('invitation-snapshots/'+id);if(!object)fail('Invitation not found.',404);return new Response(object.body,{headers:{'Content-Type':'application/json','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff','X-EW-Origin':EW_ORIGIN}});
 }
 if(path.startsWith('/api/invitations/')&&path.endsWith('/guest')&&request.method==='POST'){
  const id=path.slice('/api/invitations/'.length,-'/guest'.length);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))fail('Invitation not found.',404);
  await rateHit(env,'guest',request,240,300);
  const input=await body(request,2000);const token=String(input?.token||'').slice(0,64);
  const guest=await db(env).prepare('SELECT id,name,viewed_at FROM personal_guests WHERE token=? AND invitation_id=?').bind(token,id).first();
  if(!guest)fail('Guest not found.',404);
  if(!guest.viewed_at)await db(env).prepare('UPDATE personal_guests SET viewed_at=? WHERE id=?').bind(new Date().toISOString(),guest.id).run();
  return json({name:guest.name});
 }
 if(path.startsWith('/api/invitations/')&&path.endsWith('/rsvp')&&request.method==='POST'){
  const id=path.slice('/api/invitations/'.length,-'/rsvp'.length);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))fail('Invitation not found.',404);
  const object=await env.BUCKET?.get('invitation-snapshots/'+id);if(!object)fail('Invitation not found.',404);
  const input=await body(request,5000);const name=String(input?.name||'').trim().slice(0,80);const attendance=String(input?.attendance||'').trim().slice(0,40);if(!name||!attendance)fail('Please share your name and whether you can join us.');
  const guests=Math.max(0,Math.min(20,Math.floor(Number(input?.guests)||0)));const message=String(input?.message||'').trim().slice(0,500);const song=String(input?.song||'').trim().slice(0,200);let phone=String(input?.phone||'').replace(/\D/g,'');if(phone.length===12&&phone.startsWith('91'))phone=phone.slice(2);else if(phone.length===11&&phone.startsWith('0'))phone=phone.slice(1);if(phone&&!/^[6-9]\d{9}$/.test(phone))fail('Please enter a valid 10-digit Indian mobile number.');
  await rateHit(env,'rsvp',request,40,600);
  const count=await db(env).prepare('SELECT COUNT(*) AS n FROM rsvps WHERE invitation_id=?').bind(id).first();if(count&&count.n>=1000)fail('This invitation has received a great many replies already.',429);
  await db(env).prepare('INSERT INTO rsvps(id,invitation_id,name,attendance,guests,message,song,phone,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,name,attendance,guests,message,song,phone,new Date().toISOString()).run();
  const guestToken=String(input?.token||'').slice(0,64);
  if(guestToken)await db(env).prepare('UPDATE personal_guests SET rsvped_at=? WHERE token=? AND invitation_id=?').bind(new Date().toISOString(),guestToken,id).run();
  return json({ok:true},201);
 }
 // Invitation images are deliberately link-viewable within the Site audience.
 // Private profile/design assets never use this bucket prefix.
 if(path.startsWith('/api/invitation-photos/')&&request.method==='GET'){
  const id=path.slice('/api/invitation-photos/'.length);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))fail('Photo not found.',404);
  const object=await env.BUCKET?.get('invitation/'+id);if(!object)fail('Photo not found.',404);
  return new Response(object.body,{headers:{'Content-Type':object.httpMetadata.contentType,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});
 }
/* Public preview music: the track the owner picked in the admin console. Played in public invitation previews. */
 if(path==='/api/preview-music'&&request.method==='GET'){
  const m=await previewMusicRow(env),key=m?.id?'site/preview-music/'+m.id:'',head=key?await env.BUCKET?.head(key):null;if(!head)fail('No preview music.',404);
  const headers={'Content-Type':head.httpMetadata?.contentType||'audio/mpeg','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Access-Control-Allow-Origin':'*'};const range=request.headers.get('Range');
  if(range){const r=/^bytes=(\d*)-(\d*)$/.exec(range);if(!r||(!r[1]&&!r[2]))return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+head.size}});const start=r[1]?Number(r[1]):Math.max(0,head.size-Number(r[2])),end=r[1]?(r[2]?Math.min(Number(r[2]),head.size-1):head.size-1):head.size-1;if(start>end||start>=head.size)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+head.size}});const part=await env.BUCKET.get(key,{range:{offset:start,length:end-start+1}});return new Response(part.body,{status:206,headers:{...headers,'Content-Range':`bytes ${start}-${end}/${head.size}`,'Content-Length':String(end-start+1)}});}
  const object=await env.BUCKET.get(key);return new Response(object.body,{headers:{...headers,'Content-Length':String(head.size)}});
 }
 if(path.startsWith('/api/invitation-audio/')&&request.method==='GET'){
  const id=path.slice('/api/invitation-audio/'.length);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))fail('Song not found.',404);
  const key='invitation-audio/'+id,head=await env.BUCKET?.head(key);if(!head)fail('Song not found.',404);const headers={'Content-Type':head.httpMetadata.contentType,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};const range=request.headers.get('Range');
  if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m||(!m[1]&&!m[2]))return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+head.size}});const start=m[1]?Number(m[1]):Math.max(0,head.size-Number(m[2])),end=m[1]?(m[2]?Math.min(Number(m[2]),head.size-1):head.size-1):head.size-1;if(start>end||start>=head.size)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+head.size}});const object=await env.BUCKET.get(key,{range:{offset:start,length:end-start+1}});return new Response(object.body,{status:206,headers:{...headers,'Content-Range':`bytes ${start}-${end}/${head.size}`,'Content-Length':String(end-start+1)}});}
  const object=await env.BUCKET.get(key);return new Response(object.body,{headers:{...headers,'Content-Length':String(head.size)}});
 }
 // Privacy-friendly visit beacon (no cookies, no IPs stored): source, device, hour (IST), country.
 if(path==='/api/track'&&request.method==='POST'){
  const ua=request.headers.get('User-Agent')||'';
  if(!ua||/bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|monitor|curl|wget|python|node-fetch/i.test(ua))return new Response(null,{status:204});
  await rateHit(env,'track',request,90,60);
  const input=await body(request,2000);
  const p=typeof input?.p==='string'&&input.p.startsWith('/')?input.p.split(/[?#]/)[0].slice(0,80):'';
  const v=typeof input?.v==='string'&&/^[a-z0-9]{8,40}$/i.test(input.v)?input.v:'';
  if(!p||!v||/^\/(boss|api)(\/|$)/.test(p))return new Response(null,{status:204});
  let refHost='';try{if(input.r)refHost=new URL(String(input.r)).hostname.toLowerCase().replace(/^www\./,'');}catch{}
  const own=url.hostname.replace(/^www\./,''),start=input.s?1:0;
  let source='internal';
  if(start){const hint=String(input.u||'').toLowerCase().slice(0,40);source=(hint&&(UTM_SOURCES[hint]||'campaign'))||(refHost&&refHost!==own?classifyHost(refHost):'')||'direct';}
  const ist=istNow();
  await db(env).prepare('INSERT INTO visits(ts,day,hour,path,source,ref_host,device,country,visitor,session_start) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(new Date().toISOString(),ist.toISOString().slice(0,10),ist.getUTCHours(),p,source,start&&refHost&&refHost!==own?refHost.slice(0,80):null,deviceOf(ua),(request.cf&&request.cf.country)||null,v,start).run();
  return new Response(null,{status:204});
 }
 /* Visitor Intelligence beacon. Public by necessity (anonymous visitors),
    so it is defended like an open door: same-origin only (the site's CSRF
    pattern), a strict event whitelist, tight payload + field caps, per-IP
    and per-visitor rate limits, and identity rules that never let a caller
    adopt or merge someone else's visitor id. Anything suspicious is
    answered with a silent 204 and writes nothing. */
 if(path==='/api/vi'&&request.method==='POST'){
  const origin=request.headers.get('Origin');
  let originOk=false;
  if(origin){try{originOk=new URL(origin).origin===url.origin;}catch{}}
  else{const ref=request.headers.get('Referer');if(ref){try{originOk=new URL(ref).host===url.host;}catch{}}}
  if(!originOk)return new Response(null,{status:204});
  await rateHit(env,'vi',request,150,60);
  let input=null;try{input=await body(request,2500);}catch{return new Response(null,{status:204});}
  if(!input||typeof input!=='object')return new Response(null,{status:204});
  const type=VI_TYPES.includes(input.t)?input.t:'';
  if(!type)return new Response(null,{status:204});
  /* A preview only counts when it names a real design — a made-up template
     id is dropped entirely, so it cannot farm the preview score either. */
  if(type==='preview'&&!(typeof input.tmpl==='string'&&VI_TEMPLATES.has(input.tmpl)))return new Response(null,{status:204});
  await ensureVi(env);const d=db(env);
  const ua=request.headers.get('User-Agent')||'',cf=request.cf||{};
  const ip=request.headers.get('CF-Connecting-IP')||'';
  const ipHash=ip?await sha256hex((await viSalt(env))+':'+ip):'';
  const nowIso=new Date().toISOString(),today=istDay(),ownHost=url.hostname.replace(/^www\./,'');
  /* Identity: a presented vid counts only if the server issued it before. */
  let vid=viCookieVid(request);
  if(!vid&&typeof input.v==='string'&&VI_UUID.test(input.v))vid=input.v.toLowerCase();
  let visitor=vid?await d.prepare('SELECT * FROM vi_visitors WHERE vid=?').bind(vid).first():null;
  const fp=typeof input.fp==='string'&&/^[0-9a-f]{64}$/.test(input.fp)?input.fp:'';
  if(!visitor&&!vid&&fp){
   /* Conservative re-link: no vid was presented at all and the fingerprint
      matches exactly one stored visitor. Two matches = no merge, ever. */
   const m=await d.prepare('SELECT vid FROM vi_visitors WHERE fp=? LIMIT 2').bind(fp).all();
   const rows=m.results||[];
   if(rows.length===1){vid=rows[0].vid;visitor=await d.prepare('SELECT * FROM vi_visitors WHERE vid=?').bind(vid).first();}
  }
  if(!visitor&&vid){
   /* A well-formed but unknown vid is NOT adopted (fixation guard). If it
      carries a fingerprint that uniquely matches, fall back to that link;
      otherwise this request starts a fresh server-issued visitor. */
   if(fp){
    const m=await d.prepare('SELECT vid FROM vi_visitors WHERE fp=? LIMIT 2').bind(fp).all();
    const rows=m.results||[];
    if(rows.length===1){vid=rows[0].vid;visitor=await d.prepare('SELECT * FROM vi_visitors WHERE vid=?').bind(vid).first();}
   }
   if(!visitor)vid='';
  }
  const isBot=(VI_BOT_UA.test(ua)||(cf.asn!=null&&VI_DC_ASNS.has(Number(cf.asn))))?1:0;
  const sess=typeof input.sess==='string'&&/^[a-z0-9]{6,40}$/i.test(input.sess)?input.sess:'';
  const touchSrc=viTouchSource(input.lt||input.ft,typeof input.r==='string'?input.r.slice(0,500):'',ownHost);
  if(!visitor){
   /* New-visitor creation cap per network per day (visitor-spam guard). */
   if(ipHash){const c=await d.prepare("SELECT COUNT(*) AS n FROM vi_visitors WHERE ip_hash=? AND date(first_seen,'+330 minutes')=?").bind(ipHash,today).first();if(c&&c.n>=300)return new Response(null,{status:204});}
   vid=crypto.randomUUID();
   const parsed=viUaParse(ua);
   const src=touchSrc||'direct';
   await d.prepare('INSERT INTO vi_visitors(vid,fp,ip_hash,first_seen,last_seen,visits,last_session,city,region,country,asn,network,device,browser,os,screen,timezone,language,first_source,last_source,first_touch,last_touch,interest,score,is_bot) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?)')
    .bind(vid,fp||null,ipHash||null,nowIso,nowIso,1,sess||null,
     cf.city?String(cf.city).slice(0,80):null,cf.region?String(cf.region).slice(0,80):null,cf.country?String(cf.country).slice(0,8):null,cf.asn!=null?Number(cf.asn):null,cf.asOrganization?String(cf.asOrganization).slice(0,120):null,
     deviceOf(ua),parsed.browser,parsed.os,
     typeof input.scr==='string'&&/^\d{2,5}x\d{2,5}$/.test(input.scr)?input.scr:null,
     typeof input.tz==='string'?input.tz.slice(0,60):null,typeof input.lang==='string'?input.lang.slice(0,20):null,
     src,src,
     input.ft&&typeof input.ft==='object'?JSON.stringify(input.ft).slice(0,600):null,
     input.lt&&typeof input.lt==='object'?JSON.stringify(input.lt).slice(0,600):null,
     null,isBot).run();
   visitor=await d.prepare('SELECT * FROM vi_visitors WHERE vid=?').bind(vid).first();
  }else{
   const newSession=sess&&visitor.last_session!==sess;
   const parsed=viUaParse(ua);
   await d.prepare('UPDATE vi_visitors SET last_seen=?,visits=visits+?,last_session=?,fp=COALESCE(?,fp),ip_hash=COALESCE(?,ip_hash),city=COALESCE(?,city),region=COALESCE(?,region),country=COALESCE(?,country),asn=COALESCE(?,asn),network=COALESCE(?,network),device=?,browser=?,os=?,screen=COALESCE(?,screen),timezone=COALESCE(?,timezone),language=COALESCE(?,language),last_source=?,last_touch=COALESCE(?,last_touch),interest=COALESCE(?,interest),is_bot=? WHERE vid=?')
    .bind(nowIso,newSession?1:0,sess||visitor.last_session,
     fp||null,ipHash||null,
     cf.city?String(cf.city).slice(0,80):null,cf.region?String(cf.region).slice(0,80):null,cf.country?String(cf.country).slice(0,8):null,cf.asn!=null?Number(cf.asn):null,cf.asOrganization?String(cf.asOrganization).slice(0,120):null,
     deviceOf(ua),parsed.browser,parsed.os,
     typeof input.scr==='string'&&/^\d{2,5}x\d{2,5}$/.test(input.scr)?input.scr:null,
     typeof input.tz==='string'?input.tz.slice(0,60):null,typeof input.lang==='string'?input.lang.slice(0,20):null,
     touchSrc?touchSrc:visitor.last_source,
     input.lt&&typeof input.lt==='object'?JSON.stringify(input.lt).slice(0,600):null,
     type==='preview'&&typeof input.tmpl==='string'&&VI_TEMPLATES.has(input.tmpl)?input.tmpl:null,
     (visitor.is_bot||isBot)?1:0,vid).run();
   visitor.visits=Number(visitor.visits)+(newSession?1:0);visitor.is_bot=(visitor.is_bot||isBot)?1:0;
  }
  /* Stored-event cap per visitor/type/day: beyond it the event is dropped,
     so repeat clicking can neither grow the table nor game the score. */
  const cnt=await d.prepare('SELECT COUNT(*) AS n FROM vi_events WHERE vid=? AND day=? AND type=?').bind(vid,today,type).first();
  if(!cnt||cnt.n<(VI_TYPE_CAPS[type]||25)){
   const p=typeof input.p==='string'&&input.p.startsWith('/')?input.p.split(/[?#]/)[0].slice(0,80):null;
   const tmpl=type==='preview'&&typeof input.tmpl==='string'&&VI_TEMPLATES.has(input.tmpl)?input.tmpl:null;
   await d.prepare('INSERT INTO vi_events(vid,type,path,template,detail,ts,day) VALUES(?,?,?,?,?,?,?)').bind(vid,type,p,tmpl,typeof input.d==='string'?input.d.slice(0,40):null,nowIso,today).run();
   await viRescore(env,vid);
  }
  /* Retention: raw events older than 90 days are pruned opportunistically
     (visitor aggregates — visits, sources, score inputs — are kept). */
  if(Math.random()<0.02)await d.prepare('DELETE FROM vi_events WHERE ts<?').bind(new Date(Date.now()-90*86400000).toISOString()).run().catch(()=>{});
  const cookie='ew_vid='+vid+'; Max-Age=31536000; Path=/; SameSite=Lax'+(url.protocol==='https:'?'; Secure':'');
  return json({vid},200,{'Set-Cookie':cookie});
 }
 if(path==='/api/site-info'&&request.method==='GET'){
  const row=await db(env).prepare("SELECT value FROM site_settings WHERE key='banner'").first();let b=null;try{b=row?.value?JSON.parse(row.value):null;}catch{}
  const pm=await previewMusicRow(env),links=await appLinks(env);return json({playStore:links.playStore||null,groupUrl:links.testerOn&&links.groupUrl?links.groupUrl:null,testingUrl:links.testerOn&&links.testingUrl?links.testingUrl:null,testerUrl:links.testerOn&&links.testerUrl?links.testerUrl:null,banner:b&&b.on&&b.text?{text:String(b.text).slice(0,200)}:null,previewMusic:pm?.id?{url:'/api/preview-music?v='+encodeURIComponent(pm.id),name:String(pm.name||'').slice(0,120)}:null,support:SUPPORT},200,{'Cache-Control':'public, max-age=60'});
 }
 if(path==='/api/coupon/check'&&request.method==='POST'){
  await rateHit(env,'coupon',request,30,600);
  const input=await body(request,2000);
  const price=await db(env).prepare('SELECT * FROM prices WHERE design_id=?').bind(typeof input?.designId==='string'?input.designId:'').first();
  if(!price)fail('Choose a design first.');
  const amount=price.launch_active?price.launch_paise:price.regular_paise;
  const c=await couponFor(env,input?.code,amount);if(!c)fail('Enter a coupon code.');
  return json({code:c.code,discount:c.discount,final:c.final,current:amount});
 }
 if(path==='/api/pricing'&&request.method==='GET'){
  const rows=await db(env).prepare('SELECT design_id,regular_paise,launch_paise,launch_active FROM prices ORDER BY regular_paise DESC').all();
  const ready=[];for(const g of GATEWAYS)if(usable(await gatewayRow(env,g).catch(()=>null)))ready.push(g);
  const mapped=(rows.results||[]).map(r=>({id:r.design_id,regular:r.regular_paise,launch:r.launch_paise,current:r.launch_active?r.launch_paise:r.regular_paise,launchActive:!!r.launch_active}));
  return json({designs:mapped.filter(x=>!x.id.startsWith('addon-')),addons:mapped.filter(x=>x.id.startsWith('addon-')),gateways:ready});
 }
 /* The catalogue itself — design/add-on names, styles and artwork (server/catalog.js
    is the one source for web + app). Prices stay on /api/pricing. */
 if(path==='/api/catalog'&&request.method==='GET'){
  return json(catalogPayload(url.origin),200,{'Cache-Control':'public, max-age=300'});
 }
 if(path.startsWith('/api/payments/webhook/')&&request.method==='POST'){
  const g=path.slice('/api/payments/webhook/'.length);if(!GATEWAYS.includes(g)||g==='payu')fail('Not found.',404);
  const raw=await request.text();
  const cfg=await gatewayRow(env,g);if(!cfg)fail('Not found.',404);
  const extra=extraOf(cfg);
  if(g==='razorpay'){
   const secret=extra['webhook_'+'secret'];if(!secret)fail('Webhook is not configured.',503);
   if(!safeEq(await hmacHex(secret,raw),request.headers.get('x-razorpay-signature')||''))fail('Invalid signature.',400);
   const event=JSON.parse(raw);const entity=event?.payload?.payment?.entity;
   if(entity?.order_id&&(event.event==='payment.captured'||event.event==='order.paid')){const order=await db(env).prepare('SELECT * FROM orders WHERE gateway_order_id=?').bind(entity.order_id).first();if(order)await completeOrder(env,order,entity.id);}
   return json({ok:true});
  }
  if(g==='cashfree'){
   const ts=request.headers.get('x-webhook-timestamp')||'';
   if(!safeEq(await hmacB64(cfg.key_secret,ts+raw),request.headers.get('x-webhook-signature')||''))fail('Invalid signature.',400);
   const event=JSON.parse(raw);
   if(event?.type==='PAYMENT_SUCCESS_WEBHOOK'){const order=await db(env).prepare('SELECT * FROM orders WHERE id=?').bind(event?.data?.order?.order_id||'').first();if(order)await completeOrder(env,order,event?.data?.payment?.cf_payment_id);}
   return json({ok:true});
  }
  if(g==='phonepe'){
   const expected=await sha256hex(String(extra.webhook_username||'')+':'+String(extra['webhook_'+'password']||''));
   if(!safeEq(expected,request.headers.get('Authorization')||''))fail('Invalid signature.',400);
   const event=JSON.parse(raw);let merchantOrderId=null,state=null,payId=null;
   if(event?.response){try{const decoded=JSON.parse(atob(event.response));merchantOrderId=decoded?.data?.merchantOrderId;state=decoded?.code==='PAYMENT_SUCCESS'?'COMPLETED':decoded?.code;payId=decoded?.data?.transactionId;}catch{}}
   else if(event?.payload){merchantOrderId=event.payload.merchantOrderId;state=event.payload.state;payId=event.payload.paymentDetails?.[0]?.transactionId;}
   if(merchantOrderId&&state==='COMPLETED'){const order=await db(env).prepare('SELECT * FROM orders WHERE id=?').bind(merchantOrderId).first();if(order)await completeOrder(env,order,payId);}
   return json({ok:true});
  }
 }
 if(path==='/api/payments/payu-return'&&(request.method==='POST'||request.method==='GET')){
  const cfg=await gatewayRow(env,'payu').catch(()=>null);
  const form=request.method==='POST'?await request.formData().catch(()=>null):null;
  const get=k=>form?String(form.get(k)||''):(url.searchParams.get(k)||'');
  let ok=false,oid='';
  if(cfg){const udfs=[];for(let i=10;i>=1;i--)udfs.push(get('udf'+i));
   const calc=await sha512hex([cfg.key_secret,get('status'),...udfs,get('email'),get('firstname'),get('productinfo'),get('amount'),get('txnid'),cfg.key_id].join('|'));
   if(safeEq(calc,get('hash'))&&get('status')==='success'){const order=await db(env).prepare('SELECT * FROM orders WHERE id=?').bind(get('txnid')).first();if(order){await completeOrder(env,order,get('mihpayid'));ok=true;oid=order.id;}}
  }
  return new Response(null,{status:302,headers:{'Location':'/register?payment='+(ok?'success':'failed')+(oid?'&order_id='+oid:'')}});
 }
 /* PayU return for album "Save Forever" orders: same signed-hash check as the
    design flow, then back to My Albums (completeOrder makes the album permanent). */
 if(path==='/api/albums/pay-return'&&(request.method==='POST'||request.method==='GET')){
  const cfg=await gatewayRow(env,'payu').catch(()=>null);
  const form=request.method==='POST'?await request.formData().catch(()=>null):null;
  const get=k=>form?String(form.get(k)||''):(url.searchParams.get(k)||'');
  let ok=false,oid='';
  if(cfg){const udfs=[];for(let i=10;i>=1;i--)udfs.push(get('udf'+i));
   const calc=await sha512hex([cfg.key_secret,get('status'),...udfs,get('email'),get('firstname'),get('productinfo'),get('amount'),get('txnid'),cfg.key_id].join('|'));
   if(safeEq(calc,get('hash'))&&get('status')==='success'){const order=await db(env).prepare('SELECT * FROM orders WHERE id=? AND design_id=?').bind(get('txnid'),'album-storage').first();if(order){await completeOrder(env,order,get('mihpayid'));ok=true;oid=order.id;}}
  }
  return new Response(null,{status:302,headers:{'Location':'/albums?payment='+(ok?'success':'failed')+(oid?'&order_id='+oid:'')}});
 }
 /* Public feature settings: what the album + vendor pages need to show
    (Save Forever price, free-draft length, commission %, categories). */
 if(path==='/api/features'&&request.method==='GET'){
  const [st,cats,pct,agr]=await Promise.all([albumSettings(env),vendorCategories(env),commissionPercent(env),vendorAgreement(env)]);
  return json({album:{pricePaise:st.price_paise,draftDays:st.draft_days},commissionPercent:pct,vendorCategories:cats,vendorAgreement:agr},200,{'Cache-Control':'public, max-age=60'});
 }
 /* Public vendor directory: approved vendors only. Ratings come only from
    real, completed-booking reviews; a vendor with none shows no rating. */
 if(path==='/api/vendors'&&request.method==='GET'){
  const cats=await vendorCategories(env),cat=String(url.searchParams.get('category')||''),city=String(url.searchParams.get('city')||'').trim().toLowerCase().slice(0,60);
  const cols="*,(SELECT ROUND(AVG(stars),1) FROM vendor_reviews WHERE vendor_id=vendors.id AND hidden=0) AS rating_avg,(SELECT COUNT(*) FROM vendor_reviews WHERE vendor_id=vendors.id AND hidden=0) AS rating_count";
  let sql="SELECT "+cols+" FROM vendors WHERE status='approved'",bind=[];
  if(cat){sql+=' AND category=?';bind.push(cat);}
  if(city){sql+=' AND lower(city) LIKE ?';bind.push('%'+city+'%');}
  let rows;
  try{rows=(await db(env).prepare(sql+' ORDER BY created_at DESC LIMIT 300').bind(...bind).all()).results||[];}
  catch{rows=(await db(env).prepare(sql.replace(cols,'*')+' ORDER BY created_at DESC LIMIT 300').bind(...bind).all()).results||[];}
  const out=[];for(const r of rows){await ensureVendorCode(env,r);out.push(await vendorShape(env,r,cats));}
  return json({vendors:out});
 }
 if(path.startsWith('/api/vendors/')&&request.method==='GET'){
  const id=path.slice('/api/vendors/'.length);if(!/^[0-9a-f-]{36}$/.test(id))fail('Vendor not found.',404);
  let row=null;
  try{row=await db(env).prepare("SELECT *,(SELECT ROUND(AVG(stars),1) FROM vendor_reviews WHERE vendor_id=vendors.id AND hidden=0) AS rating_avg,(SELECT COUNT(*) FROM vendor_reviews WHERE vendor_id=vendors.id AND hidden=0) AS rating_count FROM vendors WHERE id=? AND status='approved'").bind(id).first();}
  catch{row=await db(env).prepare("SELECT * FROM vendors WHERE id=? AND status='approved'").bind(id).first();}
  if(!row)fail('Vendor not found.',404);
  await ensureVendorCode(env,row);
  let reviews=[];
  try{reviews=(await db(env).prepare('SELECT r.stars,r.body,r.created_at,u.name AS cname FROM vendor_reviews r LEFT JOIN users u ON u.id=r.customer_id WHERE r.vendor_id=? AND r.hidden=0 ORDER BY r.created_at DESC LIMIT 20').bind(id).all()).results||[];}catch{}
  return json({vendor:await vendorShape(env,row,await vendorCategories(env)),reviews:reviews.map(r=>({stars:r.stars,text:r.body||'',customer:String(r.cname||'Customer').split(' ')[0],createdAt:r.created_at}))});
 }
 /* A shared album: permanent + public only, reached by its unguessable token.
    With a share PIN set, the album's photos stay locked until the PIN is
    entered on the share page (see the unlock route below). */
 if(path.startsWith('/api/albums/shared/')&&request.method==='GET'){
  const token=path.slice('/api/albums/shared/'.length);if(!/^[a-f0-9]{32,64}$/.test(token))fail('Album not found.',404);
  const row=await db(env).prepare("SELECT * FROM albums WHERE share_token=? AND storage='permanent' AND is_public=1").bind(token).first();
  if(!row)fail('Album not found.',404);
  if(row.share_pin_hash&&!(await albumPinOk(request,row)))return json({pinRequired:true,album:{title:row.title,partner1:row.partner1||'',partner2:row.partner2||''}});
  return json({album:await albumShape(env,row)});
 }
 if(path.startsWith('/api/albums/shared/')&&path.endsWith('/unlock')&&request.method==='POST'){
  const token=path.slice('/api/albums/shared/'.length,path.length-'/unlock'.length);if(!/^[a-f0-9]{32,64}$/.test(token))fail('Album not found.',404);
  await rateHit(env,'albumpin',request,10,600);
  const row=await db(env).prepare("SELECT * FROM albums WHERE share_token=? AND storage='permanent' AND is_public=1").bind(token).first();
  if(!row||!row.share_pin_hash)fail('Album not found.',404);
  await rateHit(env,'albumpin-'+row.id.slice(0,8),request,5,600);
  const input=await body(request,2000);
  const pin=typeof input?.pin==='string'?input.pin.trim():'';
  if(!/^\d{4}$/.test(pin)||!safeEq(await sha256hex(pin+':'+row.id),row.share_pin_hash))fail('That PIN did not work. Please check the 4 digits and try again.',401);
  return json({ok:true,album:await albumShape(env,row)},200,{'Set-Cookie':albumPinCookieName(row.id)+'='+await albumPinProof(row)+'; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Lax'});
 }
 /* Album photos: public only for a public permanent album; otherwise the
    album's owner (or the admin) with a session. */
 if(path.startsWith('/api/album-photo/')&&request.method==='GET'){
  const id=path.slice('/api/album-photo/'.length);if(!/^[0-9a-f-]{36}$/.test(id))fail('Photo not found.',404);
  const photo=await db(env).prepare('SELECT p.r2_key AS k,a.id AS aid,a.user_id AS uid,a.storage AS st,a.is_public AS pub,a.share_token AS stok,a.share_pin_hash AS pin FROM album_photos p JOIN albums a ON a.id=p.album_id WHERE p.id=?').bind(id).first();
  if(!photo)fail('Photo not found.',404);
  const isPublic=photo.st==='permanent'&&photo.pub===1;
  let open=isPublic&&!photo.pin;
  if(isPublic&&photo.pin)open=await albumPinOk(request,{id:photo.aid,share_token:photo.stok,share_pin_hash:photo.pin});
  if(!open){
   const u=await currentUser(request,env);const adm=u?null:await currentAdmin(request,env);
   if(!u&&!adm)fail('Photo not found.',404);
   if(u&&u.id!==photo.uid&&!(await isAdminUser(env,u)))fail('Photo not found.',404);
  }
  const object=await env.BUCKET?.get(photo.k);if(!object)fail('Photo not found.',404);
  return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/webp','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff','X-EW-Origin':EW_ORIGIN}});
 }
 /* Vendor portfolio photos: public for approved vendors; the vendor or the
    admin can also see photos of a not-yet-approved profile. */
 if(path.startsWith('/api/vendor-photo/')&&request.method==='GET'){
  const id=path.slice('/api/vendor-photo/'.length);if(!/^[0-9a-f-]{36}$/.test(id))fail('Photo not found.',404);
  const photo=await db(env).prepare('SELECT p.r2_key AS k,v.user_id AS uid,v.status AS st FROM vendor_photos p JOIN vendors v ON v.id=p.vendor_id WHERE p.id=?').bind(id).first();
  if(!photo)fail('Photo not found.',404);
  if(photo.st!=='approved'){
   const u=await currentUser(request,env);const adm=u?null:await currentAdmin(request,env);
   if(!u&&!adm)fail('Photo not found.',404);
   if(u&&u.id!==photo.uid&&!(await isAdminUser(env,u)))fail('Photo not found.',404);
  }
  const object=await env.BUCKET?.get(photo.k);if(!object)fail('Photo not found.',404);
  return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/webp','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff','X-EW-Origin':EW_ORIGIN}});
 }
 /* Printable receipts — one for an order (design unlock or album storage),
    one for a vendor booking. Visible only to the customer who owns it, the
    vendor it belongs to, or the boss; every amount is read from the stored
    server rows, never from the request. */
 if(path.startsWith('/api/receipts/order/')&&request.method==='GET'){
  const id=path.slice('/api/receipts/order/'.length);
  const u=await currentUser(request,env);const adm=u?null:await currentAdmin(request,env);
  const o=await db(env).prepare('SELECT * FROM orders WHERE id=?').bind(id).first();
  if(!o||(!adm&&(!u||o.user_id!==u.id)))fail('Receipt not found.',404);
  const orderUser=o.user_id?await db(env).prepare('SELECT name,email FROM users WHERE id=?').bind(o.user_id).first():null;
  let item='Easy Wedding design';
  if(o.design_id==='album-storage'){const al=await db(env).prepare('SELECT title FROM albums WHERE storage_order_id=?').bind(o.id).first();item='Wedding Album — Save Forever storage'+(al&&al.title?' — '+al.title:'');}
  else{const d=CATALOG_DESIGNS.find(x=>x.id===o.design_id);item=(d?d.name:String(o.design_id))+' — invitation design unlock';}
  const paid=o.status==='paid';
  const rows=[['Receipt for',item],['Order reference',o.id],['Date',new Date(o.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})],['Customer',o.signup_name||(orderUser?orderUser.name:'')||''],['Email',o.signup_email||(orderUser?orderUser.email:'')||''],['Amount',inrHtml(o.amount_paise+o.discount_paise)]];
  if(o.discount_paise)rows.push(['Discount','− '+inrHtml(o.discount_paise)]);
  rows.push(['Status',paid?'Paid':'Pending / not completed']);
  if(o.gateway)rows.push(['Payment via',o.gateway]);
  if(o.gateway_payment_id)rows.push(['Payment ID',o.gateway_payment_id]);
  const inner='<h1>Easy Wedding</h1><p class="sub">Payment receipt · easywedding.in</p><table>'+rows.map(r=>'<tr><td class="k">'+escHtml(r[0])+'</td><td class="v">'+escHtml(r[1])+'</td></tr>').join('')+'<tr class="total"><td class="k">Total '+(paid?'paid':'payable')+'</td><td class="v">'+escHtml(inrHtml(o.amount_paise))+'</td></tr></table><p style="font-size:13px;color:#7a6a58">Keep this receipt for your records. For help, message us on WhatsApp +91 87899 91983 (support 10 AM – 8 PM).</p><button type="button" data-print>Print / Save as PDF</button>';
  return receiptResponse(receiptPage('Order receipt',inner));
 }
 if(path.startsWith('/api/receipts/booking/')&&request.method==='GET'){
  const id=path.slice('/api/receipts/booking/'.length);
  const u=await currentUser(request,env);const adm=u?null:await currentAdmin(request,env);
  const b=await db(env).prepare('SELECT * FROM vendor_bookings WHERE id=?').bind(id).first();
  if(!b)fail('Receipt not found.',404);
  const v=await db(env).prepare('SELECT * FROM vendors WHERE id=?').bind(b.vendor_id).first();
  const mine=!!u&&(b.customer_id===u.id||(v&&v.user_id===u.id));
  if(!adm&&!mine)fail('Receipt not found.',404);
  if(v)await ensureVendorCode(env,v);
  const rows=[['Booking reference',b.id],['Vendor',v?v.business_name:''],['Vendor ID',v&&v.vendor_code?v.vendor_code:'—'],['Customer',b.customer_name||''],['Event',(b.event_type||'Wedding')+(b.event_date?' · '+b.event_date:'')],['City',b.city||''],['Status',b.status],['Booked on',new Date(b.created_at).toLocaleDateString('en-IN',{dateStyle:'medium'})]];
  if(b.final_paise!=null){rows.push(['Final amount',inrHtml(b.final_paise)]);if(b.commission_percent!=null){rows.push(['Easy Wedding commission ('+b.commission_percent+'%)',inrHtml(b.commission_paise)]);rows.push(['Vendor receives',inrHtml(b.net_paise)]);}rows.push(['Payment handling',b.settlement_mode==='platform_split'?'Collected by Easy Wedding (Protected Booking)':'Settled directly with the vendor']);}
  else rows.push(['Amount','To be confirmed by the vendor']);
  const inner='<h1>Easy Wedding</h1><p class="sub">Vendor booking receipt · easywedding.in</p><table>'+rows.map(r=>'<tr><td class="k">'+escHtml(r[0])+'</td><td class="v">'+escHtml(r[1])+'</td></tr>').join('')+'</table><p style="font-size:13px;color:#7a6a58">Protected Booking: when payment is collected by Easy Wedding, it stays safe with us and is released to the vendor only after your event. For help, message us on WhatsApp +91 87899 91983 (support 10 AM – 8 PM).</p><button type="button" data-print>Print / Save as PDF</button>';
  return receiptResponse(receiptPage('Booking receipt',inner));
 }
 let authUser=await currentUser(request,env);
 const adminUser=await currentAdmin(request,env);
 if(path==='/api/session'&&request.method==='GET')return json({user:authUser?{...authUser,admin:await isAdminUser(env,authUser)}:null});
 /* Visitor Intelligence data for /boss — handled here, before the
    signed-in workspace gate below, because the boss session is separate
    from the website session. The route enforces the boss check itself:
    currentAdmin + isAdminUser, the same pair as every /api/admin route. */
 if(path==='/api/boss/vi'&&request.method==='GET'){
  if(!await isAdminUser(env,adminUser))fail('Admin access only.',403);
  return json(await viBossData(env));
 }
 if(path==='/api/auth/signup'&&request.method==='POST'){
  await rateHit(env,'signup',request,8,600);
  if(request.headers.get('Origin')!==url.origin)fail('This request must come from your wedding workspace.',403);
  const input=await body(request,20000);
  const name=typeof input?.name==='string'?input.name.trim():'',email=typeof input?.email==='string'?input.email.trim().toLowerCase():'',password=typeof input?.password==='string'?input.password:'';
  if(!bounded(name,70)||!name)fail('Please enter your name.');
  if(!bounded(email,120)||!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))fail('Please enter a valid email address.');
  if(password.length<8)fail('Please choose a password of at least 8 characters.');
  if(password.length>72)fail('Please choose a shorter password (72 characters at most).');
  if(await db(env).prepare('SELECT id FROM users WHERE email=?').bind(email).first())fail('An account with this email already exists. Please log in instead.',409);
  // With ADMIN_PASSWORD set, the owner email can only be created by logging in with the secret (nobody can register it first).
  if(env.ADMIN_EMAIL&&env.ADMIN_PASSWORD&&email===String(env.ADMIN_EMAIL).trim().toLowerCase())fail('An account with this email already exists. Please log in instead.',409);
  const id=crypto.randomUUID();
  await db(env).prepare('INSERT INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)').bind(id,email,name,await makePasswordRecord(password),new Date().toISOString()).run();
  return json({user:{id,email,name,admin:email===(await adminEmail(env))}},201,{'Set-Cookie':sessionCookie(await startSession(env,id),SESSION_COOKIE_AGE)});
 }
 if(path==='/api/auth/login'&&request.method==='POST'){
  await rateHit(env,'login',request,20,300);
  if(request.headers.get('Origin')!==url.origin)fail('This request must come from your wedding workspace.',403);
  const input=await body(request,20000);
  const email=typeof input?.email==='string'?input.email.trim().toLowerCase():'',password=typeof input?.password==='string'?input.password:'';
  if(email&&await loginLocked(env,email))fail('Too many failed sign-in attempts for this account. Please wait 15 minutes and try again.',429);
  // Owner account from Worker secrets: ADMIN_EMAIL + ADMIN_PASSWORD always sign in.
  // The account is created on first use and its stored password follows the secret.
  if(env.ADMIN_EMAIL&&env.ADMIN_PASSWORD&&email===String(env.ADMIN_EMAIL).trim().toLowerCase()&&safeEq(password,String(env.ADMIN_PASSWORD))){
   let owner=await db(env).prepare('SELECT id,email,name,password_hash FROM users WHERE email=?').bind(email).first();
   if(!owner){const id=crypto.randomUUID();await db(env).prepare('INSERT INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)').bind(id,email,'Admin',await makePasswordRecord(password),new Date().toISOString()).run();owner={id,email,name:'Admin'};}
   else if(!await verifyPassword(password,owner.password_hash))await db(env).prepare('UPDATE users SET password_hash=? WHERE id=?').bind(await makePasswordRecord(password),owner.id).run();
   await clearLoginFails(env,email);await rotateSessions(env,owner.id,'user');
   return json({user:{id:owner.id,email:owner.email,name:owner.name,admin:true}},200,{'Set-Cookie':sessionCookie(await startSession(env,owner.id),SESSION_COOKIE_AGE)});
  }
  const row=await db(env).prepare('SELECT id,email,name,password_hash FROM users WHERE email=?').bind(email).first();
  if(!row){await noteLoginFail(env,email);await hashPassword(password,'AAAAAAAAAAAAAAAAAAAAAA==',100000);fail('Email or password is incorrect.',401);}
  if(!await verifyPassword(password,row.password_hash)){await noteLoginFail(env,email);fail('Email or password is incorrect.',401);}
  await clearLoginFails(env,email);await rotateSessions(env,row.id,'user');
  return json({user:{id:row.id,email:row.email,name:row.name,admin:row.email.toLowerCase()===(await adminEmail(env))}},200,{'Set-Cookie':sessionCookie(await startSession(env,row.id),SESSION_COOKIE_AGE)});
 }
 // Admin-only sign-in used by /boss: a normal registered customer can never get a session here.
 if(path==='/api/admin/login'&&request.method==='POST'){
  await rateHit(env,'login',request,20,300);
  if(request.headers.get('Origin')!==url.origin)fail('This request must come from your wedding workspace.',403);
  const input=await body(request,20000);
  const email=typeof input?.email==='string'?input.email.trim().toLowerCase():'',password=typeof input?.password==='string'?input.password:'';
  if(email&&await loginLocked(env,email))fail('Too many failed sign-in attempts for this account. Please wait 15 minutes and try again.',429);
  if(env.ADMIN_EMAIL&&env.ADMIN_PASSWORD&&email===String(env.ADMIN_EMAIL).trim().toLowerCase()&&safeEq(password,String(env.ADMIN_PASSWORD))){
   let owner=await db(env).prepare('SELECT id,email,name,password_hash FROM users WHERE email=?').bind(email).first();
   if(!owner){const id=crypto.randomUUID();await db(env).prepare('INSERT INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)').bind(id,email,'Admin',await makePasswordRecord(password),new Date().toISOString()).run();owner={id,email,name:'Admin'};}
   else if(!await verifyPassword(password,owner.password_hash))await db(env).prepare('UPDATE users SET password_hash=? WHERE id=?').bind(await makePasswordRecord(password),owner.id).run();
   return await finishAdminLogin(env,owner);
  }
  const row=await db(env).prepare('SELECT id,email,name,password_hash FROM users WHERE email=?').bind(email).first();
  if(!row){await noteLoginFail(env,email);await hashPassword(password,'AAAAAAAAAAAAAAAAAAAAAA==',100000);fail('Email or password is incorrect.',401);}
  if(!await verifyPassword(password,row.password_hash)){await noteLoginFail(env,email);fail('Email or password is incorrect.',401);}
  const ownerEmail=await adminEmail(env);
  if(!ownerEmail||row.email.toLowerCase()!==ownerEmail)fail(env.ADMIN_EMAIL&&env.ADMIN_PASSWORD?'This account does not have admin access. Please sign in with the admin account.':'This account does not have admin access. The ADMIN_EMAIL and ADMIN_PASSWORD secrets are not set on the server: add them in Cloudflare → Workers → easy-wedding → Settings → Variables and Secrets (type Secret), then sign in with that email.',403);
  return await finishAdminLogin(env,row);
 }
 // Boss two-step login, step 2: the emailed 6-digit code. Challenges live
 // 10 minutes, allow 5 attempts, and are deleted on use or expiry.
 if(path==='/api/admin/verify-code'&&request.method==='POST'){
  await rateHit(env,'boss2fa',request,10,600);
  if(request.headers.get('Origin')!==url.origin)fail('This request must come from your wedding workspace.',403);
  const input=await body(request,4000);
  const challengeId=typeof input?.challengeId==='string'?input.challengeId:'',code=typeof input?.code==='string'?input.code.trim():'';
  const bad=()=>fail('That code did not work. Please check the code and try again.',401);
  if(!challengeId||!/^\d{6}$/.test(code))bad();
  const row=await db(env).prepare('SELECT * FROM admin_login_codes WHERE id=?').bind(challengeId).first().catch(()=>null);
  if(!row)bad();
  if(row.expires_at<Math.floor(Date.now()/1000)||row.attempts>=5){await db(env).prepare('DELETE FROM admin_login_codes WHERE id=?').bind(challengeId).run().catch(()=>{});fail('That code has expired. Please sign in again to get a fresh code.',401);}
  if(!safeEq(await sha256hex(code+':'+row.email),row.code_hash)){await db(env).prepare('UPDATE admin_login_codes SET attempts=attempts+1 WHERE id=?').bind(challengeId).run();bad();}
  await db(env).prepare('DELETE FROM admin_login_codes WHERE id=?').bind(challengeId).run();
  const owner=await db(env).prepare('SELECT id,email,name FROM users WHERE email=?').bind(row.email).first();
  if(!owner)bad();
  await rotateSessions(env,owner.id,'admin');
  return json({user:{id:owner.id,email:owner.email,name:owner.name,admin:true}},200,{'Set-Cookie':adminCookie(await startSession(env,owner.id,'admin'),SESSION_COOKIE_AGE)});
 }

 // Forgot password: the email AND the mobile number used when paying must match; then the customer sets a new password.
 if((path==='/api/auth/forgot'||path==='/api/auth/reset')&&request.method==='POST'){
  await rateHit(env,'forgot',request,15,600);
  if(request.headers.get('Origin')!==url.origin)fail('This request must come from your wedding workspace.',403);
  const input=await body(request,4000);
  const email=typeof input?.email==='string'?input.email.trim().toLowerCase():'',phone=typeof input?.phone==='string'?input.phone.replace(/\D/g,'').slice(-10):'';
  if(email)await emailHit(env,email,10,3600);
  const noMatch=()=>fail('We could not match these details. Check the email and the mobile number you used when you paid.',404);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||!/^[6-9]\d{9}$/.test(phone))noMatch();
  if(email===await adminEmail(env))fail('The admin password is set in Cloudflare (ADMIN_PASSWORD), not on this page.',403);
  const account=await db(env).prepare('SELECT id FROM users WHERE email=?').bind(email).first();
  const matched=account&&await db(env).prepare("SELECT 1 AS ok FROM orders WHERE user_id=? AND status='paid' AND phone_hash=? LIMIT 1").bind(account.id,await sha256hex(email+':'+phone)).first();
  if(!matched)noMatch();
  if(path==='/api/auth/forgot')return json({ok:true});
  const fresh=typeof input?.password==='string'?input.password:'';
  if(fresh.length<8)fail('Please choose a password of at least 8 characters.');
  if(fresh.length>72)fail('Please choose a shorter password (72 characters at most).');
  await db(env).prepare('UPDATE users SET password_hash=? WHERE id=?').bind(await makePasswordRecord(fresh),account.id).run();
  await db(env).prepare('DELETE FROM sessions WHERE user_id=?').bind(account.id).run();
  return json({ok:true});
 }
 if(path==='/api/auth/logout'&&request.method==='POST'){
  if(request.headers.get('Origin')!==url.origin)fail('This request must come from your wedding workspace.',403);
  const token=sessionToken(request);
  if(token)await db(env).prepare('DELETE FROM sessions WHERE id=?').bind(await sha256hex(token)).run();
  return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)});
 }
 // Admin sign-out ends ONLY the console session; a website sign-in in the
 // same browser is a separate session and is left untouched.
 if(path==='/api/admin/logout'&&request.method==='POST'){
  const token=adminToken(request);
  if(token)await db(env).prepare('DELETE FROM sessions WHERE id=?').bind(await sha256hex(token)).run().catch(()=>{});
  return json({ok:true},200,{'Set-Cookie':adminCookie('',0)});
 }

 // Guest checkout: no account exists until a payment succeeds. The sign-up details wait on the order.
 let guestSignup=null,guestOrder=null;
 if(!authUser&&request.method==='POST'&&path==='/api/checkout'){
  if(request.headers.get('Origin')!==url.origin)fail('This request must come from your wedding workspace.',403);
  const peek=await body(request.clone(),20000),su=peek?.signup;
  const sName=typeof su?.name==='string'?su.name.trim():'',sEmail=typeof su?.email==='string'?su.email.trim().toLowerCase():'',sPass=typeof su?.password==='string'?su.password:'';
  if(!sName||!bounded(sName,70))fail('Please enter your name to create the account.');
  if(!bounded(sEmail,120)||!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(sEmail))fail('Please enter a valid email address.');
  if(sPass.length<8)fail('Please choose a password of at least 8 characters.');
  if(sPass.length>72)fail('Please choose a shorter password (72 characters at most).');
  if(sEmail===await adminEmail(env))fail('This email is reserved. Please use a different email.',409);
  const existing=await db(env).prepare('SELECT id,password_hash FROM users WHERE email=?').bind(sEmail).first();
  if(existing){
   // An earlier account that never paid: signing in with its password lets the customer continue.
   if(!await verifyPassword(sPass,existing.password_hash))fail('This email is already registered. Please log in, or enter the password you used before.',409);
   return json({relogin:true},200,{'Set-Cookie':sessionCookie(await startSession(env,existing.id),SESSION_COOKIE_AGE)});
  }
  guestSignup={id:'pending-'+crypto.randomUUID(),name:sName,email:sEmail,hash:await makePasswordRecord(sPass)};
  authUser={id:guestSignup.id,email:sEmail,name:sName};
 }
 if(!authUser&&request.method==='POST'&&path==='/api/checkout/verify'){
  if(request.headers.get('Origin')!==url.origin)fail('This request must come from your wedding workspace.',403);
  const peek=await body(request.clone(),20000);
  guestOrder=await db(env).prepare('SELECT * FROM orders WHERE id=? AND signup_email IS NOT NULL AND claimed=0').bind(typeof peek?.orderId==='string'?peek.orderId:'').first();
  if(!guestOrder)fail('Order not found.',404);
  authUser={id:guestOrder.user_id,email:guestOrder.signup_email,name:guestOrder.signup_name};
 }
 /* The admin console passes this gate with its own admin session — it
    never needs (or gets) a website workspace identity. */
 if(!authUser&&!(adminUser&&path.startsWith('/api/admin/')))fail('Sign in to save your wedding workspace.',401);
 const owner=authUser?authUser.id:'';
 if(!['GET','HEAD'].includes(request.method)&&request.headers.get('Origin')!==url.origin)fail('This request must come from your wedding workspace.',403);
 // ---- Your data: download everything as a ZIP, or erase everything permanently (DPDP Act rights) ----
 if(path==='/api/account/export'&&request.method==='GET'){
  if(guestOrder)fail('Sign in to download your data.',401);
  return new Response(exportAccountZip(env,authUser),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="easy-wedding-my-data.zip"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-EW-Origin':EW_ORIGIN}});
 }
 if(path==='/api/account/delete'&&request.method==='POST'){
  if(guestOrder)fail('Sign in to delete your account.',401);
  const input=await body(request,2000);
  if(input?.confirm!=='DELETE')fail('Type DELETE (in capital letters) to confirm.',400);
  if(await isAdminUser(env,authUser))fail('The admin account cannot be deleted here.',409);
  await eraseAccountData(env,authUser.id,{eraseOrders:false});
  return json({deleted:true},200,{'Set-Cookie':sessionCookie('',0)});
 }
 // ---- My bookings: vendor bookings with their services, the advance and every later payment ----
 if(path==='/api/bookings'||path.startsWith('/api/bookings/')){
  const parts=path.split('/').filter(Boolean);
  const CATS=['pandal','light','dj','catering','decoration','photo','mehndi','makeup','transport','bulk','other'];
  const money=v=>{const n=Math.round(Number(v)*100);if(!Number.isFinite(n)||n<0||n>100000000000)fail('Please enter a valid amount.');return n;};
  const day=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):'';
  const clean=(v,n)=>String(v==null?'':v).trim().slice(0,n);
  const mine=async id=>{const b=await db(env).prepare('SELECT * FROM bookings WHERE id=? AND user_id=?').bind(id,owner).first();if(!b)fail('Booking not found.',404);return b;};
  const shape=async(rows)=>{
   if(!rows.length)return [];
   const ids=rows.map(r=>r.id),marks=ids.map(()=>'?').join(',');
   const items=(await db(env).prepare('SELECT id,booking_id,service,amount_paise FROM booking_items WHERE booking_id IN ('+marks+') ORDER BY rowid').bind(...ids).all()).results||[];
   const pays=(await db(env).prepare('SELECT id,booking_id,amount_paise,paid_on,mode,note FROM booking_payments WHERE booking_id IN ('+marks+') ORDER BY paid_on,created_at').bind(...ids).all()).results||[];
   return rows.map(r=>{const it=items.filter(x=>x.booking_id===r.id),pa=pays.filter(x=>x.booking_id===r.id);const total=it.reduce((s,x)=>s+x.amount_paise,0),paid=pa.reduce((s,x)=>s+x.amount_paise,0);
    return {id:r.id,vendor:r.vendor_name,phone:r.phone||'',category:r.category,eventDate:r.event_date||'',note:r.note||'',createdAt:r.created_at,
     items:it.map(x=>({id:x.id,service:x.service,amount:x.amount_paise})),payments:pa.map(x=>({id:x.id,amount:x.amount_paise,paidOn:x.paid_on,mode:x.mode||'',note:x.note||''})),total,paid,balance:total-paid};});
  };
  const readItems=input=>{const list=Array.isArray(input?.items)?input.items:[];const out=list.map(x=>({service:clean(x?.service,80),amount:money(x?.amount||0)})).filter(x=>x.service);if(!out.length)fail('Add at least one service, such as Pandal or DJ.');if(out.length>20)fail('A booking can hold up to 20 services.');return out;};
  const readFields=input=>{const vendor=clean(input?.vendor,80);if(!vendor)fail('Please enter the vendor or contact name.');const phone=clean(input?.phone,20).replace(/[^\d+ ]/g,'');const category=CATS.includes(input?.category)?input.category:'other';return {vendor,phone,category,eventDate:day(input?.eventDate),note:clean(input?.note,300)};};
  const saveItems=async(bookingId,items)=>{await db(env).prepare('DELETE FROM booking_items WHERE booking_id=?').bind(bookingId).run();for(const it of items)await db(env).prepare('INSERT INTO booking_items(id,booking_id,service,amount_paise) VALUES(?,?,?,?)').bind(crypto.randomUUID(),bookingId,it.service,it.amount).run();};
  if(parts.length===2){
   if(request.method==='GET'){const rows=(await db(env).prepare('SELECT * FROM bookings WHERE user_id=? ORDER BY created_at DESC LIMIT 200').bind(owner).all()).results||[];return json({bookings:await shape(rows)});}
   if(request.method==='POST'){
    await rateHit(env,'pbook',request,60,600);
    const input=await body(request,20000);const f=readFields(input),items=readItems(input);
    const count=await db(env).prepare('SELECT COUNT(*) AS n FROM bookings WHERE user_id=?').bind(owner).first();if((count?.n||0)>=200)fail('You have reached the limit of 200 bookings.');
    const id=crypto.randomUUID(),now=new Date().toISOString(),category=items.length>1&&f.category==='other'?'bulk':f.category;
    await db(env).prepare('INSERT INTO bookings(id,user_id,vendor_name,phone,category,event_date,note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,owner,f.vendor,f.phone,category,f.eventDate,f.note,now,now).run();
    await saveItems(id,items);
    const adv=input?.advance&&Number(input.advance.amount)>0?money(input.advance.amount):0,total=items.reduce((s,x)=>s+x.amount,0);
    if(adv>total)fail('The advance is more than the total amount.');
    if(adv>0)await db(env).prepare('INSERT INTO booking_payments(id,booking_id,amount_paise,paid_on,mode,note,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,adv,day(input.advance.paidOn)||now.slice(0,10),clean(input.advance.mode,20),'Advance',now).run();
    const row=await db(env).prepare('SELECT * FROM bookings WHERE id=?').bind(id).first();return json({booking:(await shape([row]))[0]},201);
   }
   fail('Not found.',404);
  }
  const booking=await mine(parts[2]);
  if(parts.length===3){
   if(request.method==='PUT'){const input=await body(request,20000);const f=readFields(input),items=readItems(input);const paid=(await db(env).prepare('SELECT COALESCE(SUM(amount_paise),0) AS s FROM booking_payments WHERE booking_id=?').bind(booking.id).first())?.s||0;if(items.reduce((s,x)=>s+x.amount,0)<paid)fail('The total cannot be lower than the '+(paid/100)+' already paid.');
    await db(env).prepare('UPDATE bookings SET vendor_name=?,phone=?,category=?,event_date=?,note=?,updated_at=? WHERE id=?').bind(f.vendor,f.phone,f.category,f.eventDate,f.note,new Date().toISOString(),booking.id).run();await saveItems(booking.id,items);
    const row=await db(env).prepare('SELECT * FROM bookings WHERE id=?').bind(booking.id).first();return json({booking:(await shape([row]))[0]});}
   if(request.method==='DELETE'){await db(env).prepare('DELETE FROM booking_payments WHERE booking_id=?').bind(booking.id).run();await db(env).prepare('DELETE FROM booking_items WHERE booking_id=?').bind(booking.id).run();await db(env).prepare('DELETE FROM bookings WHERE id=?').bind(booking.id).run();return json({ok:true});}
   fail('Not found.',404);
  }
  if(parts[3]==='payments'){
   if(parts.length===4&&request.method==='POST'){
    const input=await body(request,4000);const amount=money(input?.amount);if(amount<=0)fail('Please enter the amount you paid.');
    const [shaped]=await shape([booking]);if(amount>shaped.balance)fail('That is more than the balance of ₹'+(shaped.balance/100).toLocaleString('en-IN')+'.');
    const id=crypto.randomUUID(),now=new Date().toISOString();
    await db(env).prepare('INSERT INTO booking_payments(id,booking_id,amount_paise,paid_on,mode,note,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,booking.id,amount,day(input?.paidOn)||now.slice(0,10),clean(input?.mode,20),clean(input?.note,120),now).run();
    return json({booking:(await shape([booking]))[0]},201);
   }
   if(parts.length===5&&request.method==='DELETE'){await db(env).prepare('DELETE FROM booking_payments WHERE id=? AND booking_id=?').bind(parts[4],booking.id).run();return json({booking:(await shape([booking]))[0]});}
  }
  fail('Not found.',404);
 }
 // ---- Wedding albums: free drafts, "Save Forever" permanent storage ----
 /* Real reviews: only the customer of a COMPLETED booking with this vendor
    may review it, once per booking. Averages exist only when real reviews
    do — nothing is ever seeded or invented. */
 if(path.startsWith('/api/vendors/')&&path.endsWith('/reviews')&&request.method==='POST'){
  const vid=path.split('/').filter(Boolean)[2]||'';
  await rateHit(env,'review',request,10,3600);
  const input=await body(request,4000);
  const booking=await db(env).prepare('SELECT * FROM vendor_bookings WHERE id=? AND customer_id=? AND vendor_id=?').bind(String(input?.bookingId||''),owner,vid).first();
  if(!booking)fail('Booking not found.',404);
  if(booking.status!=='completed')fail('You can review this vendor after the booking is completed.');
  const existing=await db(env).prepare('SELECT id FROM vendor_reviews WHERE booking_id=?').bind(booking.id).first().catch(()=>null);
  if(existing)fail('You have already reviewed this booking.',409);
  const stars=Math.round(Number(input?.stars));if(!Number.isFinite(stars)||stars<1||stars>5)fail('Please choose a rating between 1 and 5 stars.');
  const text=String(input?.text==null?'':input.text).trim().slice(0,1000);
  const id=crypto.randomUUID();
  try{await db(env).prepare('INSERT INTO vendor_reviews(id,booking_id,vendor_id,customer_id,stars,body,hidden,created_at) VALUES(?,?,?,?,?,?,0,?)').bind(id,booking.id,vid,owner,stars,text,new Date().toISOString()).run();}
  catch{fail('You have already reviewed this booking.',409);}
  return json({review:{id,stars,text,createdAt:new Date().toISOString()}},201);
 }
 if(path==='/api/albums'||path.startsWith('/api/albums/')){
  const parts=path.split('/').filter(Boolean);
  const cleanA=(v,n)=>String(v==null?'':v).trim().slice(0,n);
  const ownAlbum=async id=>{const a=await db(env).prepare('SELECT * FROM albums WHERE id=? AND user_id=?').bind(id,owner).first();if(!a)fail('Album not found.',404);return a;};
  const albumExpired=a=>a.storage!=='permanent'&&a.expires_at&&a.expires_at<new Date().toISOString();
  if(parts.length===4&&parts[2]==='save-forever'&&parts[3]==='verify'&&request.method==='POST'){
   const input=await body(request,20000);
   const order=await db(env).prepare("SELECT * FROM orders WHERE id=? AND user_id=? AND design_id='album-storage'").bind(typeof input?.orderId==='string'?input.orderId:'',owner).first();
   if(!order)fail('Order not found.',404);
   if(order.status==='paid'){const alb=await db(env).prepare('SELECT * FROM albums WHERE id=? AND user_id=?').bind(order.ref_id||'',owner).first();return json({ok:true,album:alb?await albumShape(env,alb):null});}
   const cfg=await gatewayRow(env,order.gateway);if(!usable(cfg))fail('This payment option is not available right now.',400);
   let paid=false,paymentId=null;
   if(order.gateway==='razorpay'){
    const paymentIdIn=typeof input?.paymentId==='string'?input.paymentId:'',sig=typeof input?.signature==='string'?input.signature:'';
    const expected=await hmacHex(cfg.key_secret,(order.gateway_order_id||'')+'|'+paymentIdIn);
    if(paymentIdIn&&safeEq(expected,sig)){paid=true;paymentId=paymentIdIn;}
   }else if(order.gateway==='cashfree'){
    const base=cfg.mode==='live'?'https://api.cashfree.com/pg':'https://sandbox.cashfree.com/pg';
    const res=await fetch(base+'/orders/'+order.id,{headers:{'x-client-id':cfg.key_id,'x-client-secret':cfg.key_secret,'x-api-version':'2023-08-01'}});
    const data=await res.json().catch(()=>null);
    if(res.ok&&data?.order_status==='PAID')paid=true;
   }else if(order.gateway==='phonepe'){
    const {host,token}=await phonepeToken(cfg);
    const res=await fetch(host+'/apis/hermes/checkout/v2/order/'+order.id+'/status',{headers:{'Authorization':'O-Bearer '+token}});
    const data=await res.json().catch(()=>null);
    if(res.ok&&data?.state==='COMPLETED'){paid=true;paymentId=data?.paymentDetails?.[0]?.transactionId||null;}
   }
   if(!paid)fail('Payment is not confirmed yet. If money was deducted, it will reflect shortly.',402);
   await completeOrder(env,order,paymentId);
   const alb=await db(env).prepare('SELECT * FROM albums WHERE id=? AND user_id=?').bind(order.ref_id||'',owner).first();
   return json({ok:true,album:alb?await albumShape(env,alb):null});
  }
  if(parts.length===2){
   if(request.method==='GET'){const rows=(await db(env).prepare('SELECT * FROM albums WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(owner).all()).results||[];const out=[];for(const r of rows)out.push(await albumShape(env,r));return json({albums:out});}
   if(request.method==='POST'){
    await rateHit(env,'albumnew',request,20,600);
    const input=await body(request,4000);
    const title=cleanA(input?.title,90);if(!title)fail('Give your album a title.');
    const count=await db(env).prepare('SELECT COUNT(*) AS n FROM albums WHERE user_id=?').bind(owner).first();if((count?.n||0)>=20)fail('You can keep up to 20 albums.');
    const st=await albumSettings(env),now=new Date(),id=crypto.randomUUID();
    await db(env).prepare('INSERT INTO albums(id,user_id,title,partner1,partner2,wedding_date,storage,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,owner,title,cleanA(input?.partner1,70),cleanA(input?.partner2,70),cleanA(input?.weddingDate,10), 'draft',new Date(now.getTime()+st.draft_days*86400000).toISOString(),now.toISOString(),now.toISOString()).run();
    const row=await db(env).prepare('SELECT * FROM albums WHERE id=?').bind(id).first();return json({album:await albumShape(env,row)},201);
   }
   fail('Not found.',404);
  }
  const album=await ownAlbum(parts[2]);
  if(parts.length===3){
   if(request.method==='GET')return json({album:await albumShape(env,album)});
   if(request.method==='PUT'){
    const input=await body(request,4000);
    const title=cleanA(input?.title,90);if(!title)fail('Give your album a title.');
    await db(env).prepare('UPDATE albums SET title=?,partner1=?,partner2=?,wedding_date=?,is_public=?,updated_at=? WHERE id=?').bind(title,cleanA(input?.partner1,70),cleanA(input?.partner2,70),cleanA(input?.weddingDate,10),input?.isPublic?1:0,new Date().toISOString(),album.id).run();
    /* Optional share PIN: exactly 4 digits to set, null/empty to remove.
       Only its hash is stored; changing it invalidates earlier unlocks. */
    if(input&&Object.prototype.hasOwnProperty.call(input,'sharePin')){
     const pin=input.sharePin;
     if(pin===null||pin==='')await db(env).prepare('UPDATE albums SET share_pin_hash=NULL WHERE id=?').bind(album.id).run();
     else if(typeof pin==='string'&&/^\d{4}$/.test(pin.trim()))await db(env).prepare('UPDATE albums SET share_pin_hash=? WHERE id=?').bind(await sha256hex(pin.trim()+':'+album.id),album.id).run();
     else fail('The share PIN must be exactly 4 digits.');
    }
    const row=await db(env).prepare('SELECT * FROM albums WHERE id=?').bind(album.id).first();return json({album:await albumShape(env,row)});
   }
   if(request.method==='DELETE'){
    const keys=(await db(env).prepare('SELECT r2_key FROM album_photos WHERE album_id=?').bind(album.id).all()).results||[];
    for(const k of keys)await env.BUCKET?.delete(k.r2_key).catch(()=>{});
    await db(env).prepare('DELETE FROM album_photos WHERE album_id=?').bind(album.id).run();
    await db(env).prepare('DELETE FROM albums WHERE id=?').bind(album.id).run();
    return json({ok:true});
   }
   fail('Not found.',404);
  }
  if(parts.length===4&&parts[3]==='photos'&&request.method==='POST'){
   await rateHit(env,'upload',request,180,600);
   if(albumExpired(album))fail('This free draft has expired. Create a new album to add photos.',410);
   if(!env.BUCKET)fail('Photo storage is unavailable. Please try again.',503);
   if(Number(request.headers.get('Content-Length'))>8*1024*1024+1024*1024)fail('Choose an image smaller than 8 MB.',413);
   const count=await db(env).prepare('SELECT COUNT(*) AS n FROM album_photos WHERE album_id=?').bind(album.id).first();if((count?.n||0)>=100)fail('An album can hold up to 100 photos.');
   const data=await request.formData(),file=data.get('file');
   if(!file||typeof file==='string'||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024||file.size<12)fail('Choose a JPG, PNG or WebP image under 8 MB.');
   const bytes=new Uint8Array(await file.arrayBuffer());
   const valid=file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78:bytes[0]===82&&bytes[1]===73&&bytes[8]===87&&bytes[9]===69;
   if(!valid)fail('That file is not a valid image.');
   const pid=crypto.randomUUID(),key='albums/'+album.id+'/'+pid;
   await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:file.type}});
   const pos=((await db(env).prepare('SELECT COALESCE(MAX(position),-1) AS m FROM album_photos WHERE album_id=?').bind(album.id).first())?.m??-1)+1;
   await db(env).prepare('INSERT INTO album_photos(id,album_id,r2_key,position,caption,created_at) VALUES(?,?,?,?,?,?)').bind(pid,album.id,key,pos,cleanA(data.get('caption'),120),new Date().toISOString()).run();
   await db(env).prepare('UPDATE albums SET updated_at=? WHERE id=?').bind(new Date().toISOString(),album.id).run();
   return json({photo:{id:pid,position:pos,caption:'',url:'/api/album-photo/'+pid}},201);
  }
  if(parts.length===5&&parts[3]==='photos'&&request.method==='DELETE'){
   const photo=await db(env).prepare('SELECT * FROM album_photos WHERE id=? AND album_id=?').bind(parts[4],album.id).first();
   if(!photo)fail('Photo not found.',404);
   await env.BUCKET?.delete(photo.r2_key).catch(()=>{});
   await db(env).prepare('DELETE FROM album_photos WHERE id=?').bind(photo.id).run();
   const rest=(await db(env).prepare('SELECT id FROM album_photos WHERE album_id=? ORDER BY position,id').bind(album.id).all()).results||[];
   for(let i=0;i<rest.length;i++)await db(env).prepare('UPDATE album_photos SET position=? WHERE id=?').bind(i,rest[i].id).run();
   const row=await db(env).prepare('SELECT * FROM albums WHERE id=?').bind(album.id).first();return json({album:await albumShape(env,row)});
  }
  if(parts.length===4&&parts[3]==='reorder'&&request.method==='POST'){
   const input=await body(request,20000);
   const order=Array.isArray(input?.order)?input.order.map(x=>String(x)).slice(0,100):[];
   const existing=(await db(env).prepare('SELECT id FROM album_photos WHERE album_id=?').bind(album.id).all()).results||[];
   const valid=new Set(existing.map(r=>r.id));
   if(order.length!==valid.size||order.some(id=>!valid.has(id)))fail('The photo order did not match this album. Please reload and try again.');
   for(let i=0;i<order.length;i++)await db(env).prepare('UPDATE album_photos SET position=? WHERE id=? AND album_id=?').bind(i,order[i],album.id).run();
   const row=await db(env).prepare('SELECT * FROM albums WHERE id=?').bind(album.id).first();return json({album:await albumShape(env,row)});
  }
  if(parts.length===4&&parts[3]==='save-forever'&&request.method==='POST'){
   if(album.storage==='permanent')fail('This album is already saved forever.',409);
   if(albumExpired(album))fail('This free draft has expired, so it can no longer be saved forever. Please create a new album.',410);
   const input=await body(request,4000);
   const phone=phone10(input?.phone);if(!phone)fail('Please enter a valid 10-digit mobile number.');
   const gateway=typeof input?.gateway==='string'?input.gateway:'';
   const cfg=await gatewayRow(env,gateway);if(!GATEWAYS.includes(gateway)||!usable(cfg))fail('This payment option is not available right now. Please try another.',400);
   await rateHit(env,'checkout',request,20,600);
   const st=await albumSettings(env),now=new Date().toISOString();
   const order={id:crypto.randomUUID(),user_id:owner,design_id:'album-storage',amount_paise:st.price_paise,gateway,status:'created'};
   await db(env).prepare('INSERT INTO orders(id,user_id,design_id,amount_paise,gateway,status,created_at,updated_at,ref_id) VALUES(?,?,?,?,?,?,?,?,?)').bind(order.id,owner,'album-storage',st.price_paise,gateway,'created',now,now,album.id).run();
   try{
    let made;
    if(gateway==='razorpay')made=await razorpayCreate(cfg,order);
    else if(gateway==='cashfree'){
     const base=cfg.mode==='live'?'https://api.cashfree.com/pg':'https://sandbox.cashfree.com/pg';
     const res=await fetch(base+'/orders',{method:'POST',headers:{'x-client-id':cfg.key_id,'x-client-secret':cfg.key_secret,'x-api-version':'2023-08-01','Content-Type':'application/json'},body:JSON.stringify({order_id:order.id,order_amount:order.amount_paise/100,order_currency:'INR',customer_details:{customer_id:owner,customer_name:authUser.name||'Customer',customer_email:authUser.email,customer_phone:phone},order_meta:{return_url:url.origin+'/albums?order_id='+order.id}})});
     const data=await res.json().catch(()=>null);
     if(!res.ok||!data?.payment_session_id)fail('Payment could not be started. Please try another option.',502);
     made={gateway_order_id:order.id,payload:{gateway:'cashfree',payment_session_id:data.payment_session_id,mode:cfg.mode}};
    }
    else if(gateway==='phonepe'){
     const {host,token}=await phonepeToken(cfg);
     const res=await fetch(host+'/apis/hermes/checkout/v2/pay',{method:'POST',headers:{'Authorization':'O-Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({merchantOrderId:order.id,amount:order.amount_paise,paymentFlow:{type:'PG_CHECKOUT',merchantUrls:{redirectUrl:url.origin+'/albums?order_id='+order.id}}})});
     const data=await res.json().catch(()=>null);
     if(!res.ok||!data?.redirectUrl)fail('Payment could not be started. Please try another option.',502);
     made={gateway_order_id:order.id,payload:{gateway:'phonepe',redirect_url:data.redirectUrl}};
    }
    else{
     const amount=(order.amount_paise/100).toFixed(2),productinfo='Easy Wedding album storage — keep forever';
     const firstname=(authUser.name||'Customer').split(' ')[0].slice(0,60);
     const hash=await sha512hex([cfg.key_id,order.id,amount,productinfo,firstname,authUser.email,'','','','','','','','','','',cfg.key_secret].join('|'));
     const back=url.origin+'/api/albums/pay-return';
     made={gateway_order_id:order.id,payload:{gateway:'payu',action:cfg.mode==='live'?'https://secure.payu.in/_payment':'https://test.payu.in/_payment',fields:{key:cfg.key_id,txnid:order.id,amount,productinfo,firstname,email:authUser.email,phone:phone||'',surl:back,furl:back,hash}}};
    }
    await db(env).prepare('UPDATE orders SET gateway_order_id=?,updated_at=? WHERE id=?').bind(made.gateway_order_id,new Date().toISOString(),order.id).run();
    return json({orderId:order.id,...made.payload},201);
   }catch(e){await db(env).prepare("UPDATE orders SET status='failed',updated_at=? WHERE id=?").bind(new Date().toISOString(),order.id).run();throw e;}
  }
  fail('Not found.',404);
 }
 // ---- Vendors: profile, portfolio, booking inbox and earnings ----
 if(path==='/api/vendor/me'||path.startsWith('/api/vendor/')||path==='/api/vendors/register'||path==='/api/vendor-bookings'||path.startsWith('/api/vendor-bookings')){
  const cleanV=(v,n)=>String(v==null?'':v).trim().slice(0,n);
  const cats=await vendorCategories(env);
  const myVendor=async()=>db(env).prepare('SELECT * FROM vendors WHERE user_id=?').bind(owner).first();
  const readVendorFields=input=>{
   const businessName=cleanV(input?.businessName,90);if(!businessName)fail('Please enter your business name.');
   const ownerName=cleanV(input?.ownerName,70);if(!ownerName)fail('Please enter the owner’s name.');
   const category=cats.some(c=>c.id===input?.category)?input.category:null;if(!category)fail('Please choose a category.');
   const city=cleanV(input?.city,60);if(!city)fail('Please enter your city.');
   const phone=phone10(input?.phone);if(!phone)fail('Please enter a valid 10-digit mobile number.');
   const whatsapp=phone10(input?.whatsapp);if(!whatsapp)fail('Please enter a valid 10-digit WhatsApp number.');
   const email=cleanV(input?.email,120).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))fail('Please enter a valid email address.');
   const price=Math.round(Number(input?.startingPrice)*100);if(!Number.isFinite(price)||price<0||price>10000000000)fail('Please enter your starting price in ₹.');
   /* Payout details: optional while registering, required before the first
      payout or split settlement. Validated only when provided. */
   const payout={holder:cleanV(input?.payoutHolder,80),account:cleanV(input?.payoutAccount,24).replace(/\s/g,''),ifsc:cleanV(input?.payoutIfsc,11).toUpperCase(),upi:cleanV(input?.payoutUpi,60).toLowerCase(),pan:cleanV(input?.payoutPan,10).toUpperCase()};
   if(payout.account&&!/^\d{6,24}$/.test(payout.account))fail('Please check the bank account number.');
   if(payout.ifsc&&!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(payout.ifsc))fail('Please check the IFSC (for example SBIN0123456).');
   if(payout.pan&&!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(payout.pan))fail('Please check the PAN (for example ABCDE1234F).');
   if(payout.upi&&!/^[\w.\-]{2,}@[a-z]{2,}$/i.test(payout.upi))fail('Please check the UPI id (for example name@okhdfcbank).');
   return {businessName,ownerName,category,city,phone,whatsapp,email,startingPricePaise:price,about:cleanV(input?.about,1200),payout};
  };
  if(path==='/api/vendors/register'&&request.method==='POST'){
   await rateHit(env,'vendorreg',request,5,3600);
   const input=await body(request,20000),f=readVendorFields(input);
   /* The platform agreement is a hard gate: no acceptance, no registration.
      The exact text shown (with the live commission %) is stored on the
      vendor record as the snapshot they agreed to. */
   const agreement=await vendorAgreement(env);
   if(input?.agreementAccepted!==true)fail('Please read and accept the vendor agreement to continue.');
   if(await myVendor())fail('This account already has a vendor profile. Open your vendor dashboard to edit it.',409);
   const id=crypto.randomUUID(),now=new Date().toISOString();
   await db(env).prepare('INSERT INTO vendors(id,user_id,business_name,owner_name,category,city,phone,whatsapp,email,starting_price_paise,about,payout_holder,payout_account,payout_ifsc,payout_upi,payout_pan,status,agreement_accepted_at,agreement_version,agreement_text,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,owner,f.businessName,f.ownerName,f.category,f.city,f.phone,f.whatsapp,f.email,f.startingPricePaise,f.about,f.payout.holder||null,f.payout.account||null,f.payout.ifsc||null,f.payout.upi||null,f.payout.pan||null,'pending',now,agreement.version,agreement.text,now,now).run();
   const row=await db(env).prepare('SELECT * FROM vendors WHERE id=?').bind(id).first();
   await ensureVendorCode(env,row);
   return json({vendor:await vendorShape(env,row,cats,true)},201);
  }
  if(path==='/api/vendor/me'&&request.method==='GET'){
   const v=await myVendor();if(!v)return json({vendor:null});
   await ensureVendorCode(env,v);
   const rows=(await db(env).prepare('SELECT * FROM vendor_bookings WHERE vendor_id=? ORDER BY created_at DESC LIMIT 200').bind(v.id).all()).results||[];
   rows.forEach(r=>{r.vendor_code=v.vendor_code;r.business_name=v.business_name;});
   const payouts=(await db(env).prepare('SELECT * FROM vendor_payouts WHERE vendor_id=? ORDER BY created_at DESC').bind(v.id).all()).results||[];
   const done=rows.filter(r=>r.status==='confirmed'||r.status==='completed');
   const split=done.filter(r=>r.settlement_mode==='platform_split'),manual=done.filter(r=>r.settlement_mode!=='platform_split');
   const totals={grossPaise:done.reduce((s,r)=>s+(r.final_paise||0),0),commissionPaise:done.reduce((s,r)=>s+(r.commission_paise||0),0),netPaise:done.reduce((s,r)=>s+(r.net_paise||0),0),
    /* Split mode: the platform collected, so the vendor's share is payable to them.
       Manual mode: the vendor collected, so the commission is owed to the platform. */
    payableToVendorPaise:split.filter(r=>!r.payout_id).reduce((s,r)=>s+(r.net_paise||0),0),
    commissionOwedPaise:manual.filter(r=>!r.payout_id).reduce((s,r)=>s+(r.commission_paise||0),0),
    paidOutPaise:payouts.filter(p=>p.kind!=='commission_receipt').reduce((s,p)=>s+p.amount_paise,0),
    commissionReceivedPaise:payouts.filter(p=>p.kind==='commission_receipt').reduce((s,p)=>s+p.amount_paise,0)};
   totals.duePaise=totals.payableToVendorPaise;
   return json({vendor:await vendorShape(env,v,cats,true),bookings:rows.map(vendorBookingShape),totals,payouts:payouts.map(p=>({id:p.id,kind:p.kind||'vendor_payout',amountPaise:p.amount_paise,reference:p.reference||'',bookingCount:p.booking_count,createdAt:p.created_at}))});
  }
  if(path==='/api/vendor/me'&&request.method==='PUT'){
   const v=await myVendor();if(!v)fail('Register your business first.',404);
   const input=await body(request,20000),f=readVendorFields(input);
   await db(env).prepare('UPDATE vendors SET business_name=?,owner_name=?,category=?,city=?,phone=?,whatsapp=?,email=?,starting_price_paise=?,about=?,payout_holder=?,payout_account=?,payout_ifsc=?,payout_upi=?,payout_pan=?,updated_at=? WHERE id=?').bind(f.businessName,f.ownerName,f.category,f.city,f.phone,f.whatsapp,f.email,f.startingPricePaise,f.about,f.payout.holder||null,f.payout.account||null,f.payout.ifsc||null,f.payout.upi||null,f.payout.pan||null,new Date().toISOString(),v.id).run();
   const row=await db(env).prepare('SELECT * FROM vendors WHERE id=?').bind(v.id).first();
   return json({vendor:await vendorShape(env,row,cats,true)});
  }
  if(path==='/api/vendor/photos'&&request.method==='POST'){
   await rateHit(env,'upload',request,180,600);
   const v=await myVendor();if(!v)fail('Register your business first.',404);
   if(!env.BUCKET)fail('Photo storage is unavailable. Please try again.',503);
   if(Number(request.headers.get('Content-Length'))>8*1024*1024+1024*1024)fail('Choose an image smaller than 8 MB.',413);
   const count=await db(env).prepare('SELECT COUNT(*) AS n FROM vendor_photos WHERE vendor_id=?').bind(v.id).first();if((count?.n||0)>=12)fail('A portfolio can hold up to 12 photos.');
   const data=await request.formData(),file=data.get('file');
   if(!file||typeof file==='string'||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024||file.size<12)fail('Choose a JPG, PNG or WebP image under 8 MB.');
   const bytes=new Uint8Array(await file.arrayBuffer());
   const valid=file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78:bytes[0]===82&&bytes[1]===73&&bytes[8]===87&&bytes[9]===69;
   if(!valid)fail('That file is not a valid image.');
   const pid=crypto.randomUUID(),key='vendors/'+v.id+'/'+pid;
   await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:file.type}});
   const pos=((await db(env).prepare('SELECT COALESCE(MAX(position),-1) AS m FROM vendor_photos WHERE vendor_id=?').bind(v.id).first())?.m??-1)+1;
   await db(env).prepare('INSERT INTO vendor_photos(id,vendor_id,r2_key,position,created_at) VALUES(?,?,?,?,?)').bind(pid,v.id,key,pos,new Date().toISOString()).run();
   return json({photo:{id:pid,position:pos,url:'/api/vendor-photo/'+pid}},201);
  }
  if(path.startsWith('/api/vendor/photos/')&&request.method==='DELETE'){
   const v=await myVendor();if(!v)fail('Register your business first.',404);
   const photo=await db(env).prepare('SELECT * FROM vendor_photos WHERE id=? AND vendor_id=?').bind(path.slice('/api/vendor/photos/'.length),v.id).first();
   if(!photo)fail('Photo not found.',404);
   await env.BUCKET?.delete(photo.r2_key).catch(()=>{});
   await db(env).prepare('DELETE FROM vendor_photos WHERE id=?').bind(photo.id).run();
   return json({ok:true});
  }
  if(path==='/api/vendor-bookings'){
   if(request.method==='GET'){
    const rows=(await db(env).prepare('SELECT b.*,v.business_name AS business_name,v.vendor_code AS vendor_code FROM vendor_bookings b JOIN vendors v ON v.id=b.vendor_id WHERE b.customer_id=? ORDER BY b.created_at DESC LIMIT 200').bind(owner).all()).results||[];
    for(const r of rows){if(!r.vendor_code){const pseudo={id:r.vendor_id,vendor_code:null};r.vendor_code=await ensureVendorCode(env,pseudo);}r.reviewed=false;}
    try{const rev=(await db(env).prepare('SELECT booking_id FROM vendor_reviews WHERE customer_id=?').bind(owner).all()).results||[];const set=new Set(rev.map(x=>x.booking_id));rows.forEach(r=>{r.reviewed=set.has(r.id);});}catch{}
    return json({bookings:rows.map(vendorBookingShape)});
   }
   if(request.method==='POST'){
    await rateHit(env,'vbooking',request,30,600);
    const input=await body(request,8000);
    const vendor=await db(env).prepare("SELECT * FROM vendors WHERE id=? AND status='approved'").bind(String(input?.vendorId||'')).first();
    if(!vendor)fail('This vendor is not available for booking right now.',404);
    await ensureVendorCode(env,vendor);
    if(vendor.user_id===owner)fail('You cannot book your own business.');
    const phone=phone10(input?.phone);if(!phone)fail('Please enter a valid 10-digit mobile number.');
    const eventDate=cleanV(input?.eventDate,10);if(eventDate&&!/^\d{4}-\d{2}-\d{2}$/.test(eventDate))fail('Please choose a valid event date.');
    const budget=Math.round(Number(input?.budget)*100);
    const id=crypto.randomUUID(),now=new Date().toISOString();
    await db(env).prepare('INSERT INTO vendor_bookings(id,vendor_id,customer_id,customer_name,event_date,event_type,city,phone,message,budget_paise,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,vendor.id,owner,authUser.name||'',eventDate,cleanV(input?.eventType,60),cleanV(input?.city,60),phone,cleanV(input?.message,800),Number.isFinite(budget)&&budget>0?budget:null,'requested',now,now).run();
    const row=await db(env).prepare('SELECT * FROM vendor_bookings WHERE id=?').bind(id).first();
    row.vendor_code=vendor.vendor_code;row.business_name=vendor.business_name;
    return json({booking:vendorBookingShape(row)},201);
   }
   fail('Not found.',404);
  }
  if(path.startsWith('/api/vendor-bookings/')&&request.method==='POST'){
   const id=path.slice('/api/vendor-bookings/'.length);
   const b=await db(env).prepare('SELECT * FROM vendor_bookings WHERE id=? AND customer_id=?').bind(id,owner).first();
   if(!b)fail('Booking not found.',404);
   const input=await body(request,2000);
   if(input?.action!=='cancel')fail('Not found.',404);
   if(!['requested','confirmed'].includes(b.status))fail('This booking can no longer be cancelled.');
   await db(env).prepare("UPDATE vendor_bookings SET status='cancelled',updated_at=? WHERE id=?").bind(new Date().toISOString(),id).run();
   const row=await db(env).prepare('SELECT * FROM vendor_bookings WHERE id=?').bind(id).first();
   return json({booking:vendorBookingShape(row)});
  }
  if(path.startsWith('/api/vendor/bookings/')){
   const v=await myVendor();if(!v)fail('Register your business first.',404);
   const seg=path.split('/').filter(Boolean),id=seg[3],action=seg[4];
   const b=await db(env).prepare('SELECT * FROM vendor_bookings WHERE id=? AND vendor_id=?').bind(id,v.id).first();
   if(!b)fail('Booking not found.',404);
   const input=await body(request,4000);
   if(action==='accept'&&request.method==='POST'){
    if(b.status!=='requested')fail('Only a requested booking can be confirmed.');
    const finalPaise=Math.round(Number(input?.finalAmount)*100);
    if(!Number.isFinite(finalPaise)||finalPaise<=0||finalPaise>10000000000)fail('Enter the final amount in ₹.');
    /* The commission percentage in force right now is snapshotted onto the
       booking; later setting changes never rewrite this booking's math. */
    const pct=await commissionPercent(env),commission=commissionOf(finalPaise,pct);
    /* Settlement stays 'manual' (the vendor collects from the customer and the
       commission is owed to the platform) until a split-payment gateway flow
       is switched on; the column already supports 'platform_split'. */
    await db(env).prepare("UPDATE vendor_bookings SET status='confirmed',settlement_mode='manual',final_paise=?,commission_percent=?,commission_paise=?,net_paise=?,updated_at=? WHERE id=?").bind(finalPaise,pct,commission,finalPaise-commission,new Date().toISOString(),id).run();
    const row=await db(env).prepare('SELECT * FROM vendor_bookings WHERE id=?').bind(id).first();
    row.vendor_code=v.vendor_code;row.business_name=v.business_name;
    return json({booking:vendorBookingShape(row)});
   }
   if(action==='status'&&request.method==='POST'){
    const next=String(input?.status||'');
    if(next==='completed'){if(b.status!=='confirmed')fail('Only a confirmed booking can be marked completed.');}
    else if(next==='cancelled'){if(!['requested','confirmed'].includes(b.status))fail('This booking can no longer be cancelled.');}
    else fail('Not found.',404);
    await db(env).prepare('UPDATE vendor_bookings SET status=?,updated_at=? WHERE id=?').bind(next,new Date().toISOString(),id).run();
    const row=await db(env).prepare('SELECT * FROM vendor_bookings WHERE id=?').bind(id).first();
    row.vendor_code=v.vendor_code;row.business_name=v.business_name;
    return json({booking:vendorBookingShape(row)});
   }
   fail('Not found.',404);
  }
  fail('Not found.',404);
 }
 if(path==='/api/entitlements'&&request.method==='GET')return json({designs:await entitledDesigns(env,owner),admin:await isAdminUser(env,authUser)});
 if(path==='/api/my-invitations'&&request.method==='GET'){
  const res=await db(env).prepare('SELECT invitation_id AS id,partner1,partner2,created_at AS createdAt FROM invitation_owners WHERE owner=? ORDER BY created_at DESC LIMIT 100').bind(owner).all();
  return json({invitations:res.results||[]});
 }
 if(path==='/api/guests'){
  const mineG=await entitledDesigns(env,owner);
  if(!(mineG.includes('addon-personal')||mineG.includes('ALL')||await isAdminUser(env,authUser)))fail('Personal Invitations add-on is not unlocked for your account.',402);
  if(request.method==='GET'){
   const res=await db(env).prepare('SELECT id,invitation_id AS invitationId,name,phone,token,viewed_at AS viewedAt,rsvped_at AS rsvpedAt,created_at AS createdAt FROM personal_guests WHERE owner=? ORDER BY created_at DESC LIMIT 500').bind(owner).all();
   return json({guests:res.results||[]});
  }
  if(request.method==='POST'){
   await rateHit(env,'guests',request,120,600);
   const input=await body(request,5000);
   const invitationId=String(input?.invitationId||'');
   const own=await db(env).prepare('SELECT invitation_id FROM invitation_owners WHERE invitation_id=? AND owner=?').bind(invitationId,owner).first();
   if(!own)fail('Please choose one of your published invitations.');
   const gname=String(input?.name||'').trim().slice(0,80);if(!gname)fail("Please enter the guest's name.");
   const gphone=String(input?.phone||'').replace(/\D/g,'').slice(0,15);
   const gtoken=crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().slice(0,8);
   const gid=crypto.randomUUID();
   await db(env).prepare('INSERT INTO personal_guests(id,invitation_id,owner,name,phone,token,created_at) VALUES(?,?,?,?,?,?,?)').bind(gid,invitationId,owner,gname,gphone||null,gtoken,new Date().toISOString()).run();
   return json({id:gid,token:gtoken},201);
  }
  if(request.method==='DELETE'){
   const input=await body(request,2000);
   await db(env).prepare('DELETE FROM personal_guests WHERE id=? AND owner=?').bind(String(input?.id||''),owner).run();
   return json({ok:true});
  }
 }
 if(path==='/api/short-links'){
  if(request.method==='GET'){
   const res=await db(env).prepare('SELECT slug,invitation_id AS invitationId,created_at AS createdAt FROM short_links WHERE owner=? ORDER BY created_at DESC').bind(owner).all();
   return json({links:res.results||[]});
  }
  if(request.method==='POST'){
   const mineS=await entitledDesigns(env,owner);
   if(!(mineS.includes('addon-shortlink')||await isAdminUser(env,authUser)))fail('Custom short link add-on is not unlocked for your account.',402);
   const input=await body(request,5000);
   const slug=String(input?.slug||'').trim().toLowerCase();
   const RESERVED=['forgot-password','register','boss','workspace','dashboard','bookings','refund','sitemap','robots','admin','studio','index','landing','invite','rsvps','guests','pdf','api','assets','reference','demo','login','signup','pricing','faq','about','contact','privacy','copyright','terms','support','help','blog','new','www','mail','home','wedding','invitation','album','albums','vendors','vendor','vendor-register'];
   if(!/^[a-z0-9][a-z0-9-]{2,40}$/.test(slug)||RESERVED.includes(slug))fail('Please choose a short link using only small letters, numbers and hyphens (3-41 characters), and not a reserved word.');
   const invitationId=String(input?.invitationId||'');
   const own=await db(env).prepare('SELECT invitation_id FROM invitation_owners WHERE invitation_id=? AND owner=?').bind(invitationId,owner).first();
   if(!own)fail('Please choose one of your published invitations.');
   const taken=await db(env).prepare('SELECT owner FROM short_links WHERE slug=?').bind(slug).first();
   if(taken&&taken.owner!==owner)fail('That short link is already taken. Please try another.');
   await db(env).prepare('INSERT INTO short_links(slug,invitation_id,owner,created_at) VALUES(?,?,?,?) ON CONFLICT(slug) DO UPDATE SET invitation_id=excluded.invitation_id WHERE short_links.owner=excluded.owner').bind(slug,invitationId,owner,new Date().toISOString()).run();
   const check=await db(env).prepare('SELECT invitation_id FROM short_links WHERE slug=? AND owner=?').bind(slug,owner).first();
   if(!check)fail('That short link could not be saved. Please try another.');
   return json({slug,url:'/'+slug},201);
  }
 }
 if(path==='/api/checkout'&&request.method==='POST'){
  const input=await body(request,20000);
  const designId=typeof input?.designId==='string'?input.designId:'',gateway=typeof input?.gateway==='string'?input.gateway:'';
  const phone=typeof input?.phone==='string'?input.phone.replace(/\D/g,''):'';
  if(!/^[6-9]\d{9}$/.test(phone))fail('Please enter a valid 10-digit mobile number.');
  const price=await db(env).prepare('SELECT * FROM prices WHERE design_id=?').bind(designId).first();
  if(!price||!GATEWAYS.includes(gateway))fail('Please choose a design and a payment option.');
  await rateHit(env,'checkout',request,20,600);
  const ownedList=await entitledDesigns(env,owner);
  const alreadyOwned=ownedList.includes(designId)||(ownedList.includes('ALL')&&!designId.startsWith('addon-'))||(designId==='addon-personal'&&ownedList.includes('ALL'));
  if(alreadyOwned)fail(designId.startsWith('addon-')?'You already own this add-on.':'You already own this design.',409);
  const cfg=await gatewayRow(env,gateway);if(!usable(cfg))fail('This payment option is not available right now. Please try another.',400);
  let amount=price.launch_active?price.launch_paise:price.regular_paise;
  let coupon=null;if(input?.coupon){coupon=await couponFor(env,input.coupon,amount);amount=coupon.final;}
  const order={id:crypto.randomUUID(),user_id:owner,design_id:designId,amount_paise:amount,gateway,status:'created',coupon:coupon?coupon.code:null};
  const now=new Date().toISOString();
  const phoneHash=await sha256hex(String(authUser.email).toLowerCase()+':'+phone);
  /* Visitor attribution: the server-issued ew_vid cookie (format-checked
     only — no extra lookup on the money path) ties this order to the
     anonymous visitor journey, so the boss can see which source sells. */
  await ensureVi(env);const visitorId=viCookieVid(request);
  await db(env).prepare('INSERT INTO orders(id,user_id,design_id,amount_paise,gateway,status,created_at,updated_at,coupon,discount_paise,signup_name,signup_email,signup_hash,phone_hash,visitor_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(order.id,owner,designId,amount,gateway,'created',now,now,coupon?coupon.code:null,coupon?coupon.discount:0,guestSignup?guestSignup.name:null,guestSignup?guestSignup.email:null,guestSignup?guestSignup.hash:null,phoneHash,visitorId||null).run();
  try{
   let made;
   if(gateway==='razorpay')made=await razorpayCreate(cfg,order);
   else if(gateway==='cashfree')made=await cashfreeCreate(cfg,order,authUser,phone,url.origin);
   else if(gateway==='phonepe')made=await phonepeCreate(cfg,order,url.origin);
   else made=await payuCreate(cfg,order,authUser,phone,url.origin);
   await db(env).prepare('UPDATE orders SET gateway_order_id=?,updated_at=? WHERE id=?').bind(made.gateway_order_id,new Date().toISOString(),order.id).run();
   return json({orderId:order.id,...made.payload},201);
  }catch(e){await db(env).prepare("UPDATE orders SET status='failed',updated_at=? WHERE id=?").bind(new Date().toISOString(),order.id).run();throw e;}
 }
 if(path==='/api/checkout/verify'&&request.method==='POST'){
  const input=await body(request,20000);
  const orderId=typeof input?.orderId==='string'?input.orderId:'';
  const order=guestOrder||await db(env).prepare('SELECT * FROM orders WHERE id=? AND user_id=?').bind(orderId,owner).first();
  if(!order)fail('Order not found.',404);
  const finish=async()=>{
   if(!guestOrder)return json({ok:true,designs:await entitledDesigns(env,owner)});
   const done=await db(env).prepare('SELECT user_id FROM orders WHERE id=?').bind(order.id).first();
   const claim=await db(env).prepare('UPDATE orders SET claimed=1,signup_hash=NULL WHERE id=? AND claimed=0').bind(order.id).run();
   if(!claim.meta?.changes)fail('This payment was already used. Please log in with your email and password.',409);
   return json({ok:true,signedIn:true,designs:await entitledDesigns(env,done.user_id)},200,{'Set-Cookie':sessionCookie(await startSession(env,done.user_id),SESSION_COOKIE_AGE)});
  };
  if(order.status==='paid')return finish();
  const cfg=await gatewayRow(env,order.gateway);if(!usable(cfg))fail('This payment option is not available right now.',400);
  let paid=false,paymentId=null;
  if(order.gateway==='razorpay'){
   const paymentIdIn=typeof input?.paymentId==='string'?input.paymentId:'',sig=typeof input?.signature==='string'?input.signature:'';
   const expected=await hmacHex(cfg.key_secret,(order.gateway_order_id||'')+'|'+paymentIdIn);
   if(paymentIdIn&&safeEq(expected,sig)){paid=true;paymentId=paymentIdIn;}
  }else if(order.gateway==='cashfree'){
   const base=cfg.mode==='live'?'https://api.cashfree.com/pg':'https://sandbox.cashfree.com/pg';
   const res=await fetch(base+'/orders/'+order.id,{headers:{'x-client-id':cfg.key_id,'x-client-secret':cfg.key_secret,'x-api-version':'2023-08-01'}});
   const data=await res.json().catch(()=>null);
   if(res.ok&&data?.order_status==='PAID')paid=true;
  }else if(order.gateway==='phonepe'){
   const {host,token}=await phonepeToken(cfg);
   const res=await fetch(host+'/apis/hermes/checkout/v2/order/'+order.id+'/status',{headers:{'Authorization':'O-Bearer '+token}});
   const data=await res.json().catch(()=>null);
   if(res.ok&&data?.state==='COMPLETED'){paid=true;paymentId=data?.paymentDetails?.[0]?.transactionId||null;}
  }
  if(!paid)fail('Payment is not confirmed yet. If money was deducted, it will reflect shortly.',402);
  await completeOrder(env,order,paymentId);
  return finish();
 }
 // ---- Admin console API (owner only) ----
 if(['overview','analytics','orders','customers','pending','coupons','banner','system','music','applinks','features','vendors','albums','vendorbookings','payouts','reviews','audit','export','vi'].some(n=>path==='/api/admin/'+n||path.startsWith('/api/admin/'+n+'/'))){
  if(!await isAdminUser(env,adminUser))fail('Admin access only.',403);
  const d=db(env),q=url.searchParams,seg=path.split('/').filter(Boolean),name=seg[2];
  const one=async(sql,...b)=>d.prepare(sql).bind(...b).first();
  const all=async(sql,...b)=>(await d.prepare(sql).bind(...b).all()).results||[];
  if(name==='overview'){
   const today=istDay();
   const rev=async day=>one("SELECT COALESCE(SUM(amount_paise),0) AS paise,COUNT(*) AS n FROM orders WHERE status='paid' AND created_at>=?",istStart(day));
   const [rToday,rWeek,rMonth,rAll]=[await rev(today),await rev(istDay(6)),await rev(istDay(29)),await one("SELECT COALESCE(SUM(amount_paise),0) AS paise,COUNT(*) AS n FROM orders WHERE status='paid'")];
   const status={};for(const r of await all('SELECT status,COUNT(*) AS n FROM orders GROUP BY status'))status[r.status]=r.n;
   const customers=await one('SELECT COUNT(*) AS n FROM users'),newCustomers=await one('SELECT COUNT(*) AS n FROM users WHERE created_at>=?',istStart(today));
   const visitors=await one('SELECT COUNT(DISTINCT visitor) AS n,COUNT(*) AS views FROM visits WHERE day=?',today);
   const revenueDaily=await all("SELECT date(created_at,'+330 minutes') AS day,SUM(amount_paise) AS paise,COUNT(*) AS n FROM orders WHERE status='paid' AND created_at>=? GROUP BY 1 ORDER BY 1",istStart(istDay(13)));
   const recent=await all('SELECT o.id,o.design_id,o.amount_paise,o.gateway,o.status,o.created_at,COALESCE(u.email,\'deleted account\') AS email,COALESCE(u.name,\'\') AS name FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 8');
   const newest=await all('SELECT email,name,created_at FROM users ORDER BY created_at DESC LIMIT 5');
   const gateways=[];for(const g of GATEWAYS){const row=await gatewayRow(env,g).catch(()=>null);gateways.push({gateway:g,ready:usable(row),mode:row?.mode||'test',fromEnv:!!envGateway(env,g)});}
   const maint=await one("SELECT value FROM site_settings WHERE key='maintenance'");
   return json({revenue:{today:rToday,week:rWeek,month:rMonth,total:rAll},orders:status,customers:{total:customers.n,today:newCustomers.n},visitors:{today:visitors.n,views:visitors.views},revenueDaily,recent,newest,gateways,open:!maint||maint.value!=='1',email:adminUser?adminUser.email:''});
  }
  if(name==='analytics'){
   const days=Math.min(Math.max(parseInt(q.get('days')||'30',10)||30,1),365),from=istDay(days-1);
   const totals=await one('SELECT COUNT(*) AS views,COUNT(DISTINCT visitor) AS visitors,COALESCE(SUM(session_start),0) AS sessions FROM visits WHERE day>=?',from);
   const live=await one('SELECT COUNT(DISTINCT visitor) AS n FROM visits WHERE ts>=?',new Date(Date.now()-30*60000).toISOString());
   const funnel={visitors:totals.visitors,studio:(await one("SELECT COUNT(DISTINCT visitor) AS n FROM visits WHERE day>=? AND path IN ('/studio','/workspace','/dashboard','/register')",from)).n,signups:(await one('SELECT COUNT(*) AS n FROM users WHERE created_at>=?',istStart(from))).n,checkout:(await one('SELECT COUNT(DISTINCT user_id) AS n FROM orders WHERE created_at>=?',istStart(from))).n,paid:(await one("SELECT COUNT(DISTINCT user_id) AS n FROM orders WHERE status='paid' AND created_at>=?",istStart(from))).n};
   return json({days,from,totals,live:live.n,funnel,
    daily:await all('SELECT day,COUNT(*) AS views,COUNT(DISTINCT visitor) AS visitors FROM visits WHERE day>=? GROUP BY day ORDER BY day',from),
    sources:await all('SELECT source,COUNT(*) AS sessions,COUNT(DISTINCT visitor) AS visitors FROM visits WHERE day>=? AND session_start=1 GROUP BY source ORDER BY sessions DESC',from),
    hours:await all('SELECT hour,COUNT(*) AS views,COUNT(DISTINCT visitor) AS visitors FROM visits WHERE day>=? GROUP BY hour ORDER BY hour',from),
    devices:await all('SELECT device,COUNT(DISTINCT visitor) AS visitors FROM visits WHERE day>=? GROUP BY device ORDER BY visitors DESC',from),
    countries:await all("SELECT COALESCE(country,'XX') AS country,COUNT(DISTINCT visitor) AS visitors FROM visits WHERE day>=? GROUP BY 1 ORDER BY visitors DESC LIMIT 10",from),
    pages:await all('SELECT path,COUNT(*) AS views,COUNT(DISTINCT visitor) AS visitors FROM visits WHERE day>=? GROUP BY path ORDER BY views DESC LIMIT 12',from),
    referrers:await all("SELECT ref_host,COUNT(*) AS sessions FROM visits WHERE day>=? AND session_start=1 AND ref_host IS NOT NULL GROUP BY ref_host ORDER BY sessions DESC LIMIT 10",from)});
  }
  if(name==='vi')return json(await viBossData(env));
  if(name==='orders'){
   const st=q.get('status')||'',term=(q.get('q')||'').trim().toLowerCase().slice(0,60);
   let sql='SELECT o.id,o.design_id,o.amount_paise,o.discount_paise,o.coupon,o.gateway,o.status,o.created_at,COALESCE(u.email,\'deleted account\') AS email,COALESCE(u.name,\'\') AS name FROM orders o LEFT JOIN users u ON u.id=o.user_id WHERE 1=1';const bind=[];
   if(['paid','created','failed'].includes(st)){sql+=' AND o.status=?';bind.push(st);}
   if(term){sql+=' AND (lower(u.email) LIKE ? OR lower(u.name) LIKE ? OR o.id LIKE ?)';bind.push('%'+term+'%','%'+term+'%',term+'%');}
   return json({orders:await all(sql+' ORDER BY o.created_at DESC LIMIT 300',...bind)});
  }
  if(name==='applinks'){
   if(request.method==='GET')return json(await appLinks(env));
   if(request.method==='PUT'){
    const input=await body(request,2000),url=String(input?.playStore||'').trim(),testerOn=input?.testerOn===true;
    const hasSplit=typeof input?.groupUrl==='string'||typeof input?.testingUrl==='string';
    let groupUrl=String(input?.groupUrl||'').trim(),testingUrl=String(input?.testingUrl||'').trim();
    const legacyUrl=String(input?.testerUrl||'').trim();
    if(legacyUrl&&!GROUP_URL.test(legacyUrl)&&!TESTING_URL.test(legacyUrl))fail('Paste the full tester link: your Google Group link (https://groups.google.com/g/...) or the Play testing link (https://play.google.com/apps/testing/...).',400);
    if(!hasSplit&&legacyUrl){if(GROUP_URL.test(legacyUrl))groupUrl=legacyUrl;else testingUrl=legacyUrl;}
    if(url&&!PLAY_URL.test(url))fail('Paste the full Google Play link, for example https://play.google.com/store/apps/details?id=in.easywedding.app',400);
    if(groupUrl&&!GROUP_URL.test(groupUrl))fail('Paste the full tester group link, for example https://groups.google.com/g/your-testers-group',400);
    if(testingUrl&&!TESTING_URL.test(testingUrl))fail('Paste the full testing app link, for example https://play.google.com/apps/testing/in.easywedding.app',400);
    const saved={playStore:url,groupUrl,testingUrl,testerUrl:groupUrl||testingUrl,testerOn:testerOn&&!!(groupUrl||testingUrl)};
    await d.prepare("INSERT INTO site_settings(key,value) VALUES('app_links',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(saved)).run();
    return json(saved);
   }
   fail('Not found.',404);
  }
  if(name==='music'){
   if(request.method==='GET')return json({music:await previewMusicRow(env)});
   if(request.method==='DELETE'){const cur=await previewMusicRow(env);if(cur?.id)await env.BUCKET?.delete('site/preview-music/'+cur.id);await d.prepare("DELETE FROM site_settings WHERE key='preview_music'").run();return json({music:null});}
   if(request.method==='POST'){
    if(!env.BUCKET)fail('Storage is unavailable.',503);const max=20*1024*1024;if(Number(request.headers.get('Content-Length'))>max+1024*1024)fail('Choose a song under 20 MB.',413);
    const data=await request.formData(),file=data.get('file');
    if(!file||typeof file==='string'||!AUDIO_TYPES.includes(file.type)||file.size<12||file.size>max)fail('Choose an MP3, WAV, OGG or M4A song under 20 MB.');
    const bytes=new Uint8Array(await file.arrayBuffer());if(!validAudioHeader(bytes.slice(0,16),file.type))fail('That file is not a supported audio recording.');
    const id=crypto.randomUUID(),prev=await previewMusicRow(env),meta={id,name:String(file.name||'preview-music').slice(0,120),size:file.size,type:file.type,uploadedAt:new Date().toISOString()};
    await env.BUCKET.put('site/preview-music/'+id,bytes,{httpMetadata:{contentType:file.type}});
    await d.prepare("INSERT INTO site_settings(key,value) VALUES('preview_music',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(meta)).run();
    if(prev?.id)await env.BUCKET.delete('site/preview-music/'+prev.id);
    return json({music:meta},201);
   }
   fail('Not found.',404);
  }
  if(name==='customers'&&request.method==='DELETE'){
   let cid='';try{cid=decodeURIComponent(seg[3]||'');}catch{fail('Not found.',404);}
   const u=cid?await one('SELECT id,email FROM users WHERE id=?',cid):null;
   if(!u)fail('That customer was not found. They may already be deleted.',404);
   if(String(u.email).toLowerCase()===await adminEmail(env))fail('The admin account cannot be deleted.',409);
   const erased=await eraseAccountData(env,u.id,{eraseOrders:q.get('erase_orders')==='1'});
   await audit(env,adminUser,'customer_deleted',u.email,q.get('erase_orders')==='1'?'orders erased too':'orders anonymised');
   return json(erased);
  }
  if(name==='customers'){
   const term=(q.get('q')||'').trim().toLowerCase().slice(0,60);
   let sql="SELECT u.id,u.email,u.name,u.created_at,(SELECT COUNT(*) FROM orders o WHERE o.user_id=u.id AND o.status='paid') AS paid_orders,(SELECT COALESCE(SUM(amount_paise),0) FROM orders o WHERE o.user_id=u.id AND o.status='paid') AS spent,(SELECT group_concat(design_id) FROM entitlements e WHERE e.user_id=u.id) AS designs FROM users u WHERE 1=1";const bind=[];
   if(term){sql+=' AND (lower(u.email) LIKE ? OR lower(u.name) LIKE ?)';bind.push('%'+term+'%','%'+term+'%');}
   return json({customers:await all(sql+' ORDER BY u.created_at DESC LIMIT 1000',...bind)});
  }
  if(name==='pending'){
   const kind=seg[3];let id='';try{id=decodeURIComponent(seg[4]||'');}catch{fail('Not found.',404);}
   if(!kind){
    if(request.method!=='GET')fail('Not found.',404);
    const owner=await adminEmail(env);
    const orders=await all("SELECT id,signup_name AS name,signup_email AS email,created_at AS createdAt,design_id AS design FROM orders WHERE status!='paid' AND claimed=0 AND signup_email IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE lower(email)=lower(orders.signup_email)) ORDER BY created_at DESC LIMIT 500");
    const accounts=await all("SELECT id,name,email,created_at AS createdAt FROM users u WHERE lower(email)!=? AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.user_id=u.id AND o.status='paid') AND NOT EXISTS(SELECT 1 FROM entitlements e WHERE e.user_id=u.id) ORDER BY created_at DESC LIMIT 500",owner);
    const pending=[...orders.map(o=>({kind:'order',...o})),...accounts.map(u=>({kind:'account',...u,design:null}))].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,500);
    return json({pending});
   }
   if(request.method!=='DELETE'||!id||!['order','account'].includes(kind))fail('Not found.',404);
   if(kind==='order'){
    const o=await one('SELECT id,status,claimed,signup_email FROM orders WHERE id=?',id);
    if(!o)fail('That sign-up was not found. It may already be deleted.',404);
    if(o.status==='paid'||o.claimed||!o.signup_email)fail('This order is paid or already used, so it cannot be deleted here.',409);
    await d.prepare("DELETE FROM orders WHERE id=? AND status!='paid' AND claimed=0 AND signup_email IS NOT NULL").bind(id).run();
    return json({deleted:true});
   }
   const u=await one('SELECT id,email FROM users WHERE id=?',id);
   if(!u)fail('That account was not found. It may already be deleted.',404);
   if(String(u.email).toLowerCase()===await adminEmail(env))fail('The admin account cannot be deleted.',409);
   if(await one("SELECT 1 AS x FROM orders WHERE user_id=? AND status='paid' LIMIT 1",id)||await one('SELECT 1 AS x FROM entitlements WHERE user_id=? LIMIT 1',id))fail('This account has paid or has a design unlocked, so it cannot be deleted here.',409);
   // Every statement re-checks "never paid, nothing unlocked", so a payment landing mid-delete leaves the customer untouched.
   const safe=" AND NOT EXISTS(SELECT 1 FROM orders WHERE user_id=? AND status='paid') AND NOT EXISTS(SELECT 1 FROM entitlements WHERE user_id=?)";
   const step=sql=>d.prepare(sql+safe).bind(id,id,id);
   await d.batch([
    step('DELETE FROM sessions WHERE user_id=?'),
    step("DELETE FROM orders WHERE status!='paid' AND user_id=?"),
    step('DELETE FROM booking_items WHERE booking_id IN (SELECT id FROM bookings WHERE user_id=?)'),
    step('DELETE FROM booking_payments WHERE booking_id IN (SELECT id FROM bookings WHERE user_id=?)'),
    step('DELETE FROM bookings WHERE user_id=?'),
    d.prepare('DELETE FROM studio_drafts WHERE owner=?'+safe).bind(id,id,id),
    d.prepare('DELETE FROM workspaces WHERE owner=?'+safe).bind(id,id,id),
    d.prepare('DELETE FROM users WHERE id=?'+safe).bind(id,id,id)
   ]);
   return json({deleted:true});
  }
  if(name==='coupons'){
   if(request.method==='GET')return json({coupons:await all('SELECT * FROM coupons ORDER BY created_at DESC')});
   if(request.method==='POST'){
    const input=await body(request,2000),code=String(input?.code||'').trim().toUpperCase(),kind=input?.kind==='flat'?'flat':'percent',value=Math.round(Number(input?.value)),maxUses=Math.max(0,Math.round(Number(input?.max_uses||0)));
    if(!/^[A-Z0-9]{3,20}$/.test(code))fail('Coupon code: 3–20 letters or numbers, no spaces.');
    if(!Number.isFinite(value)||value<1||(kind==='percent'&&value>90)||(kind==='flat'&&value>100000))fail(kind==='percent'?'Percent off must be between 1 and 90.':'Flat discount must be between ₹1 and ₹1,00,000.');
    if(!Number.isFinite(maxUses)||maxUses>1000000)fail('Enter how many times it can be used (0 = unlimited).');
    const exp=input?.expires_on?String(input.expires_on):null;if(exp&&!/^\d{4}-\d{2}-\d{2}$/.test(exp))fail('Choose a valid expiry date.');
    if(await one('SELECT code FROM coupons WHERE code=?',code))fail('That coupon code already exists.',409);
    await d.prepare('INSERT INTO coupons(code,kind,value,max_uses,used,expires_on,active,created_at) VALUES(?,?,?,?,0,?,1,?)').bind(code,kind,value,maxUses,exp,new Date().toISOString()).run();
    await audit(env,adminUser,'coupon_created',code,kind+' '+value);
    return json({saved:true,code},201);
   }
   const code=decodeURIComponent(seg[3]||'').toUpperCase();
   if(request.method==='PUT'){const input=await body(request,500);const r=await d.prepare('UPDATE coupons SET active=? WHERE code=?').bind(input?.active?1:0,code).run();if(!r.meta?.changes)fail('Coupon not found.',404);await audit(env,adminUser,input?.active?'coupon_activated':'coupon_deactivated',code,'');return json({saved:true});}
   if(request.method==='DELETE'){await d.prepare('DELETE FROM coupons WHERE code=?').bind(code).run();await audit(env,adminUser,'coupon_deleted',code,'');return json({deleted:true});}
   fail('Not found.',404);
  }
  if(name==='banner'){
   if(request.method==='GET'){const row=await one("SELECT value FROM site_settings WHERE key='banner'");let b=null;try{b=row?.value?JSON.parse(row.value):null;}catch{}return json({on:!!b?.on,text:b?.text||''});}
   if(request.method==='PUT'){const input=await body(request,2000),text=String(input?.text||'').trim().slice(0,160),on=!!input?.on&&!!text;await d.prepare("INSERT INTO site_settings(key,value) VALUES('banner',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify({on,text})).run();return json({on,text});}
   fail('Not found.',404);
  }
  if(name==='features'){
   if(request.method==='GET'){const st=await albumSettings(env);return json({album:{price_paise:st.price_paise,draft_days:st.draft_days},commissionPercent:await commissionPercent(env),vendorCategories:await vendorCategories(env),vendorAgreement:await vendorAgreement(env),bossTwoFactor:(await siteSetting(env,'boss_2fa'))==='on'});}
   if(request.method==='PUT'){
    const input=await body(request,30000);
    const price=Math.round(Number(input?.albumPrice)*100),days=Math.round(Number(input?.draftDays));
    if(!Number.isFinite(price)||price<0||price>100000000)fail('Enter the Save Forever price in ₹.');
    if(!Number.isFinite(days)||days<1||days>90)fail('Free drafts can last between 1 and 90 days.');
    const pct=Number(input?.commissionPercent);if(!Number.isFinite(pct)||pct<0||pct>50)fail('Commission must be between 0% and 50%.');
    const catsIn=Array.isArray(input?.vendorCategories)?input.vendorCategories:[];
    const cats=[],seen=new Set();
    for(const c of catsIn){const label=String(c?.label||'').trim().slice(0,60);if(!label)continue;let id=String(c?.id||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);if(!id||seen.has(id))continue;seen.add(id);cats.push({id,label});}
    if(!cats.length)fail('Keep at least one vendor category.');
    /* Two-step boss login may only be switched ON after a test email has
       actually been delivered — the owner can never lock himself out by
       enabling it on a server that cannot send mail. */
    let twoFactor=(await siteSetting(env,'boss_2fa'))==='on';
    if(typeof input?.bossTwoFactor==='boolean'&&input.bossTwoFactor!==twoFactor){
     if(input.bossTwoFactor){
      const sent=await sendMail(env,{to:adminUser.email,subject:'Easy Wedding two-step login — test email',text:'Email delivery works. Boss two-step login can now be switched on in /boss: after your password, a 6-digit code will be emailed to this address.'});
      if(!sent.ok)fail('Two-step login was NOT switched on: the test email could not be sent ('+sent.reason+'). Set up email delivery first (RESEND_API_KEY + MAIL_FROM, or MAIL_WEBHOOK_URL), then try again.',400);
      twoFactor=true;
     }else twoFactor=false;
    }
    await d.prepare("INSERT INTO site_settings(key,value) VALUES('album_storage',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify({price_paise:price,draft_days:days})).run();
    await d.prepare("INSERT INTO site_settings(key,value) VALUES('vendor_commission',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify({percent:Math.round(pct*100)/100})).run();
    await d.prepare("INSERT INTO site_settings(key,value) VALUES('vendor_categories',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(cats)).run();
    let agreement=await vendorAgreement(env);
    if(input?.vendorAgreement&&(typeof input.vendorAgreement.text==='string'||typeof input.vendorAgreement.version==='string')){
     const ver=String(input.vendorAgreement.version||agreement.version).trim().slice(0,20)||agreement.version;
     const txt=String(input.vendorAgreement.text||'').trim().slice(0,8000);
     if(!txt)fail('The vendor agreement text cannot be empty.');
     await d.prepare("INSERT INTO site_settings(key,value) VALUES('vendor_agreement',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify({version:ver,text:txt})).run();
     agreement=await vendorAgreement(env);
    }
    await setSiteSetting(env,'boss_2fa',twoFactor?'on':'off');
    await audit(env,adminUser,'features_update','settings','album ₹'+(price/100)+' · draft '+days+'d · commission '+(Math.round(pct*100)/100)+'% · agreement '+agreement.version+' · boss2fa '+(twoFactor?'on':'off'));
    return json({album:{price_paise:price,draft_days:days},commissionPercent:Math.round(pct*100)/100,vendorCategories:cats,vendorAgreement:agreement,bossTwoFactor:twoFactor});
   }
   fail('Not found.',404);
  }
  if(name==='vendors'){
   if(seg.length===3&&request.method==='GET'){
    const st=['pending','approved','rejected','suspended'].includes(q.get('status')||'')?q.get('status'):'';
    const term=(q.get('q')||'').trim().toLowerCase().slice(0,60);
    let sql='SELECT v.*,u.email AS account_email FROM vendors v LEFT JOIN users u ON u.id=v.user_id WHERE 1=1';const bind=[];
    if(st){sql+=' AND v.status=?';bind.push(st);}
    if(term){sql+=' AND (lower(v.business_name) LIKE ? OR lower(v.owner_name) LIKE ? OR lower(v.city) LIKE ? OR lower(v.vendor_code) LIKE ? OR lower(u.email) LIKE ?)';const t='%'+term+'%';bind.push(t,t,t,t,t);}
    const rows=await all(sql+' ORDER BY v.created_at DESC LIMIT 500',...bind);
    const cats=await vendorCategories(env),out=[];
    for(const r of rows){await ensureVendorCode(env,r);const s=await vendorShape(env,r,cats,true);s.accountEmail=r.account_email||'';out.push(s);}
    return json({vendors:out});
   }
   if(seg.length===4&&request.method==='POST'){
    let vid='';try{vid=decodeURIComponent(seg[3]||'');}catch{fail('Not found.',404);}
    const v=await one('SELECT * FROM vendors WHERE id=?',vid);if(!v)fail('Vendor not found.',404);
    const input=await body(request,2000);
    if(Object.prototype.hasOwnProperty.call(input||{},'verified')){
     /* Owner-controlled trust flag: set only after the vendor's ID and
        address have been checked by the owner personally. */
     await d.prepare('UPDATE vendors SET verified=?,updated_at=? WHERE id=?').bind(input.verified?1:0,new Date().toISOString(),vid).run();
     await audit(env,adminUser,input.verified?'vendor_verified':'vendor_unverified',v.business_name,v.vendor_code||'');
     return json({ok:true,verified:!!input.verified});
    }
    const next=String(input?.status||'');
    if(!['approved','rejected','suspended','pending'].includes(next))fail('Not found.',404);
    await d.prepare('UPDATE vendors SET status=?,status_reason=?,updated_at=? WHERE id=?').bind(next,String(input?.reason||'').trim().slice(0,300)||null,new Date().toISOString(),vid).run();
    await audit(env,adminUser,'vendor_'+next,v.business_name,(v.vendor_code||'')+(input?.reason?' · '+String(input.reason).slice(0,120):''));
    return json({ok:true,status:next});
   }
   fail('Not found.',404);
  }
  if(name==='albums'){
   if(seg.length===3&&request.method==='GET'){
    const rows=await all('SELECT a.*,u.email AS account_email,u.name AS account_name FROM albums a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 500');
    const out=[];for(const r of rows){const s=await albumShape(env,r,false);s.ownerEmail=r.account_email||'';s.ownerName=r.account_name||'';s.photoCount=(await one('SELECT COUNT(*) AS n FROM album_photos WHERE album_id=?',r.id))?.n||0;out.push(s);}
    return json({albums:out});
   }
   if(seg.length===5&&seg[4]==='permanent'&&request.method==='POST'){
    let aid='';try{aid=decodeURIComponent(seg[3]||'');}catch{fail('Not found.',404);}
    const r=await d.prepare("UPDATE albums SET storage='permanent',updated_at=? WHERE id=?").bind(new Date().toISOString(),aid).run();
    if(!r.meta?.changes)fail('Album not found.',404);
    await audit(env,adminUser,'album_marked_permanent',aid,'manual /boss action');
    return json({ok:true});
   }
   fail('Not found.',404);
  }
  if(name==='vendorbookings'){
   if(request.method!=='GET')fail('Not found.',404);
   const rows=await all('SELECT b.*,v.business_name AS business_name,v.vendor_code AS vendor_code FROM vendor_bookings b JOIN vendors v ON v.id=b.vendor_id ORDER BY b.created_at DESC LIMIT 500');
   for(const r of rows){if(!r.vendor_code)r.vendor_code=await ensureVendorCode(env,{id:r.vendor_id,vendor_code:null});}
   const done=rows.filter(r=>r.status==='confirmed'||r.status==='completed');
   const unpaid=done.filter(r=>!r.payout_id);
   const totals={bookings:rows.length,confirmed:done.length,grossPaise:done.reduce((s,r)=>s+(r.final_paise||0),0),commissionPaise:done.reduce((s,r)=>s+(r.commission_paise||0),0),netPaise:done.reduce((s,r)=>s+(r.net_paise||0),0),vendorDuePaise:unpaid.filter(r=>r.settlement_mode==='platform_split').reduce((s,r)=>s+(r.net_paise||0),0),commissionDuePaise:unpaid.filter(r=>r.settlement_mode!=='platform_split').reduce((s,r)=>s+(r.commission_paise||0),0)};
   return json({bookings:rows.map(vendorBookingShape),totals});
  }
  if(name==='payouts'){
   if(request.method==='GET'){
    const rows=await all('SELECT p.*,v.business_name AS bname FROM vendor_payouts p JOIN vendors v ON v.id=p.vendor_id ORDER BY p.created_at DESC LIMIT 300');
    return json({payouts:rows.map(p=>({id:p.id,kind:p.kind||'vendor_payout',vendorId:p.vendor_id,vendorName:p.bname,amountPaise:p.amount_paise,reference:p.reference||'',bookingCount:p.booking_count,createdAt:p.created_at}))});
   }
   if(request.method==='POST'){
    const input=await body(request,2000),vid=String(input?.vendorId||''),reference=String(input?.reference||'').trim().slice(0,120);
    const kind=input?.kind==='commission_receipt'?'commission_receipt':'vendor_payout';
    const v=await one('SELECT id FROM vendors WHERE id=?',vid);if(!v)fail('Vendor not found.',404);
    /* Vendor payout settles platform_split bookings at the vendor's net share;
       a commission receipt settles manual bookings at the commission owed. */
    const mode=kind==='commission_receipt'?'manual':'platform_split';
    const due=await all("SELECT id,net_paise,commission_paise FROM vendor_bookings WHERE vendor_id=? AND status IN ('confirmed','completed') AND payout_id IS NULL AND settlement_mode=? ORDER BY created_at",vid,mode);
    if(!due.length)fail(kind==='commission_receipt'?'No commission is outstanding from this vendor right now.':'Nothing is due to this vendor right now.');
    const total=due.reduce((s,r)=>s+((kind==='commission_receipt'?r.commission_paise:r.net_paise)||0),0),pid=crypto.randomUUID(),now=new Date().toISOString();
    await d.prepare('INSERT INTO vendor_payouts(id,vendor_id,kind,amount_paise,reference,booking_count,created_at) VALUES(?,?,?,?,?,?,?)').bind(pid,vid,kind,total,reference||null,due.length,now).run();
    for(const b of due)await d.prepare('UPDATE vendor_bookings SET payout_id=? WHERE id=?').bind(pid,b.id).run();
    const vrow=await one('SELECT business_name,vendor_code FROM vendors WHERE id=?',vid);
    await audit(env,adminUser,kind==='commission_receipt'?'commission_received':'vendor_paid',vrow?vrow.business_name:vid,(vrow?.vendor_code||'')+' · ₹'+(total/100)+' · '+due.length+' booking(s)'+(reference?' · ref '+reference:''));
    return json({payout:{id:pid,kind,vendorId:vid,amountPaise:total,reference,bookingCount:due.length,createdAt:now}});
   }
   fail('Not found.',404);
  }
  if(name==='reviews'){
   if(request.method==='GET'){
    const rows=await all('SELECT r.*,v.business_name AS bname,v.vendor_code AS vcode,u.name AS cname,u.email AS cemail FROM vendor_reviews r JOIN vendors v ON v.id=r.vendor_id LEFT JOIN users u ON u.id=r.customer_id ORDER BY r.created_at DESC LIMIT 300').catch(()=>[]);
    return json({reviews:rows.map(r=>({id:r.id,bookingId:r.booking_id,vendorId:r.vendor_id,vendorName:r.bname,vendorCode:r.vcode||null,customer:r.cname||'',customerEmail:r.cemail||'',stars:r.stars,text:r.body||'',hidden:!!r.hidden,createdAt:r.created_at}))});
   }
   if(seg.length===4&&request.method==='POST'){
    let rid='';try{rid=decodeURIComponent(seg[3]||'');}catch{fail('Not found.',404);}
    const input=await body(request,1000);
    const r=await d.prepare('UPDATE vendor_reviews SET hidden=? WHERE id=?').bind(input?.hidden?1:0,rid).run().catch(()=>null);
    if(!r||!r.meta?.changes)fail('Review not found.',404);
    await audit(env,adminUser,input?.hidden?'review_hidden':'review_unhidden',rid,'');
    return json({ok:true,hidden:!!input?.hidden});
   }
   fail('Not found.',404);
  }
  if(name==='audit'){
   if(request.method!=='GET')fail('Not found.',404);
   const rows=await all('SELECT actor,action,target,detail,created_at FROM admin_audit ORDER BY created_at DESC LIMIT 200').catch(()=>[]);
   return json({entries:rows});
  }
  if(name==='export'){
   if(request.method!=='GET')fail('Not found.',404);
   /* One-click business export: vendors (with their IDs and payout details),
      bookings with the commission math, albums and orders — as one JSON
      file, following the account-data export pattern. Boss-only and
      audit-logged like every other sensitive action. */
   const cats=await vendorCategories(env);
   const vrows=await all('SELECT * FROM vendors ORDER BY created_at');
   const vendors=[];for(const r of vrows){await ensureVendorCode(env,r);vendors.push(await vendorShape(env,r,cats,true));}
   const brows=await all('SELECT b.*,v.business_name AS business_name,v.vendor_code AS vendor_code FROM vendor_bookings b JOIN vendors v ON v.id=b.vendor_id ORDER BY b.created_at');
   for(const r of brows){if(!r.vendor_code)r.vendor_code=await ensureVendorCode(env,{id:r.vendor_id,vendor_code:null});}
   const arows=await all('SELECT a.*,u.email AS account_email FROM albums a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at');
   const albums=[];for(const r of arows){const s=await albumShape(env,r,false);s.ownerEmail=r.account_email||'';albums.push(s);}
   const orders=await all('SELECT o.id,o.design_id,o.amount_paise,o.discount_paise,o.coupon,o.gateway,o.gateway_payment_id,o.status,o.created_at,u.email AS customer_email,u.name AS customer_name FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.created_at');
   await audit(env,adminUser,'data_export','vendors+bookings+albums+orders',vendors.length+' vendors · '+brows.length+' bookings · '+albums.length+' albums · '+orders.length+' orders');
   const payload={exportedAt:new Date().toISOString(),exportedBy:adminUser.email,vendors,bookings:brows.map(vendorBookingShape),albums,orders};
   return new Response(JSON.stringify(payload,null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="easy-wedding-export-'+new Date().toISOString().slice(0,10)+'.json"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Strict-Transport-Security':'max-age=31536000; includeSubDomains','X-EW-Origin':EW_ORIGIN}});
  }
  if(name==='system'){
   const counts={};for(const t of ['users','orders','entitlements','visits','coupons','bookings'])counts[t]=(await one('SELECT COUNT(*) AS n FROM '+t).catch(()=>null))?.n??null;
   return json({db:true,r2:!!env.BUCKET,adminEmail:!!env.ADMIN_EMAIL,adminPassword:!!env.ADMIN_PASSWORD,razorpayEnv:!!envGateway(env,'razorpay'),cashfreeEnv:!!envGateway(env,'cashfree'),counts,time:new Date().toISOString(),origin:url.origin});
  }
  fail('Not found.',404);
 }
 if(path==='/api/admin/site'){
  if(!await isAdminUser(env,adminUser))fail('Admin access only.',403);
  if(request.method==='GET'){const row=await db(env).prepare("SELECT value FROM site_settings WHERE key='maintenance'").first();return json({open:!row||row.value!=='1'});}
  if(request.method==='PUT'){const input=await body(request,2000);const open=!!input?.open;await db(env).prepare("INSERT INTO site_settings(key,value) VALUES('maintenance',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(open?'0':'1').run();await audit(env,adminUser,open?'site_opened':'site_closed','maintenance','');return json({open});}
  fail('Not found.',404);
 }
 // Master switch for the Grand Opening offer: one flip moves every design
 // (and the Pass) between its launch price and its regular price. The
 // homepage offer strip and its wording follow /api/pricing on their own.
 if(path==='/api/admin/launch'){
  if(!await isAdminUser(env,adminUser))fail('Admin access only.',403);
  if(request.method==='GET'){const rows=await db(env).prepare('SELECT launch_active FROM prices').all();const list=rows.results||[];const on=list.filter(r=>r.launch_active).length;return json({active:on>0,on,total:list.length});}
  if(request.method==='PUT'){const input=await body(request,2000);const active=!!input?.active;const total=(await db(env).prepare('SELECT COUNT(*) AS n FROM prices').first())?.n||0;await db(env).prepare('UPDATE prices SET launch_active=?').bind(active?1:0).run();await audit(env,adminUser,active?'grand_opening_on':'grand_opening_off','prices',total+' price rows');return json({active,on:active?total:0,total});}
  fail('Not found.',404);
 }
 // Owner unlocks a design for a couple who paid outside the site (UPI/WhatsApp).
 // Recorded as a paid 'manual' order so it shows in Recent orders.
 if(path==='/api/admin/grant'&&request.method==='POST'){
  if(!await isAdminUser(env,adminUser))fail('Admin access only.',403);
  const input=await body(request,4000);
  const email=typeof input?.email==='string'?input.email.trim().toLowerCase():'',designId=typeof input?.designId==='string'?input.designId:'';
  const amount=Math.round(Number(input?.amount||0)*100);
  const user=await db(env).prepare('SELECT id FROM users WHERE email=?').bind(email).first();
  if(!user)fail('No account uses that email. Ask the couple to sign up first.',404);
  if(!await db(env).prepare('SELECT design_id FROM prices WHERE design_id=?').bind(designId).first())fail('Choose a design to unlock.');
  if(!Number.isFinite(amount)||amount<0||amount>100000000)fail('Enter the amount received in ₹.');
  const now=new Date().toISOString(),order={id:crypto.randomUUID(),user_id:user.id,design_id:designId,status:'created'};
  await db(env).prepare('INSERT INTO orders(id,user_id,design_id,amount_paise,gateway,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(order.id,user.id,designId,amount,'manual','created',now,now).run();
  await completeOrder(env,order,'manual-'+(adminUser?adminUser.email:authUser.email));
  await audit(env,adminUser,'manual_grant',email,designId+' · ₹'+(amount/100));
  return json({ok:true,designs:await entitledDesigns(env,user.id)});
 }
 // Owner-assisted password reset (no email provider yet): issues a one-off
 // temporary password and signs the account out everywhere.
 if(path==='/api/admin/reset-password'&&request.method==='POST'){
  if(!await isAdminUser(env,adminUser))fail('Admin access only.',403);
  const input=await body(request,2000);
  const email=typeof input?.email==='string'?input.email.trim().toLowerCase():'';
  const user=await db(env).prepare('SELECT id FROM users WHERE email=?').bind(email).first();
  if(!user)fail('No account uses that email.',404);
  const alphabet='abcdefghjkmnpqrstuvwxyz23456789',bytes=crypto.getRandomValues(new Uint8Array(10));
  const temporary=[...bytes].map(b=>alphabet[b%alphabet.length]).join('');
  await db(env).prepare('UPDATE users SET password_hash=? WHERE id=?').bind(await makePasswordRecord(temporary),user.id).run();
  await db(env).prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id).run();
  await audit(env,adminUser,'password_reset_for_customer',email,'temporary password issued; all sessions ended');
  return json({temporaryPassword:temporary});
 }
 if(path==='/api/admin/payments'){
  if(!await isAdminUser(env,adminUser))fail('Admin access only.',403);
  if(request.method==='GET'){
   const settings=await db(env).prepare('SELECT * FROM payment_settings').all();
   const gateways=(settings.results||[]).map(r=>{const fromEnv=envGateway(env,r.gateway);if(fromEnv)r={...r,...fromEnv};const x=extraOf(r);return {fromEnv:!!fromEnv,gateway:r.gateway,enabled:!!r.enabled,mode:r.mode,key_id:r.key_id||'',has_secret:!!r.key_secret,client_version:x.client_version||'',webhook_username:x.webhook_username||'',has_webhook_secret:!!x['webhook_'+'secret'],has_webhook_password:!!x['webhook_'+'password']};});
   const priceRows=await db(env).prepare('SELECT * FROM prices').all();
   const orderRows=await db(env).prepare('SELECT o.id,o.design_id,o.amount_paise,o.gateway,o.status,o.created_at,COALESCE(u.email,\'deleted account\') AS email FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 50').all();
   return json({gateways,prices:priceRows.results||[],orders:orderRows.results||[]});
  }
  if(request.method==='PUT'){
   const input=await body(request,60000);
   for(const g of input?.gateways||[]){
    if(!g||!GATEWAYS.includes(g.gateway))continue;
    // Stored row only: env-held secrets must never be copied into D1.
    const cur=await db(env).prepare('SELECT gateway,enabled,mode,key_id,key_secret,extra FROM payment_settings WHERE gateway=?').bind(g.gateway).first();if(!cur)continue;
    const extra=extraOf(cur);
    if(typeof g.client_version==='string')extra.client_version=g.client_version.slice(0,10);
    if(typeof g.webhook_username==='string')extra.webhook_username=g.webhook_username.slice(0,120);
    const ws=g['webhook_'+'secret'];if(typeof ws==='string'&&ws)extra['webhook_'+'secret']=ws.slice(0,200);
    const wp=g['webhook_'+'password'];if(typeof wp==='string'&&wp)extra['webhook_'+'password']=wp.slice(0,200);
    const secretIn=g['key_'+'secret'];
    await db(env).prepare('UPDATE payment_settings SET enabled=?,mode=?,key_id=?,key_secret=?,extra=? WHERE gateway=?')
     .bind(g.enabled?1:0,g.mode==='live'?'live':'test',typeof g.key_id==='string'?g.key_id.slice(0,200):cur.key_id,(typeof secretIn==='string'&&secretIn)?secretIn.slice(0,300):cur.key_secret,JSON.stringify(extra),g.gateway).run();
   }
   for(const p of input?.prices||[]){
    if(!p||typeof p.design_id!=='string')continue;
    const reg=Math.round(Number(p.regular)*100),launch=Math.round(Number(p.launch)*100);
    if(!Number.isFinite(reg)||!Number.isFinite(launch)||reg<0||launch<0||reg>100000000||launch>100000000)continue;
    await db(env).prepare('UPDATE prices SET regular_paise=?,launch_paise=?,launch_active=? WHERE design_id=?').bind(reg,launch,p.launch_active?1:0,p.design_id).run();
   }
   await audit(env,adminUser,'payments_or_prices_update','payments',(input?.gateways||[]).length+' gateway row(s) · '+(input?.prices||[]).length+' price row(s)');
   return json({saved:true});
  }
 }
 if(path==='/api/workspace'){
  if(request.method==='GET'){const row=await db(env).prepare('SELECT data,revision FROM workspaces WHERE owner=?').bind(owner).first();return json(row?{state:JSON.parse(row.data),revision:row.revision}:{state:null,revision:0});}
  if(request.method==='PUT'){
   const input=await body(request),state=validateState(input.state),rev=Number(input.revision),data=JSON.stringify(state),now=new Date().toISOString();
   if(!Number.isInteger(rev)||rev<0)fail('Invalid save revision.');
   let result;if(rev===0)result=await db(env).prepare('INSERT INTO workspaces(owner,data,revision,updated_at) VALUES(?,?,1,?) ON CONFLICT(owner) DO NOTHING').bind(owner,data,now).run();
   else result=await db(env).prepare('UPDATE workspaces SET data=?,revision=revision+1,updated_at=? WHERE owner=? AND revision=?').bind(data,now,owner,rev).run();
   if(!result.meta.changes)fail('Your plan changed in another tab. Download a backup before reloading to see the latest saved plan.',409);
   return json({revision:rev+1});
  }
 }
 if(path==='/api/rsvps'&&request.method==='GET'){
  const res=await db(env).prepare('SELECT r.id,r.invitation_id AS invitationId,r.name,r.attendance,r.guests,r.message,r.song,r.phone,r.created_at AS createdAt,o.partner1,o.partner2 FROM rsvps r JOIN invitation_owners o ON o.invitation_id=r.invitation_id WHERE o.owner=? ORDER BY r.created_at DESC LIMIT 500').bind(owner).all();
  return json({rsvps:res.results||[]});
 }
 if(path==='/api/rsvps'&&request.method==='DELETE'){
  const input=await body(request,2000);
  await db(env).prepare('DELETE FROM rsvps WHERE id=? AND invitation_id IN (SELECT invitation_id FROM invitation_owners WHERE owner=?)').bind(String(input?.id||''),owner).run();
  return json({ok:true});
 }
 if(path==='/api/invitations'&&request.method==='POST'){
  await rateHit(env,'invnew',request,60,600);
  if(!env.BUCKET)fail('Invitation storage is unavailable.',503);const input=await body(request,250000);if(!input||!bounded(input.partner1,70)||!bounded(input.partner2,70))fail('Invalid invitation.');const c=normalizeConfig(input);if(c.audioUrl.startsWith('local-audio:')||JSON.stringify(c).includes('data:image/'))fail('Sign in and upload your photos and song before creating a short guest link.');
  if(!await isAdminUser(env,authUser)&&!await hasEntitlement(env,owner,c.theme))fail('Unlock this design to create your shareable invitation link.',402);
  if(c.gallery.length>4){const mineP=await entitledDesigns(env,owner);if(!mineP.includes('addon-gallery')&&!await isAdminUser(env,authUser))fail('More than 4 gallery photos needs the Premium Gallery add-on.',402);}
  c._ew=EW_ORIGIN;
  // ?replace=<id>: the owner edits and saves; the SAME share link then shows the new details.
  let id=crypto.randomUUID();const replace=url.searchParams.get('replace');
  if(replace&&/^[0-9a-f-]{36}$/.test(replace)){const own=await db(env).prepare('SELECT owner FROM invitation_owners WHERE invitation_id=?').bind(replace).first();if(own&&own.owner===owner)id=replace;}
  await env.BUCKET.put('invitation-snapshots/'+id,JSON.stringify(c),{httpMetadata:{contentType:'application/json'}});try{await db(env).prepare('INSERT OR REPLACE INTO invitation_owners(invitation_id,owner,partner1,partner2,created_at) VALUES(?,?,?,?,?)').bind(id,owner,c.partner1,c.partner2,new Date().toISOString()).run();}catch{}return json({id,url:'/invite?id='+id},201);
 }
 /* How complete the owner's invitation draft is (dashboard card + Android app). No draft yet = 0 %. */
 if(path==='/api/invitation-progress'&&request.method==='GET'){const row=await db(env).prepare('SELECT data FROM studio_drafts WHERE owner=?').bind(owner).first();let config=null;try{config=row?JSON.parse(row.data):null;}catch{}return json(inviteProgress(config),200,{'Cache-Control':'no-store'});}
 if(path==='/api/studio'){
  if(request.method==='GET'){const row=await db(env).prepare('SELECT data FROM studio_drafts WHERE owner=?').bind(owner).first();return json({config:row?JSON.parse(row.data):null});}
  if(request.method==='PUT'){const c=await body(request,250000);if(!c||!bounded(c.partner1,70)||!bounded(c.partner2,70))fail('Invalid invitation.');await db(env).prepare('INSERT INTO studio_drafts(owner,data,updated_at) VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').bind(owner,JSON.stringify(c),new Date().toISOString()).run();return json({saved:true});}
 }
 if(path==='/api/invitation-audio'&&request.method==='POST'){
  if(!env.BUCKET)fail('Song storage is unavailable.',503);const max=20*1024*1024;if(Number(request.headers.get('Content-Length'))>max+1024*1024)fail('Choose a song under 20 MB.',413);const data=await request.formData(),file=data.get('file');const types=['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/ogg','audio/mp4','audio/x-m4a'];if(!file||typeof file==='string'||!types.includes(file.type)||file.size<12||file.size>max)fail('Choose an MP3, WAV, OGG or M4A song under 20 MB.');const bytes=new Uint8Array(await file.arrayBuffer()),header=new TextDecoder().decode(bytes.slice(0,16));if(!validAudioHeader(bytes.slice(0,16),file.type))fail('That file is not a supported audio recording.');const id=crypto.randomUUID(),key='invitation-audio/'+id;await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:file.type}});try{await db(env).prepare('INSERT INTO assets(id,owner,filename,mime,size,created_at) VALUES(?,?,?,?,?,?)').bind(id,owner,file.name.slice(0,150),file.type,file.size,new Date().toISOString()).run();}catch(e){await env.BUCKET.delete(key);throw e;}return json({id,url:'/api/invitation-audio/'+id,name:file.name},201);
 }
 if((path==='/api/assets'||path==='/api/exports'||path==='/api/invitation-photos'||path==='/api/videos')&&request.method==='POST'){
  if(path==='/api/assets')await rateHit(env,'upload',request,180,600);
  const isPDF=path==='/api/exports',isInvitation=path==='/api/invitation-photos',isVideo=path==='/api/videos',maxBytes=(isVideo?20:8)*1024*1024;
  if(!env.BUCKET)fail('Photo storage is unavailable. Please try again.',503);
  if(Number(request.headers.get('Content-Length'))>maxBytes+1024*1024)fail(isVideo?'Choose a video smaller than 20 MB.':'Choose an image smaller than 8 MB.',413);
  const data=await request.formData(),file=data.get('file');
  if(!file||typeof file==='string'||!(isPDF?['application/pdf']:isVideo?['video/mp4','video/webm']:['image/jpeg','image/png','image/webp']).includes(file.type)||file.size>maxBytes||file.size<12)fail(isVideo?'Choose an MP4 or WebM video under 20 MB.':'Choose a JPG, PNG or WebP image under 8 MB.');
  const bytes=new Uint8Array(await file.arrayBuffer());const valid=isVideo?(file.type==='video/mp4'?new TextDecoder().decode(bytes.slice(4,8))==='ftyp':bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163):isPDF?new TextDecoder().decode(bytes.slice(0,5))==='%PDF-':file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78:bytes[0]===82&&bytes[1]===73&&bytes[8]===87&&bytes[9]===69;if(!valid)fail(isVideo?'That file is not a valid MP4 or WebM video.':'That file is not a valid image.');
  const id=crypto.randomUUID(),key=isInvitation?'invitation/'+id:id;await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:file.type}});
  try{await db(env).prepare('INSERT INTO assets(id,owner,filename,mime,size,created_at) VALUES(?,?,?,?,?,?)').bind(id,owner,file.name.slice(0,150),file.type,file.size,new Date().toISOString()).run();}catch(e){await env.BUCKET.delete(key);throw e;}
  return json({id,url:(isInvitation?'/api/invitation-photos/':'/api/assets/')+id,name:file.name},201);
 }
 if(path.startsWith('/api/assets/')&&request.method==='GET'){
  const id=path.split('/').pop(),row=await db(env).prepare('SELECT mime FROM assets WHERE id=? AND owner=?').bind(id,owner).first();if(!row)fail('Photo not found.',404);const object=await env.BUCKET.get(id);if(!object)fail('Photo not found.',404);return new Response(object.body,{headers:{'Content-Type':row.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...(row.mime==='application/pdf'?{'Content-Disposition':'attachment; filename="Easy-Wedding-Plan.pdf"'}:{})}});
 }
 return json({error:'Not found.'},404);
 }catch(e){if(!e.status)console.error('Wedding request failed',path,e.message);return json({error:e.status?e.message:'We could not save or load your wedding data. Your current input is still on this page. Please try again.'},e.status||503);}
}};
