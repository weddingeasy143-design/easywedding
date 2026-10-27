/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
import {animate,stagger,inView} from 'motion';
const preference=()=>matchMedia('(prefers-reduced-motion: reduce)');
const ease=[.16,1,.3,1];let workspaceCleanup=()=>{};
function trackedMotion(){const running=new Set(),elements=new Set();return {run(target,frames,options){const list=target instanceof Element?[target]:Array.from(target);list.forEach(el=>elements.add(el));const handle=animate(target,frames,options);running.add(handle);Promise.resolve(handle.finished).then(()=>running.delete(handle),()=>running.delete(handle));return handle;},reset(){running.forEach(h=>h.stop());running.clear();elements.forEach(el=>{el.style.removeProperty('opacity');el.style.removeProperty('transform');el.style.removeProperty('translate');});elements.clear();}};}
export function animateWorkspace(){workspaceCleanup();const content=document.querySelector('#main-content');if(!content)return;
 const media=preference(),motion=trackedMotion();let stopView=()=>{};
 function start(){stopView();motion.reset();if(media.matches)return;
 const entrance=[...content.querySelectorAll('.page-heading,.cine-hero-copy,.hero-count')];if(entrance.length)motion.run(entrance,{opacity:[0,1],y:[18,0]},{duration:.85,delay:stagger(.1),ease});
 const cards=[...content.querySelectorAll('.stat,.event-card,.template-card,.quick-card,.cine-stat')];if(cards.length)motion.run(cards,{opacity:[0,1],y:[16,0]},{duration:.65,delay:stagger(.035),ease});
 const seen=new WeakSet();stopView=inView(content.querySelectorAll('.panel,.design-stage,[data-reveal]'),el=>{if(seen.has(el))return;seen.add(el);motion.run(el,{opacity:[.35,1],y:[18,0]},{duration:.8,ease});},{amount:.08});
 }
 start();media.addEventListener?.('change',start);workspaceCleanup=()=>{stopView();motion.reset();media.removeEventListener?.('change',start);};
}
export function invitationMotion(){
 if(!document.querySelector('#invitation'))return;
 const media=preference(),motion=trackedMotion();let arrived=document.body.classList.contains('arrived');
 const observer=new MutationObserver(()=>{const next=document.body.classList.contains('arrived');if(next&&!arrived&&!media.matches){const name=document.querySelector('#couple-heading');if(name)motion.run(name,{opacity:[0,1],y:[22,0]},{duration:1.2,ease});}if(!next&&arrived)motion.reset();arrived=next;});observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 const stopView=inView('.couple-photo-wrap,.venue-image-wrap,.timeline li,.paper-card',el=>{if(!media.matches)motion.run(el,{opacity:[.55,1],y:[20,0]},{duration:.9,ease});},{amount:.1});
 let scheduled=false,lastX=0,lastY=0;
 function pointer(event){if(media.matches||document.hidden||document.body.classList.contains('sealed')||!matchMedia('(pointer:fine)').matches)return;lastX=(event.clientX/innerWidth-.5)*12;lastY=(event.clientY/innerHeight-.5)*8;if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;const art=document.querySelector('.hero-light');if(art)art.style.translate=`${lastX}px ${lastY}px`;});}
 function reset(){if(media.matches){motion.reset();const art=document.querySelector('.hero-light');if(art)art.style.removeProperty('translate');}}
 document.addEventListener('pointermove',pointer,{passive:true});media.addEventListener?.('change',reset);
 function dispose(){observer.disconnect();stopView();motion.reset();document.removeEventListener('pointermove',pointer);media.removeEventListener?.('change',reset);}
 window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();},{once:true});
}
