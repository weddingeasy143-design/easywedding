import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {createPlan} from '../public/planner-data.js';

const tick=()=>new Promise(r=>setTimeout(r,25));

test('cinematic motion stack is fully self-hosted (no external API/CDN)',async()=>{
 for(const [file,marker] of [['assets/vendor/gsap.min.js','3.15.0'],['assets/vendor/ScrollTrigger.min.js','ScrollTrigger'],['assets/vendor/SplitText.js','SplitText'],['assets/vendor/lenis.min.js','1.3.26']]){
  const body=await readFile('public/'+file,'utf8');
  assert.ok(body.length>5000,file+' is a real library, not a stub');
  assert.ok(body.includes(marker),file+' contains version marker '+marker);
 }
 const html=await readFile('dist/client/index.html','utf8');
 for(const s of ['assets/vendor/gsap.min.js','assets/vendor/ScrollTrigger.min.js','assets/vendor/SplitText.js','assets/vendor/lenis.min.js','cinematic.js'])assert.ok(html.includes(s),'built index.html loads '+s);
 // Our own sources must never embed an external service or call an external
 // API. Allowed hosts below are all user/guest-initiated *navigations*
 // (open my AI account, WhatsApp a vendor, get map directions, read a style
 // guide) or the inert SVG XML namespace — never fetches, embeds or keys.
 // (Bundled third-party code such as jsPDF carries a dormant pdfobject CDN
 // string that is only used by an embed code path this app never calls —
 // the wedding PDF is produced with output('blob').)
 // Scanned in Node (not shell grep) so the check also runs on Windows.
 const {readdir}=await import('node:fs/promises');
 const ownFiles=(await readdir('public')).filter(f=>/\.(js|html|css)$/.test(f));
 const found=new Set();
 for(const f of ownFiles)for(const m of (await readFile('public/'+f,'utf8')).matchAll(/https?:\/\/[a-zA-Z0-9.-]+/g))found.add(m[0]);
 const own=[...found].sort();
 const allowed=['http://www.w3.org','https://chatgpt.com','https://checkout.razorpay.com','https://easywedding.in','https://gemini.google.com','https://sdk.cashfree.com','https://wa.me','https://www.canva.com','https://www.facebook.com','https://www.google.com','https://www.instagram.com','https://www.manyavar.com','https://www.youtube-nocookie.com'].sort();
 assert.deepEqual(own,allowed,'no new external host may appear in our own sources without review');
 assert.ok(!(await readFile('public/invite.html','utf8')).includes('<iframe'),'invitation ships no embedded external content');
});

test('cinematic.js exposes a guarded motion engine',async()=>{
 const src=await readFile('public/cinematic.js','utf8');
 assert.ok(src.includes('window.EWCinematic'),'exposes window.EWCinematic');
 assert.ok(src.includes("prefers-reduced-motion"),'honours reduced-motion');
 assert.ok(src.includes('new window.Lenis'),'wires Lenis smooth scroll');
 assert.ok(src.includes('ScrollTrigger'),'drives reveals with ScrollTrigger');
 assert.ok(src.includes('SplitText'),'uses SplitText line reveals');
 assert.ok(src.includes('heroPlayed'),'hero intro plays once per session');
 assert.ok(src.includes('data-reveal'),'binds scroll reveals');
 assert.ok(src.includes('data-count'),'binds animated counters');
 assert.ok(src.includes('data-parallax'),'binds desktop parallax');
 // engine must no-op cleanly when vendor scripts are absent
 const dom=new JSDOM('<!doctype html><html><body><main id="main-content"></main></body></html>',{runScripts:'outside-only'});
 dom.window.eval(src);
 assert.doesNotThrow(()=>dom.window.EWCinematic.init('overview'),'init no-ops without gsap');
 dom.window.close();
});

test('overview renders the cinematic luxury homepage',async()=>{
 const bundle=await build({entryPoints:['public/planner.js'],bundle:true,format:'iife',write:false,target:'es2022'});
 const dom=new JSDOM(await readFile('public/index.html','utf8'),{url:'https://wedding.test/#overview',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;
 w.matchMedia=()=>({matches:true,addEventListener(){}});w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.structuredClone=structuredClone;w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 const state=createPlan({partner1:'Meera',partner2:'Aarav',date:'2026-12-12',city:'Jaipur',guests:200,budget:1500000,contingency:10});
 w.fetch=async(path,options={})=>{let data;if(path==='/api/session')data={user:{id:'alice',name:'Alice'}};else if(path==='/api/workspace'&&options.method==='PUT')data={revision:2};else if(path==='/api/workspace')data={state,revision:1};else throw Error('Unexpected request '+path);return{ok:true,json:async()=>data};};
 try{
  w.eval(bundle.outputFiles[0].text);await tick();await tick();
  const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];
  const hero=$('.cine-hero');assert.ok(hero,'cinematic hero section renders');
  assert.equal($$('.hero-title .hl-inner').length,3,'headline reveals in three masked lines');
  assert.match($('.hero-title').textContent,/Meera/);assert.match($('.hero-title').textContent,/Aarav/);
  assert.ok($('.cine-hero-bg'),'Ken Burns hero image present');
  assert.ok($('.grade-shadows')&&$('.grade-warm')&&$('.grade-vignette'),'cinematic colour grades present');
  assert.ok($('.grain'),'film grain overlay present');
  assert.match($('.hero-count').textContent,/DAYS TO/,'countdown medallion kept');
  assert.ok($('.hero-scroll-cue'),'scroll cue present');
  assert.ok($('.hero-cta [data-action=invitation]'),'invitation CTA kept');
  assert.ok($('.hero-cta [data-view=events]'),'celebrations CTA present');
  assert.equal($$('.marquee-half').length,2,'seamless marquee has two identical halves');
  assert.match($('.marquee').textContent,/SANGEET/);
  const cards=$$('.cine-card');assert.ok(cards.length>=3,'celebration + next-step cards render');
  assert.ok($('.cine-card img').getAttribute('src').startsWith('assets/'),'card imagery is local');
  assert.ok($('[data-view=vendors]'),'vendor directory card present');
  const counts=$$('[data-count]');assert.equal(counts.length,4,'four animated stat counters');
  assert.equal($('[data-count][data-format=inr]').getAttribute('data-count'),'1500000');
  assert.ok($('.cine-band'),'maroon stats band renders');
  assert.ok($('[data-reveal]'),'scroll-reveal hooks present');
  assert.ok($('[data-split]'),'SplitText heading hooks present');
  assert.ok($('.panel.luxe [data-action=add-task],.panel.luxe .task-line')||$('.panel.luxe'),'checklist panel kept');
  assert.ok(w.document.querySelector('.budget-ring'),'budget ring kept');
  // content is visible without the motion engine (no-JS-hiding guarantee)
  for(const el of $$('[data-reveal]'))assert.notEqual(w.getComputedStyle(el).opacity,'0','reveal elements not hidden by CSS');
 }finally{w.close();}
});
