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
 const p=state.profile,t=budgetTotals(state),W=1440,H=2036;
 const themeKey=state.events[0]?.invitationTheme||'royal-prestige',themeArt='assets/'+(eventThemes[themeKey]||eventThemes['royal-prestige']).image;
 let bgImg=null;
 for(const src of [p.invitationPhoto,p.photo1,p.photo2,themeArt].filter(Boolean)){try{bgImg=await loadImage(src);break;}catch{}}
 const weddingDate=new Date(p.date+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
 const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
 let canvas,ctx,y,page=0;
 function frame(){ctx.strokeStyle='#bd9760';ctx.lineWidth=3;ctx.strokeRect(55,55,W-110,H-110);ctx.strokeStyle='#bd976080';ctx.lineWidth=1;ctx.strokeRect(75,75,W-150,H-150);}
 function background(){ctx.fillStyle='#fffcf5';ctx.fillRect(0,0,W,H);if(bgImg){ctx.save();ctx.globalAlpha=.5;cover(ctx,bgImg,0,0,W,H);ctx.restore();ctx.fillStyle='rgba(255,252,245,.35)';ctx.fillRect(0,0,W,H);}}
 function footer(){text(ctx,'EASY WEDDING · PRIVATE WEDDING PLAN',100,H-103,900,20,'Arial','#90786a','left');text(ctx,'Page '+page,W-110,H-103,180,20,'Arial','#90786a','right');}
 function pushPage(){pdf.addImage(canvas.toDataURL('image/jpeg',.91),'JPEG',0,0,210,297,undefined,'FAST');}
 canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d');page=1;
 background();frame();
 const cw=1060,ch=1120,cx=(W-cw)/2,cy=(H-ch)/2;
 ctx.fillStyle='#fffdf8';ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,22);ctx.fill();ctx.strokeStyle='#bd9760';ctx.lineWidth=2;ctx.stroke();
 text(ctx,'TOGETHER WITH THEIR FAMILIES',W/2,cy+165,920,27,'Arial','#9c753d');
 text(ctx,p.partner1,W/2,cy+330,960,88,'"Cormorant Garamond", Georgia','#651c32');
 text(ctx,'&',W/2,cy+435,960,56,'"Cormorant Garamond", Georgia','#9c753d');
 text(ctx,p.partner2,W/2,cy+545,960,88,'"Cormorant Garamond", Georgia','#651c32');
 ctx.strokeStyle='#d9c6a6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W/2-170,cy+640);ctx.lineTo(W/2+170,cy+640);ctx.stroke();
 text(ctx,'invite you to celebrate their wedding',W/2,cy+715,920,31,'Arial','#67534e');
 text(ctx,weddingDate,W/2,cy+800,920,36,'"Cormorant Garamond", Georgia','#651c32');
 text(ctx,p.city+'  ·  '+p.guests+' guests',W/2,cy+865,920,30,'Arial','#9c753d');
 text(ctx,'W E D D I N G   P L A N',W/2,cy+ch-95,920,24,'Arial','#9c753d');
 footer();pushPage();
 function newPage(){pdf.addPage();page++;canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d');background();frame();text(ctx,'E A S Y   W E D D I N G   /   W E D D I N G   P L A N',100,130,1100,24,'Arial','#9c753d','left');text(ctx,p.partner1+' & '+p.partner2,100,230,1240,66,'"Cormorant Garamond", Georgia','#651c32','left');text(ctx,weddingDate+'  ·  '+p.city+'  ·  '+p.guests+' guests',100,283,1220,28,'Arial','#67534e','left');footer();y=360;}
 function space(height){if(y+height>H-175)newPage();}
 function line(value,size=28,color='#493a36'){ctx.font=`${size}px Arial`;const wrapped=lines(ctx,value,1210);for(const part of wrapped){space(size*1.65);text(ctx,part,110,y,1210,size,'Arial',color,'left');y+=size*1.55;}}
 function section(value){space(120);y+=25;text(ctx,value,110,y,1210,43,'"Cormorant Garamond", Georgia','#651c32','left');y+=50;ctx.strokeStyle='#d9c6a6';ctx.beginPath();ctx.moveTo(110,y-10);ctx.lineTo(1330,y-10);ctx.stroke();y+=28;}
 newPage();section('Your wedding budget');line('Budget target: '+rupees(p.budget));line('Estimated costs: '+rupees(t.subtotal));line('Contingency ('+p.contingency+'%): '+rupees(t.contingency));line('Total estimate: '+rupees(t.total),34,'#651c32');line('Paid: '+rupees(t.paid)+'    Remaining: '+rupees(t.remaining));line((t.unallocated>=0?'Budget remaining: ':'Over budget: ')+rupees(Math.abs(t.unallocated)));y+=20;line('Planning figures are entered by you. Confirm final prices and availability with each vendor.',23,'#79675d');
 section('Every celebration');for(const event of [...state.events].sort((a,b)=>a.date.localeCompare(b.date))){space(165);line(event.name+'  |  '+event.date+'  |  '+event.time+' IST',31,'#651c32');line(event.venue||'Venue to be confirmed',27);if(event.dress)line('Dress code: '+event.dress,25);if(event.notes)line(event.notes,25);y+=22;}
 section('Complete cost estimate');if(!state.budget.length)line('No costs added yet.');for(const row of state.budget){space(160);line(row.title+'  ·  '+row.category,30,'#651c32');line(row.quantity+' × '+rupees(row.rate)+' = '+rupees(row.quantity*row.rate)+'    |    Paid: '+rupees(row.paid),26);if(row.notes)line(row.notes,23);y+=22;}
 section('Wedding checklist');for(const task of state.tasks){line((task.done?'✓ ':'□ ')+task.title,27);line('Due '+task.due+(task.owner?' · '+task.owner:''),22,'#877266');y+=16;}
 if(state.vendors.length){section('Your wedding team');for(const v of state.vendors){space(145);line(v.name+' · '+v.status,30,'#651c32');line(v.category+' · '+(v.area||p.city),25);if(v.phone)line('Phone: '+v.phone,25);line('Quote: '+rupees(v.quote)+' · Deposit: '+rupees(v.deposit),25);if(v.notes)line(v.notes,24);y+=20;}}
 if(state.shopping.length){section('Wedding shopping');for(const i of state.shopping){line((i.done?'Bought: ':'To buy: ')+i.title,27);line(i.event+' · '+i.person+' · Budget '+rupees(i.budget),23,'#877266');if(i.notes)line(i.notes,23);y+=18;}}
 if(p.notes){section('Your notes');line(p.notes,27);}
 pushPage();pdf.setProperties({title:p.partner1+' & '+p.partner2+' · Wedding plan',subject:'Wedding events and cost estimate',creator:'Easy Wedding'});return pdf.output('blob');
}
