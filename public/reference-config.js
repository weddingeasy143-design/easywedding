/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
import {referenceFields,referenceDefaults} from './reference-fields.js';
export function getReferencePath(object,path){return path.split('.').reduce((o,k)=>o?.[k],object)}
export function setReferencePath(object,path,value){const keys=path.split('.');let o=object;for(const k of keys.slice(0,-1)){if(!o[k])o[k]={};o=o[k]}o[keys.at(-1)]=value}
export function validReferenceDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:[+-]\d{2}:\d{2}|Z)?$/.test(value)||!Number.isFinite(Date.parse(value)))return false;
 try{return new Date(value.slice(0,10)+'T12:00:00Z').toISOString().slice(0,10)===value.slice(0,10)}catch{return false}
}
export function syncReferenceWedding(previous,data,reference){
 const wedding=reference.events.find(e=>e.id==='wedding');if(!wedding)return;
 if(data.date!==previous.date||data.time!==previous.time||data.timezone!==previous.timezone){
  const shift=Date.parse(data.date+'T12:00:00Z')-Date.parse(previous.date+'T12:00:00Z');
  if(Number.isFinite(shift)&&shift)for(const e of reference.events){if(e===wedding||!validReferenceDate(e.dateISO))continue;const day=new Date(Date.parse(e.dateISO.slice(0,10)+'T12:00:00Z')+shift).toISOString().slice(0,10);e.dateISO=day+e.dateISO.slice(10)}
  const iso=data.date+'T'+data.time+':00'+data.timezone;if(validReferenceDate(iso))wedding.dateISO=iso;
 }else if(validReferenceDate(wedding.dateISO)){
  data.date=wedding.dateISO.slice(0,10);data.time=wedding.dateISO.slice(11,16);data.timezone=wedding.dateISO.endsWith('Z')?'+00:00':wedding.dateISO.match(/[+-]\d{2}:\d{2}$/)?.[0]||'+05:30';
 }
}
export function refreshReferenceDates(reference){
 for(const e of reference.events){const d=new Date(e.dateISO);e.dateLabel=d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'});e.timeLabel=d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata'});}
 return reference;
}
export function normalizeReference(value,safeImage){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const result=JSON.parse(JSON.stringify(referenceDefaults));
 for(const field of referenceFields){const eventField=field.path.match(/^events\.(\d+)\.(.+)$/);const savedEvent=eventField&&Array.isArray(value.events)?value.events.find(e=>e?.id===referenceDefaults.events[Number(eventField[1])]?.id):null;const input=eventField&&Array.isArray(value.events)&&value.events.some(e=>e?.id)?savedEvent?.[eventField[2]]:getReferencePath(value,field.path);if(typeof input!=='string')continue;
  let v=input.trim();
  if(field.path==='copy.text21'&&v==='॥ श्री गणेशाय नमः ॥')v='Shree Ganeshaya Namah';
  if(field.path==='content.venueMapUrl'){try{const u=new URL(v);v=u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{v=''}}
  if(field.path==='contactPhone'&&!/^\+?[\d\s().-]{7,25}$/.test(v))v='';
  if(field.kind==='image')v=/^\/(?:reference\/assets|photos|ornaments|sagun|share|opening)\/[A-Za-z0-9._-]+$/.test(v)?v:safeImage(v);
  else if(field.kind==='select'){if(!field.options?.includes(v))continue;}
  else if(field.kind==='datetime'){if(!validReferenceDate(v))continue;if(!/(Z|[+-]\d{2}:\d{2})$/.test(v))v+=(/T\d{2}:\d{2}$/.test(v)?':00':'')+'+05:30'}
  else v=v.slice(0,1500);
  setReferencePath(result,field.path,v);
 }
 return refreshReferenceDates(result);
}
