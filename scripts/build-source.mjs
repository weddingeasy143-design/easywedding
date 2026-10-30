import {build} from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=resolve('.');
const seedBundle=await build({entryPoints:['invitation-source/src/content/wedding.ts'],bundle:true,format:'cjs',platform:'node',write:false});
const seedModule={exports:{}};
new Function('module','exports',seedBundle.outputFiles[0].text)(seedModule,seedModule.exports);
const source=seedModule.exports;
const snapshot=JSON.parse(await readFile('public/reference/source-data.json','utf8'));
const previous=await import(pathToFileURL(resolve('public/reference-fields.js')).href+'?build='+Date.now());
const content={...snapshot.site.content,...source.FAMILY,
 groomName:source.COUPLE.groom,brideName:source.COUPLE.bride,
 headline:source.COUPLE.headline,quote:source.COUPLE.quote,invitationMessage:source.COUPLE.invitationMessage,
 heroPhoto:source.COUPLE.heroPhoto,heroPhotoFit:'cover',invitationPhoto:source.COUPLE.invitationPhoto,invitationPhotoFit:'contain',
 venueName:source.VENUE.name,venueAddressLines:source.VENUE.addressLines,venuePhoto:source.VENUE.photo,
 venuePin:'',venueMapUrl:'',siteTexts:source.SITE_TEXTS};
const defaults={content,story:source.STORY_SEED,events:source.EVENTS,
 gallery:source.GALLERY_SEED.map((photo,index)=>({...photo,id:'gallery-'+index,isCover:index===0,sortOrder:index,focus:'50,50',fit:'contain'})),
 sagun:{...snapshot.site.sagun,qr1Image:'',qr2Image:'',qr1UpiId:'',qr2UpiId:'',
 hindiText:'Your good wishes and blessings are our greatest gift. If you wish, you can also send a digital wedding gift.',
 quoteLeft:'Your blessings make our new beginning even more special.',quoteRight:'Your good wishes bring joy to our life together.',
 bottomLine1:'Send your love and blessings in any way you choose.',bottomLine2:'May your love and blessings always be with us.'},
 share:{...snapshot.site.share,shareUrl:'',whatsappMessage:"You're invited to the wedding of {groom} & {bride} on {date}! {link}"},
 contactPhone:'',copy:{...previous.referenceDefaults.copy,text21:'Shree Ganeshaya Namah'}};
// Fill every original heading, retaining old draft field identities.
const copyDefaults=['A Little','Surprise Awaits...','Something beautiful is about to begin...',"You're Invited",'To Our Wedding Celebration','Our Story','Two Hearts, One Journey','Wedding Festivities','Join Us for Our Special Moments','Wedding Timeline','Every celebration, in order','Our Moments','A few special moments from our journey','Video Section','Our invitation film','Will You Celebrate With Us?','Please RSVP and let us know your presence — it will mean a lot to us!','Celebration Details','Thank You!','For Being a Part of Our Beginning','With Love','Shree Ganeshaya Namah','Tap to Reveal','To the Wedding of','Tap to Begin','Scroll to Explore','Same People','Same Love','Bigger Blessings','Our Family','Home','Where Our','Celebration Begins','Join us as we celebrate love, laughter and new beginnings at our family home.'];
copyDefaults.forEach((value,index)=>{defaults.copy['text'+index]??=value;});
Object.assign(defaults.copy,{text26:'Two Families',text27:'One Celebration',text28:'A Lifetime of Love'});
const fields=[];
const label=key=>key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase());
function add(path,name,kind='text',group='Family & invitation',options){
 const value=path.split('.').reduce((o,k)=>o?.[k],defaults)??'';
 fields.push({path,label:name,kind,group,value,...(options?{options}:{} )});
}
for(const key of ['groomPhoto','bridePhoto','heroPhoto'])add('content.'+key,label(key),'image');
for(const key of ['groomRelationLabel','groomParents','groomAddress','brideRelationLabel','brideParents','brideAddress','headline','quote','invitationMessage','venuePin','venueMapUrl'])add('content.'+key,label(key));
for(const key of ['groomPhotoFit','bridePhotoFit','heroPhotoFit','invitationPhotoFit'])add('content.'+key,label(key),'select','Photo framing',['cover','contain']);
for(const key of ['groomPhotoFocus','bridePhotoFocus'])add('content.'+key,label(key)+' · horizontal, vertical %','text','Photo framing');
defaults.story.forEach((row,i)=>{for(const key of ['title','dateLabel','description','photo'])add(`story.${i}.${key}`,`Story ${i+1} · ${key}`,key==='photo'?'image':'text','Our story · 3 chapters');});
defaults.events.forEach((row,i)=>{for(const key of ['name','tagline','dateISO','description','dressCode','image'])add(`events.${i}.${key}`,`Event ${i+1} · ${key}`,key==='image'?'image':key==='dateISO'?'datetime':'text','Festivities · 4 events');});
defaults.gallery.forEach((row,i)=>{for(const key of ['src','caption'])add(`gallery.${i}.${key}`,`Gallery ${i+1} · ${key==='src'?'photo':key}`,key==='src'?'image':'text','Our moments · 11 photos');});
for(const key of Object.keys(defaults.sagun))if(!['qr1IconsImage','qr2IconsImage'].includes(key))add('sagun.'+key,label(key),['qr1Image','qr2Image'].includes(key)?'image':'text','Blessings & your UPI QR codes');
add('contactPhone','Venue contact number','text','Venue & sharing');
for(const key of ['title','subtitle','scanLabel','whatsappMessage'])add('share.'+key,'Share · '+key,'text','Venue & sharing');
for(const [key,value] of Object.entries(defaults.copy))add('copy.'+key,key==='text21'?'Ganesh invocation':value,'text','All section headings & opening text');
await writeFile('public/reference-fields.js','export const referenceFields='+JSON.stringify(fields)+';\nexport const referenceDefaults='+JSON.stringify(defaults)+';\n');
snapshot.site={...snapshot.site,content:defaults.content,sagun:defaults.sagun,share:defaults.share,contactPhone:''};
snapshot.wedding={...snapshot.wedding,story:defaults.story,events:defaults.events,gallery:defaults.gallery};
await writeFile('public/reference/source-data.json',JSON.stringify(snapshot));
const imageCount=fields.filter(f=>f.kind==='image').length;
await writeFile('public/reference-capacity.js',`export const invitationCapacity={photos:${imageCount},qrUploads:2,fields:${fields.length},events:4,gallery:11};\n`);

