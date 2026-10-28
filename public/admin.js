/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
const $=s=>document.querySelector(s);
const DESIGN_NAMES={'premium-original':'Premium Original','royal-prestige':'Crimson Vows','ivory-arch':'Ivory Jasmine','garden':'Botanical Forever','haldi':'Golden Phere','mehndi':'Peacock Promise','sangeet':'Wisteria Vows','reception':'Champagne Forever','midnight-noor':'Starlit Vows','blush-mehraab':'Blush Lotus','emerald-darbar':'Sacred Courtyard','ALL':'All-Designs Pass','addon-personal':'Add-on · Personal Invitations','addon-language-hi':'Add-on · Extra Language (Hindi)','addon-pdf':'Add-on · Print-ready PDF','addon-gallery':'Add-on · Premium Gallery','addon-shortlink':'Add-on · Custom Short Link'};
const DESIGN_ORDER=Object.keys(DESIGN_NAMES);
const GUIDE={
 razorpay:{name:'Razorpay',key:'Key Id',secret:'Key Secret',steps:['Create a merchant account at razorpay.com.','Dashboard → Account & Settings → API Keys → Generate Key.','Paste the Key Id and Key Secret here, switch this gateway ON, and Save.','For real payments: complete KYC on Razorpay, then generate the Live-mode key and replace the test key here.'],hook:'Webhook (recommended): Razorpay Dashboard → Accounts & Settings → Webhooks → add the URL https://easywedding.in/api/payments/webhook/razorpay with events payment.captured and order.paid. Choose a secret there and paste the same secret in the Webhook Secret box here.'},
 cashfree:{name:'Cashfree',key:'Client ID',secret:'Client Secret',steps:['Create a merchant account at cashfree.com.','Dashboard → Developers → API Keys — copy the Client ID and Client Secret.','Paste them here, switch this gateway ON, and Save. Test keys work right away; live keys unlock after KYC (usually within a day).','Offer running now: new merchants pay 0% platform fee on their first ₹20 lakh of sales until 31 Mar 2027 (only the GST on the fee is deducted).'],hook:'Webhook (recommended): Cashfree Dashboard → Payment Gateway → Developers → Add Webhook Endpoint, URL https://easywedding.in/api/payments/webhook/cashfree . No separate secret is needed — Cashfree signs webhooks with your Client Secret.'},
 phonepe:{name:'PhonePe Payment Gateway',key:'Client ID',secret:'Client Secret',steps:['Create a merchant account on the PhonePe Business dashboard and finish onboarding.','Developer Settings → API Keys — copy the Client ID, Client Secret and Client Version.','Paste all three here, switch this gateway ON, and Save.'],hook:'Webhook (recommended): PhonePe Dashboard → Developer Settings → Webhook → Create Webhook, URL https://easywedding.in/api/payments/webhook/phonepe , choose the SHA option and set a username and password there — paste the same pair here.'},
 payu:{name:'PayU',key:'Merchant Key',secret:'Salt',steps:['Create a merchant account at payu.in.','Dashboard → Developer → API Keys (test mode) or API Details (live mode) — copy the Merchant Key and Salt.','Paste them here, switch this gateway ON, and Save. Live keys appear after your documents and website are verified.'],hook:''}
};
const GATEWAY_ORDER=['cashfree','razorpay','phonepe','payu'];
let state=null;
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
function field(labelText,input){const l=el('label','ewp-field',labelText);l.append(input);return l;}
function textInput(dataset,value,placeholder,type){const i=document.createElement('input');i.type=type||'text';i.dataset.g=dataset;if(value)i.value=value;if(placeholder)i.placeholder=placeholder;return i;}
function gatewayCard(g){const meta=GUIDE[g.gateway];const card=el('div','ewp-card');card.dataset.gateway=g.gateway;
 const head=el('div','ewp-card-head');head.append(el('strong',null,meta.name));
 const sw=el('label','ewp-switch');const toggle=document.createElement('input');toggle.type='checkbox';toggle.dataset.g='enabled';toggle.checked=!!g.enabled;toggle.setAttribute('aria-label','Switch '+meta.name+' on or off');sw.append(toggle,el('span','ewp-track'));head.append(sw);card.append(head);
 const grid=el('div','ewp-grid');
 const modeSel=document.createElement('select');modeSel.dataset.g='mode';for(const [v,t] of [['test','Test mode (no real money)'],['live','Live mode (real payments)']]){const o=el('option',null,t);o.value=v;modeSel.append(o);}modeSel.value=g.mode==='live'?'live':'test';
 grid.append(field('Mode',modeSel));
 grid.append(field(meta.key,textInput('key_id',g.key_id||'','Paste the '+meta.key)));
 grid.append(field(meta.secret,textInput('secret','',g.has_secret?'•••••••• saved — type only to change it':'Paste the '+meta.secret,'password')));
 if(g.gateway==='phonepe')grid.append(field('Client Version',textInput('client_version',g.client_version||'1','1')));
 if(g.gateway==='razorpay')grid.append(field('Webhook Secret',textInput('webhook_secret','',g.has_webhook_secret?'•••••••• saved — type only to change it':'From the Razorpay webhook settings','password')));
 if(g.gateway==='phonepe'){grid.append(field('Webhook Username',textInput('webhook_username',g.webhook_username||'','From the PhonePe webhook settings')));grid.append(field('Webhook Password',textInput('webhook_password','',g.has_webhook_password?'•••••••• saved — type only to change it':'From the PhonePe webhook settings','password')));}
 card.append(grid);
 if(g.fromEnv){card.append(el('p','ewp-hook','Keys come from the Cloudflare environment secrets ('+(g.gateway==='razorpay'?'RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET':'CASHFREE_APP_ID / CASHFREE_SECRET_KEY')+') and are always on. Change them in Cloudflare, not here.'));for(const x of card.querySelectorAll('input,select'))x.disabled=true;}
 const steps=el('ol','ewp-steps');for(const s of meta.steps)steps.append(el('li',null,s));card.append(steps);
 if(meta.hook)card.append(el('p','ewp-hook',meta.hook));
 return card;}
