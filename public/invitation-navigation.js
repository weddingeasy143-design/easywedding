/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Keep section navigation and progress synchronized without a continuous render loop. */
export function attachInvitationNavigation(){
 const header=document.querySelector('#invitation-navigation'),root=document.querySelector('#invitation');if(!header||!root)return;
 const media=matchMedia('(prefers-reduced-motion: reduce)'),links=[...header.querySelectorAll('nav a,.nav-rsvp')];let frame=0;
 const update=()=>{frame=0;if(!document.body.classList.contains('arrived')||document.hidden)return;
  const r=root.getBoundingClientRect(),height=Math.max(1,root.scrollHeight-innerHeight);header.style.setProperty('--reading-progress',String(Math.min(1,Math.max(0,-r.top/height))));
  let current=links.find(a=>!a.hidden);for(const link of links){const section=document.querySelector(link.getAttribute('href'));if(!link.hidden&&section&&!section.hidden&&section.getBoundingClientRect().top<=innerHeight*.38)current=link;}
  for(const link of links){if(link===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}
 };
 const schedule=()=>{if(!frame&&!document.hidden)frame=requestAnimationFrame(update);};
 const click=e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const target=document.querySelector(a.getAttribute('href'));if(!target||target.hidden)return;e.preventDefault();target.scrollIntoView({behavior:media.matches?'instant':'smooth',block:'start'});history.replaceState(null,'',a.getAttribute('href'));};
 header.addEventListener('click',click);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});document.addEventListener('visibilitychange',schedule);
 const observer=new MutationObserver(schedule);observer.observe(document.body,{attributes:true,attributeFilter:['class']});schedule();
 window.addEventListener('pagehide',e=>{if(e.persisted)return;cancelAnimationFrame(frame);observer.disconnect();header.removeEventListener('click',click);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);document.removeEventListener('visibilitychange',schedule);},{once:true});
}
