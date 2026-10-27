import {SITE,providers,isSite,isProvider,validateJob,validateResult} from './protocol.js';
const activeTransfers=new Set();
async function getJob(){const {job}=await chrome.storage.session.get('job');if(job&&Date.now()-job.started>45*60e3){await chrome.storage.session.remove('job');return null;}return job;}
const ownPanel=sender=>sender.id===chrome.runtime.id&&sender.url?.startsWith(chrome.runtime.getURL('panel.html'));
async function dispatch(m,sender){
 if(m?.type==='EW_START'){
  if(!isSite(sender.url)||sender.frameId!==0)throw Error('Open the Easy Wedding workspace to start.');
  const input=validateJob(m.job),previous=await getJob();if(previous)throw Error('Finish or cancel the current job in the companion before starting another.');
  const job={...input,siteTab:sender.tab.id,started:Date.now(),providerTab:null};await chrome.storage.session.set({job});
  try{await chrome.windows.create({url:chrome.runtime.getURL('panel.html'),type:'popup',width:430,height:760});}catch(e){await chrome.storage.session.remove('job');throw e;}return {ok:true,id:job.id};
 }
 const job=await getJob();
 if(m?.type==='EW_PANEL'){if(!ownPanel(sender))throw Error('Open the companion panel.');return {ok:true,job:job?{name:job.name,provider:job.provider,mode:job.mode,photos:job.photos.length,started:job.started}:null};}
 if(m?.type==='EW_CANCEL'){if(!ownPanel(sender))throw Error('Open the companion panel.');await chrome.storage.session.remove('job');if(job)await chrome.tabs.sendMessage(job.siteTab,{type:'EW_CANCELLED',id:job.id}).catch(()=>{});return {ok:true};}
 if(!job)throw Error('This job ended. Start again from Easy Wedding.');
 if(m.type==='EW_OPEN'){
  if(!ownPanel(sender))throw Error('Open the companion panel.');
  if(!await chrome.permissions.contains({origins:[providers[job.provider].origin]}))throw Error('Allow access to your selected provider first.');
  if(job.providerTab){try{const tab=await chrome.tabs.get(job.providerTab);if(isProvider(tab.url,job.provider)){await chrome.tabs.update(tab.id,{active:true});await chrome.windows.update(tab.windowId,{focused:true});return {ok:true};}}catch{}}
  const win=await chrome.windows.create({url:providers[job.provider].url,type:'normal',width:960,height:850});job.providerTab=win.tabs[0].id;await chrome.storage.session.set({job});const opened=await chrome.tabs.get(job.providerTab);if(opened?.status==='complete')await chrome.scripting.executeScript({target:{tabId:job.providerTab},files:['provider.js']});return {ok:true};
 }
 if(sender.frameId!==0||sender.tab?.id!==job.providerTab||!isProvider(sender.url,job.provider))throw Error('The result must come from the creative window opened for this job.');
 if(m.type==='EW_JOB')return {ok:true,job:{id:job.id,provider:job.provider,mode:job.mode,prompt:job.prompt,photos:job.photos,name:job.name}};
 if(m.type==='EW_RESULT'){
  if(m.id!==job.id||activeTransfers.has(job.id))throw Error('A transfer is already in progress or this job expired.');
  const data=validateResult(m.data,job.mode);const tab=await chrome.tabs.get(job.siteTab);if(!isSite(tab.url))throw Error('Return to the original Easy Wedding tab.');
  activeTransfers.add(job.id);
  try{const ack=await chrome.tabs.sendMessage(job.siteTab,{type:'EW_RESULT',id:job.id,owner:job.owner,mode:job.mode,provider:job.provider,name:job.name,data});if(!ack?.ok)throw Error(ack?.error||'Keep the original wedding tab open and try again.');await chrome.storage.session.remove('job');await chrome.tabs.update(job.siteTab,{active:true});await chrome.windows.update(tab.windowId,{focused:true});setTimeout(()=>chrome.tabs.remove(job.providerTab).catch(()=>{}),800);return {ok:true};}finally{activeTransfers.delete(job.id);}
 }
 throw Error('Unknown companion request.');
}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{dispatch(m,sender).then(reply).catch(e=>reply({ok:false,error:e.message}));return true;});
chrome.tabs.onUpdated.addListener(async(id,info,tab)=>{if(info.status!=='complete')return;const job=await getJob();if(job?.providerTab===id&&isProvider(tab.url,job.provider)){await chrome.scripting.executeScript({target:{tabId:id},files:['provider.js']}).catch(()=>{});}});
chrome.tabs.onRemoved.addListener(async id=>{const job=await getJob();if(job?.siteTab===id)await chrome.storage.session.remove('job');});
