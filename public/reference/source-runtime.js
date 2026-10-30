import {readConfig,encodeConfig,rsvpDestination,isSamplePreview,withSample} from '../config.js';
import {resolveSong} from '../audio-upload.js';
import {withTimeout} from '../safe-wait.js';
import {invitationModel} from '../reference-model.js';
import {referenceDesignFor,referenceMotionFor} from '../reference-designs.js';
import {installReferenceDesign} from '../reference-theme-motion.js';

const root=document.querySelector('#reference-root');
/* Rendering never waits on audio, photos, IndexedDB or the network for longer than this. */
const AUDIO_WAIT_MS=2500,SAFETY_MS=6000;
/* Safety net: low-end phones and Android WebViews must never be left on a blurred or half-drawn screen. */
const lite=/; wv\)/.test(navigator.userAgent||'')||new URLSearchParams(location.search).has('lite');
const safetyStyle=document.createElement('style');safetyStyle.id='ew-safety-style';
safetyStyle.textContent='html.ew-lite *,html.ew-lite *::before,html.ew-lite *::after,html.ew-force-visible *,html.ew-force-visible *::before,html.ew-force-visible *::after{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}html.ew-force-visible #reference-root{opacity:1!important;visibility:visible!important;filter:none!important}';
document.head.append(safetyStyle);
if(lite)document.documentElement.classList.add('ew-lite');
setTimeout(()=>{
 document.documentElement.classList.add('ew-force-visible');
 if(root&&root.dataset.loading!=='ready'){const waiting=root.querySelector('.invitation-loading');if(waiting&&!waiting.querySelector('button')){const again=document.createElement('button');again.type='button';again.textContent='Reload';again.onclick=()=>location.reload();waiting.replaceChildren('Still preparing your invitation… ',again);}}
},SAFETY_MS);
let config=readConfig(location);
/* A public preview (a visitor looking at a design before buying) shows a finished sample: sample couple, sample photographs and the preview music the owner chose in the admin console.
   A real invitation (#card=…, ?id=…, ?to=…) is never touched. */
if(isSamplePreview(location)&&!new URLSearchParams(location.search).has('id')&&!new URLSearchParams(location.search).has('to')){
 config=withSample(config,location.href);
 try{const info=await withTimeout(fetch('/api/site-info',{credentials:'omit'}).then(r=>r.json()),AUDIO_WAIT_MS,null);if(info?.previewMusic?.url)config={...config,audioUrl:new URL(info.previewMusic.url,location.href).href,music:true};}catch{}
}
const seed=await fetch('./source-data.json').then(r=>{if(!r.ok)throw Error('Invitation data unavailable');return r.json()});
/* A preview that carries no invitation of its own (direct design previews,
   feature previews) shows that design's own sample couple — its names, dates,
   story, events and gallery — loaded from the demo library. Real invitations
   (an id, a guest token, or a saved reference of their own) are never touched. */
{const q0=new URLSearchParams(location.search);
if(!q0.has('id')&&!q0.has('to')&&!config.reference){
 try{const demos=await fetch('./demos.json').then(r=>r.ok?r.json():null);const demo=demos?.[config.theme];
 if(demo)config={...config,...demo.flat,reference:demo.reference};}catch{}}}
const design=referenceDesignFor(config.theme),params=new URLSearchParams(location.search);
const model=invitationModel(config,seed,new URL('../invite',location.href),params.get('id'));
let audio=config.audioUrl;
if(audio.startsWith('local-audio:')){try{audio=(await withTimeout(resolveSong(audio),AUDIO_WAIT_MS,{url:''})).url||'';}catch{audio='';}}
model.site.music={aartiUrl:'',weddingUrl:'',universalUrl:audio,universalEnabled:config.music&&!!audio,universalVolume:.55,universalFadeIn:2,universalFadeOut:1,universalTrimStart:0,universalTrimEnd:0};
window.__easyWedding={...model,config,design,motion:referenceMotionFor(design),musicEnabled:config.music&&!!audio};
document.body.dataset.ganeshIcon=config.ganeshIcon;
document.body.dataset.sourceInvitation='true';
if(design.premium)document.body.dataset.premium='true';
else installReferenceDesign(design);
document.querySelector('#__SITE_CONFIG__').textContent=JSON.stringify(model.site);
document.title=config.partner1+' & '+config.partner2+' · '+design.name;

