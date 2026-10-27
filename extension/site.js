(()=>{
 if(!['https://wedcanvas-interactive-invitation.mail-amtcentre.chatgpt.site','http://localhost:4173','http://localhost:5173','http://127.0.0.1:4173','http://127.0.0.1:5173'].includes(location.origin))return;
 const channel='easy-wedding-companion-v1',pending=new Map();
 const post=data=>window.postMessage({channel,source:'extension',...data},location.origin);
 window.addEventListener('message',async e=>{
  if(e.source!==window||e.origin!==location.origin||e.data?.channel!==channel||e.data.source!=='site')return;
  const m=e.data;
  if(m.type==='PING'){post({type:'READY',version:'1.0.1'});return;}
  if(m.type==='ACK'){const done=pending.get(m.id);if(done){pending.delete(m.id);done({ok:m.ok===true,error:String(m.error||'Could not save the result.').slice(0,500)});}return;}
  if(m.type==='START'){try{const r=await chrome.runtime.sendMessage({type:'EW_START',job:m.job});post({type:'STARTED',id:m.job?.id,...r});}catch(e){post({type:'STARTED',id:m.job?.id,ok:false,error:'Reload Easy Wedding after installing or updating the extension.'});}}
 });
 chrome.runtime.onMessage.addListener((m,sender,reply)=>{
  if(sender.id!==chrome.runtime.id)return;
  if(m.type==='EW_CANCELLED'){post({type:'CANCELLED',id:m.id});reply({ok:true});return;}
  if(m.type!=='EW_RESULT')return;
  const timer=setTimeout(()=>{pending.delete(m.id);reply({ok:false,error:'Saving timed out. Keep the original wedding tab open and retry.'});},90000);
  pending.set(m.id,r=>{clearTimeout(timer);reply(r);});post({...m,type:'RESULT'});return true;
 });
 post({type:'READY',version:'1.0.1'});
})();
