/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
// Turns a pasted YouTube / Instagram / Facebook video page link into the
// provider's official embed URL. Returns '' for anything else, so an
// invitation only ever embeds a real, playable film.
export function videoEmbedUrl(raw){
 const text=String(raw||'').trim();if(!text)return '';
 let url;try{url=new URL(text)}catch{return ''}
 if(url.protocol!=='https:')return '';
 const host=url.hostname.replace(/^www\./,'').replace(/^m\./,'');
 if(host==='youtu.be'){
  const id=url.pathname.slice(1).split('/')[0];
  return /^[\w-]{6,20}$/.test(id)?'https://www.youtube-nocookie.com/embed/'+id:'';
 }
 if(host==='youtube.com'||host==='youtube-nocookie.com'){
  const v=url.searchParams.get('v');
  if(url.pathname==='/watch'&&v&&/^[\w-]{6,20}$/.test(v))return 'https://www.youtube-nocookie.com/embed/'+v;
  const m=url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,20})/);
  return m?'https://www.youtube-nocookie.com/embed/'+m[1]:'';
 }
 if(host==='instagram.com'){
  const m=url.pathname.match(/^\/(p|reel|reels)\/([\w-]+)/);
  return m?'https://www.instagram.com/'+(m[1]==='p'?'p':'reel')+'/'+m[2]+'/embed':'';
 }
 if(host==='facebook.com'||host==='fb.watch'){
  if(host==='fb.watch'||url.pathname.startsWith('/watch')||url.pathname.includes('/videos/'))
   return 'https://www.facebook.com/plugins/video.php?href='+encodeURIComponent(url.href)+'&show_text=false';
  return '';
 }
 return '';
}
export function validVideoUrl(raw){return videoEmbedUrl(raw)!==''}
