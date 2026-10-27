/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
// The full invitation keeps one content model; each world owns its art,
// palette, typography, frames and motion choreography.
const design=(id,name,palette,floral,script,frame,motion,description)=>({
 id,name,palette,floral:'/assets/floral/'+floral+'-botanical.webp',
 scene:'/assets/wedding/'+id+'.webp',script,frame,motion,description
});
export const referenceDesigns={
 'premium-original':{...design('premium-original','Premium Original',
  ['#fff7e8','#f7ecd4','#8d1730','#5e2f21','#755240','#c99a3d','#e8c876','#6d1025','#fff7e8'],
  'ivory','vibes','6px','original','Original royal artwork · cinematic curtain & doors'),
  premium:true,scene:'/ornaments/opening-realistic.webp',floral:'/ornaments/floral-corner.webp'},
 'ivory-arch':design('ivory-arch','Ivory Jasmine',
  ['#fff9ee','#f4e9d5','#703c2b','#654b37','#856c55','#b88b36','#e2c779','#784632','#fff9ee'],
  'ivory','vibes','999px 999px 18px 18px','veil','Jasmine breeze · silk reveal'),
 'royal-prestige':design('royal-prestige','Crimson Vows',
  ['#32121f','#451d2b','#ffe0bf','#ecd8bf','#cdb99e','#dbb474','#f5dca2','#dcb878','#351521'],
  'rose','garden','160px 160px 8px 8px','hinge','Rose drift · royal gates'),
 garden:design('garden','Botanical Forever',
  ['#f1f6ec','#e5eddc','#285840','#40553d','#6e7d62','#93834b','#c5be82','#315b42','#fffaf0'],
  'ivory','garden','24px 24px 140px 140px','leaf','Leaf sway · garden unfold'),
 haldi:design('haldi','Golden Phere',
  ['#fff5d9','#f6e4b5','#793d16','#68491f','#8a6d3d','#ab741e','#dfba62','#995024','#fff8e4'],
  'marigold','vibes','100px 100px 28px 28px','curtain','Marigold flutter · golden curtain'),
 mehndi:design('mehndi','Peacock Promise',
  ['#082d30','#123d3d','#e5efda','#d3e2d7','#b5c9bd','#c2b376','#e6dba5','#c9bd87','#082d30'],
  'peacock','garden','160px 160px 65px 65px','fan','Feather sway · peacock fan'),
 sangeet:design('sangeet','Wisteria Vows',
  ['#f4edfb','#e7ddf1','#69438a','#5e4c70','#81738c','#9a7cac','#cab4d8','#72518d','#fff7fd'],
  'lavender','vibes','48% 48% 22px 22px','cascade','Wisteria cascade · violet veil'),
 reception:design('reception','Champagne Forever',
  ['#fff8ec','#f0e5d4','#69513b','#655343','#85725c','#aa8956','#dac497','#73553c','#fff9ee'],
  'ivory','serif','12px','candle','Candlelight drift · editorial reveal'),
 'midnight-noor':design('midnight-noor','Starlit Vows',
  ['#0b1830','#14243f','#e2eafa','#d4dded','#adbdd6','#aebfe4','#e0e8ff','#c3d0eb','#10203b'],
  'lavender','serif','180px 180px 48px 48px','moon','Moonlit float · starlight reveal'),
 'blush-mehraab':design('blush-mehraab','Blush Lotus',
  ['#fff1f2','#f4e1e4','#863d58','#744959','#997181','#bb866d','#e3bda5','#914e67','#fff6f2'],
  'lotus','vibes','46% 46% 12px 12px','bloom','Lotus bloom · petal drift'),
 'emerald-darbar':design('emerald-darbar','Sacred Courtyard',
  ['#f7eee0','#eaddc8','#355448','#5c4938','#84715b','#ab7847','#d7b383','#3f5d4a','#fff8e8'],
  'marigold','garden','80px 80px 5px 5px','fold','Terracotta warmth · courtyard fold')
};
export const referenceDesignFor=id=>referenceDesigns[id]||referenceDesigns['ivory-arch'];
const channels=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255);
const luminance=hex=>channels(hex).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
// Paper text, inverse controls and lettering on ceremony photography need
// separate foregrounds. Reusing "ivory" for all three hides words in dark worlds.
export function referenceSurfaceColors(design){
 const [paper,panel,ink,text,muted,gold]=design.palette;
 const readable=colour=>Math.min(contrast(colour,paper),contrast(colour,panel))>=4.5;
 const bronze='#'+channels(gold).map((x,i)=>Math.round((x*.35+channels(ink)[i]*.65)*255).toString(16).padStart(2,'0')).join('');
 return {mutedText:readable(muted)?muted:text,accentInk:readable(gold)?gold:readable(bronze)?bronze:ink,
  sceneShade:luminance(paper)<luminance(ink)?paper:ink,onScene:'#fff8ed'};
}
const profiles={
 original:{duration:2.8,floral:18000,turn:1,drift:6,enter:{y:28},door:left=>({x:left?'-104%':'104%'})},
 veil:{duration:2.6,floral:15000,turn:2,drift:10,enter:{y:34,scale:.98},door:left=>({x:left?'-108%':'108%',opacity:0,scale:1.04})},
 hinge:{duration:3.2,floral:18500,turn:1.5,drift:8,enter:{y:36,scale:.94},door:left=>({x:left?'-70%':'70%',rotateY:left?-88:88,opacity:0})},
 leaf:{duration:2.8,floral:12500,turn:4,drift:16,enter:{x:26,y:8,rotate:-1,scale:.98},door:left=>({x:left?'-108%':'108%',rotate:left?-5:5,opacity:0})},
 curtain:{duration:2.4,floral:10500,turn:3,drift:18,enter:{y:42,scale:.97},door:left=>({x:left?'-18%':'18%',y:'-108%',opacity:0})},
 fan:{duration:3,floral:17000,turn:5,drift:10,enter:{scale:.9,y:16},door:left=>({x:left?'-65%':'65%',rotate:left?-58:58,scale:.88,opacity:0})},
 cascade:{duration:2.9,floral:13500,turn:3,drift:20,enter:{y:-28,rotate:-.6},door:left=>({x:left?'-15%':'15%',y:left?'-110%':'110%',opacity:0})},
 candle:{duration:3.1,floral:22000,turn:1,drift:6,enter:{y:22,scale:.99},door:left=>({x:left?'-30%':'30%',scale:1.2,opacity:0})},
 moon:{duration:3.4,floral:20000,turn:2,drift:14,enter:{y:32,scale:.96},door:left=>({x:left?'-106%':'106%',y:'-14%',scale:1.12,opacity:0})},
 bloom:{duration:2.7,floral:14500,turn:4,drift:12,enter:{y:18,scale:.92,rotate:-1.5},door:left=>({x:left?'-105%':'105%',rotate:left?-12:12,scale:1.06,opacity:0})},
 fold:{duration:3,floral:16000,turn:2.5,drift:10,enter:{x:-20,y:24,scale:.97},door:left=>({x:left?'-95%':'95%',rotateY:left?-68:68,y:'8%',opacity:0})}
};
export function referenceMotionFor(design){
 const p=profiles[design.motion];
 return {...p,doorInitial:{x:0,y:0,rotate:0,rotateY:0,scale:1,opacity:1},
  enter:y=>({opacity:0,x:0,y,rotate:0,scale:1,...p.enter}),
  shown:{opacity:1,x:0,y:0,rotate:0,scale:1}};
}
// Only source ornaments are remapped. User photos, QR images and Ganesh icons
// must never receive scene effects, tinting or an unrelated floral asset.
export function referenceImageFor(src,design){
 if(typeof src!=='string'||design.premium)return {src,kind:''};
 if(/^\/ornaments\/(?:royal-door-bg|palace-night|opening-realistic|royal-mandap-invite)\.webp$/.test(src))return {src:design.scene,kind:'scene'};
 if(src==='/ornaments/floral-corner.webp')return {src:design.floral,kind:'floral'};
 if(/\/(?:current-)?(?:278a81b7a25d|278a81b7a2|3ad3aec99e87|3ad3aec99e|bd94896fb01d|bd94896fb0|ac9265734f9e|ac9265734f)(?:\.webp)$/.test(src))return {src:design.scene,kind:'scene'};
 if(/\/(?:current-)?(?:29ca8f2f3ef8|29ca8f2f3e)\.webp$/.test(src))return {src:design.floral,kind:'floral'};
 return {src,kind:''};
}
