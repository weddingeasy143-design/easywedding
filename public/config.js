/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
import {normalizeReference} from './reference-config.js';
import {validVideoUrl} from './video-embed.js';
import {eventPreset as legacyPreset,eventThemes as legacyThemes} from './event-themes.js';
import {weddingThemes as eventThemes,weddingPreset as eventPreset,ganeshOptions} from './wedding-themes.js';
export const DEFAULTS = Object.freeze({
  reference:null,version:3,theme:'premium-original',partner1:'Rupesh',partner2:'Usha',partner1Details:'',partner2Details:'',groomName:'Rupesh',brideName:'Usha',groomDetails:'',brideDetails:'',groomAddress:'',brideAddress:'',hostSide:'groom',occasion:'The wedding celebration of',date:'2027-02-14',time:'19:00',timezone:'+05:30',city:'Udaipur, Rajasthan',
  blessing:'A love that grows.\nA lifetime that blooms.',message:'Together with our families, we invite you to share in the joy of our wedding. Join us for an evening of love, laughter and a beautiful new beginning.',
  families:'With the blessings of our families',venue:'The Lake Pichola Palace',address:'Lake Palace Road',venueNote:'Please arrive 15 minutes before the ceremony.',dressCode:'Garden formal. Soft colours, flowing silhouettes and your happiest smile.',gifts:'Your love and blessings are the greatest gift of all.',note:'',
  rsvpContact:'',rsvpMethod:'whatsapp',rsvpDeadline:'2027-01-31',photoUrl:'',groomPhoto:'',bridePhoto:'',venuePhotoUrl:'',audioUrl:'',audioName:'',videoUrl:'',languages:[],ganeshIcon:'gold',music:true,scratch:true,preEvents:'',transport:'',accommodation:'',gallery:[],
  events:[...eventPreset('premium-original').events,{time:'21:30',title:'Family blessings & farewell',description:'With love, we begin our new journey.'}]
});
const limit=(value,fallback,max=300)=>typeof value==='string'?value.trim().slice(0,max):fallback;
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;}
export function validTime(s){return /^([01]\d|2[0-3]):[0-5]\d$/.test(s||'');}
export function safeImageUrl(value){try{if(typeof value!=='string')return '';if(value.length<=180000&&/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value))return value;if(value.length>2000)return '';if(/^\/api\/invitation-photos\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value))return value;const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}}
export function safeAudioUrl(value){if(typeof value!=='string'||value.length>2000)return '';if(/^(?:local-audio:|\/api\/invitation-audio\/)[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value))return value;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function normalizeConfig(value={}){
  const c={...DEFAULTS,events:DEFAULTS.events.map(e=>({...e}))};
  for(const [key,max] of Object.entries({partner1:35,partner2:35,partner1Details:220,partner2Details:220,occasion:80,city:100,blessing:180,message:800,families:300,venue:120,address:350,groomAddress:350,brideAddress:350,venueNote:350,dressCode:350,gifts:350,note:500,rsvpContact:120,preEvents:1500,transport:500,accommodation:500}))c[key]=limit(value[key],c[key],max);
  c.theme=Object.hasOwn(eventThemes,value.theme)?value.theme:'royal-prestige';c.gallery=Array.isArray(value.gallery)?value.gallery.slice(0,12).map(safeImageUrl).filter(Boolean):[];c.languages=Array.isArray(value.languages)?value.languages.filter(x=>x==='hi'):[];
  c.hostSide=value.hostSide==='bride'?'bride':'groom';
  const gIn=limit(value.groomName,'',35),bIn=limit(value.brideName,'',35);
  /* A name the customer typed is theirs — even when it happens to match a
     sample name. Only an empty name falls back to the partner fields. */
  c.groomName=gIn||((c.hostSide==='bride'?c.partner2:c.partner1)||DEFAULTS.groomName);
  c.brideName=bIn||((c.hostSide==='bride'?c.partner1:c.partner2)||DEFAULTS.brideName);
  c.groomDetails=limit(value.groomDetails,c.partner1Details,220);c.brideDetails=limit(value.brideDetails,c.partner2Details,220);
  if(c.hostSide==='bride'){c.partner1=c.brideName;c.partner2=c.groomName;c.partner1Details=c.brideDetails;c.partner2Details=c.groomDetails;}
  else{c.partner1=c.groomName;c.partner2=c.brideName;c.partner1Details=c.groomDetails;c.partner2Details=c.brideDetails;}
  c.partner1 ||= DEFAULTS.partner1;c.partner2 ||= DEFAULTS.partner2;c.date=validDate(value.date)?value.date:DEFAULTS.date;c.time=validTime(value.time)?value.time:DEFAULTS.time;c.timezone=/^[+-](0\d|1[0-4]):(00|15|30|45)$/.test(value.timezone||'')?value.timezone:DEFAULTS.timezone;
  c.rsvpDeadline=validDate(value.rsvpDeadline)?value.rsvpDeadline:'';c.rsvpMethod=value.rsvpMethod==='email'?'email':'whatsapp';c.photoUrl=safeImageUrl(value.photoUrl);c.groomPhoto=safeImageUrl(value.groomPhoto);c.bridePhoto=safeImageUrl(value.bridePhoto);c.venuePhotoUrl=safeImageUrl(value.venuePhotoUrl);c.audioUrl=safeAudioUrl(value.audioUrl);c.audioName=limit(value.audioName,'',120);c.videoUrl=validVideoUrl(value.videoUrl)?String(value.videoUrl).trim().slice(0,300):'';
  // Earlier drafts shipped with an empty Ganesh slot. Upgrade that default;
  // an explicit choice in the current editor still survives copied links.
  c.ganeshIcon=value.ganeshIcon==='none'&&value.version!==3?'gold':Object.hasOwn(ganeshOptions,value.ganeshIcon)?value.ganeshIcon:DEFAULTS.ganeshIcon;
  c.music=value.music!==false;c.scratch=value.scratch!==false;
  c.reference=normalizeReference(value.reference,safeImageUrl);
  if(Array.isArray(value.events))c.events=value.events.slice(0,10).filter(e=>e&&typeof e==='object'&&validTime(e.time)&&typeof e.title==='string'&&e.title.trim()).map(e=>({time:e.time,title:limit(e.title,'',70),description:limit(e.description,'',150)}));if(Object.hasOwn(legacyThemes,value.theme)){const previous=legacyPreset(value.theme),wedding=eventPreset(value.theme);for(const key of ['occasion','blessing','message'])if(c[key]===previous[key])c[key]=wedding[key];if(JSON.stringify(c.events)===JSON.stringify(previous.events))c.events=wedding.events.map(e=>({...e}));}return c;
}
export function encodeConfig(c){const bytes=new TextEncoder().encode(JSON.stringify(normalizeConfig(c)));let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function decodeConfig(encoded){if(!encoded||encoded.length>6500000)throw new Error('Invalid invitation data');const bin=atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bin,c=>c.charCodeAt(0))));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid invitation data');return normalizeConfig(value);}
export function readConfig(location){const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('card'))return decodeConfig(hash.get('card'));const p=new URLSearchParams(location.search);if(p.has('bride')||p.has('groom'))return normalizeConfig({...DEFAULTS,partner1:p.get('groom')||DEFAULTS.partner1,partner2:p.get('bride')||DEFAULTS.partner2,date:p.get('date')||DEFAULTS.date,venue:p.get('venue')||DEFAULTS.venue,time:p.get('time')||DEFAULTS.time,theme:p.get('template')||'garden'});return normalizeConfig({...DEFAULTS,...eventPreset(p.get('template')||DEFAULTS.theme)});}
export function invitationUrl(c,base){const url=new URL('invite',base);url.search='';url.hash='card='+encodeConfig(c);return url.href;}
export function eventTimestamp(c){return new Date(`${c.date}T${c.time}:00${c.timezone}`).getTime();}
export function dateParts(c){const d=new Date(c.date+'T12:00:00Z');return {day:String(d.getUTCDate()).padStart(2,'0'),month:d.toLocaleString('en-GB',{month:'short',timeZone:'UTC'}),year:String(d.getUTCFullYear()),short:c.date.split('-').reverse().join(' · '),long:d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})};}
export function formatTime(t){const [h,m]=t.split(':').map(Number);return `${h%12||12}${m?':'+String(m).padStart(2,'0'):''} ${h>=12?'PM':'AM'}`;}
export function countdownParts(timestamp,now=Date.now()){const seconds=Math.max(0,Math.floor((timestamp-now)/1000));return {days:Math.floor(seconds/86400),hours:Math.floor(seconds%86400/3600),minutes:Math.floor(seconds%3600/60),seconds:seconds%60};}
export function mapsUrl(c){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([c.venue,c.address,c.city].filter(Boolean).join(', '));}
export function rsvpDestination(c){if(c.rsvpMethod==='email')return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.rsvpContact)?c.rsvpContact:'';const phone=c.rsvpContact.replace(/[\s()+.-]/g,'');return /^[1-9]\d{6,14}$/.test(phone)?phone:'';}
export function rsvpUrl(c,{name,attendance,guests,message,song}){const destination=rsvpDestination(c);if(!destination)return '';const body=`Wedding RSVP — ${c.partner1} & ${c.partner2}\nDate: ${dateParts(c).long}\nName: ${name}\nReply: ${attendance}\nGuests: ${attendance==='Regretfully declines'?'0':guests}${message?'\nNote: '+message:''}${song?'\nSong request: '+song:''}`;return c.rsvpMethod==='email'?`mailto:${destination}?subject=${encodeURIComponent(`Wedding RSVP: ${name}`)}&body=${encodeURIComponent(body)}`:`https://wa.me/${destination}?text=${encodeURIComponent(body)}`;}
const icsEscape=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
export function calendarFile(c){const start=eventTimestamp(c);const stamp=t=>new Date(t).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Easy Wedding//Garden Invitation//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${c.date}-${encodeURIComponent(c.partner1+'-'+c.partner2)}@wedcanvas`,`DTSTAMP:${stamp(Date.now())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(start+4*3600000)}`,`SUMMARY:${icsEscape(c.partner1+' & '+c.partner2+' — Wedding')}`,`LOCATION:${icsEscape(c.venue+', '+c.address)}`,`DESCRIPTION:${icsEscape(c.message)}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n');}

/* Public previews (a visitor looking at a design before buying) show a finished sample: a sample couple and sample photographs.
   Real invitations never use this — it applies only when the link carries no invitation of its own. */
/* Every design's own sample couple and wedding — mirrors public/demo-configs/. */
const DEMO_FLAT={
 'premium-original':{groom:'Rupesh',bride:'Usha',venue:'The Lake Pichola Palace',address:'Lake Palace Road',city:'Udaipur, Rajasthan',date:'2027-02-14',time:'19:00'},
 'ivory-arch':{groom:'Goutam',bride:'Sweety',venue:'The Garden Pavilion',address:'Palace Road, Civil Lines',city:'Jaipur, Rajasthan',date:'2027-01-23',time:'18:30'},
 'royal-prestige':{groom:'Arjun',bride:'Kavya',venue:'Umaid Heritage Lawns',address:'Circuit House Road',city:'Jodhpur, Rajasthan',date:'2026-11-29',time:'20:00'},
 'garden':{groom:'Rohan',bride:'Sneha',venue:'Green Valley Farms',address:'SP Ring Road',city:'Ahmedabad, Gujarat',date:'2027-03-06',time:'17:30'},
 'haldi':{groom:'Kunal',bride:'Priya',venue:'Gomti Riverfront Lawns',address:'Gomti Nagar',city:'Lucknow, Uttar Pradesh',date:'2026-12-05',time:'10:30'},
 'mehndi':{groom:'Dev',bride:'Ishita',venue:'Chattarpur Greens',address:'Chattarpur',city:'New Delhi, Delhi',date:'2027-01-09',time:'16:00'},
 'sangeet':{groom:'Aditya',bride:'Divya',venue:'Backwater Breeze Resort',address:'Marine Drive',city:'Kochi, Kerala',date:'2027-02-20',time:'19:30'},
 'reception':{groom:'Vikram',bride:'Anjali',venue:'Deccan Pearl Convention',address:'Banjara Hills',city:'Hyderabad, Telangana',date:'2026-12-19',time:'19:00'},
 'midnight-noor':{groom:'Ayaan',bride:'Zara',venue:'Sea Princess Lawns',address:'Juhu Tara Road',city:'Mumbai, Maharashtra',date:'2027-01-16',time:'20:30'},
 'blush-mehraab':{groom:'Kabir',bride:'Simran',venue:'Heritage Haveli',address:'Queens Road',city:'Amritsar, Punjab',date:'2026-11-21',time:'18:00'},
 'emerald-darbar':{groom:'Yash',bride:'Riya',venue:'Ganga Kinare Mahal',address:'Assi Ghat Road',city:'Varanasi, Uttar Pradesh',date:'2027-03-13',time:'18:30'}};
export const SAMPLE_PHOTOS=Object.freeze({photoUrl:'couple.webp',groomPhoto:'groom.webp',bridePhoto:'bride.webp',venuePhotoUrl:'venue.webp',gallery:['couple.webp','groom.webp','bride.webp','venue.webp']});
export function sampleCouple(theme){const d=DEMO_FLAT[theme]||DEMO_FLAT['premium-original'];return {groom:d.groom,bride:d.bride};}
export function isSamplePreview(location){const hash=new URLSearchParams(location.hash.slice(1)),p=new URLSearchParams(location.search);return !hash.has('card')&&!p.has('bride')&&!p.has('groom');}
/* Sample photographs for public previews live in assets/samples/. */
export const SAMPLE_PHOTOS_READY=true;
export function withSample(c,base){const d=DEMO_FLAT[c.theme]||DEMO_FLAT['premium-original'],u=f=>new URL('/assets/samples/'+f,base).href,named={...c,partner1:d.groom,partner2:d.bride,groomName:d.groom,brideName:d.bride,venue:d.venue,address:d.address,city:d.city,date:d.date,time:d.time};if(!SAMPLE_PHOTOS_READY)return named;return {...named,photoUrl:u(SAMPLE_PHOTOS.photoUrl),groomPhoto:u(SAMPLE_PHOTOS.groomPhoto),bridePhoto:u(SAMPLE_PHOTOS.bridePhoto),venuePhotoUrl:u(SAMPLE_PHOTOS.venuePhotoUrl),gallery:SAMPLE_PHOTOS.gallery.map(u)};}
