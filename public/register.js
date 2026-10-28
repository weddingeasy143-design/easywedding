/* Easy Wedding — register: pick a design, add your details, pay. The account is created only after payment succeeds. */
(function(){
  /* A gateway return that the studio started (add-on or publish payment) belongs to the studio's own return handler. */
  var returning=/[?&](order_id|payment)=[^&]/.test(location.search),studioFlag=false;
  try{studioFlag=!!(sessionStorage.getItem('ew_addon_after_pay')||sessionStorage.getItem('ew_publish_after_pay'));}catch(e){}
  if(returning&&studioFlag){location.replace('/studio'+location.search);return;}
  var $=function(s){return document.querySelector(s);};
  var rupees=function(p){return '₹'+Math.round(p/100).toLocaleString('en-IN');};
  var GATEWAY_LABELS={razorpay:'Razorpay · UPI, cards & netbanking',cashfree:'Cashfree · UPI, cards & netbanking',phonepe:'PhonePe · UPI & cards',payu:'PayU · UPI, cards & netbanking'};
  var STEPS=['design','details','pay'];
  var state={design:null,pricing:null,coupon:null,busy:false,user:null};
  var pricingRequest=null;

  function post(path,body,fallback){return fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().catch(function(){return {};}).then(function(d){if(!r.ok)throw new Error(d.error||fallback||'Something went wrong. Please try again.');return d;});});}
  function loadScript(src,global){return new Promise(function(res,rej){if(window[global]){res();return;}var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('The payment window could not be loaded. Please check your connection and try again.'));};document.head.append(s);});}
  function setError(msg){$('#rg-error').textContent=msg||'';}
  function setNotice(msg){var n=$('#rg-notice');n.textContent=msg||'';n.hidden=!msg;return n;}
  function setBusy(on){state.busy=on;$('#rg-pay').disabled=on;}
  function cardName(id){var c=document.querySelector('.rg-card[data-design="'+id+'"] strong');return c?c.textContent:id;}
  function priceRow(id){return state.pricing&&state.pricing.designs.filter(function(d){return d.id===id;})[0]||null;}
  function payAmount(){var row=priceRow(state.design);return state.coupon?state.coupon.final:(row?row.current:null);}

  function showStep(name){
    STEPS.forEach(function(s){$('#step-'+s).hidden=s!==name;});
    [].forEach.call(document.querySelectorAll('#rg-steps li'),function(li){var s=li.getAttribute('data-step'),on=s===name;li.classList.toggle('is-on',on);li.classList.toggle('is-done',STEPS.indexOf(s)<STEPS.indexOf(name));if(on)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
    var top=$('#rg-steps');if(top&&top.scrollIntoView)top.scrollIntoView({block:'start'});
  }

  /* ---- prices and payment options from the server ---- */
  function loadPricing(){
    if(state.pricing)return Promise.resolve(state.pricing);
    if(!pricingRequest)pricingRequest=fetch('/api/pricing').then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(d){if(!d||!Array.isArray(d.designs))throw new Error();state.pricing=d;renderCardPrices();return d;}).catch(function(){pricingRequest=null;throw new Error('Prices could not be loaded. Please check your connection and try again.');});
    return pricingRequest;
  }
  function renderCardPrices(){
    state.pricing.designs.forEach(function(row){
      var price=document.querySelector('.rg-card[data-design="'+row.id+'"] .rg-price');if(!price)return;
      price.textContent='';
      if(row.launchActive&&row.regular>row.current){var s=document.createElement('s');s.textContent=rupees(row.regular);price.append(s,' ');}
      var b=document.createElement('b');b.textContent=rupees(row.current);price.append(b);
    });
  }
  function renderPay(){
    var d=state.pricing,amount=payAmount();
    $('#rg-summary').textContent=cardName(state.design)+(amount!=null?' · '+rupees(amount):'')+' · '+(state.user?state.user.email:$('#rg-email').value.trim());
    $('#rg-pay').textContent=amount!=null?'Pay '+rupees(amount):'Pay';
    var list=$('#rg-gateways'),ready=(d&&d.gateways)||[];
    [].slice.call(list.querySelectorAll('label')).forEach(function(l){l.remove();});
    ready.forEach(function(g,i){var label=document.createElement('label');label.className='rg-gateway';var radio=document.createElement('input');radio.type='radio';radio.name='rg-gateway';radio.value=g;if(i===0)radio.checked=true;var span=document.createElement('span');span.textContent=GATEWAY_LABELS[g]||g;label.append(radio,span);list.append(label);});
    list.hidden=!ready.length;$('#rg-soon').hidden=ready.length>0;$('#rg-pay').hidden=!ready.length;
  }

  /* ---- step 1: pick a design ---- */
  function choose(id){
    state.design=id;state.coupon=null;$('#rg-coupon').value='';$('#rg-coupon-msg').textContent='';
    $('#rg-chosen').textContent=cardName(id);setError('');showStep('details');
    try{$('#rg-name').focus();}catch(e){}
  }
  $('#step-design').addEventListener('click',function(e){var card=e.target.closest&&e.target.closest('.rg-card[data-design]');if(card)choose(card.getAttribute('data-design'));});
  $('#rg-change').addEventListener('click',function(){setError('');showStep('design');});
  $('#rg-back').addEventListener('click',function(){if(state.busy)return;setError('');showStep('details');});

  /* ---- step 2: details ---- */
  function readDetails(){
    var name=$('#rg-name').value.trim(),email=$('#rg-email').value.trim().toLowerCase(),phone=$('#rg-phone').value.replace(/\D/g,''),password=$('#rg-pass').value;
    if(phone.length===12&&phone.indexOf('91')===0)phone=phone.slice(2);else if(phone.length===11&&phone.charAt(0)==='0')phone=phone.slice(1);
    var msg='',me=state.user;
    if(!me&&!name)msg='Please enter your name.';
    else if(!me&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))msg='Please enter a valid email address.';
    else if(!/^[6-9]\d{9}$/.test(phone))msg='Please enter a valid 10-digit mobile number. It should start with 6, 7, 8 or 9.';
    else if(!me&&password.length<8)msg='Choose a password of at least 8 characters.';
    else if(!me&&password.length>72)msg='Please use a password of 72 characters or fewer.';
    else{var typed=$('#rg-coupon').value.trim().toUpperCase();if(typed&&(!state.coupon||state.coupon.code.toUpperCase()!==typed))msg='Please press Apply to use your coupon, or clear the coupon box.';}
    if(msg){setError(msg);return null;}
    return me?{name:me.name||'',email:me.email,phone:phone,password:''}:{name:name,email:email,phone:phone,password:password};
  }
  $('#rg-coupon-apply').addEventListener('click',function(){
    var msg=$('#rg-coupon-msg'),code=$('#rg-coupon').value.trim();
    if(!code){state.coupon=null;msg.textContent='';return;}
    msg.textContent='Checking…';
    var stale=function(){return $('#rg-coupon').value.trim()!==code;};
    post('/api/coupon/check',{code:code,designId:state.design},'This coupon is not valid.').then(function(d){if(stale())return;state.coupon=d;msg.textContent='Coupon '+d.code+' applied — you save '+rupees(d.discount)+'.';}).catch(function(e){if(stale())return;state.coupon=null;msg.textContent=e.message;});
  });
  /* editing the box discards an applied coupon, so the price can never disagree with what is typed */
  $('#rg-coupon').addEventListener('input',function(){state.coupon=null;$('#rg-coupon-msg').textContent='';});
  $('#rg-coupon').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();$('#rg-coupon-apply').click();}});
  $('#rg-form').addEventListener('submit',function(e){
    e.preventDefault();setError('');
    if(!state.design){showStep('design');return;}
    if(!readDetails())return;
    loadPricing().then(function(){renderPay();showStep('pay');}).catch(function(x){setError(x.message);});
  });

  /* ---- step 3: pay ---- */
  function done(){location.replace('/dashboard');}
  function verify(body){return post('/api/checkout/verify',body,'Payment verification failed.');}
  function refreshAuth(){try{return Promise.resolve(window.EWAuth&&window.EWAuth.refresh?window.EWAuth.refresh():null).catch(function(){});}catch(e){return Promise.resolve();}}
  function checkout(d,gateway,withSignup){
    var body={designId:state.design,gateway:gateway,phone:d.phone};
    if(state.coupon)body.coupon=state.coupon.code;
    if(withSignup)body.signup={name:d.name,email:d.email,password:d.password};
    return post('/api/checkout',body,'Payment could not be started.').then(function(data){
      if(data.relogin){
        /* an earlier unpaid account was recognised and signed in: carry on as that account */
        if(!withSignup)throw new Error('Please log in to your account and try again.');
        return refreshAuth().then(function(){return checkout(d,gateway,false);});
      }
      return openGateway(data,d.phone);
    });
  }
  function openGateway(data,phone){
    if(data.gateway==='razorpay'){
      return loadScript('https://checkout.razorpay.com/v1/checkout.js','Razorpay').then(function(){
        var rzp=new window.Razorpay({key:data.key_id,order_id:data.order_id,amount:data.amount,currency:'INR',name:'Easy Wedding',description:'Invitation design',prefill:{contact:phone},theme:{color:'#75152e'},
          handler:function(response){return verify({orderId:data.orderId,paymentId:response.razorpay_payment_id,signature:response.razorpay_signature}).then(done).catch(function(e){setError(e.message);setBusy(false);});},
          modal:{ondismiss:function(){setBusy(false);}}});
        rzp.open();
      });
    }
    if(data.gateway==='cashfree'){
      return loadScript('https://sdk.cashfree.com/js/v3/cashfree.js','Cashfree').then(function(){
        var cf=window.Cashfree({mode:data.mode==='live'?'production':'sandbox'});
        return Promise.resolve(cf.checkout({paymentSessionId:data.payment_session_id,redirectTarget:'_self'})).then(function(res){
          if(res&&res.error){var m=typeof res.error==='string'?res.error:res.error.message;throw new Error(m||'The payment could not be started. Please try again.');}
        });
      });
    }
    if(data.gateway==='phonepe'){location.href=data.redirect_url;return Promise.resolve();}
    if(data.gateway==='payu'){
      var f=document.createElement('form');f.method='POST';f.action=data.action;
      Object.keys(data.fields||{}).forEach(function(k){var i=document.createElement('input');i.type='hidden';i.name=k;i.value=data.fields[k];f.append(i);});
      document.body.append(f);f.submit();return Promise.resolve();
    }
    throw new Error('That payment option is not available right now.');
  }
  $('#rg-pay').addEventListener('click',function(){
    if(state.busy)return;setError('');
    var d=readDetails();if(!d){showStep('details');return;}
    /* this page runs its own return handling: a stale studio flag must not hijack the next return */
    try{sessionStorage.removeItem('ew_addon_after_pay');sessionStorage.removeItem('ew_publish_after_pay');}catch(e){}
    var picked=document.querySelector('#rg-gateways input:checked'),gateway=picked&&picked.value;
    if(!gateway){setError('Please choose how you would like to pay.');return;}
    setBusy(true);
    checkout(d,gateway,!state.user).catch(function(e){setError(e.message);setBusy(false);});
  });

  /* coming back from a gateway (or the browser's back button) must not leave Pay stuck on "busy" */
  window.addEventListener('pageshow',function(e){if(e.persisted)setBusy(false);});

  /* ---- signed-in mode: an account that is already signed in skips the name, email and password ---- */
  function applySignedIn(user){
    if(!user||user.fake||!user.email)return;
    state.user=user;
    var s=$('#rg-signed');s.textContent='Signed in as '+user.email;s.hidden=false;
    [].forEach.call(document.querySelectorAll('.rg-acct'),function(el){el.hidden=true;});
  }
  refreshAuth().then(applySignedIn);

  /* ---- start up ---- */
  var q=new URLSearchParams(location.search),orderId=q.get('order_id'),flag=q.get('payment'),template=q.get('template');
  if(orderId||flag)try{history.replaceState(null,'',location.pathname);}catch(e){}
  loadPricing().catch(function(){});
  if(orderId){
    setNotice('Confirming your payment…');
    verify({orderId:orderId}).then(done).catch(function(e){setNotice('');setError(e.message);});
  }else if(flag==='success'){
    var n=setNotice('Payment received — thank you! ');var a=document.createElement('a');a.href='/login';a.textContent='Log in to open your invitation';n.append(a,'.');
  }else if(flag==='failed'){
    setError('Your payment was not completed. You can pick your design and try again.');
  }else if(template&&/^[a-z0-9-]+$/.test(template)&&document.querySelector('.rg-card[data-design="'+template+'"]')){
    choose(template);
  }
})();
