/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* "Your invitation" card at the top of the dashboard Overview: how complete the invitation is
   (GET /api/invitation-progress), the next things to add, and a way into the Invitation Studio. */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cached=null,shareUrl='';

/* data: the endpoint's answer, or null when there is no invitation yet / it could not load. */
export function progressCardHtml(data,share=''){
 const valid=data&&Number.isFinite(Number(data.percent))&&Array.isArray(data.items);
 if(!valid||Number(data.percent)<=0)return `<p class="eyebrow">YOUR INVITATION</p><h2 class="ip-title">Start your invitation</h2><p class="ip-note">Add your names, date and venue in the Invitation Studio. It takes a few minutes and you can change everything later.</p><div class="ip-actions"><a class="button" href="/studio">Open Invitation Studio</a></div>`;
 const percent=Math.max(0,Math.min(100,Math.round(Number(data.percent)))),complete=!!data.complete&&percent===100;
 const missing=data.items.filter(item=>item&&!item.done).slice(0,3);
 const bar=`<div class="ip-bar" role="progressbar" aria-label="Invitation completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>`;
 const list=missing.length?`<p class="ip-next">Add next for the best result:</p><ul class="ip-missing">${missing.map(item=>`<li><a href="/studio?step=${Math.max(1,Math.min(8,Number(item.step)||1))}">${esc(item.label)}</a></li>`).join('')}</ul>`:'';
 const done=complete?`<p class="ip-success" role="status">${esc(data.message||'Best result! Your invitation is 100% complete. Share it with everyone you love.')}</p>`:'';
 const actions=`<div class="ip-actions"><a class="button" href="/studio">Open Invitation Studio</a>${complete?`<a class="button secondary ip-share" href="${esc(share||'/studio?step=9')}">View / share invitation</a>`:''}</div>`;
 return `<p class="eyebrow">YOUR INVITATION</p><h2 class="ip-title">Your invitation</h2><p class="ip-percent"><strong>${percent}%</strong> complete</p>${bar}${done}${list}${actions}`;
}
function paint(el,data){if(!el||!el.isConnected)return;el.classList.remove('ip-loading');el.classList.toggle('ip-complete',!!(data&&data.complete));el.classList.toggle('ip-start',!(data&&Number(data.percent)>0));el.innerHTML=progressCardHtml(data,shareUrl);}

/* Paints the last answer at once (no flicker on re-render), then asks the server again. */
export async function loadInviteProgress(el,{fetch:fetchImpl=globalThis.fetch,local=false}={}){
 if(!el)return null;
 if(local||typeof fetchImpl!=='function'){paint(el,null);return null;}
 if(cached)paint(el,cached);
 let data=null;
 try{const r=await fetchImpl('/api/invitation-progress',{credentials:'same-origin',cache:'no-store'});if(r.ok)data=await r.json();}catch{data=null;}
 if(data&&data.complete&&!shareUrl){try{const r=await fetchImpl('/api/my-invitations',{credentials:'same-origin'});const d=r.ok?await r.json():null;const first=d&&Array.isArray(d.invitations)?d.invitations[0]:null;if(first&&/^[0-9a-f-]{36}$/.test(first.id))shareUrl='/invite?id='+first.id;}catch{}}
 cached=data;paint(el,data);return data;
}
