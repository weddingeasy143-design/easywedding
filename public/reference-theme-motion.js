/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
import {referenceMotionFor,referenceSurfaceColors} from './reference-designs.js';

export function installReferenceDesign(design,doc=document){
 const root=doc.documentElement,body=doc.body,motion=referenceMotionFor(design);
 const [paper,panel,ink,text,muted,gold,goldLight,button,buttonText]=design.palette;
 const surfaces=referenceSurfaceColors(design);
 const vars={'color-ivory':paper,'color-ivory-deep':panel,'color-cream':panel,
  'color-maroon':ink,'color-maroon-deep':ink,'color-wine':ink,'color-bark':text,
  'color-bark-soft':surfaces.mutedText,'color-gold':gold,'color-gold-light':goldLight,'color-gold-deep':surfaces.accentInk,
  'theme-paper':paper,'theme-panel':panel,'theme-ink':ink,'theme-text':text,'theme-muted':surfaces.mutedText,
  'theme-button':button,'theme-button-text':buttonText,'theme-gold':gold,
  'theme-accent-ink':surfaces.accentInk,'theme-scene-shade':surfaces.sceneShade,'theme-on-scene':surfaces.onScene,
  'theme-scene':`url("${design.scene}")`,'theme-frame':design.frame,
  'font-script':design.script==='garden'?"'Wedding Garden Script','Great Vibes',cursive":design.script==='serif'?"'Cormorant Garamond',serif":"'Great Vibes',cursive"};
 for(const [name,value] of Object.entries(vars)){root.style.setProperty('--'+name,value);body.style.setProperty('--'+name,value);}
 root.dataset.invitationDesign=design.id;
 body.dataset.invitationDesign=design.id;body.dataset.nameStyle=design.script;
 body.dataset.motionStyle=design.motion;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)'),records=new Map();
 let pending=0,disposed=false;
 const sync=()=>{for(const {animation,visible} of records.values()){
  if(reduce.matches||body.dataset.motionPaused==='true'||doc.hidden||!visible)animation?.pause();else animation?.play();
 }};
 const observe=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const e of entries){const r=records.get(e.target);if(r)r.visible=e.isIntersecting;}sync();
 },{rootMargin:'100px',threshold:.01}):null;
 const animate=element=>{
  if(records.has(element))return;
  const ganesh=element.classList.contains('theme-ganesh-image');
  const halo=element.classList.contains('theme-ganesh-halo');
  const side=element.classList.contains('theme-floral-right')||element.className.includes('right-')?-1:1;
  const frames=ganesh?[{transform:'translate3d(0,0,0) scale(1)'},{transform:'translate3d(0,-4px,0) scale(1.018)'},{transform:'translate3d(0,0,0) scale(1)'}]:halo?
   [{opacity:.45,transform:'scale(.94)'},{opacity:.75,transform:'scale(1.05)'},{opacity:.45,transform:'scale(.94)'}]:[{transform:'translate3d(0,0,0) rotate(0deg)'},
   {transform:`translate3d(${side*motion.drift}px,${-motion.drift*.55}px,0) rotate(${side*motion.turn}deg)`},
   {transform:`translate3d(${-side*motion.drift*.35}px,${motion.drift*.3}px,0) rotate(${-side*motion.turn*.6}deg)`},
   {transform:'translate3d(0,0,0) rotate(0deg)'}];
  const animation=element.animate?.(frames,{duration:ganesh?6200:halo?4800:motion.floral,iterations:Infinity,easing:'ease-in-out'});
  records.set(element,{animation,visible:!observe});observe?.observe(element);
 };
 const scan=()=>{
  pending=0;if(disposed)return;
  const page=doc.querySelector('main[data-invitation-phase]');
  body.dataset.invitationPhase=page?.dataset.invitationPhase||'opening';
  for(const section of doc.querySelectorAll('main section[id]')){
   if(section.querySelector('.theme-section-art'))continue;
   const art=doc.createElement('div');art.className='theme-section-art';art.setAttribute('aria-hidden','true');
   const image=doc.createElement('img');image.src=design.floral;image.alt='';image.loading='lazy';image.decoding='async';
   image.className='theme-floral theme-floral-bottom '+(section.id.length%2?'theme-floral-right':'');
   art.append(image);section.append(art);
  }
  for(const el of doc.querySelectorAll('.theme-floral,.theme-ganesh-image,.theme-ganesh-halo'))animate(el);
  for(const [el,r] of records)if(!el.isConnected){r.animation?.cancel();observe?.unobserve(el);records.delete(el);}
  sync();
 };
 const queue=()=>{if(!pending&&!disposed)pending=requestAnimationFrame(scan);};
 const mutations=new MutationObserver(queue);
 mutations.observe(doc.querySelector('#reference-root'),{childList:true,subtree:true,attributes:true,attributeFilter:['data-invitation-phase']});
 window.addEventListener('wedding:motion',sync);reduce.addEventListener('change',sync);doc.addEventListener('visibilitychange',sync);queue();
 let scrollFrame=0;
 const onScroll=()=>{if(scrollFrame||reduce.matches||body.dataset.motionPaused==='true'||doc.hidden)return;scrollFrame=requestAnimationFrame(()=>{
  scrollFrame=0;for(const el of doc.querySelectorAll('.theme-section-art')){
   const rect=el.parentElement.getBoundingClientRect();if(rect.bottom<0||rect.top>window.innerHeight)continue;
   const shift=Math.max(-18,Math.min(18,(window.innerHeight*.5-rect.top)*.025));el.style.setProperty('--theme-scroll-shift',shift+'px');
  }
 });};
 window.addEventListener('scroll',onScroll,{passive:true});
 return ()=>{disposed=true;cancelAnimationFrame(pending);cancelAnimationFrame(scrollFrame);mutations.disconnect();observe?.disconnect();
  for(const r of records.values())r.animation?.cancel();records.clear();window.removeEventListener('wedding:motion',sync);reduce.removeEventListener('change',sync);doc.removeEventListener('visibilitychange',sync);window.removeEventListener('scroll',onScroll);};
}
