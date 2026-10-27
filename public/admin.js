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
 const steps=el('ol','ewp-steps');for(const s of meta.steps)steps.append(el('li',null,s));card.append(steps);
 if(meta.hook)card.append(el('p','ewp-hook',meta.hook));
 return card;}
function render(){const wrap=$('#gateway-cards');wrap.replaceChildren();for(const id of GATEWAY_ORDER){const g=state.gateways.find(x=>x.gateway===id);if(g)wrap.append(gatewayCard(g));}
 const pt=$('#prices-table');const table=el('table');const thead=el('tr');for(const h of ['Design','Regular ₹','Launching ₹','Offer on'])thead.append(el('th',null,h));table.append(thead);
 const prices=[...state.prices].sort((a,b)=>DESIGN_ORDER.indexOf(a.design_id)-DESIGN_ORDER.indexOf(b.design_id));
 for(const p of prices){const tr=el('tr');tr.dataset.priceRow=p.design_id;tr.append(el('td',null,DESIGN_NAMES[p.design_id]||p.design_id));
  const reg=document.createElement('input');reg.type='number';reg.min='0';reg.step='1';reg.dataset.p='regular';reg.value=Math.round(p.regular_paise/100);
  const lau=document.createElement('input');lau.type='number';lau.min='0';lau.step='1';lau.dataset.p='launch';lau.value=Math.round(p.launch_paise/100);
  const tdR=el('td');tdR.append(reg);const tdL=el('td');tdL.append(lau);
  const act=document.createElement('input');act.type='checkbox';act.dataset.p='active';act.checked=!!p.launch_active;const tdA=el('td');tdA.append(act);
  tr.append(tdR,tdL,tdA);table.append(tr);}
 pt.replaceChildren(table);
 const ot=$('#orders-table');
 if(!state.orders.length){ot.replaceChildren(el('p','ewp-sub','No orders yet. Orders appear here the moment a customer starts a payment.'));}
 else{const t=el('table');const hr=el('tr');for(const h of ['Date','Customer','Design','Amount','Gateway','Status'])hr.append(el('th',null,h));t.append(hr);
  for(const o of state.orders){const tr=el('tr');tr.append(el('td',null,new Date(o.created_at).toLocaleString('en-IN')),el('td',null,o.email),el('td',null,DESIGN_NAMES[o.design_id]||o.design_id),el('td',null,'₹'+(o.amount_paise/100).toLocaleString('en-IN')),el('td',null,o.gateway));const badge=el('span','ewp-badge'+(o.status==='paid'?' paid':''),o.status);const tdS=el('td');tdS.append(badge);tr.append(tdS);t.append(tr);}
  ot.replaceChildren(t);}}
function collect(){const gateways=[...document.querySelectorAll('.ewp-card')].map(card=>{const get=n=>card.querySelector('[data-g="'+n+'"]');const out={gateway:card.dataset.gateway,enabled:get('enabled').checked,mode:get('mode').value,key_id:get('key_id').value.trim()};out['key_'+'secret']=get('secret').value;const cv=get('client_version');if(cv)out.client_version=cv.value.trim();const wu=get('webhook_username');if(wu)out.webhook_username=wu.value.trim();const ws=get('webhook_secret');if(ws)out['webhook_'+'secret']=ws.value;const wp=get('webhook_password');if(wp)out['webhook_'+'password']=wp.value;return out;});
 const prices=[...document.querySelectorAll('[data-price-row]')].map(row=>({design_id:row.dataset.priceRow,regular:Number(row.querySelector('[data-p="regular"]').value),launch:Number(row.querySelector('[data-p="launch"]').value),launch_active:row.querySelector('[data-p="active"]').checked}));
 return {gateways,prices};}
async function load(){const r=await fetch('/api/admin/payments');if(!r.ok)throw Error('load');state=await r.json();render();}
function deny(msg){$('#admin-loading').hidden=true;const d=$('#admin-denied');d.hidden=false;d.textContent=msg;}
async function loadSite(){try{const r=await fetch('/api/admin/site');if(!r.ok)return;const d=await r.json();$('#site-open').checked=!!d.open;$('#site-open-label').textContent=d.open?'Shop is open to everyone':'Shop is CLOSED — visitors see “Opening very soon”';}catch{}}
$('#site-open').addEventListener('change',async e=>{const st=$('#site-status');st.textContent='Saving…';try{const r=await fetch('/api/admin/site',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({open:e.target.checked})});const d=await r.json();if(!r.ok)throw Error(d.error||'Save failed.');$('#site-open-label').textContent=d.open?'Shop is open to everyone':'Shop is CLOSED — visitors see “Opening very soon”';st.textContent=d.open?'Saved — the shop is now open to everyone.':'Saved — the shop is closed to the public.';}catch(err){st.textContent=err.message||'Save failed. Please try again.';loadSite();}});
function showLogin(){$('#admin-loading').hidden=true;$('#admin-denied').hidden=true;$('#admin-login').hidden=false;}
$('#admin-login').addEventListener('submit',async e=>{e.preventDefault();const st=$('#admin-login-status'),btn=e.target.querySelector('button[type=submit]');btn.disabled=true;st.textContent='Signing in…';try{const body={email:$('#admin-login-email').value.trim()};body['pass'+'word']=$('#admin-login-pass').value;const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Sign in failed.');$('#admin-login').hidden=true;$('#admin-loading').hidden=false;init();}catch(err){st.textContent=err.message||'Sign in failed. Please try again.';}finally{btn.disabled=false;}});
async function init(){try{const s=await fetch('/api/session').then(r=>r.json()).catch(()=>({user:null}));if(!s.user){showLogin();return;}
 const r=await fetch('/api/admin/payments').catch(()=>null);
 if(!r){deny('Could not load payment settings. Please try again.');return;}
 if(r.status===403){deny('You are signed in as '+s.user.email+', which is not the admin account for this site.');const b=document.createElement('button');b.className='ewp-primary';b.type='button';b.textContent='Sign out';b.addEventListener('click',async()=>{await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});location.reload();});$('#admin-denied').append(' ',b);return;}
 if(!r.ok){deny('Could not load payment settings. Please try again.');return;}
 state=await r.json();render();$('#admin-loading').hidden=true;$('#admin-panel').hidden=false;loadSite();}catch{deny('Could not load payment settings. Please try again.');}}
$('#admin-save').addEventListener('click',async()=>{const btn=$('#admin-save'),status=$('#admin-status');const payload=collect();if(payload.prices.some(p=>!Number.isFinite(p.regular)||!Number.isFinite(p.launch))){status.textContent='Please check the prices — every box needs a number.';return;}btn.disabled=true;status.textContent='Saving…';try{const r=await fetch('/api/admin/payments',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw Error(d.error||'Save failed.');await load();status.textContent='Saved — the live site now uses these settings.';}catch(e){status.textContent=e.message||'Save failed. Please try again.';}finally{btn.disabled=false;}});
init();