function reviewReply(path,data){
 const destination=rsvpDestination(config);
 if(!destination)return new Response(JSON.stringify({error:'The couple has not added an RSVP contact yet.'}),{status:400});
 const events=(data.events||[]).map(id=>model.wedding.events.find(e=>e.id===id)?.name||id).join(', ');
 const body=path==='/api/rsvp'?`Wedding RSVP — ${config.partner1} & ${config.partner2}\nName: ${data.name}\nPhone: ${data.phone}\nGuests: ${data.guests}\nEvents: ${events}\nFood: ${data.foodPref}\nBlessings: ${data.message||''}\nSong: ${data.songRequest||''}`:`Wedding blessings — ${config.partner1} & ${config.partner2}\nFrom: ${data.name}\n${data.message}`;
 const href=config.rsvpMethod==='email'?`mailto:${destination}?subject=Wedding%20reply&body=${encodeURIComponent(body)}`:`https://wa.me/${destination}?text=${encodeURIComponent(body)}`;
 let dialog=document.querySelector('#reply-review');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='reply-review';dialog.setAttribute('aria-labelledby','reply-title');document.body.append(dialog);}
 dialog.replaceChildren();
 const heading=document.createElement('h2');heading.id='reply-title';heading.textContent='Review your reply';
 const message=document.createElement('p');message.className='reply-message';message.textContent=body;
 const help=document.createElement('p');help.textContent='Send this reply to the couple to complete your response.';
 const link=document.createElement('a');link.className='btn-royal';link.href=href;link.target='_blank';link.rel='noopener';link.textContent='Send in '+(config.rsvpMethod==='email'?'email':'WhatsApp');
 const close=document.createElement('button');close.className='btn-royal-outline';close.type='button';close.textContent='Close';close.onclick=()=>dialog.close();
 dialog.append(heading,message,help,link,close);dialog.showModal();
 return new Response(JSON.stringify({reviewReady:true}),{headers:{'Content-Type':'application/json'}});
}
const nativeFetch=window.fetch.bind(window);
window.fetch=async(input,options={})=>{
 const url=new URL(typeof input==='string'?input:input.url,location.href);
 if(url.origin===location.origin){
  if(url.pathname==='/api/wedding')return new Response(JSON.stringify(model.wedding),{headers:{'Content-Type':'application/json'}});
  if(['/api/rsvp','/api/blessings'].includes(url.pathname)){
   if((options.method||'GET').toUpperCase()==='GET')return new Response('[]',{headers:{'Content-Type':'application/json'}});
   return reviewReply(url.pathname,JSON.parse(options.body||'{}'));
  }
 }
 return nativeFetch(input,options);
};

// Load the compiled TSX source only after its personalized data exists.
await new Promise((resolve,reject)=>{
 const script=document.createElement('script');script.src='./source-app.js';
 const done=()=>{clearTimeout(timeout);resolve();};
 const fail=()=>{clearTimeout(timeout);window.removeEventListener('wedding:mounted',done);reject(Error('Invitation components unavailable'));};
 const timeout=setTimeout(fail,15000);
 window.addEventListener('wedding:mounted',done,{once:true});
 script.onerror=fail;document.head.append(script);
});
root.dataset.loading='ready';
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent)return;
 if(event.data?.type==='wedcanvas:config'&&JSON.stringify(event.data.config)!==JSON.stringify(config)){
  location.hash='card='+encodeConfig(event.data.config);location.reload();
 }
 if(event.data?.type==='wedcanvas:replay')window.dispatchEvent(new Event('wedding:replay'));
 /* A late open request (autoplay) must never throw a visitor who has already scrolled back to the cover. */
 if(event.data?.type==='wedcanvas:open'&&window.scrollY<=24)window.dispatchEvent(new Event('wedding:open'));
});
parent.postMessage({type:'wedcanvas:ready'},location.origin);
