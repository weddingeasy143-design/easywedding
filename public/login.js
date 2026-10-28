/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. */
/* /login: sign in with email + password, then open the dashboard (or a same-site ?next= path). */
(function(){
  'use strict';
  var $=function(s){return document.querySelector(s);};
  var form=$('#login-form'),errorBox=$('#login-error');
  /* ?next=/studio… returns the customer there after signing in; same-site paths only, anything else is ignored. */
  function safeNext(raw){raw=raw||'';return /^\/(?!\/)[A-Za-z0-9._~!$&'()*+,;=:@%\/?-]*$/.test(raw)&&raw.indexOf('\\')<0?raw:'';}
  function destination(){return safeNext(new URLSearchParams(location.search).get('next'))||'/dashboard';}
  window.EWLogin={safeNext:safeNext,destination:destination};
  function go(){location.replace(destination());}
  function fail(message){errorBox.textContent=message;errorBox.hidden=false;}
  /* Already signed in (the server session is the source of truth): skip the form. */
  if(window.EWAuth&&window.EWAuth.refresh){window.EWAuth.refresh().then(function(user){if(user)go();}).catch(function(){});}
  form.addEventListener('submit',async function(e){
    e.preventDefault();var button=form.querySelector('button[type="submit"]');errorBox.hidden=true;errorBox.textContent='';
    if(!form.elements.email.value.trim()||!form.elements.password.value){fail('Please enter your email and password.');return;}
    button.disabled=true;
    try{await window.EWAuth.signIn(form.elements.email.value,form.elements.password.value);go();}
    catch(err){fail(err&&err.message?err.message:'Unable to sign in. Please try again.');button.disabled=false;}
  });
})();
