/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Crop step shown before a profile photograph is uploaded: drag to move, slider or wheel to zoom, then "Use photo". */
const TYPES=['image/jpeg','image/png','image/webp'],OUT=1000,MAX_ZOOM=4;
const CSS=`.ew-crop{border:0!important;border-radius:16px;padding:0;width:min(92vw,420px);max-height:96vh;background:#fffaf3!important;color:#3a1220!important;box-shadow:0 20px 60px rgba(20,5,10,.5)}
.ew-crop::backdrop{background:rgba(20,5,10,.65)}
.ew-crop form{display:flex;flex-direction:column;gap:14px;padding:18px}
.ew-crop h2{margin:0;font:700 20px/1.3 Georgia,serif;color:#3a1220!important}
.ew-crop p{margin:0;font:15px/1.45 system-ui,sans-serif;color:#6b4a52!important}
.ew-crop-frame{position:relative;width:min(100%,340px);aspect-ratio:1;margin:0 auto;overflow:hidden;border-radius:12px;background:#222;touch-action:none;cursor:grab;user-select:none}
.ew-crop-frame:active{cursor:grabbing}
.ew-crop-frame img{position:absolute;left:50%;top:50%;max-width:none;pointer-events:none;-webkit-user-drag:none;will-change:transform}
.ew-crop-frame::after{content:"";position:absolute;inset:0;border:2px solid rgba(255,255,255,.85);border-radius:12px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25);pointer-events:none;background:linear-gradient(rgba(255,255,255,.28),rgba(255,255,255,.28)) 33.3% 0/1px 100% no-repeat,linear-gradient(rgba(255,255,255,.28),rgba(255,255,255,.28)) 66.6% 0/1px 100% no-repeat,linear-gradient(rgba(255,255,255,.28),rgba(255,255,255,.28)) 0 33.3%/100% 1px no-repeat,linear-gradient(rgba(255,255,255,.28),rgba(255,255,255,.28)) 0 66.6%/100% 1px no-repeat}
.ew-crop .ew-crop-zoom{display:flex!important;flex-direction:row!important;align-items:center;gap:10px;color:#3a1220;font:600 14px system-ui,sans-serif}
.ew-crop-zoom input{flex:1;min-height:44px}
.ew-crop-zoom button{flex:none;width:44px!important;height:44px;border:1px solid #c99a3d;border-radius:50%;background:#fff!important;color:#75152e!important;font:700 22px/1 system-ui,sans-serif;cursor:pointer}
.ew-crop .ew-crop-actions{display:flex!important;flex-direction:row!important;gap:10px}
.ew-crop-actions button{flex:1;min-height:48px;border-radius:12px;font:700 16px system-ui,sans-serif;cursor:pointer;border:2px solid #c99a3d}
.ew-crop-actions .ew-crop-ok{background:linear-gradient(180deg,#e8c876,#c99a3d)!important;color:#3a1220!important}
.ew-crop-actions .ew-crop-cancel{background:#fff!important;color:#75152e!important}`;

export function cropGeometry({natW,natH,view,zoom,x,y}){
 const base=view/Math.min(natW,natH),scale=base*zoom,w=natW*scale,h=natH*scale,mx=Math.max(0,(w-view)/2),my=Math.max(0,(h-view)/2);
 return {scale,x:Math.min(mx,Math.max(-mx,x)),y:Math.min(my,Math.max(-my,y))};
}

export async function cropPhoto(file,{title='Crop your photo'}={}){
 if(!TYPES.includes(file.type))throw Error('Choose a JPG, PNG or WebP photograph.');
 if(file.size>60*1024*1024)throw Error('Choose a photograph under 60 MB.');
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
 const natW=bitmap.width,natH=bitmap.height,url=URL.createObjectURL(file);
 if(!document.getElementById('ew-crop-style')){const s=document.createElement('style');s.id='ew-crop-style';s.textContent=CSS;document.head.append(s);}
 const dialog=document.createElement('dialog');dialog.className='ew-crop';dialog.setAttribute('aria-labelledby','ew-crop-title');
 dialog.innerHTML=`<form method="dialog"><h2 id="ew-crop-title"></h2><p>Drag the photo to move it. Use the slider to zoom in.</p><div class="ew-crop-frame"><img alt="Photo being cropped"></div><label class="ew-crop-zoom"><button type="button" data-z="-1" aria-label="Zoom out">−</button><input type="range" min="1" max="${MAX_ZOOM}" step="0.01" value="1" aria-label="Zoom"><button type="button" data-z="1" aria-label="Zoom in">+</button></label><div class="ew-crop-actions"><button type="button" class="ew-crop-cancel">Cancel</button><button type="button" class="ew-crop-ok">Use photo</button></div></form>`;
 dialog.querySelector('h2').textContent=title;
 const frame=dialog.querySelector('.ew-crop-frame'),img=dialog.querySelector('img'),range=dialog.querySelector('input');
 img.src=url;img.width=natW;img.height=natH;
 document.body.append(dialog);
 let zoom=1,x=0,y=0,view=1;
 const draw=()=>{view=frame.clientWidth||320;const g=cropGeometry({natW,natH,view,zoom,x,y});x=g.x;y=g.y;img.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) scale(${g.scale})`;img.style.transformOrigin='center';};
 const setZoom=z=>{const next=Math.min(MAX_ZOOM,Math.max(1,z)),k=next/zoom;x*=k;y*=k;zoom=next;range.value=String(zoom);draw();};
 range.addEventListener('input',()=>setZoom(Number(range.value)));
 dialog.querySelectorAll('[data-z]').forEach(b=>b.addEventListener('click',()=>setZoom(zoom+Number(b.dataset.z)*.25)));
 frame.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*(e.deltaY<0?1.08:.93));},{passive:false});
 let drag=null;
 frame.addEventListener('pointerdown',e=>{drag={px:e.clientX,py:e.clientY,x,y};frame.setPointerCapture(e.pointerId);});
 frame.addEventListener('pointermove',e=>{if(!drag)return;x=drag.x+e.clientX-drag.px;y=drag.y+e.clientY-drag.py;draw();});
 const end=()=>{drag=null;};frame.addEventListener('pointerup',end);frame.addEventListener('pointercancel',end);
 return await new Promise((resolve,reject)=>{
  const cleanup=()=>{URL.revokeObjectURL(url);bitmap.close();dialog.close?.();dialog.remove();};
  dialog.querySelector('.ew-crop-cancel').addEventListener('click',()=>{cleanup();resolve(null);});
  dialog.addEventListener('cancel',e=>{e.preventDefault();cleanup();resolve(null);});
  dialog.querySelector('.ew-crop-ok').addEventListener('click',()=>{
   try{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=OUT;const ctx=canvas.getContext('2d');
    const g=cropGeometry({natW,natH,view,zoom,x,y}),k=OUT/view,w=natW*g.scale*k,h=natH*g.scale*k;
    ctx.fillStyle='#fff';ctx.fillRect(0,0,OUT,OUT);ctx.drawImage(bitmap,OUT/2+g.x*k-w/2,OUT/2+g.y*k-h/2,w,h);
    canvas.toBlob(blob=>{cleanup();if(!blob)return reject(Error('This photograph could not be cropped. Try another one.'));resolve(new File([blob],(file.name.replace(/\.[^.]+$/,'')||'photo')+'-cropped.jpg',{type:'image/jpeg'}));},'image/jpeg',.9);
   }catch(error){cleanup();reject(error);}
  });
  dialog.showModal();draw();
 });
}
