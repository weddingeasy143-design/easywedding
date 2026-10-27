/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Shared, progressive scroll motion. Dynamic SPA/editor cards are registered too. */
(function(){
 'use strict';
 var body=document.body;
 if(!body||!body.classList.contains('royal-ui'))return;
 var media=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
 var preference=false;
 try{preference=localStorage.getItem('easy-wedding:motion-paused')==='true';}catch(e){}
 var records=new Map(),chapters=new Set(),frame=0,scanFrame=0,disposed=false;
 var selector=body.classList.contains('royal-home')?
  '[data-reveal],.homepage-template,.studio-points li,.dashboard-metrics>span,.dashboard-panels>span,.final-cta>div,.final-cta>.button,.site-footer>div':
  '.page-heading,.panel,.stat,.event-card,.cine-card,.cine-band,.quick-card,.wardrobe-image,.filter-bar,.editor-intro,.theme-fieldset,.theme-card,.editor-section,.section-fields>label,.section-fields>.field-row,.photo-upload,.collection-intro,.world,.collection-footer';
 if(body.classList.contains('premium-home'))selector='';
 var toggle=document.createElement('button');toggle.type='button';toggle.className='royal-motion-toggle';if(window.self===window.top)body.append(toggle);
 function paused(){return preference||media.matches;}
 function finish(record){record.animation?.cancel();record.animation=null;record.element.classList.add('is-visible');}
 function sync(){
  var stopped=paused();body.classList.toggle('royal-motion-paused',stopped);body.classList.toggle('royal-page-hidden',document.hidden);
  toggle.textContent=media.matches?'Reduced motion':stopped?'Resume motion':'Pause motion';toggle.setAttribute('aria-pressed',String(stopped));toggle.disabled=media.matches;
  toggle.title=media.matches?'Your system reduced-motion setting is enabled':'Pause or resume decorative animations';
  records.forEach(function(record){if(stopped)finish(record);else if(record.animation){if(document.hidden||!record.visible)record.animation.pause();else record.animation.play();}});
  if(window.EWHomeMotion?.setPaused)window.EWHomeMotion.setPaused(stopped);
  if(window.EWCinematic?.setPaused)window.EWCinematic.setPaused(stopped);
  window.dispatchEvent(new CustomEvent('easy-wedding:motion',{detail:{paused:stopped}}));
 }
 toggle.addEventListener('click',function(){preference=!preference;try{localStorage.setItem('easy-wedding:motion-paused',String(preference));}catch(e){}sync();});
 function enter(record,index){
  if(record.seen)return;
  record.seen=true;record.element.classList.add('is-visible');
  if(paused()||typeof record.element.animate!=='function')return;
  var compact=record.element.matches('.section-fields>label,.section-fields>.field-row,.studio-points li');
  var offset=compact?10:26;
  record.animation=record.element.animate([
   {opacity:0,transform:'translate3d(0,'+offset+'px,0) scale('+(compact?1:.985)+')'},
   {opacity:1,transform:'translate3d(0,0,0) scale(1)'}
  ],{duration:compact?400:650,delay:Math.min(index*65,260),easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
  var animation=record.animation;
  animation.onfinish=function(){if(record.animation===animation){animation.cancel();record.animation=null;}};
  if(document.hidden)animation.pause();
 }
 var observer=typeof IntersectionObserver==='function'?new IntersectionObserver(function(entries){
  var index=0;
  entries.forEach(function(entry){
   var record=records.get(entry.target);
   if(record){record.visible=entry.isIntersecting;if(record.visible)enter(record,index++);if(record.animation){if(document.hidden||!record.visible)record.animation.pause();else record.animation.play();}}
   else if(entry.target.classList.contains('royal-chapter')){if(entry.isIntersecting)chapters.add(entry.target);else chapters.delete(entry.target);}
  });queueScroll();
 },{threshold:.06,rootMargin:'0px 0px -12px 0px'}):null;
 function scan(){
  scanFrame=0;if(disposed)return;
  records.forEach(function(record,element){if(!element.isConnected){finish(record);observer?.unobserve(element);records.delete(element);}});
  (selector?body.querySelectorAll(selector):[]).forEach(function(element){
   if(records.has(element)||element.closest('dialog')||element.hidden)return;
   var record={element:element,seen:false,visible:!observer,animation:null};records.set(element,record);
   element.dataset.royalMotion='reveal';
   if(observer)observer.observe(element);else enter(record,0);
  });
 }
 function refresh(){if(!scanFrame&&!disposed)scanFrame=requestAnimationFrame(scan);}
 function scroll(){
  frame=0;if(disposed||paused()||document.hidden)return;
  chapters.forEach(function(section){var r=section.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
   var progress=Math.max(-1,Math.min(1,(innerHeight*.5-r.top)/(innerHeight+r.height)));
   section.style.setProperty('--royal-scroll-shift',(progress*34).toFixed(1)+'px');
   section.style.setProperty('--royal-scroll-turn',(progress*12).toFixed(1)+'deg');
  });
 }
 function queueScroll(){if(!frame&&!paused()&&!document.hidden)frame=requestAnimationFrame(scroll);}
 if(body.classList.contains('royal-home')&&!body.classList.contains('premium-home'))body.querySelectorAll('main>section:not(#top),.planning-stories>section').forEach(function(section){
  section.classList.add('royal-chapter');
  var art=document.createElement('div');art.className='royal-scroll-ornament';art.setAttribute('aria-hidden','true');
  art.innerHTML='<svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="132"/><circle cx="150" cy="150" r="112"/><path d="M150 0V300M0 150H300M44 44L256 256M44 256L256 44"/>'+Array.from({length:8},function(_,i){return '<path transform="rotate('+i*45+' 150 150)" d="M150 32C166 72 173 91 150 120C127 91 134 72 150 32Z"/>';}).join('')+'</svg>';
  section.append(art);observer?.observe(section);
 });
 var mutations=typeof MutationObserver==='function'?new MutationObserver(refresh):null;
 mutations?.observe(body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
 function focus(event){records.forEach(function(record){if(record.element.contains(event.target)){record.seen=true;finish(record);}});}
 function visibility(){sync();queueScroll();}
 function preferenceChanged(){sync();refresh();}
 document.addEventListener('focusin',focus);document.addEventListener('visibilitychange',visibility);
 media.addEventListener?.('change',preferenceChanged);window.addEventListener('scroll',queueScroll,{passive:true});window.addEventListener('resize',queueScroll,{passive:true});
 window.EWRoyalMotion={paused:paused,refresh:refresh,destroy:function(){disposed=true;cancelAnimationFrame(frame);cancelAnimationFrame(scanFrame);observer?.disconnect();mutations?.disconnect();records.forEach(finish);records.clear();chapters.clear();toggle.remove();document.removeEventListener('focusin',focus);document.removeEventListener('visibilitychange',visibility);media.removeEventListener?.('change',preferenceChanged);window.removeEventListener('scroll',queueScroll);window.removeEventListener('resize',queueScroll);}};
 sync();scan();
})();
