/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Public homepage interactions; the existing auth implementation is preserved. */
(function(){
  'use strict';
  var $=function(s){return document.querySelector(s);};
  if(window.lucide)window.lucide.createIcons();
  var dialog=$('#auth-dialog'),login=$('#auth-login-form'),register=$('#auth-register-form');
  var tabLogin=$('#tab-login'),tabRegister=$('#tab-register');
  function setTab(mode){var isLogin=mode!=='register';login.hidden=!isLogin;register.hidden=isLogin;tabLogin.setAttribute('aria-selected',isLogin);tabRegister.setAttribute('aria-selected',!isLogin);tabLogin.tabIndex=isLogin?0:-1;tabRegister.tabIndex=isLogin?-1:0;$('#auth-title').textContent=isLogin?'Welcome back':'Begin your story';dialog.querySelectorAll('.auth-error').forEach(function(p){p.hidden=true;});}
  function closeNav(){var nav=$('#site-links'),toggle=$('.nav-toggle');nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');}
  function openDialog(target){document.querySelectorAll('dialog[open]').forEach(function(d){d.close();});closeNav();target.showModal();}
  document.addEventListener('click',function(e){var el=e.target.closest('[data-auth],[data-dialog],[data-close-dialog]');if(!el)return;if(el.hasAttribute('data-auth')){setTab(el.dataset.auth);openDialog(dialog);(login.hidden?register:login).querySelector('input').focus();}else if(el.dataset.dialog){openDialog($('#'+el.dataset.dialog));}else el.closest('dialog').close();});
  tabLogin.addEventListener('click',function(){setTab('login');});tabRegister.addEventListener('click',function(){setTab('register');});
  document.querySelector('.auth-tabs').addEventListener('keydown',function(e){if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();var useLogin=e.key==='Home'||(e.key!=='End'&&tabLogin.getAttribute('aria-selected')!=='true');setTab(useLogin?'login':'register');(useLogin?tabLogin:tabRegister).focus();});
  $('#auth-close').addEventListener('click',function(){dialog.close();});
  document.querySelectorAll('dialog').forEach(function(d){d.addEventListener('click',function(e){if(e.target!==d)return;var r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});});
  /* ?auth=login|register opens the dialog; ?next=/studio.html… returns the buyer there after signing in (same-site paths only). */
  var params=new URLSearchParams(location.search),nextRaw=params.get('next')||'',next=/^\/(?!\/)[A-Za-z0-9._~!$&'()*+,;=:@%\/?-]*$/.test(nextRaw)&&nextRaw.indexOf('\\')<0?nextRaw:'/index.html';
  if(params.get('auth')==='login'||params.get('auth')==='register'){setTab(params.get('auth'));openDialog(dialog);}
  function fail(form,message){var p=form.querySelector('.auth-error');p.textContent=message;p.hidden=false;}
  login.addEventListener('submit',async function(e){e.preventDefault();try{await window.EWAuth.signIn(login.elements.email.value,login.elements.password.value);location.href=next;}catch(err){fail(login,err.message);}});
  register.addEventListener('submit',async function(e){e.preventDefault();try{await window.EWAuth.signUp(register.elements.name.value,register.elements.email.value,register.elements.password.value);location.href=next;}catch(err){fail(register,err.message);}});
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

})();
