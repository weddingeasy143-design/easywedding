/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
import {readConfig,encodeConfig,normalizeConfig} from './config.js';
try{
 const id=new URLSearchParams(location.search).get('id');let config=readConfig(location);
 /* A template preview shows that design's own finished sample invitation
    (different couple, family, venue, dates and photos for every design). */
 const template=new URLSearchParams(location.search).get('template');
 if(!id&&template){try{const r=await fetch('demo-configs/'+encodeURIComponent(template)+'.json');if(r.ok){const demo=normalizeConfig(await r.json());if(demo.theme===template){config=demo;
 /* A public design preview is a sample invitation: give its RSVP a working
    destination (the business WhatsApp) so a visitor's reply reaches the
    review-and-send step instead of dead-ending on "no RSVP contact".
    Only this preview path is filled in — the demo files themselves stay
    contact-free so the Studio still starts every customer with a blank
    RSVP contact of their own, and published invitations never pass here. */
 if(!config.rsvpContact)config={...config,rsvpContact:'918789991983',rsvpMethod:'whatsapp'};}}}catch{}}
 if(id){const response=await fetch('/api/invitations/'+encodeURIComponent(id));const data=await response.json();if(!response.ok)throw Error(data.error||'Invitation not found.');config=normalizeConfig(data)}
 const url=new URL('reference/render.html',location.href);if(id)url.searchParams.set('id',id);const guestToken=new URLSearchParams(location.search).get('to');if(guestToken)url.searchParams.set('to',guestToken);url.hash='card='+encodeConfig(config);location.replace(url.href);
}catch(error){document.body.style.visibility='visible';document.body.replaceChildren();const p=document.createElement('p');p.textContent=error.message;document.body.append(p)}
