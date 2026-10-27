/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
const app=document.getElementById('app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=iso=>{try{return new Date(iso).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}catch{return ''}};
const attending=r=>!/declin/i.test(r.attendance||'');

async function main(){
 let session;
 try{session=await (await fetch('/api/session')).json()}catch{session=null}
 if(!session?.user){
  app.innerHTML='<div class="card state">Please sign in first with the account that published your invitation, then open this page again.<br><a class="btn" href="/">Go to Easy Wedding</a></div>';
  return;
 }
 let data;
 try{data=await (await fetch('/api/rsvps')).json()}catch{data=null}
 const rows=Array.isArray(data?.rsvps)?data.rsvps:[];
 if(!rows.length){
  app.innerHTML='<div class="card empty">No guest replies yet.<br><span class="note">When a guest replies on your published invitation link, their answer appears here — alongside the WhatsApp or email message they send you.</span></div>';
  return;
 }
 const coming=rows.filter(attending),gone=rows.filter(r=>!attending(r));
 const guestTotal=coming.reduce((sum,r)=>sum+(Number(r.guests)||0),0);
 const byInvite=new Map();
 for(const r of rows){if(!byInvite.has(r.invitationId))byInvite.set(r.invitationId,[]);byInvite.get(r.invitationId).push(r)}
 let html='<div class="chips"><span class="chip">'+rows.length+' replies</span><span class="chip">'+coming.length+' joining · '+guestTotal+' guests</span><span class="chip">'+gone.length+' cannot join</span></div>';
 for(const [,list] of byInvite){
  const first=list[0];
  const title=[first.partner1,first.partner2].filter(Boolean).join(' & ')||'Your invitation';
  html+='<section class="card"><h2>'+esc(title)+'</h2><p class="meta">'+list.length+' '+(list.length===1?'reply':'replies')+'</p><table><thead><tr><th>Guest</th><th>Phone</th><th>Reply</th><th>Guests</th><th>Song request</th><th>Note</th><th>When</th><th></th></tr></thead><tbody>';
  for(const r of list){
   const ok=attending(r);
   html+='<tr><td><strong>'+esc(r.name)+'</strong></td><td>'+esc(r.phone||'—')+'</td><td class="'+(ok?'yes':'no')+'">'+esc(r.attendance)+'</td><td>'+(ok?esc(r.guests??1):'—')+'</td><td>'+esc(r.song||'—')+'</td><td>'+esc(r.message||'—')+'</td><td class="note">'+esc(when(r.createdAt))+'</td><td><button type="button" class="del-rsvp" data-del-rsvp="'+esc(r.id)+'" title="Delete this reply" style="border:1px solid #d8c4b0;background:#fff;border-radius:8px;padding:4px 9px;cursor:pointer">Delete</button></td></tr>';
  }
  html+='</tbody></table></section>';
 }
 app.innerHTML=html;
 app.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-del-rsvp]');if(!btn)return;
  if(!confirm('Delete this reply? This cannot be undone.'))return;
  btn.disabled=true;
  try{const r=await fetch('/api/rsvps',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:btn.dataset.delRsvp})});if(!r.ok)throw Error();btn.closest('tr')?.remove();}catch{btn.disabled=false;}
 });
}
main();
