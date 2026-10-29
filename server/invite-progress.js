/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* How complete is a couple's invitation? Pure: no storage, no network.
   Used by GET /api/invitation-progress (website dashboard + Android app). Keep the response shape stable:
   {percent, complete, items:[{key,label,done,step}], message}. An item counts only when the couple filled it
   AND it is not the sample text/photo every new invitation starts with. */
import {DEFAULTS,normalizeConfig,validDate} from '../public/config.js';
import {weddingThemes,weddingPreset} from '../public/wedding-themes.js';
import {eventThemes as legacyThemes,eventPreset as legacyPreset} from '../public/event-themes.js';

const clean=v=>typeof v==='string'?v.trim().replace(/\s+/g,' '):'';
/* every sample wording a design can start with: the editor default and each design's preset */
const sampleWords=(()=>{const set={message:new Set(),blessing:new Set(),families:new Set()};
 const add=p=>{for(const key of Object.keys(set))if(p&&typeof p[key]==='string')set[key].add(clean(p[key]));};
 add(DEFAULTS);
 for(const id of Object.keys(weddingThemes)){try{add(weddingPreset(id));}catch{}}
 for(const id of Object.keys(legacyThemes)){try{add(legacyPreset(id));}catch{}}
 return set;})();
const changed=(value,sample)=>{const v=clean(value);return !!v&&v!==clean(sample);};

export const PROGRESS_ITEMS=Object.freeze([
 {key:'names',label:'Couple names',step:1},
 {key:'date',label:'Wedding date',step:2},
 {key:'venue',label:'Venue name',step:2},
 {key:'address',label:'Venue address',step:2},
 {key:'city',label:'City',step:2},
 {key:'couplePhoto',label:'Couple photo',step:3},
 {key:'familyPhotos',label:'Groom and bride photos',step:3},
 {key:'venuePhoto',label:'Venue photo',step:3},
 {key:'song',label:'Wedding song',step:4},
 {key:'words',label:'Your invitation words',step:5},
 {key:'rsvp',label:'RSVP contact',step:7}
]);

function doneMap(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
 let c;try{c=normalizeConfig(raw);}catch{return {};}
 const groom=clean(c.groomName),bride=clean(c.brideName);
 const words=['message','blessing','families'].some(key=>{const v=clean(c[key]);return !!v&&!sampleWords[key].has(v);});
 return {
  names:!!groom&&!!bride&&!(groom===DEFAULTS.groomName&&bride===DEFAULTS.brideName),
  date:validDate(raw.date)&&raw.date!==DEFAULTS.date,
  venue:changed(c.venue,DEFAULTS.venue),
  address:changed(c.address,DEFAULTS.address),
  city:changed(c.city,DEFAULTS.city),
  couplePhoto:!!c.photoUrl,
  familyPhotos:!!c.groomPhoto&&!!c.bridePhoto,
  venuePhoto:!!c.venuePhotoUrl,
  song:!!c.audioUrl,
  words,
  rsvp:!!clean(c.rsvpContact)
 };
}

export function inviteProgress(config){
 const done=doneMap(config);
 const items=PROGRESS_ITEMS.map(item=>({key:item.key,label:item.label,done:done[item.key]===true,step:item.step}));
 const count=items.filter(item=>item.done).length,percent=Math.round(count/items.length*100),complete=count===items.length;
 const missing=items.filter(item=>!item.done).slice(0,2).map(item=>item.label.toLowerCase());
 const message=complete?'Best result! Your invitation is 100% complete. Share it with everyone you love.':`Your invitation is ${percent}% complete. Add ${missing.join(' and ')} for the best result.`;
 return {percent,complete,items,message};
}
