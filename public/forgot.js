/* Easy Wedding — forgot password: match email + payment mobile, then set a new password. */
(function(){
  var $=function(s){return document.querySelector(s);};
  var email='',phone='';
  function post(path,body){return fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().catch(function(){return {};}).then(function(d){if(!r.ok)throw new Error(d.error||'Something went wrong. Please try again.');return d;});});}
  $('#fg-check').addEventListener('submit',function(e){
    e.preventDefault();var err=$('#fg-error1'),btn=e.target.querySelector('button');err.textContent='';
    email=$('#fg-email').value.trim().toLowerCase();phone=$('#fg-phone').value.replace(/\D/g,'').slice(-10);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){err.textContent='Please enter a valid email address.';return;}
    if(!/^[6-9]\d{9}$/.test(phone)){err.textContent='Please enter the 10-digit mobile number you used when paying.';return;}
    btn.disabled=true;
    post('/api/auth/forgot',{email:email,phone:phone}).then(function(){$('#fg-who').textContent=email;$('#fg-check').hidden=true;$('#fg-reset').hidden=false;$('#fg-pass').focus();}).catch(function(x){err.textContent=x.message;}).then(function(){btn.disabled=false;});
  });
  $('#fg-reset').addEventListener('submit',function(e){
    e.preventDefault();var err=$('#fg-error2'),btn=e.target.querySelector('button'),a=$('#fg-pass').value,b=$('#fg-pass2').value;err.textContent='';
    if(a.length<8){err.textContent='Choose a password of at least 8 characters.';return;}
    if(a!==b){err.textContent='The two passwords do not match.';return;}
    btn.disabled=true;
    post('/api/auth/reset',{email:email,phone:phone,password:a}).then(function(){$('#fg-reset').hidden=true;$('#fg-done').hidden=false;}).catch(function(x){err.textContent=x.message;}).then(function(){btn.disabled=false;});
  });
})();
