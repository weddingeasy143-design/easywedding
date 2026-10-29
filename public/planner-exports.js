/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
import {eventThemes} from './event-themes.js';
import {budgetTotals,rupees} from './planner-data.js';
const loadImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('A design image could not be loaded. Please try again.'));img.src=src;});
function cover(ctx,img,x,y,w,h){const r=Math.max(w/img.width,h/img.height),sw=w/r,sh=h/r;ctx.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,w,h)}
// Only remove a near-uniform studio backdrop; mixed outdoor backgrounds keep their original pixels.
export function softenStudioBackdrop(paint,w,h){let pixels;try{pixels=paint.getImageData(0,0,w,h);}catch{return;}if(!pixels?.data)return;const data=pixels.data,corner=(x,y)=>{const sum=[0,0,0];for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){const at=((y+dy)*w+x+dx)*4;for(let c=0;c<3;c++)sum[c]+=data[at+c]/9;}return sum;};if(w<12||h<12)return;const a=corner(1,1),b=corner(w-4,1);if(Math.hypot(...a.map((v,i)=>v-b[i]))>65)return;const background=a.map((v,i)=>(v+b[i])/2);if(Math.min(...background)<175||Math.max(...background)-Math.min(...background)>45)return;const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;const visit=index=>{if(index<0||index>=w*h||seen[index])return;seen[index]=1;const x=index%w,y=Math.floor(index/w);if(y>h*.32&&x>w*.18&&x<w*.82)return;const offset=index*4;if(Math.hypot(data[offset]-background[0],data[offset+1]-background[1],data[offset+2]-background[2])>48)return;queue[tail++]=index;};for(let x=0;x<w;x++)visit(x);for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}while(head<tail){const index=queue[head++];data[index*4+3]=0;if(index%w)visit(index-1);if(index%w<w-1)visit(index+1);visit(index-w);visit(index+w);}paint.putImageData(pixels,0,0);}
function blendedPhoto(ctx,img,x,y,w,h){const layer=document.createElement('canvas');layer.width=Math.max(1,Math.ceil(w));layer.height=Math.max(1,Math.ceil(h));const paint=layer.getContext('2d');paint.drawImage(img,0,0,w,h);softenStudioBackdrop(paint,layer.width,layer.height);paint.globalCompositeOperation='destination-in';const horizontal=paint.createLinearGradient(0,0,layer.width,0);for(const [stop,alpha] of [[0,0],[.18,1],[.82,1],[1,0]])horizontal.addColorStop(stop,'rgba(0,0,0,'+alpha+')');paint.fillStyle=horizontal;paint.fillRect(0,0,layer.width,layer.height);const vertical=paint.createLinearGradient(0,0,0,layer.height);for(const [stop,alpha] of [[0,0],[.055,1],[.86,1],[1,0]])vertical.addColorStop(stop,'rgba(0,0,0,'+alpha+')');paint.fillStyle=vertical;paint.fillRect(0,0,layer.width,layer.height);ctx.drawImage(layer,x,y,layer.width,layer.height);}
function fitPhoto(ctx,img,x,y,w,h){const scale=Math.min(w/img.width,h/img.height),iw=img.width*scale,ih=img.height*scale;blendedPhoto(ctx,img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);}
function fitPortrait(ctx,img,x,y,size){const inset=size*.14,availableHeight=size-inset,availableWidth=size*.72,scale=Math.min(availableWidth/img.width,availableHeight/img.height),w=img.width*scale,h=img.height*scale;blendedPhoto(ctx,img,x+(size-w)/2,y+size-h,w,h);}
function text(ctx,value,x,y,max,size=32,font='Arial',color='#572337',align='center'){ctx.fillStyle=color;ctx.textAlign=align;ctx.font=`${size}px ${font}`;while(ctx.measureText(value).width>max&&size>18){size-=1;ctx.font=`${size}px ${font}`;}ctx.fillText(value,x,y,max);return size;}
function lines(ctx,value,max){const all=[];for(const para of String(value||'').split('\n')){let line='';for(const word of para.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>max&&line){all.push(line);line=word;}else line=next;}all.push(line);}return all;}
export const nameFontStyles={classic:{label:'Classic serif',family:'"Cormorant Garamond", Georgia',load:'Cormorant Garamond'},script:{label:'Wedding calligraphy',family:'GardenScript, cursive',load:'GardenScript'},romantic:{label:'Romantic script',family:'"Great Vibes", cursive',load:'Great Vibes'},heritage:{label:'Heritage serif',family:'GardenSerif, Georgia',load:'GardenSerif'},modern:{label:'Modern minimal',family:'"DM Sans", Arial',load:'DM Sans'}};
export function nameFontStyle(key){return nameFontStyles[key]||nameFontStyles.classic;}
export function photoBackgroundOpacity(event){const value=Number(event?.backgroundPhotoOpacity??20);return Math.max(0,Math.min(100,Number.isFinite(value)?value:20))/100;}
function paperWash(ctx,dark,h){const ink=dark?'36,19,30':'255,250,239',wash=ctx.createLinearGradient(0,105,0,h-105);for(const [stop,alpha] of [[0,1],[.32,1],[.43,.91],[.55,.22],[.68,.74],[.77,1],[1,1]])wash.addColorStop(stop,`rgba(${ink},${alpha})`);ctx.fillStyle=wash;ctx.fillRect(100,105,880,h-210);}
export async function renderDesign(state,event,format,theme,layout='heirloom'){
 await Promise.all([document.fonts.load('40px "Cormorant Garamond"'),document.fonts.load('40px GardenScript')]);
 const firstFont=nameFontStyle(event.nameFont1),secondFont=nameFontStyle(event.nameFont2);await Promise.all([firstFont,secondFont].map(f=>document.fonts.load('83px "'+f.load+'"')));
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=format==='Poster'?1350:1520;canvas.setAttribute('aria-label',event.name+' invitation design for '+state.profile.partner1+' and '+state.profile.partner2);
 const ctx=canvas.getContext('2d'),h=canvas.height,t=eventThemes[theme]||eventThemes['royal-prestige'],bg=await loadImage('assets/'+t.image),editorial=layout==='editorial',dark=Boolean(t.dark),color=dark?'#fff6e6':'#4b2130',gold=dark?'#edd4a0':'#855c2c';
 const date=new Date(event.date+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}),time=new Date('2000-01-01T'+event.time).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'});
 const photoSource=event.cardPhoto||state.profile.invitationPhoto||state.profile.photo1||state.profile.photo2;
 if(layout==='portrait'){
 if(!photoSource)throw Error('Upload a couple photo to use Portrait Spotlight.');const photo=await loadImage(photoSource);cover(ctx,bg,0,0,1080,h);ctx.fillStyle='#24131e';ctx.fillRect(55,55,970,h-110);ctx.save();ctx.globalAlpha=photoBackgroundOpacity(event);fitPhoto(ctx,photo,55,55,970,h-110);ctx.restore();const wash=ctx.createLinearGradient(0,0,0,h);wash.addColorStop(0,'#24131e44');wash.addColorStop(.35,'#24131e00');wash.addColorStop(.55,'#24131ecf');wash.addColorStop(.73,'#24131ef5');wash.addColorStop(1,'#24131e');ctx.fillStyle=wash;ctx.fillRect(55,55,970,h-110);ctx.strokeStyle='#edd4a0';ctx.lineWidth=1.5;ctx.strokeRect(78,78,924,h-156);
 text(ctx,'TOGETHER WITH OUR FAMILIES',540,150,800,24,'Arial','#edd4a0');text(ctx,event.name,540,h-520,800,88,'GardenScript, cursive','#edd4a0');text(ctx,state.profile.partner1,540,h-398,820,88,firstFont.family,'#fff6e6');text(ctx,'& '+state.profile.partner2,540,h-300,820,88,secondFont.family,'#fff6e6');text(ctx,date+' · '+time+' IST',540,h-207,800,29,'Arial','#fff6e6');text(ctx,event.venue||state.profile.city,540,h-150,800,34,'"Cormorant Garamond", Georgia','#fff6e6');text(ctx,t.headline.replace(/\n/g,' '),540,h-95,800,25,'"Cormorant Garamond", Georgia','#edd4a0');return canvas;
 }
 cover(ctx,bg,0,0,1080,h);ctx.fillStyle=dark?'#24131e':'#fffaf0';ctx.fillRect(100,105,880,h-210);
 if(photoSource){const photo=await loadImage(photoSource);ctx.save();ctx.beginPath();ctx.rect(100,105,880,h-210);ctx.clip();ctx.globalAlpha=photoBackgroundOpacity(event);fitPhoto(ctx,photo,100,105,880,h-210);ctx.restore();}paperWash(ctx,dark,h);
 ctx.strokeStyle=gold;ctx.lineWidth=1.5;ctx.strokeRect(120,125,840,h-250);ctx.strokeStyle=dark?'#edd4a050':'#855c2c40';ctx.strokeRect(135,140,810,h-280);
 const bouquet=await loadImage('assets/floral/wedding-bouquet.webp');ctx.save();ctx.globalAlpha=.88;ctx.drawImage(bouquet,45,42,240,240);ctx.translate(1035,h-42);ctx.rotate(Math.PI);ctx.drawImage(bouquet,0,0,240,240);ctx.restore();
 const align=editorial?'left':'center',x=editorial?185:540,width=editorial?700:730;
 text(ctx,'WITH THE BLESSINGS OF OUR FAMILIES',x,210,width,22,'Arial',gold,align);
 text(ctx,event.name,x,320,width,98,'GardenScript, cursive',gold,align);
 text(ctx,'You are invited to celebrate the wedding journey of',x,390,width,31,'"Cormorant Garamond", Georgia',color,align);
 text(ctx,state.profile.partner1,x,480,width,83,firstFont.family,color,align);
 text(ctx,'& '+state.profile.partner2,x,568,width,83,secondFont.family,color,align);
 const photos=event.cardPhoto?[event.cardPhoto]:state.profile.invitationPhoto?[state.profile.invitationPhoto]:[state.profile.photo1,state.profile.photo2].filter(Boolean);const top=640,size=format==='Poster'?220:300,gap=30,total=photos.length*size+(photos.length-1)*gap,left=editorial?185:(1080-total)/2;
 if(photos.length){const imgs=await Promise.all(photos.map(loadImage));imgs.forEach((img,i)=>{const px=left+i*(size+gap);ctx.save();ctx.beginPath();ctx.roundRect(px,top,size,size,[size/2,size/2,4,4]);ctx.clip();fitPortrait(ctx,img,px,top,size);ctx.restore();ctx.beginPath();ctx.roundRect(px-7,top-7,size+14,size+14,[(size+14)/2,(size+14)/2,5,5]);ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.stroke();});}
 const detailsY=photos.length?top+size+72:800;
 text(ctx,date,x,detailsY,width,37,'"Cormorant Garamond", Georgia',color,align);text(ctx,time+' IST',x,detailsY+46,width,24,'Arial',gold,align);
 const venue=event.venue||state.profile.city;text(ctx,venue,x,detailsY+103,width,33,'"Cormorant Garamond", Georgia',color,align);if(event.venue&&state.profile.city)text(ctx,state.profile.city,x,detailsY+145,width,24,'Arial',gold,align);
 if(event.venuePhoto){const venueImg=await loadImage(event.venuePhoto);cover(ctx,venueImg,740,h-278,160,92);text(ctx,'THE VENUE',820,h-162,160,16,'Arial',gold);}
 text(ctx,t.headline.replace(/\n/g,' '),x,h-148,event.venuePhoto?500:width,27,'"Cormorant Garamond", Georgia',color,align);
 return canvas;
}
export async function downloadDesign(canvas,name){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('The card could not be exported. Please generate it again.');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;document.body.append(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},30000);return blob;}
export async function exportWeddingPDF(state){
 const {jsPDF}=await import('jspdf');await document.fonts.ready;
 const p=state.profile,t=budgetTotals(state),W=1440,H=2036,M=90,CW=W-2*M;
 const C={deep:'#4b0b20',maroon:'#75152e',gold:'#c99a3d',goldLight:'#efcc87',ivory:'#fffaf3',card:'#ffffff',zebra:'#fbf5ea',line:'#e6d8c3',ink:'#3a1220',muted:'#7a5b60',good:'#2e7d4f',bad:'#a62640'};
 const SERIF='"Cormorant Garamond", Georgia, serif',SANS='"DM Sans", Arial, sans-serif';
 const themeKey=state.events[0]?.invitationTheme||'royal-prestige',themeArt='assets/'+(eventThemes[themeKey]||eventThemes['royal-prestige']).image;
 let bgImg=null;
 for(const src of [p.invitationPhoto,p.photo1,p.photo2,themeArt].filter(Boolean)){try{bgImg=await loadImage(src);break;}catch{}}
 const weddingDate=new Date(p.date+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
 const today=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
 const couple=p.partner1+' & '+p.partner2;
 const pages=[];let canvas,ctx,y;
 const font=(size,family=SANS,weight='')=>`${weight?weight+' ':''}${size}px ${family}`;
 const fit=(value,max,size,family=SANS,weight='')=>{ctx.font=font(size,family,weight);let s=String(value??'');if(ctx.measureText(s).width<=max)return s;while(s.length>1&&ctx.measureText(s+'…').width>max)s=s.slice(0,-1);return s+'…';};
 const put=(value,x,yy,{size=26,family=SANS,weight='',color=C.ink,align='left',max=CW,track=0}={})=>{ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';if('letterSpacing' in ctx)ctx.letterSpacing=track+'px';ctx.font=font(size,family,weight);ctx.fillText(fit(value,max,size,family,weight),x,yy);if('letterSpacing' in ctx)ctx.letterSpacing='0px';};
 const rr=(x,yy,w,h,r,fill,stroke,lw=2)=>{ctx.beginPath();ctx.roundRect(x,yy,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}};
 const diamond=(cx,cy,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r,cy);ctx.lineTo(cx,cy+r);ctx.lineTo(cx-r,cy);ctx.closePath();ctx.fill();};
 const flourish=(cx,yy,width,color)=>{ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-width/2,yy);ctx.lineTo(cx-18,yy);ctx.moveTo(cx+18,yy);ctx.lineTo(cx+width/2,yy);ctx.stroke();diamond(cx,yy,8,color);diamond(cx-width/2,yy,4,color);diamond(cx+width/2,yy,4,color);};
 function fresh(){canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d');pages.push(canvas);}
 /* ---------- cover ---------- */
 fresh();
 const wash=ctx.createLinearGradient(0,0,W,H);wash.addColorStop(0,C.maroon);wash.addColorStop(.55,C.deep);wash.addColorStop(1,'#2a0612');ctx.fillStyle=wash;ctx.fillRect(0,0,W,H);
 if(bgImg){ctx.save();ctx.globalAlpha=.2;const r=Math.max(W/bgImg.width,H/bgImg.height),sw=W/r,sh=H/r;ctx.drawImage(bgImg,(bgImg.width-sw)/2,(bgImg.height-sh)/2,sw,sh,0,0,W,H);ctx.restore();}
 const vign=ctx.createRadialGradient(W/2,H/2,300,W/2,H/2,1250);vign.addColorStop(0,'rgba(42,6,18,0)');vign.addColorStop(1,'rgba(20,3,9,.65)');ctx.fillStyle=vign;ctx.fillRect(0,0,W,H);
 ctx.strokeStyle=C.goldLight;ctx.lineWidth=3;ctx.strokeRect(60,60,W-120,H-120);ctx.lineWidth=1;ctx.strokeRect(84,84,W-168,H-168);
 for(const [x,yy] of [[84,84],[W-84,84],[84,H-84],[W-84,H-84]])diamond(x,yy,12,C.goldLight);
 put('EASY WEDDING',W/2,260,{size:26,color:C.goldLight,align:'center',track:10});
 flourish(W/2,310,360,C.goldLight);
 put('WEDDING PLAN & BUDGET',W/2,520,{size:34,color:C.goldLight,align:'center',track:12});
 put(p.partner1,W/2,790,{size:150,family:SERIF,weight:'600',color:'#fff5e7',align:'center',max:1100});
 put('&',W/2,930,{size:96,family:SERIF,color:C.goldLight,align:'center'});
 put(p.partner2,W/2,1090,{size:150,family:SERIF,weight:'600',color:'#fff5e7',align:'center',max:1100});
 flourish(W/2,1210,520,C.goldLight);
 put(weddingDate,W/2,1330,{size:54,family:SERIF,color:'#fff5e7',align:'center'});
 put([p.city,p.guests?p.guests+' guests':''].filter(Boolean).join('   ·   '),W/2,1400,{size:30,color:C.goldLight,align:'center',track:3});
 rr(W/2-300,1560,600,150,18,'rgba(255,255,255,.07)','rgba(239,204,135,.55)',2);
 put('TOTAL BUDGET TARGET',W/2,1620,{size:21,color:C.goldLight,align:'center',track:6});
 put(rupees(p.budget),W/2,1680,{size:58,family:SERIF,weight:'600',color:'#fff5e7',align:'center'});
 put('Prepared '+today+' · easywedding.in',W/2,H-130,{size:22,color:'rgba(255,245,231,.7)',align:'center',track:2});
 /* ---------- content pages ---------- */
 function newPage(){
  fresh();ctx.fillStyle=C.ivory;ctx.fillRect(0,0,W,H);
  const band=ctx.createLinearGradient(0,0,W,0);band.addColorStop(0,C.deep);band.addColorStop(1,C.maroon);ctx.fillStyle=band;ctx.fillRect(0,0,W,138);
  ctx.fillStyle=C.gold;ctx.fillRect(0,138,W,5);
  put('EASY WEDDING',M,84,{size:24,color:C.goldLight,track:8});
  put(couple+'  ·  '+weddingDate,W-M,84,{size:25,family:SERIF,weight:'600',color:'#fff5e7',align:'right',max:900});
  y=215;
 }
 const room=h=>{if(y+h>H-150)newPage();};
 function heading(title,note){if(y>330)y+=30;room(190);diamond(M+8,y-12,8,C.gold);put(title,M+34,y,{size:50,family:SERIF,weight:'600',color:C.maroon,max:CW-34});if(note)put(note,W-M,y-4,{size:22,color:C.muted,align:'right',max:520});y+=22;ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(M,y);ctx.lineTo(W-M,y);ctx.stroke();ctx.strokeStyle=C.gold;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(M,y);ctx.lineTo(M+120,y);ctx.stroke();y+=42;}
 function tiles(items){const gap=24,w=(CW-gap*(items.length-1))/items.length,h=170;room(h+40);items.forEach((it,i)=>{const x=M+i*(w+gap);rr(x,y,w,h,18,C.card,C.line,2);ctx.fillStyle=it.color||C.gold;ctx.fillRect(x+24,y,w-48,6);put(it.label.toUpperCase(),x+w/2,y+58,{size:19,color:C.muted,align:'center',track:3,max:w-24});put(it.value,x+w/2,y+122,{size:it.value.length>11?42:50,family:SERIF,weight:'600',color:it.color||C.maroon,align:'center',max:w-24});});y+=h+40;}
 function progress(label,done,total,color){const ratio=total>0?Math.min(1,done/total):0;room(110);put(label,M,y,{size:25,weight:'500',color:C.ink,max:760});put(Math.round(ratio*100)+'%',W-M,y,{size:25,weight:'600',color:color,align:'right'});y+=22;rr(M,y,CW,26,13,'#efe4d0');if(ratio>0){const g=ctx.createLinearGradient(M,0,M+CW,0);g.addColorStop(0,color);g.addColorStop(1,C.gold);rr(M,y,Math.max(26,CW*ratio),26,13,g);}y+=70;}
 function table(cols,rows,{foot=[]}={}){
  const rowH=64,head=()=>{room(rowH*3);rr(M,y,CW,58,12,C.maroon);let x=M;for(const c of cols){put(c.label.toUpperCase(),c.align==='right'?x+c.w-18:x+18,y+37,{size:18,weight:'700',color:C.goldLight,align:c.align||'left',track:2,max:c.w-30});x+=c.w;}y+=58;};
  head();let i=0;
  for(const row of rows){if(y+rowH>H-150){newPage();head();}if(i%2===0){ctx.fillStyle=C.zebra;ctx.fillRect(M,y,CW,rowH);}let x=M;for(const c of cols){const v=typeof row[c.key]==='object'&&row[c.key]!==null?row[c.key].text:row[c.key],color=typeof row[c.key]==='object'&&row[c.key]!==null?row[c.key].color:C.ink;put(v,c.align==='right'?x+c.w-18:x+18,y+41,{size:23,weight:c.bold?'600':'',color,align:c.align||'left',max:c.w-32});x+=c.w;}ctx.strokeStyle=C.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(M,y+rowH);ctx.lineTo(W-M,y+rowH);ctx.stroke();y+=rowH;i++;}
  for(const f of foot){if(y+rowH>H-150)newPage();const strong=f.strong;if(strong){rr(M,y+6,CW,rowH,12,C.maroon);}put(f.label,W-M-330,y+(strong?49:43),{size:strong?27:23,weight:strong?'700':'500',color:strong?C.goldLight:C.muted,align:'right',max:520});put(f.value,W-M-18,y+(strong?49:43),{size:strong?30:25,family:strong?SERIF:SANS,weight:'700',color:strong?'#fff5e7':(f.color||C.ink),align:'right',max:300});y+=strong?rowH+14:rowH-6;}
  y+=36;
 }
 /* --- budget at a glance --- */
 newPage();heading('Budget at a glance','All amounts in Indian rupees');
 tiles([{label:'Budget target',value:rupees(p.budget)},{label:'Total estimate',value:rupees(t.total)},{label:'Paid so far',value:rupees(t.paid),color:C.good},{label:'Still to pay',value:rupees(t.remaining),color:C.maroon}]);
 const within=t.unallocated>=0;room(120);rr(M,y,CW,92,16,within?'#eaf5ee':'#fbe9ec',within?'#b9dcc6':'#efb6bf',2);ctx.fillStyle=within?C.good:C.bad;ctx.beginPath();ctx.arc(M+52,y+46,20,0,Math.PI*2);ctx.fill();put(within?'✓':'!',M+52,y+57,{size:30,weight:'700',color:'#fff',align:'center'});put(within?'You are within budget':'You are over budget',M+96,y+40,{size:28,weight:'700',color:within?C.good:C.bad,max:700});put((within?'Budget remaining: ':'Over budget by: ')+rupees(Math.abs(t.unallocated))+'  ·  includes '+p.contingency+'% contingency',M+96,y+74,{size:22,color:C.muted,max:1100});y+=132;
 progress('Paid against total estimate',t.paid,t.total,C.good);
 const byCat=new Map();for(const row of state.budget){const v=(Number(row.quantity)||0)*(Number(row.rate)||0);byCat.set(row.category||'Other',(byCat.get(row.category||'Other')||0)+v);}
 let cats=[...byCat.entries()].filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);if(cats.length>6){const rest=cats.slice(5).reduce((s,[,v])=>s+v,0);cats=[...cats.slice(0,5),['Other',rest]];}
 if(cats.length&&t.subtotal>0){
  heading('Where the money goes','Share of estimated costs');room(420);
  const palette=[C.maroon,C.gold,'#a85d3b','#5f8a6b','#4f6d9a','#b98aa0'],cx=M+210,cy=y+200,R=190,r=112;let a0=-Math.PI/2;
  cats.forEach(([,v],i)=>{const a1=a0+v/t.subtotal*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,R,a0,a1);ctx.arc(cx,cy,r,a1,a0,true);ctx.closePath();ctx.fillStyle=palette[i%palette.length];ctx.fill();ctx.strokeStyle=C.ivory;ctx.lineWidth=4;ctx.stroke();a0=a1;});
  put('TOTAL',cx,cy-6,{size:17,color:C.muted,align:'center',track:4});put(rupees(t.subtotal),cx,cy+34,{size:32,family:SERIF,weight:'700',color:C.maroon,align:'center',max:190});
  cats.forEach(([name,v],i)=>{const ly=y+56+i*58;rr(M+470,ly-24,28,28,8,palette[i%palette.length]);put(name,M+516,ly,{size:26,weight:'500',max:340});put(rupees(v),W-M-130,ly,{size:26,weight:'600',align:'right',max:240});put(Math.round(v/t.subtotal*100)+'%',W-M,ly,{size:24,color:C.muted,align:'right'});});
  y+=cy-y+R+60;
 }
 /* --- cost table --- */
 heading('Complete cost estimate',state.budget.length+' item'+(state.budget.length===1?'':'s'));
 if(!state.budget.length){put('No costs added yet.',M,y,{size:26,color:C.muted});y+=70;}
 else table([{key:'item',label:'Item',w:370,bold:true},{key:'cat',label:'Category',w:230},{key:'qty',label:'Qty',w:80,align:'right'},{key:'rate',label:'Rate',w:170,align:'right'},{key:'est',label:'Estimate',w:200,align:'right'},{key:'paid',label:'Paid',w:210,align:'right'}],
  state.budget.map(row=>({item:row.title,cat:row.category,qty:String(row.quantity),rate:rupees(row.rate),est:rupees((Number(row.quantity)||0)*(Number(row.rate)||0)),paid:{text:rupees(row.paid),color:Number(row.paid)>0?C.good:C.muted}})),
  {foot:[{label:'Subtotal',value:rupees(t.subtotal)},{label:'Contingency ('+p.contingency+'%)',value:rupees(t.contingency)},{label:'Paid so far',value:rupees(t.paid),color:C.good},{label:'Balance to pay',value:rupees(t.remaining),color:C.maroon},{label:'TOTAL ESTIMATE',value:rupees(t.total),strong:true}]});
 /* --- celebrations --- */
 const events=[...state.events].sort((a,b)=>a.date.localeCompare(b.date));
 if(events.length){heading('Your celebrations',events.length+' events');for(const ev of events){room(150);rr(M,y,CW,128,18,C.card,C.line,2);rr(M,y,128,128,18,C.maroon);ctx.fillRect(M+100,y,28,128);const d=new Date(ev.date+'T12:00:00');put(String(d.getDate()),M+64,y+76,{size:60,family:SERIF,weight:'700',color:'#fff5e7',align:'center'});put(d.toLocaleDateString('en-IN',{month:'short'}).toUpperCase(),M+64,y+110,{size:20,color:C.goldLight,align:'center',track:4});ctx.fillStyle=C.maroon;ctx.fillRect(M+100,y,28,128);put(ev.name,M+164,y+52,{size:36,family:SERIF,weight:'700',color:C.maroon,max:700});put((ev.time||'')+' IST',W-M-28,y+50,{size:25,weight:'600',color:C.gold,align:'right',max:260});put(ev.venue||'Venue to be confirmed',M+164,y+90,{size:24,color:C.ink,max:760});if(ev.dress)put('Dress code: '+ev.dress,W-M-28,y+90,{size:21,color:C.muted,align:'right',max:430});y+=150;}y+=14;}
 /* --- checklist --- */
 if(state.tasks.length){const done=state.tasks.filter(x=>x.done).length;heading('Wedding checklist',done+' of '+state.tasks.length+' done');progress('Planning progress',done,state.tasks.length,C.good);for(const task of state.tasks){room(78);rr(M,y-30,38,38,10,task.done?C.good:C.card,task.done?C.good:C.gold,3);if(task.done){ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(M+9,y-10);ctx.lineTo(M+17,y-2);ctx.lineTo(M+30,y-21);ctx.stroke();}put(task.title,M+64,y,{size:27,weight:'500',color:task.done?C.muted:C.ink,max:820});put('Due '+task.due+(task.owner?' · '+task.owner:''),W-M,y,{size:21,color:C.muted,align:'right',max:330});ctx.strokeStyle=C.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(M,y+24);ctx.lineTo(W-M,y+24);ctx.stroke();y+=70;}y+=20;}
 /* --- vendors --- */
 if(state.vendors.length){heading('Your wedding team',state.vendors.length+' vendors');table([{key:'name',label:'Vendor',w:340,bold:true},{key:'cat',label:'Category',w:230},{key:'status',label:'Status',w:170},{key:'quote',label:'Quote',w:250,align:'right'},{key:'dep',label:'Deposit',w:270,align:'right'}],state.vendors.map(v=>({name:v.name,cat:v.category,status:{text:v.status,color:v.status==='Booked'?C.good:C.muted},quote:rupees(v.quote),dep:rupees(v.deposit)})));}
 /* --- shopping --- */
 if(state.shopping.length){heading('Wedding shopping',state.shopping.length+' items');table([{key:'item',label:'Item',w:460,bold:true},{key:'ev',label:'For',w:260},{key:'who',label:'Person',w:170},{key:'bud',label:'Budget',w:200,align:'right'},{key:'st',label:'Status',w:170}],state.shopping.map(i=>({item:i.title,ev:i.event,who:i.person,bud:rupees(i.budget),st:{text:i.done?'Bought':'To buy',color:i.done?C.good:C.muted}})));}
 if(p.notes){heading('Your notes');ctx.font=font(26);for(const part of lines(ctx,p.notes,CW)){room(52);put(part,M,y,{size:26,color:C.ink});y+=44;}}
 /* ---------- footers with "Page n of N" ---------- */
 const total=pages.length;
 const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
 pages.forEach((cv,i)=>{
  ctx=cv.getContext('2d');
  if(i>0){ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(M,H-96);ctx.lineTo(W-M,H-96);ctx.stroke();put('Prepared with Easy Wedding · Figures are your planning estimates — confirm final prices with each vendor.',M,H-52,{size:19,color:C.muted,max:1000});put('Page '+(i+1)+' of '+total,W-M,H-52,{size:20,weight:'600',color:C.maroon,align:'right'});}
  if(i>0)pdf.addPage();
  pdf.addImage(cv.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297,undefined,'FAST');
 });
 pdf.setProperties({title:couple+' · Wedding plan & budget',subject:'Wedding events, budget and cost estimate',creator:'Easy Wedding'});return pdf.output('blob');
}
