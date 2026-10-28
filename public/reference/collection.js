import {readConfig,encodeConfig} from '../config.js';
import {referenceDesigns} from '../reference-designs.js';
const config=readConfig(location),worlds=document.querySelector('#worlds'),dialog=document.querySelector('#preview-dialog');
const $=s=>document.querySelector(s);
const studioUrl=theme=>'/studio?demo=1#card='+encodeConfig({...config,theme});
$('#back-to-studio').href=studioUrl(config.theme);$('#footer-studio').href=studioUrl(config.theme);
function preview(design,index){
 $('#preview-title').textContent=design.name;$('#preview-number').textContent=String(index+1).padStart(2,'0')+' / '+(design.premium?'PREMIUM ORIGINAL':'WEDDING COLLECTION');
 const url='render.html#card='+encodeConfig({...config,theme:design.id});
 const frame=document.createElement('iframe');frame.title=design.name+' interactive invitation';frame.src=url;frame.allow='autoplay';
 $('#preview-stage').replaceChildren(frame);$('#preview-full').href=url;$('#preview-edit').href=studioUrl(design.id);dialog.showModal();
}
for(const [index,design] of Object.values(referenceDesigns).entries()){
 const item=document.createElement('article');item.className='world'+(design.premium?' world-premium':'');item.dataset.design=design.id;
 item.style.setProperty('--paper',design.palette[0]);item.style.setProperty('--ink',design.palette[2]);item.style.setProperty('--gold',design.palette[5]);
 const art=document.createElement('button');art.type='button';art.className='world-art';art.setAttribute('aria-label','Preview '+design.name);art.onclick=()=>preview(design,index);
 const image=document.createElement('img');image.src=design.scene;image.alt='';image.loading=index<3?'eager':'lazy';image.className='world-scene';
 const paper=document.createElement('span');paper.className='world-paper';
 const ganesh=document.createElement('img');ganesh.src='/assets/wedding/ganesh.png';ganesh.alt='';ganesh.className='world-ganesh';
 const invocation=document.createElement('small');invocation.textContent='SHREE GANESHAYA NAMAH';
 const groom=document.createElement('span'),join=document.createElement('i'),bride=document.createElement('span'),date=document.createElement('small');groom.textContent=config.partner1;bride.textContent=config.partner2;join.textContent='weds';date.textContent=config.date.split('-').reverse().join(' · ');
 paper.append(ganesh,invocation,groom,join,bride,date);
 const cue=document.createElement('span');cue.className='world-preview-cue';cue.textContent='Experience invitation ↗';art.append(image,paper,cue);
 const words=document.createElement('div');words.className='world-words';
 const meta=document.createElement('p');meta.className='world-meta';meta.textContent=String(index+1).padStart(2,'0')+' / '+(design.premium?'PREMIUM · THE ORIGINAL':'WEDDING COLLECTION');
 const title=document.createElement('h2');title.textContent=design.name;
 const description=document.createElement('p');description.className='world-description';description.textContent=design.premium?'The complete original royal experience. A divine welcome, silk curtain reveal and carved doors open into your wedding story.':design.description;
 const palette=document.createElement('div');palette.className='world-palette';palette.setAttribute('aria-label',design.name+' colour palette');for(const color of design.palette.slice(0,6)){const swatch=document.createElement('span');swatch.style.background=color;swatch.setAttribute('aria-hidden','true');palette.append(swatch);}
 const capacity=document.createElement('p');capacity.className='world-capacity';capacity.textContent='23 photos · 4 events · your song · every section';
 const actions=document.createElement('div');actions.className='world-actions';const view=document.createElement('button');view.type='button';view.textContent='Preview';view.onclick=()=>preview(design,index);
 const edit=document.createElement('a');edit.href='/studio?demo=1&template='+design.id;edit.textContent='Use design →';edit.addEventListener('click',()=>{edit.href=studioUrl(design.id);});actions.append(view,edit);
 words.append(meta,title,description,palette,capacity,actions);item.append(art,words);worlds.append(item);
}
$('#preview-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>$('#preview-stage').replaceChildren());
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
$('#skip-opening').onclick=()=>$('#preview-stage iframe')?.contentWindow?.postMessage({type:'wedcanvas:open'},location.origin);
for(const button of document.querySelectorAll('[data-device]'))if(button.tagName==='BUTTON')button.onclick=()=>{const mode=button.dataset.device;$('#preview-stage').dataset.device=mode;for(const b of document.querySelectorAll('button[data-device]'))b.setAttribute('aria-pressed',String(b===button));};
