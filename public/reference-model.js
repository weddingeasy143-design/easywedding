/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
import {referenceForConfig} from './reference-editor.js';
import {referenceDefaults} from './reference-fields.js';
import {invitationUrl,rsvpDestination} from './config.js';

/** Shared by every template; a design change never replaces personal content. */
export function invitationModel(config,seed,base,snapshotId=''){
 const site=structuredClone(seed.site),wedding=structuredClone(seed.wedding),r=referenceForConfig(config);
 Object.assign(site.content,r.content||{},{groomName:config.groomName||config.partner1,brideName:config.brideName||config.partner2,weddingDateISO:config.date+'T'+config.time+':00'+config.timezone});
 site.content.invitationMessage=r.content?.invitationMessage??config.message;
 site.content.quote=r.content?.quote??config.blessing;
 site.content.venueName=config.venue;site.content.venueAddressLines=[config.address,config.city];site.content.venuePin=r.content?.venuePin||'';
 if(config.venuePhotoUrl)site.content.venuePhoto=config.venuePhotoUrl;
 if(config.photoUrl)site.content.invitationPhoto=config.photoUrl;
 if(config.photoUrl)site.content.heroPhoto=config.photoUrl;
 if(config.groomPhoto)site.content.groomPhoto=config.groomPhoto;
 if(config.bridePhoto)site.content.bridePhoto=config.bridePhoto;
 site.content.venueMapUrl=r.content?.venueMapUrl||('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([config.venue,config.address,config.city].join(', ')));
 site.sagun={...site.sagun,...r.sagun,qr1Image:r.sagun?.qr1Image||'',qr2Image:r.sagun?.qr2Image||'',qr1UpiId:r.sagun?.qr1UpiId||'',qr2UpiId:r.sagun?.qr2UpiId||''};
 site.contactPhone=r.contactPhone||(config.rsvpMethod==='whatsapp'?rsvpDestination(config):'')||'';
 wedding.story=r.story;wedding.events=r.events;wedding.gallery=r.gallery.filter(photo=>photo.src);
 const art=config.theme==='premium-original'?'/ornaments/opening-realistic.webp':'/assets/wedding/'+(config.theme||'premium-original')+'.webp';
 const fixImg=v=>typeof v==='string'&&v.startsWith('/photos/')?art:v;
 for(const k of ['heroPhoto','invitationPhoto','groomPhoto','bridePhoto','venuePhoto'])site.content[k]=fixImg(site.content[k]);
 for(const st of wedding.story||[])st.photo=fixImg(st.photo);
 for(const g of wedding.gallery)g.src=fixImg(g.src);
 for(const e of wedding.events)e.image=fixImg(e.image);
 for(const event of wedding.events){event.venue=config.venue;event.address=[config.venue,config.address,config.city].join(', ');event.mapUrl=site.content.venueMapUrl;}
 site.share={...site.share,...r.share};
 const url=new URL('invite.html',base);
 if(snapshotId){url.searchParams.set('id',snapshotId);site.share.shareUrl=url.href;}else site.share.shareUrl=invitationUrl(config,url);
 const copy={...referenceDefaults.copy,...r.copy};
 site.content.siteTexts={...site.content.siteTexts,...r.content?.siteTexts,
   youreInvited:copy.text3,thankYouTitle:copy.text18,tapToReveal:copy.text22,tapToBegin:copy.text24,
   footerText:`Made with love for ${config.partner1} & ${config.partner2}`};
 return {site,wedding,copy};
}
