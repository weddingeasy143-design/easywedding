/* Easy Wedding — privacy-friendly visit beacon + announcement banner. No cookies; a random id stays on this device. */
(()=>{
 const path=location.pathname.replace(/\/+$/,'')||'/';
 if(/^\/(boss|admin)/.test(path))return;
 const safe=(fn,fallback)=>{try{return fn();}catch{return fallback;}};
 const owner=safe(()=>localStorage.getItem('ew_notrack')==='1',false);
 const send=()=>{
  if(owner)return;
  let vid=safe(()=>localStorage.getItem('ew_vid'),'');
  if(!vid){vid=Array.from(crypto.getRandomValues(new Uint8Array(12)),b=>b.toString(36).padStart(2,'0')).join('').slice(0,20);safe(()=>localStorage.setItem('ew_vid',vid));}
  const first=safe(()=>!sessionStorage.getItem('ew_s'),true);safe(()=>sessionStorage.setItem('ew_s','1'));
  const q=new URLSearchParams(location.search);
  const body=JSON.stringify({p:path,r:document.referrer||'',v:vid,s:first?1:0,u:q.get('utm_source')||''});
  if(navigator.sendBeacon&&navigator.sendBeacon('/api/track',new Blob([body],{type:'application/json'})))return;
  fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
 };
 const banner=()=>{
  if(path!=='/')return;
  fetch('/api/site-info').then(r=>r.ok?r.json():null).then(d=>{
   if(d&&d.playStore)document.querySelectorAll('[data-play-store]').forEach(a=>{a.href=d.playStore;a.hidden=false;});
   const text=d&&d.banner&&d.banner.text;if(!text)return;
   if(safe(()=>sessionStorage.getItem('ew_banner_x')===text,false))return;
   const bar=document.createElement('div');bar.className='ew-banner';bar.setAttribute('role','status');
   bar.style.cssText='position:relative;background:#75152e;color:#fff6e0;text-align:center;padding:9px 40px;font:600 14px/1.4 system-ui,sans-serif;z-index:60';
   const span=document.createElement('span');span.textContent=text;
   const x=document.createElement('button');x.type='button';x.textContent='×';x.setAttribute('aria-label','Dismiss announcement');
   x.style.cssText='position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:0;color:inherit;font-size:20px;cursor:pointer;line-height:1';
   x.addEventListener('click',()=>{safe(()=>sessionStorage.setItem('ew_banner_x',text));bar.remove();});
   bar.append(span,x);document.body.prepend(bar);
  }).catch(()=>{});
 };
 const run=()=>{send();banner();};
 if(document.readyState==='complete')run();else addEventListener('load',run,{once:true});
})();
