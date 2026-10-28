/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
// Easy Wedding enhancements for the rendered invitation:
//  1. If the couple added an invitation film link, show the film as its own
//     closing section after the invitation.
//  2. If this invitation was opened from a published link, quietly save the
//     guest's RSVP reply to the couple's inbox as well (the guest's normal
//     WhatsApp / email flow is untouched).
import {readConfig,encodeConfig,normalizeConfig} from './config.js';
import {videoEmbedUrl} from './video-embed.js';

const ewStyle=document.createElement('style');
ewStyle.textContent='#rsvp h1,#rsvp h2{position:relative;z-index:9}'+(window.self!==window.top?'.royal-motion-toggle{display:none!important}':'');
document.head.append(ewStyle);
const invitationId=new URLSearchParams(location.search).get('id')||'';
const guestToken=new URLSearchParams(location.search).get('to')||'';
let config=null;
try{config=readConfig(location)}catch{config=null}

// A published invitation (server ?id) shows exactly what the couple paid to
// publish. Anything else — the studio's "open full screen" link or a hand-made
// #card= URL — is an unpaid preview: opened on its own it carries a PREVIEW
// watermark so it can't stand in for a real invitation. Previews framed inside
// the studio or the homepage stay clean.
function showPreviewRibbon(){
 if(window.self!==window.top)return;
 const style=document.createElement('style');
 style.textContent='.ew-preview-mark{position:fixed;inset:0;z-index:2147483646;pointer-events:none;background-image:url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="260" height="180"><text x="20" y="110" transform="rotate(-28 130 90)" font-family="Georgia,serif" font-size="34" letter-spacing="6" fill="rgba(117,21,46,0.16)">PREVIEW</text></svg>')+'")}'
  +'.ew-preview-bar{position:fixed;left:0;right:0;top:0;z-index:2147483647;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;padding:10px 14px;background:#5e1220;color:#fff7e8;font:600 13px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.25)}'
  +'.ew-preview-bar a{color:#3a0a18;background:#e8c876;border-radius:999px;padding:6px 14px;text-decoration:none;font-weight:700;white-space:nowrap}';
 document.head.append(style);
 const mark=document.createElement('div');mark.className='ew-preview-mark';mark.setAttribute('aria-hidden','true');
 const bar=document.createElement('div');bar.className='ew-preview-bar';bar.setAttribute('role','note');
 const text=document.createElement('span');text.textContent='Preview only · unlock this design to share it with your guests';
 const link=document.createElement('a');link.href='/studio'+(config?.theme?'?template='+encodeURIComponent(config.theme):'');link.textContent='Unlock & share →';
 bar.append(text,link);document.body.append(mark,bar);
}
(async()=>{
 if(!invitationId){showPreviewRibbon();return;}
 try{
  const r=await fetch('/api/invitations/'+encodeURIComponent(invitationId));
  if(!r.ok){showPreviewRibbon();return;}
  const published=encodeConfig(normalizeConfig(await r.json()));
  if(location.hash.replace(/^#card=/,'')!==published){location.hash='card='+published;location.reload();}
 }catch{/* offline guest: keep what loaded rather than block a real invitation */}
})();

function mountFilm(){
 if(!config||!config.videoUrl||document.getElementById('ew-film'))return false;
 const embed=videoEmbedUrl(config.videoUrl);if(!embed)return true;
 const section=document.createElement('section');
 section.id='ew-film';
 section.setAttribute('aria-label','Our invitation film');
 section.style.cssText='background:#f7ecd9;padding:56px 20px 64px;text-align:center;';
 section.innerHTML='<p style="margin:0 0 6px;font:600 11px/1.4 system-ui,sans-serif;letter-spacing:.28em;color:#9a7b2d;text-transform:uppercase">A little film, just for you</p>'
  +'<h2 style="margin:0 0 22px;font:italic 600 34px/1.2 Georgia,serif;color:#571c24">Our Invitation Film</h2>'
  +'<div style="position:relative;max-width:820px;margin:0 auto;aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px rgba(87,28,36,.25)">'
  +'<iframe title="Our invitation film" src="'+embed+'" style="position:absolute;inset:0;width:100%;height:100%;border:0" loading="lazy" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
 document.body.append(section);
 return true;
}

async function postRsvp(values){
 if(!invitationId)return;
 try{
  await fetch('/api/invitations/'+encodeURIComponent(invitationId)+'/rsvp',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(guestToken?{...values,token:guestToken}:values),keepalive:true
  });
 }catch{/* the guest's own send flow still works without the inbox copy */}
}

// The invitation's RSVP is a card of loose fields (no <form>): the guest
// fills name / phone / guests / events / food / blessings / song, clicks
// CONFIRM RSVP, reviews, and completes the reply with a SEND button. The
// most reliable copy of the reply is the review dialog itself — it lists
// Name / Phone / Guests / Events / Food / Blessings / Song as plain text —
// so we parse that first and fall back to reading the card's fields.
let lastSave={key:'',at:0};
function labelTextOf(el){
 const clean=s=>(s||'').replace(/\s+/g,' ').trim();
 const wrap=el.closest('label');if(wrap)return clean(wrap.textContent);
 if(el.id){const l=document.querySelector('label[for="'+el.id+'"]');if(l)return clean(l.textContent);}
 let node=el.parentElement;
 for(let i=0;i<3&&node;i++,node=node.parentElement){
  const own=[...node.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ');
  if(clean(own))return clean(own).slice(0,60);
  const lab=node.querySelector(':scope > label,:scope > span,:scope > p');if(lab)return clean(lab.textContent).slice(0,60);
 }
 return '';
}
function reviewRoot(control){
 let node=control;
 for(let i=0;i<9&&node;i++,node=node.parentElement){
  const t=node.innerText||'';
  if(/review your reply/i.test(t)&&/name:/i.test(t))return node;
 }
 return document.querySelector('[role="dialog"],dialog');
}
function parseReview(root){
 if(!root)return null;
 const t=(root.innerText||'').replace(/\r/g,'');
 const grab=re=>{const m=t.match(re);return m?m[1].trim():''};
 const name=grab(/Name:\s*(.+)/i);if(!name)return null;
 const phone=grab(/Phone:\s*(.+)/i).replace(/[^\d+]/g,'').slice(0,16);
 const guests=parseInt(grab(/Guests:\s*(\d+)/i),10)||1;
 const events=grab(/Events:\s*(.+)/i);
 const food=grab(/Food:\s*(.+)/i);
 const blessings=grab(/Blessings:\s*(.+)/i);
 const song=grab(/Song:\s*(.+)/i);
 const message=[food?'Food: '+food+'.':'',blessings].filter(Boolean).join(' ');
 return {name,phone,attendance:events?'Attending: '+events:'Joyfully accepts',guests:Math.min(20,guests),message,song};
}
function readReply(container){
 const fields=[...container.querySelectorAll('input,select,textarea')].filter(el=>el.type!=='hidden');
 const textInputs=fields.filter(el=>el.tagName==='INPUT'&&['text','tel','search',''].includes(el.type||''));
 const find=(re,pool)=>pool.find(el=>re.test(labelTextOf(el))||re.test(el.placeholder||''));
 const nameEl=find(/name/i,textInputs.filter(el=>!/phone/i.test(labelTextOf(el))))||textInputs[0];
 const name=(nameEl?.value||'').trim();if(!name)return null;
 const phoneEl=find(/phone|mobile/i,textInputs);
 const phone=(phoneEl?.value||'').replace(/[^\d+]/g,'').slice(0,16);
 const selects=fields.filter(el=>el.tagName==='SELECT');
 const guestsEl=selects.find(el=>/guest/i.test(el.options[el.selectedIndex]?.text||''))||selects[0]||find(/guest/i,fields);
 let guests=1;
 if(guestsEl){const raw=guestsEl.tagName==='SELECT'?(guestsEl.options[guestsEl.selectedIndex]?.text||guestsEl.value):guestsEl.value;const n=parseInt(raw,10);if(n>0)guests=n;}
 const events=[...container.querySelectorAll('input[type="checkbox"]:checked')].map(cb=>labelTextOf(cb).split(/\d/)[0].trim()).filter(Boolean);
 const foodEl=container.querySelector('input[type="radio"]:checked');
 const food=foodEl?labelTextOf(foodEl).trim():'';
 const songEl=find(/song/i,textInputs);
 const song=(songEl?.value||'').trim();
 const area=fields.find(el=>el.tagName==='TEXTAREA');
 const blessing=(area?.value||'').trim();
 const message=[food?'Food: '+food+'.':'',blessing].filter(Boolean).join(' ');
 const attendance=events.length?'Attending: '+events.join(', '):'Regretfully declines';
 return {name,phone,attendance,guests,message,song};
}
// Arm the save listener immediately — the RSVP card may only render after
// the guest opens the invitation and scrolls, long after this script runs,
// so nothing here may wait for the card to exist. The click is delegated
// and the fields are looked up fresh at click time.
if(invitationId){
 document.addEventListener('click',e=>{
  try{
   const control=e.target.closest('a,button');if(!control)return;
   const text=(control.textContent||'').replace(/\s+/g,' ').trim();
   const isSendText=/^send\b/i.test(text)&&/whatsapp|email|reply/i.test(text);
   const isWaLink=control.tagName==='A'&&/wa\.me|api\.whatsapp\.com/.test(control.href||'')&&/review your reply/i.test(document.body?.innerText||'');
   if(!isSendText&&!isWaLink)return;
   const fromDialog=parseReview(reviewRoot(control));
   const values=fromDialog||readReply(document.getElementById('rsvp')||document.body);
   if(!values)return;
   const key=JSON.stringify(values),now=Date.now();
   if(key===lastSave.key&&now-lastSave.at<120000)return;
   lastSave={key,at:now};
   postRsvp(values);
  }catch{/* never disturb the guest's reply */}
 },true);
}

let filmDone=false;
function tick(){
 if(!filmDone)filmDone=mountFilm();
 if(filmDone)observer.disconnect();
}
const observer=new MutationObserver(tick);
observer.observe(document.documentElement,{childList:true,subtree:true});
tick();
setTimeout(()=>observer.disconnect(),30000);

// 3. Personal invitations: if this visit carries a guest token, greet the
//    guest by name ("Dear {name}") and record the opening for the couple.
// 4. Extra Language (Hindi): if the couple enabled Hindi, guests can switch
//    the invitation's labels between English and Hindi.
let guestName='';
async function fetchGuest(){
 if(!invitationId||!guestToken)return;
 try{
  const r=await fetch('/api/invitations/'+encodeURIComponent(invitationId)+'/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:guestToken})});
  if(!r.ok)return;
  const d=await r.json();
  if(d&&d.name)guestName=d.name;
 }catch{/* a greeting is a delight, never a blocker */}
}
function mountGreeting(){
 if(!guestName||document.getElementById('ew-greeting'))return false;
 if(!document.body||!document.body.children.length)return false;
 const s=document.createElement('section');
 s.id='ew-greeting';
 s.style.cssText='background:#f7ecd9;padding:44px 20px 8px;text-align:center;';
 s.innerHTML='<p class="ew-dear" data-en="Dear" style="margin:0;font:600 12px/1.4 system-ui,sans-serif;letter-spacing:.3em;color:#9a7b2d;text-transform:uppercase">Dear</p>'
  +'<h2 style="margin:6px 0 4px;font:italic 600 36px/1.2 Georgia,serif;color:#571c24">'+guestName.replace(/[<>&"]/g,'')+'</h2>'
  +'<p class="ew-dear-line" data-en="You are lovingly invited — this invitation was made specially for you." style="margin:0 auto;max-width:520px;font:15px/1.6 Georgia,serif;color:#6b5138">You are lovingly invited — this invitation was made specially for you.</p>';
 document.body.insertBefore(s,document.body.firstChild);
 return true;
}
fetchGuest();

const HI={'Tap to Reveal':'खोलने के लिए छुएँ','Open Invitation':'निमंत्रण खोलें','Will You Celebrate With Us?':'क्या आप हमारे साथ जश्न मनाएँगे?','Please RSVP and let us know your presence — it will mean a lot to us!':'कृपया RSVP करके अपनी उपस्थिति बताएँ — यह हमारे लिए बहुत मायने रखेगा!','Your Name *':'आपका नाम','Enter your name':'अपना नाम लिखें','Phone Number *':'फ़ोन नंबर','10-digit mobile number':'10 अंकों का मोबाइल नंबर','Number of Guests *':'मेहमानों की संख्या','Food Preference':'खाने की पसंद','Veg':'शाकाहारी','Non-Veg':'मांसाहारी','Both':'दोनों','Your Message / Blessings':'आपका संदेश / आशीर्वाद','🎵 Song Request (optional)':'🎵 गाने की फ़रमाइश (वैकल्पिक)','CONFIRM RSVP':'RSVP की पुष्टि करें','Review your reply':'अपना जवाब देखें','SEND IN WHATSAPP':'WhatsApp पर भेजें','SEND IN EMAIL':'ईमेल से भेजें','CLOSE':'बंद करें','Close':'बंद करें','Our Invitation Film':'हमारी निमंत्रण फ़िल्म','A little film, just for you':'सिर्फ़ आपके लिए एक छोटी-सी फ़िल्म','Dear':'प्यारे','You are lovingly invited — this invitation was made specially for you.':'आपको सादर आमंत्रित किया जाता है — यह निमंत्रण ख़ास आपके लिए बनाया गया है।','Haldi':'हल्दी','Mehendi':'मेहंदी','Wedding':'विवाह','Reception':'रिसेप्शन','Sangeet':'संगीत','Our Story':'हमारी कहानी','Our Moments':'हमारी यादें','Wedding Festivities':'विवाह उत्सव','Wedding Timeline':'कार्यक्रम क्रम','Celebration Details':'उत्सव का विवरण','Share the Joy':'खुशियाँ बाँटें','Thank You!':'धन्यवाद!','Send Your Blessings via UPI (Sagun)':'UPI (सगुन) से आशीर्वाद भेजें','DETAILS':'विवरण','SAVE DATE':'तारीख़ याद रखें','MAP':'नक्शा','OPEN IN GOOGLE MAPS':'Google Maps में खोलें','CALL':'कॉल करें','DIRECTIONS':'रास्ता देखें','SHARE LOCATION':'जगह साझा करें','REPLAY INVITATION':'निमंत्रण फिर देखें','The Wedding':'विवाह समारोह','Which events will you attend?':'आप किन कार्यक्रमों में आएँगे?','Send Your Blessings':'अपना आशीर्वाद भेजें','For being a part of our beginning':'हमारी शुरुआत का हिस्सा बनने के लिए','How We Met':'हम कैसे मिले','Growing Together':'साथ बढ़ते हुए','Forever Begins':'हमेशा की शुरुआत','Haldi Ceremony':'हल्दी समारोह','Mehendi Ceremony':'मेहंदी समारोह'};
const HI_MONTHS={'January':'जनवरी','February':'फ़रवरी','March':'मार्च','April':'अप्रैल','May':'मई','June':'जून','July':'जुलाई','August':'अगस्त','September':'सितंबर','October':'अक्टूबर','November':'नवंबर','December':'दिसंबर','JANUARY':'जनवरी','FEBRUARY':'फ़रवरी','MARCH':'मार्च','APRIL':'अप्रैल','MAY':'मई','JUNE':'जून','JULY':'जुलाई','AUGUST':'अगस्त','SEPTEMBER':'सितंबर','OCTOBER':'अक्टूबर','NOVEMBER':'नवंबर','DECEMBER':'दिसंबर'};
let hindiOn=false;
function normKey(s){return s.toLowerCase().replace(/\s+/g,' ').replace(/\s*\*+\s*$/,'').trim();}
const HI_NORM={};
for(const [k,v] of Object.entries(HI))HI_NORM[normKey(k)]=v;
function translateDom(){
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const nodes=[];
 while(walker.nextNode())nodes.push(walker.currentNode);
 for(const n of nodes){
  const raw=n.nodeValue;if(!raw)continue;
  const t=raw.trim();if(!t)continue;
  const hit=HI_NORM[normKey(t)];
  if(hit){n.nodeValue=raw.replace(t,hit+(/\*\s*$/.test(t)&&!/\*\s*$/.test(hit)?' *':''));continue;}
  for(const [en,hi] of Object.entries(HI_MONTHS)){if(t.includes(en)){n.nodeValue=raw.replace(en,hi);break;}}
 }
 for(const el of document.querySelectorAll('[placeholder]')){
  const p=el.getAttribute('placeholder');if(!p)continue;
  const hit=HI_NORM[normKey(p)];if(hit)el.setAttribute('placeholder',hit);
 }
}
function mountLangToggle(){
 if(window.self!==window.top)return true;
 if(!config||!(config.languages||[]).includes('hi')||document.getElementById('ew-lang-toggle'))return false;
 if(!document.body)return false;
 const b=document.createElement('button');
 b.id='ew-lang-toggle';b.type='button';b.textContent='हिंदी में देखें';
 b.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9999;background:#571c24;color:#f7ead2;border:1px solid #c9a24b;border-radius:999px;padding:9px 16px;font:600 13px system-ui,sans-serif;box-shadow:0 8px 24px rgba(87,28,36,.35);cursor:pointer';
 b.addEventListener('click',()=>{
  hindiOn=!hindiOn;
  if(hindiOn){translateDom();b.textContent='View in English';}
  else location.reload();
 });
 document.body.append(b);
 return true;
}
let greetDone=false,langDone=false,translateQueued=false;
function queueTranslate(){
 if(!hindiOn||translateQueued)return;translateQueued=true;
 requestAnimationFrame(()=>{translateQueued=false;if(hindiOn)translateDom();});
}
function hideEmbeddedChrome(){
 if(window.self===window.top)return;
 for(const el of document.querySelectorAll('button,a,[role="button"],div,span')){
  const t=(el.textContent||'').trim();
  if((t==='Pause motion'||t==='Resume motion'||t==='Reduced motion')&&el.querySelectorAll('*').length<=3){
   (el.closest('button,a,[role="button"]')||el).style.display='none';
  }
 }
}
const observer2=new MutationObserver(()=>{
 hideEmbeddedChrome();
 if(!greetDone)greetDone=mountGreeting();
 if(!langDone)langDone=mountLangToggle();
 queueTranslate();
});
observer2.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
addEventListener('scroll',queueTranslate,{passive:true});