const inr=p=>'₹'+(Math.round(Number(p)||0)/100).toLocaleString('en-IN',{maximumFractionDigits:2});
const num=n=>(Number(n)||0).toLocaleString('en-IN');
const when=iso=>{const t=new Date(iso);return isNaN(t)?'':t.toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'});};
const SRC={google:'Google',facebook:'Facebook',instagram:'Instagram',whatsapp:'WhatsApp',chatgpt:'ChatGPT',ai_chat:'Other AI chats (Gemini, Claude…)',direct:'Direct / typed link',search_other:'Other search engines',youtube:'YouTube',twitter:'X / Twitter',referral:'Other websites',campaign:'Campaign links'};
const PAGES={dashboard:'Dashboard',analytics:'Analytics',orders:'Orders',payments:'Payments',designs:'Designs & prices',addons:'Add-ons',coupons:'Coupons & offers',customers:'Customers',settings:'Website & banner',system:'System health'};
const istDays=n=>Array.from({length:n},(_,k)=>new Date(Date.now()+19800000-(n-1-k)*86400000).toISOString().slice(0,10));
const hourLabel=h=>(h%12||12)+(h<12?' am':' pm');
async function api(path,opts){const r=await fetch(path,opts);const d=await r.json().catch(()=>({}));if(!r.ok){const e=Error(d.error||'Request failed.');e.status=r.status;throw e;}return d;}
const send=(path,body,method)=>api(path,{method:method||'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const clear=n=>{n.replaceChildren();return n;};
function table(headers,rows,empty){if(!rows.length)return el('p','ad-empty',empty||'Nothing here yet.');const t=el('table','ad-table');const h=el('tr');for(const x of headers)h.append(el('th',null,x));t.append(h);for(const r of rows){const tr=el('tr');for(const c of r){const td=el('td');if(c instanceof Node)td.append(c);else td.textContent=c==null?'':String(c);tr.append(td);}t.append(tr);}const w=el('div','ad-scroll');w.append(t);return w;}
const badge=(text,cls)=>el('span','ad-badge '+(cls||''),text);
function kpi(label,value,sub){const k=el('div','ad-kpi');k.append(el('small',null,label),el('b',null,value),el('span',null,sub||''));return k;}
function bars(target,items,fmt){clear(target);if(!items.length||!items.some(i=>i.value>0)){target.append(el('p','ad-empty','No data yet.'));return;}const max=Math.max(...items.map(i=>i.value),1);const box=el('div','ad-bars');for(const i of items){const b=el('div',i.value>0?'':'zero');b.style.height=(i.value/max*100)+'%';b.title=i.label+': '+(fmt?fmt(i.value):i.value);box.append(b);}target.append(box);const ax=el('div','ad-axis');ax.append(el('span',null,items[0].label),el('span',null,items[items.length-1].label));target.append(ax);}
function hbars(target,items,empty){clear(target);if(!items.length){target.append(el('p','ad-empty',empty||'No data yet.'));return;}const max=Math.max(...items.map(i=>i.value),1);for(const i of items){const row=el('div','ad-hrow');const t=el('div','t');const f=el('i');f.style.width=(i.value/max*100)+'%';t.append(f);row.append(el('span',null,i.label),t,el('b',null,i.text||num(i.value)));target.append(row);}}
const pct=(a,b)=>b>0?Math.round(a/b*1000)/10+'%':'0%';
let payState=null,siteOpen=true,lastOrders=[];

// ---- Dashboard ----
async function loadDashboard(){
 const d=await api('/api/admin/overview');siteOpen=d.open;paintSite();
 const k=clear($('#kpis'));
 k.append(kpi("Today's revenue",inr(d.revenue.today.paise),d.revenue.today.n+' paid orders'),kpi('Last 30 days',inr(d.revenue.month.paise),d.revenue.month.n+' paid orders'),kpi('Total revenue',inr(d.revenue.total.paise),(d.orders.paid||0)+' paid · '+(d.orders.created||0)+' pending'),kpi('Customers',num(d.customers.total),'+'+d.customers.today+' today'),kpi('Visitors today',num(d.visitors.today),num(d.visitors.views)+' page views'));
 const byDay=Object.fromEntries(d.revenueDaily.map(r=>[r.day,r.paise]));
 bars($('#rev-chart'),istDays(14).map(day=>({label:day.slice(5),value:byDay[day]||0})),inr);
 clear($('#recent-orders')).append(table(['Date','Customer','Design','Amount','Status'],d.recent.map(o=>[when(o.created_at),o.name||o.email,DESIGN_NAMES[o.design_id]||o.design_id,inr(o.amount_paise),badge(o.status==='created'?'pending':o.status,o.status)]),'No orders yet. They appear here the moment a customer starts a payment.'));
 const gw=clear($('#gw-status'));for(const g of d.gateways){const row=el('div','ad-gw');row.append(el('span',null,(GUIDE[g.gateway]?.name||g.gateway)+(g.fromEnv?' · secrets':'')),badge(g.ready?'Active · '+g.mode:'Not set up',g.ready?'on':'off'));gw.append(row);}
 clear($('#new-customers')).append(table(['Name','Email','Joined'],d.newest.map(u=>[u.name,u.email,when(u.created_at)]),'No customers yet.'));
}
function paintSite(){document.querySelectorAll('.site-toggle').forEach(t=>t.checked=siteOpen);document.querySelectorAll('.site-label').forEach(s=>s.textContent=siteOpen?'Shop is open to everyone':'Shop is CLOSED — visitors see “Opening very soon”');}
document.addEventListener('change',async e=>{if(!e.target.classList.contains('site-toggle'))return;const wanted=e.target.checked;document.querySelectorAll('.site-status').forEach(s=>s.textContent='Saving…');try{const d=await send('/api/admin/site',{open:wanted});siteOpen=d.open;document.querySelectorAll('.site-status').forEach(s=>s.textContent=d.open?'Saved — the shop is now open to everyone.':'Saved — the shop is closed to the public.');}catch(err){document.querySelectorAll('.site-status').forEach(s=>s.textContent=err.message);}paintSite();});

// ---- Analytics ----
async function loadAnalytics(){
 const days=Number($('#an-days').value)||30,d=await api('/api/admin/analytics?days='+days);
 const t=d.totals,k=clear($('#an-kpis'));
 k.append(kpi('Visitors',num(t.visitors),'unique people'),kpi('Page views',num(t.views),'all pages'),kpi('Visits',num(t.sessions),'sessions started'),kpi('Buying rate',pct(d.funnel.paid,t.visitors),d.funnel.paid+' paid customers'));
 $('#an-live').textContent='● '+num(d.live)+' on the site in the last 30 minutes';
 const by=Object.fromEntries(d.daily.map(r=>[r.day,r])),list=istDays(Math.min(days,90));
 bars($('#an-daily'),list.map(day=>({label:day.slice(5),value:(by[day]||{}).visitors||0})),v=>v+' visitors');
 const totalSess=d.sources.reduce((a,s)=>a+s.sessions,0);
 hbars($('#an-sources'),d.sources.map(s=>({label:SRC[s.source]||s.source,value:s.sessions,text:num(s.sessions)+' · '+pct(s.sessions,totalSess)})),'No visits recorded yet — they start appearing as soon as people open the website.');
 const hv=Array.from({length:24},(_,h)=>(d.hours.find(r=>r.hour===h)||{}).views||0),sum=(a,b)=>hv.slice(a,b).reduce((x,y)=>x+y,0),dayV=sum(6,18),nightV=sum(0,6)+sum(18,24),all=dayV+nightV;
 const dn=clear($('#an-daynight'));dn.className='ad-dn';
 for(const [icon,label,v] of [['☀','Day · 6 am – 6 pm',dayV],['☾','Night · 6 pm – 6 am',nightV]]){const c=el('div');c.append(el('small',null,icon+' '+label),el('b',null,num(v)+' views'),el('small',null,pct(v,all)+' of traffic'));dn.append(c);}
 bars($('#an-hours'),hv.map((v,h)=>({label:hourLabel(h),value:v})),v=>v+' views');
 hbars($('#an-devices'),d.devices.map(x=>({label:{mobile:'📱 Mobile',desktop:'💻 Desktop',tablet:'Tablet'}[x.device]||x.device,value:x.visitors})));
 let region=null;try{region=new Intl.DisplayNames(['en'],{type:'region'});}catch{}
 hbars($('#an-countries'),d.countries.map(x=>({label:x.country==='XX'?'Unknown':(region?(()=>{try{return region.of(x.country);}catch{return x.country;}})():x.country),value:x.visitors})));
 hbars($('#an-refs'),d.referrers.map(x=>({label:x.ref_host,value:x.sessions})),'No referring websites yet.');
 clear($('#an-pages')).append(table(['Page','Views','Visitors'],d.pages.map(p=>[p.path,num(p.views),num(p.visitors)]),'No page views yet.'));
 const f=d.funnel,fn=clear($('#an-funnel'));fn.className='ad-funnel';
 hbars(fn,[['Visited the website',f.visitors],['Opened the design studio',f.studio],['Created an account',f.signups],['Started a payment',f.checkout],['Paid',f.paid]].map(([label,value])=>({label,value,text:num(value)+' · '+pct(value,f.visitors)})));
}
$('#an-days').addEventListener('change',()=>loadAnalytics().catch(handleErr));

// ---- Orders ----
async function loadOrders(){
 const qs=new URLSearchParams({status:$('#ord-status').value,q:$('#ord-q').value.trim()}),d=await api('/api/admin/orders?'+qs);lastOrders=d.orders;
 clear($('#orders-table')).append(table(['Date','Customer','Design','Amount','Gateway','Status','Order'],d.orders.map(o=>[when(o.created_at),(o.name||'')+' · '+o.email,DESIGN_NAMES[o.design_id]||o.design_id,inr(o.amount_paise)+(o.coupon?' ('+o.coupon+' −'+inr(o.discount_paise)+')':''),o.gateway,badge(o.status==='created'?'pending':o.status,o.status),o.id.slice(0,8)]),'No orders match.'));
}
let ordTimer;$('#ord-q').addEventListener('input',()=>{clearTimeout(ordTimer);ordTimer=setTimeout(()=>loadOrders().catch(handleErr),300);});$('#ord-status').addEventListener('change',()=>loadOrders().catch(handleErr));
$('#ord-csv').addEventListener('click',()=>{const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const lines=[['Date','Name','Email','Design','Amount (INR)','Discount (INR)','Coupon','Gateway','Status','Order id'].map(esc).join(',')];for(const o of lastOrders)lines.push([o.created_at,o.name,o.email,DESIGN_NAMES[o.design_id]||o.design_id,o.amount_paise/100,(o.discount_paise||0)/100,o.coupon||'',o.gateway,o.status,o.id].map(esc).join(','));const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv'}));a.download='easy-wedding-orders.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});

// ---- Payments, designs & add-ons (one shared state + one Save) ----
function priceTable(target,rows){
 const t=el('table','ad-table');const hr=el('tr');for(const h of ['Name','Regular ₹','Launching ₹','Offer on'])hr.append(el('th',null,h));t.append(hr);
 for(const p of rows){const tr=el('tr');tr.dataset.priceRow=p.design_id;tr.append(el('td',null,DESIGN_NAMES[p.design_id]||p.design_id));
  const mk=(key,v)=>{const i=document.createElement('input');i.type='number';i.min='0';i.step='1';i.dataset.p=key;i.value=Math.round(v/100);const td=el('td');td.append(i);return td;};
  const act=document.createElement('input');act.type='checkbox';act.dataset.p='active';act.checked=!!p.launch_active;const tdA=el('td');tdA.append(act);
  tr.append(mk('regular',p.regular_paise),mk('launch',p.launch_paise),tdA);t.append(tr);}
 const w=el('div','ad-scroll');w.append(t);clear(target).append(w);}
function renderPayments(){
 const wrap=clear($('#gateway-cards'));for(const id of GATEWAY_ORDER){const g=payState.gateways.find(x=>x.gateway===id);if(g)wrap.append(gatewayCard(g));}
 const prices=[...payState.prices].sort((a,b)=>DESIGN_ORDER.indexOf(a.design_id)-DESIGN_ORDER.indexOf(b.design_id));
 priceTable($('#prices-table'),prices.filter(p=>!p.design_id.startsWith('addon-')));priceTable($('#addons-table'),prices.filter(p=>p.design_id.startsWith('addon-')));}
async function ensurePayments(){payState=await api('/api/admin/payments');renderPayments();}
function collect(){const gateways=[...document.querySelectorAll('.ewp-card')].map(card=>{const get=n=>card.querySelector('[data-g="'+n+'"]');const out={gateway:card.dataset.gateway,enabled:get('enabled').checked,mode:get('mode').value,key_id:get('key_id').value.trim()};out['key_'+'secret']=get('secret').value;const cv=get('client_version');if(cv)out.client_version=cv.value.trim();const wu=get('webhook_username');if(wu)out.webhook_username=wu.value.trim();const ws=get('webhook_secret');if(ws)out['webhook_'+'secret']=ws.value;const wp=get('webhook_password');if(wp)out['webhook_'+'password']=wp.value;return out;});
 const prices=[...document.querySelectorAll('[data-price-row]')].map(row=>({design_id:row.dataset.priceRow,regular:Number(row.querySelector('[data-p="regular"]').value),launch:Number(row.querySelector('[data-p="launch"]').value),launch_active:row.querySelector('[data-p="active"]').checked}));
 return {gateways,prices};}
document.addEventListener('click',async e=>{const btn=e.target.closest('.save-all');if(!btn)return;const out=document.querySelectorAll('.save-status');const say=m=>out.forEach(s=>s.textContent=m);const payload=collect();
 if(payload.prices.some(p=>!Number.isFinite(p.regular)||!Number.isFinite(p.launch))){say('Please check the prices — every box needs a number.');return;}
 btn.disabled=true;say('Saving…');try{await send('/api/admin/payments',payload);await ensurePayments();say('Saved — the live site now uses these settings.');}catch(err){say(err.message||'Save failed. Please try again.');}finally{btn.disabled=false;}});

// ---- Coupons ----
async function loadCoupons(){
 const d=await api('/api/admin/coupons');
 const rows=d.coupons.map(c=>{const acts=el('div');const tog=el('button','ad-btn sm',c.active?'Pause':'Enable');tog.type='button';tog.addEventListener('click',async()=>{await send('/api/admin/coupons/'+encodeURIComponent(c.code),{active:!c.active}).catch(handleErr);loadCoupons().catch(handleErr);});const del=el('button','ad-btn sm danger','Delete');del.type='button';del.style.marginLeft='6px';del.addEventListener('click',async()=>{if(!confirm('Delete coupon '+c.code+'?'))return;await api('/api/admin/coupons/'+encodeURIComponent(c.code),{method:'DELETE'}).catch(handleErr);loadCoupons().catch(handleErr);});acts.append(tog,del);
  return [c.code,c.kind==='percent'?c.value+'% off':'₹'+num(c.value)+' off',num(c.used)+(c.max_uses?' / '+num(c.max_uses):' / ∞'),c.expires_on||'No expiry',badge(c.active?'Active':'Paused',c.active?'on':'off'),acts];});
 clear($('#coupons-table')).append(table(['Code','Discount','Used','Expires','Status',''],rows,'No coupons yet. Create your first one above.'));
}
$('#coupon-form').addEventListener('submit',async e=>{e.preventDefault();const st=$('#cp-status');st.textContent='Creating…';try{const d=await send('/api/admin/coupons',{code:$('#cp-code').value,kind:$('#cp-kind').value,value:$('#cp-value').value,max_uses:$('#cp-max').value,expires_on:$('#cp-exp').value||null},'POST');st.textContent='Coupon '+d.code+' is live — couples can enter it at payment.';e.target.reset();loadCoupons().catch(handleErr);}catch(err){st.textContent=err.message;}});

// ---- Customers ----
function planCell(designs){
 const ids=(designs||'').split(',').filter(Boolean),main=ids.filter(x=>!x.startsWith('addon-')),extra=ids.filter(x=>x.startsWith('addon-'));
 const box=el('div');
 if(!main.length){box.append(badge('No plan yet','off'));}
 else box.append(el('b',null,main.includes('ALL')?'All-Designs Pass':main.map(x=>DESIGN_NAMES[x]||x).join(', ')));
 if(extra.length)box.append(el('div','ad-sub',('Add-ons: '+extra.map(x=>(DESIGN_NAMES[x]||x).replace('Add-on · ','')).join(', '))));
 return box;
}
async function resetFor(email){
 if(!confirm('Create a temporary password for '+email+'? They are signed out everywhere and must use the new password.'))return;
 const box=$('#cu-temp');box.hidden=false;clear(box).append(el('p','ad-sub','Creating…'));
 try{
  const d=await send('/api/admin/reset-password',{email},'POST');
  clear(box);box.append(el('h3',null,'Temporary password ready'),el('p',null,'Send this to '+email+' now — it is not shown again.'));
  const code=el('code','ad-temp',d.temporaryPassword);const copy=el('button','ad-btn sm','Copy');copy.type='button';
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(d.temporaryPassword);copy.textContent='Copied ✓';}catch{copy.textContent='Select & copy it manually';}});
  const row=el('div','ad-temp-row');row.append(code,copy);box.append(row);if(box.scrollIntoView)box.scrollIntoView({behavior:'smooth',block:'center'});
 }catch(err){clear(box);box.append(el('p','ad-status',err.message));}
}
async function loadCustomers(){
 const d=await api('/api/admin/customers?q='+encodeURIComponent($('#cu-q').value.trim()));
 const rows=d.customers.map(u=>{const acts=el('div');const g=el('button','ad-btn sm','Unlock');g.type='button';g.addEventListener('click',()=>{$('#grant-email').value=u.email;$('#grant-form').scrollIntoView({behavior:'smooth',block:'center'});});const r=el('button','ad-btn sm','Reset password');r.type='button';r.style.marginLeft='6px';r.addEventListener('click',()=>resetFor(u.email));acts.append(g,r);
  return [u.name,u.email,planCell(u.designs),inr(u.spent),when(u.created_at),acts];});
 $('#cu-count').textContent=d.customers.length+' registered user'+(d.customers.length===1?'':'s');
 clear($('#customers-table')).append(table(['Name','Email','Plan taken','Paid','Registered',''],rows,'No customers match.'));
}
let cuTimer;$('#cu-q').addEventListener('input',()=>{clearTimeout(cuTimer);cuTimer=setTimeout(()=>loadCustomers().catch(handleErr),300);});
{const sel=$('#grant-design');for(const [id,name] of Object.entries(DESIGN_NAMES)){const o=el('option',null,id==='ALL'?'All-Designs Wedding Pass':name);o.value=id;sel.append(o);}
 $('#grant-form').addEventListener('submit',async e=>{e.preventDefault();const status=$('#grant-status');status.textContent='Unlocking…';try{await send('/api/admin/grant',{email:$('#grant-email').value,designId:sel.value,amount:$('#grant-amount').value},'POST');status.textContent='Unlocked '+(sel.selectedOptions[0]?.textContent||sel.value)+' for '+$('#grant-email').value+'.';e.target.reset();loadCustomers().catch(handleErr);}catch(err){status.textContent=err.message;}});
 $('#reset-form').addEventListener('submit',async e=>{e.preventDefault();const status=$('#reset-status');status.textContent='Creating…';try{const d=await send('/api/admin/reset-password',{email:$('#reset-email').value},'POST');status.textContent='New password for '+$('#reset-email').value+': '+d.temporaryPassword+' — send it to them now; it is not shown again.';e.target.reset();}catch(err){status.textContent=err.message;}});}

