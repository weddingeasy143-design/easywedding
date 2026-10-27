/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
const app=document.getElementById('app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=iso=>{try{return new Date(iso).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}catch{return ''}};
async function api(path,opts){const r=await fetch(path,opts);const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Something went wrong. Please try again.');return d;}
const linkFor=g=>location.origin+'/invite.html?id='+encodeURIComponent(g.invitationId)+'&to='+encodeURIComponent(g.token);

async function main(){
 let session;
 try{session=await (await fetch('/api/session')).json()}catch{session=null}
 if(!session?.user){
  app.innerHTML='<div class="card state">Please sign in first with the account that published your invitation, then open this page again.<br><a class="btn" href="/">Go to Easy Wedding</a></div>';
  return;
 }
 let ent={designs:[]};
 try{ent=await api('/api/entitlements')}catch{}
 const owns=(ent.designs||[]).includes('addon-personal')||(ent.designs||[]).includes('ALL')||ent.admin;
 if(!owns){
  app.innerHTML='<div class="card empty">Personal Invitations is an advanced add-on.<br><span class="note">Unlock it from the studio — section 07 “Advanced add-ons” (free with the All-Designs Pass).</span><br><a class="btn" href="/studio.html">Open the studio</a></div>';
  return;
 }
 let invitations=[];
 try{invitations=(await api('/api/my-invitations')).invitations||[]}catch{}
 if(!invitations.length){
  app.innerHTML='<div class="card empty">Publish your invitation first.<br><span class="note">Personal guest links are made for a published invitation — create your invitation link in the studio, then come back here.</span><br><a class="btn" href="/studio.html">Open the studio</a></div>';
  return;
 }
 let guests=[];
 try{guests=(await api('/api/guests')).guests||[]}catch{}
 const invName=id=>{const inv=invitations.find(i=>i.id===id);return inv?((inv.partner1||'')+' & '+(inv.partner2||'')):'Your invitation';};
 const viewed=guests.filter(g=>g.viewedAt).length,replied=guests.filter(g=>g.rsvpedAt).length;
 let html='<div class="chips"><span class="chip">'+guests.length+' personal links</span><span class="chip">'+viewed+' opened</span><span class="chip">'+replied+' replied</span></div>';
 html+='<section class="card"><h2>Add a guest</h2><p class="meta">Every guest gets their own link, with their name on the invitation.</p><form class="add" id="add-form">'
  +'<label>For invitation<select id="f-invite">'+invitations.map(i=>'<option value="'+esc(i.id)+'">'+esc((i.partner1||'')+' & '+(i.partner2||''))+'</option>').join('')+'</select></label>'
  +'<label>Guest name<input id="f-name" maxlength="80" placeholder="e.g. Rahul Sharma" required></label>'
  +'<label>Guest mobile (optional — for one-tap WhatsApp sharing)<input id="f-phone" inputmode="numeric" maxlength="15" placeholder="10-digit mobile number"></label>'
  +'<button class="btn" type="submit" style="margin-top:2px">Create personal link</button><p class="note" id="f-status" role="status"></p></form></section>';
 const byInvite=new Map();
 for(const g of guests){if(!byInvite.has(g.invitationId))byInvite.set(g.invitationId,[]);byInvite.get(g.invitationId).push(g)}
 for(const [invId,list] of byInvite){
  html+='<section class="card"><h2>'+esc(invName(invId))+'</h2><p class="meta">'+list.length+(list.length===1?' guest':' guests')+'</p><table><thead><tr><th>Guest</th><th>Opened</th><th>Replied</th><th>Share</th><th></th></tr></thead><tbody>';
  for(const g of list){
   const link=linkFor(g);
   const wa=g.phone&&/^\d{10}$/.test(g.phone)?'https://wa.me/91'+g.phone+'?text='+encodeURIComponent('Namaste '+g.name+' ji, you are lovingly invited to our wedding. Your personal invitation: '+link):'';
   html+='<tr><td><strong>'+esc(g.name)+'</strong>'+(g.phone?'<br><span class="note">'+esc(g.phone)+'</span>':'')+'</td>'
    +'<td class="'+(g.viewedAt?'yes':'note')+'">'+(g.viewedAt?('Yes · '+esc(when(g.viewedAt))):'Not yet')+'</td>'
    +'<td class="'+(g.rsvpedAt?'yes':'note')+'">'+(g.rsvpedAt?('Yes · '+esc(when(g.rsvpedAt))):'Not yet')+'</td>'
    +'<td><button type="button" class="mini" data-copy="'+esc(link)+'">Copy link</button>'+(wa?'<a class="mini" target="_blank" rel="noopener" href="'+esc(wa)+'">WhatsApp</a>':'')+'</td>'
    +'<td><button type="button" class="mini" data-del="'+esc(g.id)+'">Remove</button></td></tr>';
  }
  html+='</tbody></table></section>';
 }
 if(!guests.length)html+='<div class="card empty">No personal links yet.<br><span class="note">Add your first guest above — their name appears on their own invitation.</span></div>';
 app.innerHTML=html;
 app.querySelector('#add-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const status=app.querySelector('#f-status');
  const name=app.querySelector('#f-name').value.trim(),phone=app.querySelector('#f-phone').value.replace(/\D/g,''),invitationId=app.querySelector('#f-invite').value;
  if(!name){status.textContent='Please enter the guest\u2019s name.';return;}
  if(phone&&!/^[6-9]\d{9}$/.test(phone)){status.textContent='Please enter a valid 10-digit mobile number, or leave it empty.';return;}
  status.textContent='Creating the link…';
  try{await api('/api/guests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invitationId,name,phone})});main();}
  catch(err){status.textContent=err.message;}
 });
 app.addEventListener('click',async e=>{
  const copy=e.target.closest('[data-copy]');
  if(copy){try{await navigator.clipboard.writeText(copy.dataset.copy);copy.textContent='Copied ✓';setTimeout(()=>{copy.textContent='Copy link';},1600);}catch{prompt('Copy this link:',copy.dataset.copy);}return;}
  const del=e.target.closest('[data-del]');
  if(del){if(!confirm('Remove this guest and their personal link?'))return;del.disabled=true;try{await api('/api/guests',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:del.dataset.del})});main();}catch{del.disabled=false;}}
 });
}
main();
