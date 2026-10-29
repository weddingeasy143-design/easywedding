/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Shared local image preparation. Cloud uploads retain their original resolution. */
export const MAX_INPUT_BYTES=60*1024*1024;
/* Any photograph, any size: scaled to at most 2000 px on the long side and re-saved as WebP at high quality (about 0.84), which keeps it sharp on every phone and screen while loading fast. */
export async function compressPhoto(file,{maxEdge=2000,targetBytes=700*1024}={}){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP photograph.');
 if(file.size>MAX_INPUT_BYTES)throw Error('Choose a photograph under 60 MB.');
 if(typeof createImageBitmap!=='function')return file;/* very old browsers: the server still checks type and size */
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
 try{
  let edge=maxEdge,best=null;
  for(let round=0;round<4;round++){
   const ratio=Math.min(1,edge/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
   const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   for(const quality of [.86,.82,.76,.7]){
    const blob=encode(canvas,quality);
    if(!best||blob.size<best.size)best=blob;
    if(blob.size<=targetBytes)return finish(blob);
   }
   edge=Math.round(edge*.85);
  }
  return finish(best);
 }finally{bitmap.close();}
 function finish(blob){return blob.size>=file.size&&file.size<=targetBytes&&bitmap.width<=maxEdge&&bitmap.height<=maxEdge?file:new File([blob],(file.name.replace(/\.[^.]+$/,'')||'photo')+(blob.type==='image/webp'?'.webp':'.jpg'),{type:blob.type});}
}
/* WebP where the browser can write it (Chrome, Edge, Firefox, Android); high-quality JPEG otherwise (Safari on iPhone). */
function encode(canvas,quality){
 let url=canvas.toDataURL('image/webp',quality);if(!url.startsWith('data:image/webp'))url=canvas.toDataURL('image/jpeg',quality);
 const comma=url.indexOf(','),type=url.slice(5,url.indexOf(';')),bin=atob(url.slice(comma+1)),bytes=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
 return new Blob([bytes],{type});
}
export async function prepareLocalPhoto(file,maxBytes=90000){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP photograph.');
 if(file.size>MAX_INPUT_BYTES)throw Error('Choose a photograph under 60 MB.');
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
 try{const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');let edge=1280,result='';for(let attempt=0;attempt<7;attempt++){const ratio=Math.min(1,edge/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);for(const quality of [.88,.76,.64,.52]){result=canvas.toDataURL('image/jpeg',quality);if(result.length*.75<=maxBytes)return result;}edge=Math.round(edge*.8);}throw Error('This photograph could not be prepared. Try a smaller image.');}finally{bitmap.close();}
}
export function browserOnlySession(){try{return !!window.EWAuth?.session()?.fake||new URLSearchParams(location.search).get('demo')==='1';}catch{return false;}}
