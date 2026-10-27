import {referenceDefaults} from '../reference-fields.js';
import {readConfig,encodeConfig,invitationUrl,rsvpDestination} from '../config.js';
import {referenceForConfig} from '../reference-editor.js';
import {resolveSong} from '../audio-upload.js';
import {invitationQRCode} from '../reference-qr.js';
import {currentFactories} from './current-components.js';
import {referenceDesignFor,referenceImageFor,referenceMotionFor} from '../reference-designs.js';
import {installReferenceDesign} from '../reference-theme-motion.js';

document.querySelector('#reference-root').dataset.loading='configuration';
const source=await fetch('./source-data.json').then(r=>r.json());
document.querySelector('#reference-root').dataset.loading='components';
let config=readConfig(location),isEvidence=new URLSearchParams(location.search).get('source')==='1';
const design=referenceDesignFor(config.theme);
if(!isEvidence){document.body.dataset.ganeshIcon=config.ganeshIcon;window.__referenceGaneshEnabled=config.ganeshIcon!=='none';window.__referenceThemeMotion=referenceMotionFor(design);installReferenceDesign(design);}
window.__referenceCredit=isEvidence?' Developed by Chandan Kumar Mahato':' Crafted with Easy Wedding';
const site=structuredClone(source.site),wedding=structuredClone(source.wedding);
if(!isEvidence){
 const r=referenceForConfig(config);
 Object.assign(site.content,r.content||{},{groomName:config.partner1,brideName:config.partner2,weddingDateISO:config.date+'T'+config.time+':00'+config.timezone});
 site.content.invitationMessage=r.content?.invitationMessage||config.message;
 site.content.quote=r.content?.quote||config.blessing;
 site.content.venueNote=config.venueNote;site.content.venueName=config.venue;site.content.venueAddressLines=[config.address,config.city];site.content.venuePin=r.content?.venuePin||'';
 site.content.venuePhoto=config.venuePhotoUrl||site.content.venuePhoto;
 site.content.invitationPhoto=config.photoUrl||site.content.invitationPhoto;
 const savedMap=r.content?.venueMapUrl;site.content.venueMapUrl=(savedMap===source.site.content.venueMapUrl&&config.venue!==source.site.content.venueName?'':savedMap)||('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(config.venue+', '+config.address+', '+config.city));
 Object.assign(site.sagun,r.sagun||{});site.sagun.qr1Image=r.sagun?.qr1Image||'';site.sagun.qr2Image=r.sagun?.qr2Image||'';site.sagun.qr1UpiId=r.sagun?.qr1UpiId||'';site.sagun.qr2UpiId=r.sagun?.qr2UpiId||'';
 site.contactPhone=r.contactPhone||(config.rsvpMethod==='whatsapp'?rsvpDestination(config):'')||'';
 if(r.story)wedding.story=r.story;if(r.events)wedding.events=r.events;if(r.gallery)wedding.gallery=r.gallery;
 if(config.gallery.length&&!r.gallery)wedding.gallery=config.gallery.map((src,i)=>({id:'photo-'+i,src,caption:'Our moment '+(i+1),sortOrder:i,isCover:i===0}));
 site.share.whatsappMessage=r.share?.whatsappMessage||"You're invited to the wedding of {groom} & {bride} on {date}! {link}";
 Object.assign(site.share,r.share||{});const snapshotId=new URLSearchParams(location.search).get('id');const guestUrl=new URL('../invite.html',location.href);if(snapshotId){guestUrl.searchParams.set('id',snapshotId);site.share.shareUrl=guestUrl.href}else site.share.shareUrl=invitationUrl(config,guestUrl);
 let audio=config.audioUrl;if(audio.startsWith('local-audio:')){try{audio=(await resolveSong(audio)).url}catch{audio=''}}
 site.music={aartiUrl:'',weddingUrl:'',universalUrl:audio,universalEnabled:config.music&&!!audio,universalVolume:.55,universalFadeIn:2,universalFadeOut:1,universalTrimStart:0,universalTrimEnd:0};
 for(const e of wedding.events){e.venue=config.venue;e.address=[config.venue,config.address,config.city].join(', ');e.mapUrl=site.content.venueMapUrl;}
}
window.__referenceVenueAddress=isEvidence?'Po+Ps - Pindrajora, Bokaro, Jharkhand, 827013':[config.address,config.city].join(', ');
window.__referenceAllCelebrations=isEvidence?'All celebrations at Keliya Dabar, Bokaro, Jharkhand':'All celebrations at '+[config.venue,config.city].join(', ');
window.__referenceClosingDate=new Date(site.content.weddingDateISO).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Kolkata'}).replaceAll('/',' • ');
window.__referenceMusicEnabled=isEvidence||(config.music&&!!site.music.universalUrl);
window.__referenceCopy={...referenceDefaults.copy,...(config.reference?.copy||{})};
if(isEvidence)window.__referenceCopy.text21='॥ श्री गणेशाय नमः ॥';
document.querySelector('#__SITE_CONFIG__').textContent=JSON.stringify(site);
document.title=site.content.groomName+' & '+site.content.brideName+' · Wedding invitation';
const nativeFetch=window.fetch.bind(window);
window.fetch=async(input,options)=>{
 const url=typeof input==='string'?input:input.url;
 if(url==='/api/wedding')return new Response(JSON.stringify(wedding),{headers:{'Content-Type':'application/json'}});
 if(url==='/api/rsvp'||url==='/api/blessings'){
  const data=JSON.parse(options.body);const destination=rsvpDestination(config);
  if(!destination)return new Response(JSON.stringify({error:'The couple has not added an RSVP contact yet.'}),{status:400,headers:{'Content-Type':'application/json'}});
  const body=url==='/api/rsvp'?`Wedding RSVP — ${config.partner1} & ${config.partner2}\nName: ${data.name}\nPhone: ${data.phone}\nGuests: ${data.guests}\nEvents: ${data.events.join(', ')}\nFood: ${data.foodPref}\nBlessings: ${data.message||''}\nSong: ${data.songRequest||''}`:`Wedding blessings — ${config.partner1} & ${config.partner2}\nFrom: ${data.name}\n${data.message}`;
  const href=config.rsvpMethod==='email'?`mailto:${destination}?subject=Wedding%20reply&body=${encodeURIComponent(body)}`:`https://wa.me/${destination}?text=${encodeURIComponent(body)}`;
  let panel=document.querySelector('#reply-review');if(!panel){panel=document.createElement('dialog');panel.id='reply-review';panel.style.cssText='padding:32px;max-width:500px;width:calc(100% - 40px);border:1px solid #c99a3d;border-radius:20px;background:#fff7e8;color:#4a2c33';document.body.append(panel)}
  panel.replaceChildren();const h=document.createElement('h2');h.textContent='Review your reply';const pre=document.createElement('p');pre.style.whiteSpace='pre-wrap';pre.textContent=body;const link=document.createElement('a');link.className='btn-royal';link.href=href;link.target='_blank';link.rel='noopener';link.textContent='Send in '+(config.rsvpMethod==='email'?'email':'WhatsApp');const close=document.createElement('button');close.className='btn-outline ml-3';close.textContent='Close';close.onclick=()=>panel.close();panel.append(h,pre,link,close);panel.showModal();
  return new Response(JSON.stringify({error:'Your reply is ready in the review window. Send it to complete your RSVP.'}),{status:409,headers:{'Content-Type':'application/json'}});
 }
 return nativeFetch(input,options);
};

// Register the captured source components without its hosting/router runtime.
const modules={},cache={};
self.webpackChunk_N_E={push(value){Object.assign(modules,value[1]);return 0}};
const chunks=await nativeFetch('./chunks.json').then(r=>r.json());
for(const path of chunks){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=path;script.onload=resolve;script.onerror=reject;document.head.append(script)})}
function requireModule(id){if(cache[id])return cache[id].exports;const module={exports:{}};cache[id]=module;if(!modules[id])throw Error('Reference component '+id+' is missing');modules[id](module,module.exports,requireModule);return module.exports}
requireModule.d=(exports,values)=>{for(const key in values)if(!Object.hasOwn(exports,key))Object.defineProperty(exports,key,{enumerable:true,get:values[key]})};
requireModule.r=exports=>{Object.defineProperty(exports,'__esModule',{value:true});Object.defineProperty(exports,Symbol.toStringTag,{value:'Module'})};
requireModule.n=module=>{const getter=module&&module.__esModule?()=>module.default:()=>module;requireModule.d(getter,{a:getter});return getter};
requireModule.o=(o,k)=>Object.hasOwn(o,k);requireModule.g=globalThis;requireModule.nmd=m=>{m.paths=[];if(!m.children)m.children=[];return m};requireModule.p='/reference/';requireModule.O=()=>{};requireModule.e=()=>Promise.resolve();
const React=requireModule(2115);
modules[5239]=(module)=>{const Image=props=>{
 const {fill,priority,quality,unoptimized,placeholder,blurDataURL,onLoadingComplete,...p}=props;
 if(typeof p.src==='object')p.src=p.src.src;if(!p.src)return null;
 const art=isEvidence?{src:p.src,kind:''}:referenceImageFor(p.src,design);
 p.src=art.src;
 const isGanesh=!isEvidence&&p.alt==='Lord Ganesha';
 if(isGanesh){p.src='/assets/wedding/ganesh.png';p.className=(p.className||'')+' theme-ganesh-image';}
 if(art.kind){p.className=(p.className||'')+' theme-'+art.kind;p['data-theme-art']=art.kind;p.alt='';p['aria-hidden']=true;}
 return React.createElement('img',{...p,loading:priority?'eager':p.loading,style:{
  ...(fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{}),...p.style,
  ...(art.kind==='floral'?{WebkitMaskImage:'none',maskImage:'none'}:{}),
  ...(isGanesh?{opacity:config.ganeshIcon==='none'?0:1,filter:config.ganeshIcon==='vermilion'?'sepia(1) saturate(3) hue-rotate(330deg)':config.ganeshIcon==='ivory'?'grayscale(1) brightness(1.3)':'none'}:{})
 }});
};module.exports={__esModule:true,default:Image}};
modules[8973]=module=>{module.exports={rs:site.sagun,II:site.share}};
const originalData=modules[934];modules[934]=(module,exports,req)=>{originalData(module,exports,req);const d=module.exports;module.exports={...d,MG:site.content.weddingDateISO,nH:new Date(site.content.weddingDateISO).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'}),qY:wedding.events,kg:wedding.story,$m:wedding.gallery,kh:{...d.kh,name:site.content.venueName,addressLines:site.content.venueAddressLines,pin:site.content.venuePin||'',full:[site.content.venueName,...site.content.venueAddressLines,site.content.venuePin].filter(Boolean).join(', '),photo:site.content.venuePhoto,mapUrl:site.content.venueMapUrl},z1:{...d.z1,groom:site.content.groomName,bride:site.content.brideName,headline:site.content.headline,invitationMessage:site.content.invitationMessage,quote:site.content.quote,heroPhoto:site.content.heroPhoto,invitationPhoto:site.content.invitationPhoto},Ju:{...d.Ju,...site.content}}};
window.__referenceQRCode=(value,options)=>invitationQRCode(value,options,(text,settings)=>requireModule(2769).toDataURL(text,settings));
// The live source now uses Turbopack. Keep its exact current components and
// motion code, while adapting only image hosting, editable data and delivery.
const currentCache={};
function currentModule(id){
 if(id===71645)return {...React,default:React};
 if(id===43476)return requireModule(5155);
 if(id===47167)return {default:{env:{}}};
 if(id===85437)return {Image:requireModule(5239).default};
 if(id===88705)return {s:site.sagun,t:site.share};
 if(id===73134)return {default:{toDataURL:window.__referenceQRCode},toDataURL:window.__referenceQRCode};
 if(currentCache[id])return currentCache[id];
 const exports={};currentCache[id]=exports;
 const context={i:currentModule,s(values){for(let i=0;i<values.length;){const name=values[i++];if(values[i]===0){i++;exports[name]=values[i++]}else Object.defineProperty(exports,name,{enumerable:true,get:values[i++]})}}};
 if(!currentFactories[id])throw Error('Current reference component '+id+' is missing');
 currentFactories[id](context);
 if(id===38126)Object.assign(exports,{
  J:{...exports.J,groom:site.content.groomName,bride:site.content.brideName,headline:site.content.headline,invitationMessage:site.content.invitationMessage,quote:site.content.quote,heroPhoto:site.content.heroPhoto,invitationPhoto:site.content.invitationPhoto},
  N:site.content.weddingDateISO,Q:new Date(site.content.weddingDateISO).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'}),
  k:wedding.events,j:wedding.story,f:wedding.gallery,i:{...exports.i,...site.content},
  e:{...exports.e,name:site.content.venueName,addressLines:site.content.venueAddressLines,pin:site.content.venuePin||'',full:[site.content.venueName,...site.content.venueAddressLines,site.content.venuePin].filter(Boolean).join(', '),photo:site.content.venuePhoto,mapUrl:site.content.venueMapUrl}
 });
 if(id===89542)exports.y=Object.fromEntries(Object.keys(exports.y).map(key=>[key,'']));
 return exports;
}
const Page=currentModule(52683).default;
requireModule(9248).createRoot(document.querySelector('#reference-root')).render(React.createElement(Page));
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent)return;
 if(event.data?.type==='wedcanvas:config'&&JSON.stringify(event.data.config)!==JSON.stringify(config)){location.hash='card='+encodeConfig(event.data.config);location.reload()}
 if(event.data?.type==='wedcanvas:replay'){const button=[...document.querySelectorAll('button')].find(e=>e.textContent==='Replay Invitation');button?.click()}
 if(event.data?.type==='wedcanvas:open'){const button=document.querySelector('[aria-label="Tap to reveal the invitation"]')||[...document.querySelectorAll('button')].find(e=>e.textContent==='Open Invitation');button?.click()}
});
parent.postMessage({type:'wedcanvas:ready'},location.origin);
