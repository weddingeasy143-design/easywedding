/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
const CHANNEL='easy-wedding-companion-v1';
export async function referencePhoto(url,name){
 if(typeof url==='string'&&url.length<=180000&&/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(url))return {name:name+'.jpg',data:url};
 const u=new URL(url,location.origin);if(u.origin!==location.origin||!/^\/api\/(assets|invitation-photos)\/[\da-f-]+$/.test(u.pathname))throw Error('Upload your reference photos in Easy Wedding first.');
 const r=await fetch(u.href);if(!r.ok)throw Error('Your reference photo could not be loaded.');const bitmap=await createImageBitmap(await r.blob());
 const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();let quality=.87,data=canvas.toDataURL('image/jpeg',quality);while(data.length>1500000&&quality>.35){quality-=.1;data=canvas.toDataURL('image/jpeg',quality);}if(data.length>1800000)throw Error('Use a smaller reference photo.');return {name:name+'.jpg',data};
}
export function createCreativeBridge({getOwner,receive,onStatus}){
 let ready=false,active=null,receiving=false;const starts=new Map();
 try{active=JSON.parse(sessionStorage.getItem('easy-wedding:creative-job')||'null');}catch{}
 const post=m=>window.postMessage({channel:CHANNEL,source:'site',...m},location.origin);
 function clear(){active=null;sessionStorage.removeItem('easy-wedding:creative-job');}
 window.addEventListener('message',async e=>{
  const m=e.data;if(e.source!==window||e.origin!==location.origin||m?.channel!==CHANNEL||m.source!=='extension')return;
  if(m.type==='READY'){ready=true;onStatus('Companion detected · choose your account');}
  if(m.type==='STARTED'){const start=starts.get(m.id);if(start){starts.delete(m.id);if(m.ok){onStatus('Brief sent · open your creative account in the companion');start.resolve();}else{clear();start.reject(Error(m.error||'The companion could not start.'));}}}
  if(m.type==='CANCELLED'&&m.id===active?.id){clear();onStatus('Job cancelled. Ready for a new brief.');}
  if(m.type!=='RESULT')return;
  if(!active||active.id!==m.id||active.owner!==getOwner()||m.owner!==getOwner()||active.mode!==m.mode||active.provider!==m.provider||Date.now()-active.started>45*60e3){post({type:'ACK',id:m.id,ok:false,error:'This result does not belong to the current wedding session. Start a new job.'});return;}
  if(receiving){post({type:'ACK',id:m.id,ok:false,error:'Already saving this result.'});return;}
  receiving=true;
  try{if(typeof m.data!=='string'||m.data.length>(m.mode==='video'?28000000:11200000)||!(m.mode==='video'?/^data:video\/(mp4|webm);base64,[A-Za-z0-9+/=]+$/:/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/).test(m.data))throw Error('The provider returned an unsupported file.');onStatus('Saving your finished '+m.mode+'…');const blob=await (await fetch(m.data)).blob();await receive({...m,blob});post({type:'ACK',id:m.id,ok:true});clear();onStatus('Result saved in Cards & posters.');}catch(e){post({type:'ACK',id:m.id,ok:false,error:e.message});onStatus(e.message);}finally{receiving=false;}
 });
 return {get ready(){return ready},check(){post({type:'PING'});setTimeout(()=>{if(!ready)onStatus('Companion not detected · install it on desktop and reload');},1200);},async start(job){if(!ready)throw Error('Install the desktop companion, then reload this page.');if(active&&(active.owner!==getOwner()||Date.now()-active.started>45*60e3))clear();if(active||receiving)throw Error('Finish or cancel the current companion job before sending another brief.');active={id:job.id,owner:job.owner,mode:job.mode,provider:job.provider,started:Date.now()};sessionStorage.setItem('easy-wedding:creative-job',JSON.stringify(active));await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{starts.delete(job.id);if(active?.id===job.id)clear();reject(Error('The companion did not respond. Reload and try again.'));},12000);starts.set(job.id,{resolve:()=>{clearTimeout(timer);resolve()},reject:e=>{clearTimeout(timer);reject(e)}});post({type:'START',job});});}};
}
