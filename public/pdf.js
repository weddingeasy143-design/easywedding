/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
const app=document.getElementById('app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=new URLSearchParams(location.search).get('id')||'';
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function prettyDate(iso,time){
 try{
  const d=new Date(String(iso||'')+'T'+(time||'18:00')+':00+05:30');
  if(isNaN(d))return '';
  let h=d.getHours();const m=String(d.getMinutes()).padStart(2,'0');const ap=h>=12?'PM':'AM';h=h%12||12;
  return d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear()+' · '+h+':'+m+' '+ap;
 }catch{return ''}
}
async function main(){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)){
  app.innerHTML='<p class="state">Choose one of your published invitations in the studio (section 07), then open the print card from there.<br><a class="btn" href="/studio">Open the studio</a></p>';
  return;
 }
 let session;
 try{session=await (await fetch('/api/session')).json()}catch{session=null}
 if(!session?.user){
  app.innerHTML='<p class="state">Please sign in first with the account that published this invitation.<br><a class="btn" href="/">Go to Easy Wedding</a></p>';
  return;
 }
 let ent={designs:[]};
 try{ent=await (await fetch('/api/entitlements')).json()}catch{}
 const owns=(ent.designs||[]).includes('addon-pdf')||ent.admin;
 if(!owns){
  app.innerHTML='<p class="state">The Print-ready PDF card is an add-on.<br>Unlock it from the studio — section 07 “Advanced add-ons”.<br><a class="btn" href="/studio">Open the studio</a></p>';
  return;
 }
 let cfg;
 try{const r=await fetch('/api/invitations/'+encodeURIComponent(id));if(!r.ok)throw Error();cfg=await r.json();}catch{
  app.innerHTML='<p class="state">This invitation could not be found.</p>';return;
 }
 const link=location.origin+'/invite?id='+id;
 const events=(cfg.events||[]).slice(0,6).map(e=>'<div><span>'+esc(e.title||'Celebration')+'</span><b>'+esc(e.time||'')+'</b></div>').join('');
 app.innerHTML='<div class="bar"><p>Your print-ready card — print it, or save it as a PDF to share anywhere.</p><button type="button" id="print-btn">Print / Save PDF</button></div>'
  +'<section class="sheet"><div class="om">॥ श्री गणेशाय नमः ॥</div>'
  +'<p class="occasion">'+esc(cfg.occasion||'The wedding celebration of')+'</p>'
  +'<h1 class="names">'+esc(cfg.partner1||'')+' <span class="amp">&amp;</span> '+esc(cfg.partner2||'')+'</h1>'
  +(cfg.blessing?'<p class="blessing">'+esc(cfg.blessing)+'</p>':'')
  +'<p class="when">'+esc(prettyDate(cfg.date,cfg.time))+'</p>'
  +'<p class="venue">'+esc(cfg.venue||'')+(cfg.city?', '+esc(cfg.city):'')+'</p>'
  +(cfg.address?'<p class="addr">'+esc(cfg.address)+'</p>':'')
  +(events?'<div class="events">'+events+'</div>':'')
  +'<div class="qr" id="qr"></div>'
  +'<p class="link">Scan the QR code, or open your invitation here:<br>'+esc(link)+'</p>'
  +'<p class="foot">Easy Wedding · easywedding.in</p></section>';
 app.querySelector('#print-btn').addEventListener('click',()=>window.print());
 try{
  if(window.QRCode){
   const url=await window.QRCode.toDataURL(link,{width:300,margin:1,color:{dark:'#571c24',light:'#fdf8ec'}});
   const img=document.createElement('img');img.src=url;img.alt='QR code for this invitation';
   app.querySelector('#qr').append(img);
  }
 }catch{/* the card still prints beautifully without the QR image */}
}
main();
