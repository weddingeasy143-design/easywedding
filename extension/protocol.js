export const SITE='https://wedcanvas-interactive-invitation.mail-amtcentre.chatgpt.site';
export const providers={chatgpt:{url:'https://chatgpt.com/',origin:'https://chatgpt.com/*'},gemini:{url:'https://gemini.google.com/app',origin:'https://gemini.google.com/*'},canva:{url:'https://www.canva.com/',origin:'https://www.canva.com/*'}};
export const isSite=url=>{try{return [SITE,'http://localhost:4173','http://localhost:5173','http://127.0.0.1:4173','http://127.0.0.1:5173'].includes(new URL(url).origin)}catch{return false}};
export const isProvider=(url,key)=>{try{return new URL(url).origin===new URL(providers[key].url).origin}catch{return false}};
export function validateJob(j){
 if(!j||typeof j!=='object'||!Object.hasOwn(providers,j.provider)||!['image','video'].includes(j.mode))throw Error('Choose a supported creative account.');
 if(j.mode==='video'&&j.provider!=='gemini')throw Error('Video briefs use Gemini.');
 if(typeof j.id!=='string'||!/^[-a-zA-Z0-9]{10,80}$/.test(j.id)||typeof j.owner!=='string'||!j.owner||j.owner.length>200)throw Error('Invalid workspace session.');
 if(typeof j.prompt!=='string'||!j.prompt.trim()||j.prompt.length>14000)throw Error('Enter a brief under 14,000 characters.');
 if(!Array.isArray(j.photos)||j.photos.length>2)throw Error('Select up to two reference photos.');
 for(const p of j.photos)if(!p||typeof p.name!=='string'||p.name.length>100||typeof p.data!=='string'||p.data.length>1800000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.data))throw Error('Reference photo is invalid or too large.');
 return {id:j.id,owner:j.owner,provider:j.provider,mode:j.mode,prompt:j.prompt,photos:j.photos,name:String(j.name||'Wedding artwork').slice(0,150)};
}
export function validateResult(data,mode){const types=mode==='video'?'video/(mp4|webm)':'image/(jpeg|png|webp)';if(typeof data!=='string'||data.length>(mode==='video'?28000000:11200000)||!new RegExp('^data:'+types+';base64,[A-Za-z0-9+/=]+$').test(data))throw Error('Choose a supported image under 8 MB or video under 20 MB.');return data;}
