/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Native scrolling with coordinated chapter motion and responsive button feedback. */
(function(){
 'use strict';
 var body=document.body;if(!body?.classList.contains('premium-home'))return;
 var reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 var fine=window.matchMedia?.('(hover: hover) and (pointer: fine)');
 var context=null,sections=new Map(),buttons=new Map(),observer=null,refreshFrame=0,disposed=false;
 function paused(){return !!reduce?.matches||!!window.EWRoyalMotion?.paused();}
 function resetButton(button){button.classList.remove('is-hovered');button.style.removeProperty('--pointer-x');button.style.removeProperty('--pointer-y');button.style.removeProperty('--magnet-x');button.style.removeProperty('--magnet-y');}
 function bindButtons(){
  body.querySelectorAll('.button,.collection-all,.demo-link').forEach(function(button){
   if(buttons.has(button)||button.closest('dialog'))return;
   var label=document.createElement('span');label.className='premium-button__label';
   while(button.firstChild)label.append(button.firstChild);button.append(label);
   var sheen=document.createElement('span');sheen.className='premium-button__sheen';sheen.setAttribute('aria-hidden','true');button.append(sheen);
   button.classList.add('premium-button');
   function enter(event){if(paused()||fine?.matches===false||event.pointerType==='touch')return;button.classList.add('is-hovered');move(event);}
   function move(event){if(!button.classList.contains('is-hovered'))return;var r=button.getBoundingClientRect();if(!r.width||!r.height)return;
    var x=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(event.clientY-r.top)/r.height));
    button.style.setProperty('--pointer-x',x*100+'%');button.style.setProperty('--pointer-y',y*100+'%');
    button.style.setProperty('--magnet-x',((x-.5)*10).toFixed(2)+'px');button.style.setProperty('--magnet-y',((y-.5)*7).toFixed(2)+'px');
   }
   function leave(){resetButton(button);}
   button.addEventListener('pointerenter',enter);button.addEventListener('pointermove',move);button.addEventListener('pointerleave',leave);button.addEventListener('blur',leave);
   buttons.set(button,function(){leave();button.removeEventListener('pointerenter',enter);button.removeEventListener('pointermove',move);button.removeEventListener('pointerleave',leave);button.removeEventListener('blur',leave);});
  });
  buttons.forEach(function(cleanup,button){if(!button.isConnected){cleanup();buttons.delete(button);}});
 }
 function chapter(section,configure){
  if(!section||sections.has(section))return;
  var tl=window.gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:section,start:'top 92%',end:'clamp(top 36%)',scrub:.85,invalidateOnRefresh:true}});
  configure(tl,section);sections.set(section,tl);
 }
 function reveal(tl,targets,vars,position){if(targets.length)tl.from(targets,Object.assign({y:64,opacity:.25,duration:1,stagger:.09},vars),position??0);}
 function scan(){
  refreshFrame=0;if(disposed)return;bindButtons();
  if(!context)return;
  context.add(function(){
   chapter(document.querySelector('#features'),function(tl,s){
    reveal(tl,s.querySelectorAll('.feature-heading'),{y:54});
   });
   chapter(document.querySelector('#how'),function(tl,s){
    reveal(tl,s.querySelectorAll('.how-copy'),{x:-36,y:28});
   });
   document.querySelectorAll('.feature-card,.step-link').forEach(function(card,index){
    chapter(card,function(tl){reveal(tl,[card],{y:80,scale:.94,rotationX:4,opacity:.35,duration:1,delay:(index%3)*.07});});
   });
   chapter(document.querySelector('#studio'),function(tl,s){
    reveal(tl,s.querySelectorAll('.studio-copy,.studio-points li'),{y:50,stagger:.07});
   });
   document.querySelectorAll('.homepage-template').forEach(function(card,index){
    chapter(card,function(tl){reveal(tl,[card],{y:76,rotation:index%2?2:-2,scale:.92,opacity:.4});});
   });
   chapter(document.querySelector('#dashboard'),function(tl,s){
    reveal(tl,s.querySelectorAll('.dash-copy'),{y:52});
    reveal(tl,s.querySelectorAll('.dashboard-image'),{y:96,scale:.9,rotationX:9,opacity:.5},.08);
    reveal(tl,s.querySelectorAll('.dashboard-metrics>span,.dashboard-panels>span'),{y:30,stagger:.06},.3);
   });
   chapter(document.querySelector('#love'),function(tl,s){
    reveal(tl,s.querySelectorAll('h2'),{y:50});
    reveal(tl,s.querySelectorAll('.love-grid article'),{y:80,scale:.95,stagger:.1},.1);
   });
   chapter(document.querySelector('.final-cta'),function(tl,s){
    reveal(tl,s.querySelectorAll(':scope>div'),{y:64,scale:.96});
    var controls=s.querySelectorAll(':scope>.button');if(controls.length)tl.from(controls,{opacity:.25,duration:.8},.12);
   });
   chapter(document.querySelector('.site-footer'),function(tl,s){reveal(tl,s.querySelectorAll(':scope>div'),{y:35,opacity:.45,stagger:.08});});
   sections.forEach(function(tl,section){if(!section.isConnected){tl.scrollTrigger?.kill();tl.revert();sections.delete(section);}});
  });
  window.ScrollTrigger.refresh();
 }
 function requestScan(){if(!refreshFrame&&!disposed)refreshFrame=requestAnimationFrame(scan);}
 function stop(){context?.revert();context=null;sections.clear();body.classList.remove('premium-scroll-ready');buttons.forEach(function(_,button){resetButton(button);});}
 function start(){
  stop();if(disposed||paused()||!window.gsap||!window.ScrollTrigger)return;
  window.gsap.registerPlugin(window.ScrollTrigger);
  context=window.gsap.context(function(){
   var floating=document.querySelector('.hero-floating');
   if(floating)window.gsap.to(floating,{y:95,rotation:4,ease:'none',scrollTrigger:{trigger:'.wedding-hero',start:'top top',end:'bottom top',scrub:1.1}});
   document.querySelectorAll('main>section:not(#top),.planning-stories>section').forEach(function(section){
    var art=section.querySelector('.premium-chapter-art');
    if(!art){art=document.createElement('span');art.className='premium-chapter-art';art.setAttribute('aria-hidden','true');section.append(art);}
    window.gsap.fromTo(art,{y:50,rotation:-12},{y:-65,rotation:18,ease:'none',scrollTrigger:{trigger:section,start:'top bottom',end:'bottom top',scrub:1.3}});
   });
  },body);
  body.classList.add('premium-scroll-ready');scan();
 }
 function focus(event){sections.forEach(function(tl,section){if(section.contains(event.target)){tl.progress(1);tl.scrollTrigger?.kill();tl.kill();}});}
 function visibility(){if(document.hidden)buttons.forEach(function(_,button){resetButton(button);});}
 window.addEventListener('easy-wedding:motion',start);reduce?.addEventListener('change',start);
 document.addEventListener('focusin',focus);document.addEventListener('visibilitychange',visibility);
 observer=new MutationObserver(function(changes){if(changes.some(function(change){return Array.from(change.addedNodes).some(function(node){return node.nodeType===1&&!node.matches('.premium-button__label,.premium-button__sheen,.premium-chapter-art');})||change.removedNodes.length;}))requestScan();});
 bindButtons();start();observer.observe(body,{childList:true,subtree:true});
 document.fonts?.ready.then(function(){if(!disposed&&context)window.ScrollTrigger.refresh();});
 window.EWPremiumHome={refresh:requestScan,destroy:function(){disposed=true;cancelAnimationFrame(refreshFrame);observer.disconnect();stop();buttons.forEach(function(cleanup){cleanup();});buttons.clear();window.removeEventListener('easy-wedding:motion',start);reduce?.removeEventListener('change',start);document.removeEventListener('focusin',focus);document.removeEventListener('visibilitychange',visibility);}};
})();
