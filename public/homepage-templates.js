/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
import {referenceDesigns} from './reference-designs.js';
const target=document.querySelector('#studio .template-row');
if(target){
 target.replaceChildren();
 for(const [index,design] of Object.values(referenceDesigns).entries()){
  const link=document.createElement('a');link.href='invite?template='+design.id;link.className='homepage-template';link.dataset.preview=design.id;link.setAttribute('aria-label','Preview '+design.name);
  const figure=document.createElement('figure'),image=document.createElement('img'),caption=document.createElement('figcaption');
  image.src=design.scene;image.alt=design.name+' wedding design';image.loading='lazy';
  caption.textContent=String(index+1).padStart(2,'0')+' · '+design.name;
  if(design.premium){link.classList.add('homepage-template-premium');const badge=document.createElement('span');badge.className='collection-premium';badge.textContent='PREMIUM';figure.append(badge);}
  figure.append(image,caption);link.append(figure);target.append(link);
 }
 const browse=document.createElement('a');browse.className='collection-all';browse.href='/reference/collection.html';browse.textContent='Explore all 11 invitations →';target.after(browse);
}
