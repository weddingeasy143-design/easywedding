/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
import {referenceFields,referenceDefaults} from './reference-fields.js';
import {getReferencePath,setReferencePath,refreshReferenceDates} from './reference-config.js';
import {prepareLocalPhoto,compressPhoto,browserOnlySession} from './photo-upload.js';

const uploads=new Map();
export function referenceForConfig(config){
 const value=JSON.parse(JSON.stringify(config.reference||referenceDefaults));
 if(!config.reference){const offset=new Date(config.date+'T12:00:00Z')-new Date('2026-11-26T12:00:00Z');for(const e of value.events){const d=new Date(new Date(e.dateISO).getTime()+offset);const date=d.toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});const time=d.toLocaleTimeString('en-GB',{hour12:false,hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'});e.dateISO=date+'T'+time+':00+05:30'}const wedding=value.events.find(e=>e.id==='wedding');if(wedding)wedding.dateISO=config.date+'T'+config.time+':00'+config.timezone;value.content.invitationMessage=config.message;value.content.quote=config.blessing;}
 return refreshReferenceDates(value);
}
export function renderReferenceEditor(form,config,changed){
 let container=form.querySelector('#reference-editor');if(!container){container=document.createElement('section');container.id='reference-editor';form.append(container)}
 const timeline=form.querySelector('#event-editor')?.closest('details');if(timeline)timeline.hidden=true;for(const key of ['partner1Details','partner2Details','occasion','families','preEvents','dressCode','gifts','transport','accommodation','note','gallery','scratch','rsvpDeadline','venueNote']){const field=form.elements.namedItem(key);if(field)field.closest('label').hidden=true;}
 for(const key of uploads.keys())uploads.set(key,uploads.get(key)+1);container.replaceChildren();const data=referenceForConfig(config);let group='',section;
 for(const field of referenceFields){
  if(group!==field.group){group=field.group;const detail=document.createElement('details');detail.className='editor-section';const summary=document.createElement('summary');const title=document.createElement('span');title.textContent=group;summary.append(title);section=document.createElement('div');section.className='section-fields';detail.append(summary,section);container.append(detail)}
  const label=document.createElement('label');label.append(field.label);const input=document.createElement(field.kind==='select'?'select':field.kind==='image'||field.kind==='datetime'?'input':'textarea');input.dataset.referencePath=field.path;if(field.kind==='select')for(const value of field.options){const option=document.createElement('option');option.value=value;option.textContent=value==='contain'?'Show whole photo':'Fill frame';input.append(option);}input.value=getReferencePath(data,field.path)||'';
  if(input.tagName==='TEXTAREA'){input.rows=3;input.maxLength=1500}else if(input.tagName==='INPUT')input.type='text';
  if(field.kind==='datetime')input.placeholder='2026-12-12T18:00:00+05:30';
  label.append(input);section.append(label);
  if(field.kind==='image'){
   const img=document.createElement('img');img.alt=field.label;img.style.cssText='width:100%;height:170px;object-fit:contain;border-radius:10px';img.hidden=!input.value;if(input.value)img.src=input.value;
   const file=document.createElement('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.setAttribute('aria-label','Upload '+field.label.toLowerCase());
   const remove=document.createElement('button');remove.type='button';remove.className='text-button';remove.textContent='Remove '+field.label.toLowerCase();
   const status=document.createElement('span');status.setAttribute('role','status');status.className='helper';
   const upload=document.createElement('div');upload.className='photo-upload';upload.append(img,file,remove,status);section.append(upload);
   const update=()=>{img.hidden=!input.value;if(input.value)img.src=input.value;else img.removeAttribute('src');changed()};
   input.addEventListener('change',update);remove.onclick=()=>{uploads.set(field.path,(uploads.get(field.path)||0)+1);input.value='';status.textContent='Photo removed.';update()};
   file.onchange=async()=>{const selected=file.files?.[0];if(!selected)return;const version=(uploads.get(field.path)||0)+1;uploads.set(field.path,version);file.disabled=true;status.textContent='Uploading photograph…';try{if(!['image/jpeg','image/png','image/webp'].includes(selected.type))throw Error('Choose a JPG, PNG or WebP photograph.');let url;if(browserOnlySession())url=await prepareLocalPhoto(selected,50000);else{const body=new FormData();body.set('file',await compressPhoto(selected));const response=await fetch('/api/invitation-photos',{method:'POST',body});const result=await response.json();if(!response.ok)throw Error(result.error||'Photo upload failed.');url=result.url}if(uploads.get(field.path)!==version)return;input.value=url;status.textContent='Photo uploaded. Preview updated.';update()}catch(e){if(uploads.get(field.path)===version)status.textContent=e.message}finally{file.disabled=false;file.value=''}};
  }
 }
}
export function readReferenceEditor(form,config){const value=referenceForConfig(config);for(const input of form.querySelectorAll('[data-reference-path]'))setReferencePath(value,input.dataset.referencePath,input.value);return value}