await build({entryPoints:['invitation-source/adapters/entry.tsx'],bundle:true,format:'iife',target:'es2022',jsx:'automatic',minify:true,
 outfile:'public/reference/source-app.js',define:{'process.env.NODE_ENV':'"production"'},
 tsconfigRaw:{compilerOptions:{baseUrl:root,paths:{'@/*':['invitation-source/src/*']}}},
 alias:{'next/image':resolve('invitation-source/adapters/Image.tsx'),'@/server/wedding/site-config':resolve('invitation-source/adapters/site-config.ts'),
 qrcode:resolve('invitation-source/adapters/QRCode.ts'),'qrcode-core':require.resolve('qrcode/lib/browser.js')}});
const from=resolve('invitation-source/src/app/globals.css');
const css=await postcss([tailwind({base:resolve('invitation-source')})]).process(await readFile(from,'utf8'),{from,to:resolve('public/reference/source.css')});
await writeFile('public/reference/source.css',css.css);
await build({entryPoints:['public/reference/source-runtime.js'],bundle:true,format:'esm',target:'es2022',outfile:'public/reference/entry.js',minify:true});
await writeFile('public/reference/render.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wedding Invitation · Easy Wedding</title><link rel="stylesheet" href="/reference/assets/current-3296p3dkz9qkg.css"><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="/reference/source.css"><link rel="stylesheet" href="/reference-designs.css"><link rel="stylesheet" href="/reference/source-polish.css"><link rel="modulepreload" href="/reference/entry.js"><link rel="modulepreload" href="/reference/source-app.js"></head><body><!-- Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying or cloning of this website, its designs or its code is prohibited. --><div id="ew-origin-marker" hidden data-origin="EW-ORIGIN-2026-369eafc22a98" aria-hidden="true">Easy Wedding · easywedding.in · Original creation of Chandan Kumar Mahato · © 2026 · EW-ORIGIN-2026-369eafc22a98</div><script id="__SITE_CONFIG__" type="application/json">{}</script><div id="reference-root"><p class="invitation-loading">Preparing your invitation…</p></div><script type="module">import('./entry.js').catch(error=>{console.error(error);document.querySelector('#reference-root').textContent='Your invitation could not open. Please reload.'})</script><script type="module" src="/reference-enhance.js"></script></body></html>`);
console.log(`Original TSX invitation integrated: ${imageCount} photograph positions, 2 QR uploads, ${fields.length} controls, 11 designs.`);