// ---- Settings & system ----
async function loadSettings(){const [s,b]=await Promise.all([api('/api/admin/site'),api('/api/admin/banner')]);siteOpen=s.open;paintSite();$('#bn-text').value=b.text||'';$('#bn-on').checked=!!b.on;}
$('#banner-form').addEventListener('submit',async e=>{e.preventDefault();const st=$('#bn-status');st.textContent='Saving…';try{const d=await send('/api/admin/banner',{text:$('#bn-text').value,on:$('#bn-on').checked});$('#bn-on').checked=d.on;st.textContent=d.on?'Saved — the banner is live on the homepage (refreshes within a minute).':'Saved — the banner is hidden.';}catch(err){st.textContent=err.message;}});
async function loadSystem(){
 const d=await api('/api/admin/system'),ok=(v,yes,no)=>badge(v?yes:no,v?'on':'off');
 const row=(label,node)=>{const r=el('div','ad-sys');r.append(el('span',null,label));r.append(node);return r;};
 const list=clear($('#sys-list'));
 list.append(row('Database (D1)',ok(d.db,'Connected','Not connected')),row('File storage (R2) for photos & songs',ok(d.r2,'Connected','Not connected')),row('Admin email secret (ADMIN_EMAIL)',ok(d.adminEmail,'Set','Not set — using database value')),row('Admin password secret (ADMIN_PASSWORD)',ok(d.adminPassword,'Set','Not set')),row('Razorpay secrets in Cloudflare',ok(d.razorpayEnv,'Set','Not set')),row('Cashfree secrets in Cloudflare',ok(d.cashfreeEnv,'Set','Not set')));
 const c=Object.entries(d.counts).map(([k,v])=>k+': '+(v==null?'—':num(v))).join(' · ');
 list.append(row('Records',el('span',null,c)),row('Server time',el('span',null,when(d.time))));
}

