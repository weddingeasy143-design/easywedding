/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Hero choreography; shared royal-motion.js owns all scroll reveals. */
(function(){
 'use strict';
 var started=false,played=false,paused=false,context=null,preference=null;
 function update(){
  if(context){context.revert();context=null;}
  document.body.classList.remove('home-motion');
  if(paused||preference?.matches||!window.gsap)return;
  var g=window.gsap,hero=document.querySelector('.wedding-hero');if(!hero)return;
  context=g.context(function(){
   document.body.classList.add('home-motion');
   var svg=hero.querySelector('.motion-orbit');
   if(!svg){svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 400 650');svg.setAttribute('class','motion-orbit');svg.setAttribute('aria-hidden','true');svg.innerHTML='<path d="M30 620V210C30 -30 370 -30 370 210V620"/><path d="M48 620V215C48 0 352 0 352 215V620"/>'+[[38,150],[362,330],[50,490],[320,70],[200,25],[360,550],[90,85]].map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="2"/>';}).join('');hero.append(svg);}
   var introReady=played;
   var idle=g.to('.hero-stationery',{y:-7,rotation:-1,duration:3.2,repeat:-1,yoyo:true,ease:'sine.inOut',paused:true});
   var motes=g.to(svg.querySelectorAll('circle'),{y:-12,opacity:.25,duration:3,stagger:.12,repeat:-1,yoyo:true,ease:'sine.inOut',paused:true});
   function visibility(){var r=hero.getBoundingClientRect(),stop=!introReady||document.hidden||r.bottom<0||r.top>innerHeight;idle.paused(stop);motes.paused(stop);}
   if(!played){
    played=true;
    var tl=g.timeline({defaults:{ease:'power3.out'}});
    tl.from('.cine-hero-bg',{scale:1.055,duration:2.6},0).from('.hero-eyebrow',{y:14,opacity:0,duration:.7},.1)
     .from('.hl-inner',{yPercent:105,opacity:0,duration:1.05,stagger:.14},.15)
     .from('.hero-sub,.hero-cta,.hero-stats,.demo-link',{y:18,opacity:0,stagger:.09,duration:.75},.45)
     .from('.hero-stationery',{y:30,rotation:-6,opacity:0,duration:1.3},.4)
     .from('.hero-mini-rail a',{x:18,opacity:0,stagger:.08,duration:.7},.9);
    svg.querySelectorAll('path').forEach(function(p,i){var length=p.getTotalLength?p.getTotalLength():1200;g.set(p,{strokeDasharray:length,strokeDashoffset:length});tl.to(p,{strokeDashoffset:0,duration:2.1},.5+i*.12);});
    tl.call(function(){introReady=true;visibility();});
   }
   var observer=typeof IntersectionObserver==='function'?new IntersectionObserver(visibility):null;observer?.observe(hero);
   document.addEventListener('visibilitychange',visibility);visibility();
   return function(){observer?.disconnect();document.removeEventListener('visibilitychange',visibility);};
  },hero);
 }
 window.EWHomeMotion={start:function(){if(started)return true;if(!window.gsap)return false;started=true;preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');preference?.addEventListener('change',update);update();return true;},setPaused:function(value){if(paused===value)return;paused=value;if(started)update();}};
})();
