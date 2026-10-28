/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Public homepage interactions; the existing auth implementation is preserved. */
(function(){
  'use strict';
  var $=function(s){return document.querySelector(s);};
  if(window.lucide)window.lucide.createIcons();
  function closeNav(){var nav=$('#site-links'),toggle=$('.nav-toggle');nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');}
  function openDialog(target){document.querySelectorAll('dialog[open]').forEach(function(d){d.close();});closeNav();target.showModal();}
  document.addEventListener('click',function(e){var el=e.target.closest('[data-dialog],[data-close-dialog]');if(!el)return;if(el.dataset.dialog){openDialog($('#'+el.dataset.dialog));}else el.closest('dialog').close();});
  document.querySelectorAll('dialog').forEach(function(d){d.addEventListener('click',function(e){if(e.target!==d)return;var r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});});
  /* Old popup addresses still work: ?auth=login[&next=/studio…] goes to /login (next kept only when it is a same-site path), ?auth=register to /register. */
  var params=new URLSearchParams(location.search),nextRaw=params.get('next')||'',next=/^\/(?!\/)[A-Za-z0-9._~!$&'()*+,;=:@%\/?-]*$/.test(nextRaw)&&nextRaw.indexOf('\\')<0?nextRaw:'';
  if(params.get('auth')==='register'){location.replace('/register');}
  else if(params.get('auth')==='login'){location.replace('/login'+(next?'?next='+encodeURIComponent(next):''));}
  try{if(window.EWAuth&&window.EWAuth.session())document.body.classList.add('is-signed-in');}catch(e){}
  if(window.EWAuth&&window.EWAuth.refresh)window.EWAuth.refresh().then(function(u){document.body.classList.toggle('is-signed-in',!!u);}).catch(function(){});
  $('.nav-toggle').addEventListener('click',function(){var open=$('#site-links').classList.toggle('open');this.setAttribute('aria-expanded',open);this.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
  $('#site-links').addEventListener('click',function(e){if(e.target.closest('a,button'))closeNav();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeNav();});
  document.addEventListener('click',function(e){if(!e.target.closest('.site-nav'))closeNav();});
  // Reveal content once as it enters the viewport; keep a visible no-JS fallback.
  var reduced=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var enhanced=window.EWHomeMotion&&window.EWHomeMotion.start();
  if(!document.body.classList.contains('royal-ui')&&!enhanced&&!reduced&&typeof window.IntersectionObserver==='function'){
    var revealObserver=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}});},{threshold:.08,rootMargin:'0px 0px -30px 0px'});
    document.querySelectorAll('[data-reveal]').forEach(function(el){revealObserver.observe(el);});
    document.body.classList.add('motion-ready');
    document.addEventListener('focusin',function(e){var el=e.target.closest('[data-reveal]');if(el){el.classList.add('is-visible');revealObserver.unobserve(el);}});
  }
  var progress=$('#page-progress'),framePending=false;
  function updateProgress(){framePending=false;var range=document.documentElement.scrollHeight-window.innerHeight;progress.value=range>0?Math.min(100,Math.max(0,window.scrollY/range*100)):0;}
  window.addEventListener('scroll',function(){if(!framePending){framePending=true;requestAnimationFrame(updateProgress);}},{passive:true});
  window.addEventListener('resize',updateProgress);updateProgress();
  if(typeof window.IntersectionObserver==='function'){
    var sectionObserver=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;document.querySelectorAll('#site-links a').forEach(function(link){if(link.getAttribute('href')==='#'+entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});});},{rootMargin:'-25% 0px -50% 0px',threshold:0});
    document.querySelectorAll('#top,#features,#how,#studio,.dash-band,#love,.final-cta').forEach(function(section){sectionObserver.observe(section);});
  }
  document.addEventListener('click',function(e){var b=e.target.closest('[data-signout]');if(!b)return;e.preventDefault();if(window.EWAuth)window.EWAuth.signOut();});

  /* One scroll animation for every in-page link: eased, ~0.7s, identical in every browser (instant when the visitor prefers reduced motion). */
  var glideFrame=0;
  function glideTo(y){
    var from=window.pageYOffset,dist=y-from;if(window.cancelAnimationFrame)cancelAnimationFrame(glideFrame);
    if(!dist)return;
    if(!window.requestAnimationFrame||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){window.scrollTo({top:y,behavior:'instant'});return;}
    var start=null,dur=Math.min(900,Math.max(450,Math.abs(dist)*0.35));
    function step(t){if(start===null)start=t;var k=Math.min(1,(t-start)/dur),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;window.scrollTo({top:from+dist*e,behavior:'instant'});if(k<1)glideFrame=requestAnimationFrame(step);}
    glideFrame=requestAnimationFrame(step);
    var stop=function(){if(window.cancelAnimationFrame)cancelAnimationFrame(glideFrame);};window.addEventListener('wheel',stop,{passive:true,once:true});window.addEventListener('touchstart',stop,{passive:true,once:true});
  }
  /* In-page links (#top, #pricing…) scroll smoothly and keep the address bar clean: easywedding.in, never easywedding.in/#top. */
  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest('a[href^="#"]');if(!a)return;
    var id=a.getAttribute('href').slice(1),target=id&&id!=='top'?document.getElementById(id):null;
    if(id&&id!=='top'&&!target)return;
    e.preventDefault();
    var L=window.__ewLenis,pad=parseInt(getComputedStyle(document.documentElement).scrollPaddingTop,10)||0;
    if(L){L.scrollTo(target||0,{offset:target?-pad:0});}
    else{glideTo(target?Math.max(0,Math.round(target.getBoundingClientRect().top+window.pageYOffset-pad)):0);}
    try{if(location.hash||location.search.indexOf('auth=')>=0)history.replaceState(null,'',location.pathname);}catch(err){}
  });
  if(location.hash){try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}}

  /* Dialogs scroll on their own: while one is open the page's smooth-scroll engine steps aside so the wheel reaches the dialog and its preview. */
  document.querySelectorAll('dialog').forEach(function(d){d.setAttribute('data-lenis-prevent','');});
  new MutationObserver(function(){var L=window.__ewLenis;if(!L)return;if(document.querySelector('dialog[open]'))L.stop();else L.start();}).observe(document.documentElement,{attributes:true,attributeFilter:['open'],subtree:true});

})();
