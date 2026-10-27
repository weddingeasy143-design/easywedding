/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Shared local image preparation. Cloud uploads retain their original resolution. */
export async function prepareLocalPhoto(file,maxBytes=90000){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP photograph.');
 if(file.size>8*1024*1024)throw Error('Choose a photograph under 8 MB.');
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
 try{const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');let edge=1280,result='';for(let attempt=0;attempt<7;attempt++){const ratio=Math.min(1,edge/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);for(const quality of [.88,.76,.64,.52]){result=canvas.toDataURL('image/jpeg',quality);if(result.length*.75<=maxBytes)return result;}edge=Math.round(edge*.8);}throw Error('This photograph could not be prepared. Try a smaller image.');}finally{bitmap.close();}
}
export function browserOnlySession(){try{return !!window.EWAuth?.session()?.fake||new URLSearchParams(location.search).get('demo')==='1';}catch{return false;}}