// ---- Routing, login, start-up ----
const loaders={dashboard:loadDashboard,analytics:loadAnalytics,orders:loadOrders,payments:ensurePayments,designs:ensurePayments,addons:ensurePayments,coupons:loadCoupons,customers:loadCustomers,settings:loadSettings,system:loadSystem};
function handleErr(e){if(e&&(e.status===401||e.status===403)){location.reload();return;}console.error(e);}
function route(){let p=location.hash.replace(/^#\/?/,'')||'dashboard';if(!loaders[p])p='dashboard';document.querySelectorAll('.ad-content>section').forEach(s=>{s.hidden=s.dataset.page!==p;});document.querySelectorAll('#ad-nav a').forEach(a=>a.classList.toggle('on',a.dataset.page===p));$('#ad-title').textContent=PAGES[p];document.title='Easy Wedding · '+PAGES[p];window.scrollTo(0,0);Promise.resolve(loaders[p]()).catch(handleErr);}
addEventListener('hashchange',route);
function deny(msg){$('#admin-loading').hidden=true;const d=$('#admin-denied');d.hidden=false;d.textContent=msg;}
function showLogin(){$('#admin-loading').hidden=true;$('#admin-denied').hidden=true;$('#admin-login-wrap').hidden=false;}
$('#admin-login').addEventListener('submit',async e=>{e.preventDefault();const st=$('#admin-login-status'),btn=e.target.querySelector('button[type=submit]');btn.disabled=true;st.textContent='Signing in…';try{const body={email:$('#admin-login-email').value.trim()};body['pass'+'word']=$('#admin-login-pass').value;const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Sign in failed.');$('#admin-login-wrap').hidden=true;$('#admin-loading').hidden=false;init();}catch(err){st.textContent=err.message||'Sign in failed. Please try again.';}finally{btn.disabled=false;}});
$('#ad-signout').addEventListener('click',async()=>{await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});location.reload();});
async function init(){try{const s=await fetch('/api/session').then(r=>r.json()).catch(()=>({user:null}));if(!s.user){showLogin();return;}
 const r=await fetch('/api/admin/overview').catch(()=>null);
 if(!r){deny('Could not load the admin console. Please try again.');return;}
 if(r.status===403){deny('You are signed in as '+s.user.email+', which is not the admin account for this site.');const b=el('button','ad-btn primary','Sign out');b.type='button';b.style.marginLeft='10px';b.addEventListener('click',async()=>{await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});location.reload();});$('#admin-denied').append(b);return;}
 if(!r.ok){deny('Could not load the admin console. Please try again.');return;}
 try{localStorage.setItem('ew_notrack','1');}catch{}
 $('#ad-me').textContent=s.user.email;$('#admin-loading').hidden=true;$('#admin-panel').hidden=false;route();}catch{deny('Could not load the admin console. Please try again.');}}
init();
