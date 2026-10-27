/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Idempotent motion surfaces; listeners and observers are owned by each root. */
const surfaces=new WeakMap();
export function attachFloralMotion(root){if(!root)return;if(surfaces.has(root))return surfaces.get(root);
 const images=[];for(const side of ['left','right']){const img=document.createElement('img');img.src='assets/floral/wedding-bouquet.webp';img.className='floral-corner floral-'+side;img.alt='';img.setAttribute('aria-hidden','true');img.width=1254;img.height=1254;root.append(img);images.push(img);}
 root.classList.add('floral-surface');let observer;
 if(typeof IntersectionObserver!=='undefined'){observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('floral-in-view',e.isIntersecting)));observer.observe(root);}
 function visibility(){root.classList.toggle('floral-page-visible',!document.hidden);}visibility();document.addEventListener('visibilitychange',visibility);
 const cleanup=()=>{observer?.disconnect();document.removeEventListener('visibilitychange',visibility);images.forEach(img=>img.remove());root.classList.remove('floral-in-view','floral-page-visible','floral-surface');surfaces.delete(root);};surfaces.set(root,cleanup);return cleanup;
}
