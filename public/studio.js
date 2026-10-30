/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
import {syncReferenceWedding,validReferenceDate} from './reference-config.js';
import {renderReferenceEditor,readReferenceEditor} from './reference-editor.js';
import {validateSong,prepareLocalSong} from './audio-upload.js';
import {prepareLocalPhoto,compressPhoto,browserOnlySession} from './photo-upload.js';
import {ceremonyMotifs,ornament} from './ceremony-art.js';
import {weddingThemes as eventThemes,weddingPreset as eventPreset} from './wedding-themes.js';
import {invitationCapacity} from './reference-capacity.js';
import {referenceDesignFor} from './reference-designs.js';
import {DEFAULTS,normalizeConfig,readConfig,encodeConfig,invitationUrl,rsvpDestination,safeImageUrl,validDate,validTime} from './config.js';
import {videoEmbedUrl} from './video-embed.js';
import {createWizard,priceRow,fillPriceChips,REVIEW_STEP,DONE_STEP} from './wizard.js';
/* Android app (window.EWApp bridge): the app supplies its own header, progress card and tab bar,
   so the studio page drops its duplicated chrome there and the editor gets the full height. */
if(window.EWApp)document.body.classList.add('in-app');
addEventListener('load',()=>{if(window.EWApp)document.body.classList.add('in-app');});
const $=s=>document.querySelector(s),form=$('#editor-form'),preview=$('#preview'),STORAGE='wedcanvas:invitation:v2',WIZARD_STORAGE='wedcanvas:wizard:v1';let config=normalizeConfig(DEFAULTS),updateTimer,songUploadVersion=0,wizard=null,payPricing=null,errorSeq=0;
try{if(location.hash.includes('card='))config=readConfig(location);else{const saved=localStorage.getItem(STORAGE);if(saved)config=normalizeConfig(JSON.parse(saved));}}catch{$('#save-status').textContent='Sample opened · saved draft unavailable';}
const selectedTheme=new URLSearchParams(location.search).get('template');if(Object.hasOwn(eventThemes,selectedTheme))config=normalizeConfig({...config,theme:selectedTheme});
$('#theme-options').innerHTML=Object.entries(eventThemes).map(([key,t],index)=>{const d=referenceDesignFor(key);return `<label class="theme-card ${d.premium?'theme-card-premium':''}" style="--card-ink:${d.palette[2]};--card-paper:${d.palette[0]};--card-gold:${d.palette[5]}"><input type="radio" name="theme" value="${key}"><span class="theme-art"><img src="${d.scene}" alt="${t.name} wedding artwork"><span class="theme-number">${String(index+1).padStart(2,'0')}</span></span><span class="theme-caption"><strong>${t.name}${d.premium?'<span class="premium-badge">PREMIUM</span>':''}</strong><small>${d.description}</small><span class="theme-capacity">${invitationCapacity.photos} photos · full invitation</span></span><i aria-hidden="true">✓</i></label>`}).join('');
/* "Start with this design" on the homepage opens the studio on that design only; the other designs are not shown. */
function lockDesign(){
if(!Object.hasOwn(eventThemes,selectedTheme)||new URLSearchParams(location.search).has('demo'))return;
document.querySelectorAll('#theme-options .theme-card').forEach(c=>{c.hidden=c.querySelector('input')?.value!==selectedTheme;});
const legend=document.querySelector('.theme-fieldset legend span');if(legend)legend.textContent='Your chosen design';
const help=document.querySelector('.theme-help');if(help)help.hidden=true;const cmp=$('#compare-designs');if(cmp)cmp.hidden=true;
if(!$('#change-design')){const a=document.createElement('a');a.id='change-design';a.className='secondary';a.href='/#pricing';a.textContent='Choose a different design';a.style.cssText='display:inline-block;margin-top:12px';$('#theme-options').after(a);}
/* the wizard shows the chosen design in its title; the one-card chooser is not needed */
const fieldset=document.querySelector('.theme-fieldset');if(fieldset)fieldset.hidden=true;
}
lockDesign();
function refreshPhotos(){if($('#song-status'))$('#song-status').textContent=config.audioName?(config.audioName+(config.audioUrl.startsWith('local-audio:')?' · Available on this device':' · Uploaded song selected')):'Upload your favourite wedding song.';for(const key of ['photoUrl','groomPhoto','bridePhoto','venuePhotoUrl']){const img=$('#'+key+'-preview');img.hidden=!config[key];if(config[key])img.src=config[key];else img.removeAttribute('src');}}
const names=Object.keys(DEFAULTS).filter(k=>!['events','version','reference'].includes(k));
function fillForm(){for(const key of names){const field=form.elements.namedItem(key);if(!field)continue;if(key==='theme'){field.value=config.theme;}else if(key==='gallery')field.value=config.gallery.join('\n');else if(field.type==='checkbox')field.checked=config[key];else field.value=config[key]??'';}const lh0=form.elements['lang-hi'];if(lh0)lh0.checked=(config.languages||[]).includes('hi');renderEvents();updateContact();refreshPhotos();renderReferenceEditor(form,config,()=>refresh());tuckAdvanced();}
/* The 150+ fine-tuning fields stay out of the way: one closed "Advanced" section at the very end. */
function tuckAdvanced(){const c=document.getElementById('reference-editor');if(!c)return;if(!c.closest('.advanced-wrap')){const d=document.createElement('details');d.className='editor-section advanced-wrap';d.innerHTML='<summary>Fine-tune every section (advanced)<small>Story, moments, UPI QR codes and every heading</small></summary>';const inner=document.createElement('div');inner.className='section-fields';c.before(d);inner.append(c);d.append(inner);}placeFunctions();}
/* Step 6 "The functions": the invitation's own festivities (name, date & time, dress code, photo) move out of the advanced section.
   renderReferenceEditor rebuilds its groups on every fill, so the previous copy is dropped first (no duplicate fields). */
function placeFunctions(){const host=$('#wz-functions'),c=$('#reference-editor');if(!host||!c)return;host.replaceChildren();const group=[...c.children].find(d=>/^Festivities/.test(d.querySelector('summary')?.textContent||''));if(!group)return;group.open=true;group.classList.add('wz-functions-group');const sum=group.querySelector('summary');if(sum)sum.textContent='Your functions · up to 4';for(const label of group.querySelectorAll('label')){const t=label.firstChild;if(t&&t.nodeType===3)t.textContent=t.textContent.replace(/^Event (\d+) · /,'Function $1 · ').replace(/dateISO$/,'date & time').replace(/dressCode$/,'dress code');const input=label.querySelector('[data-reference-path$=".dateISO"]');if(input&&!label.querySelector('.wz-hint')){const hint=document.createElement('small');hint.className='wz-hint';hint.textContent='Write it as year-month-day, then T and the 24-hour time, e.g. 2026-12-12T18:00';label.append(hint);}}host.append(group);}
function readRawEvents(){return [...$('#event-editor').children].map(row=>({time:row.querySelector('[data-field=time]').value,title:row.querySelector('[data-field=title]').value,description:row.querySelector('[data-field=description]').value}));}
function readForm(){const data=Object.fromEntries(new FormData(form));data.version=DEFAULTS.version;data.music=form.elements.music.checked;data.scratch=form.elements.scratch.checked;data.gallery=String(data.gallery||'').split('\n').map(s=>s.trim()).filter(Boolean);data.events=readRawEvents();if(!validDate(data.date))data.date=config.date;if(!validTime(data.time))data.time=config.time;data.reference=readReferenceEditor(form,config);syncReferenceWedding(config,data,data.reference);data.reference.events.forEach((event,index)=>{const input=form.querySelector('[data-reference-path="events.'+index+'.dateISO"]');if(input&&input.value!==event.dateISO)input.value=event.dateISO;});for(const key of ['date','time','timezone']){const field=form.elements[key];if(document.activeElement!==field)field.value=data[key];}if(data.message!==config.message)data.reference.content.invitationMessage=data.message;if(data.blessing!==config.blessing)data.reference.content.quote=data.blessing;data.languages=form.elements['lang-hi']?.checked?['hi']:[];return normalizeConfig(data);}
function renderEvents(events=config.events){const target=$('#event-editor');target.replaceChildren();events.forEach((event,index)=>{const row=document.createElement('div');row.className='event-edit';const head=document.createElement('div');head.className='event-edit-head';const title=document.createElement('span');title.textContent='Moment '+String(index+1).padStart(2,'0');const controls=document.createElement('div');controls.className='event-controls';for(const [symbol,label,action,disabled] of [['↑','Move moment '+(index+1)+' up','up',index===0],['↓','Move moment '+(index+1)+' down','down',index===events.length-1],['×','Remove moment '+(index+1),'remove',false]]){const button=document.createElement('button');button.type='button';button.textContent=symbol;button.setAttribute('aria-label',label);button.disabled=disabled;button.dataset.action=action;button.dataset.index=index;controls.append(button);}head.append(title,controls);row.append(head);const fields=document.createElement('div');fields.className='field-row';for(const [key,label,type,max] of [['time','Time','time',null],['title','Moment','text',70]]){const labelEl=document.createElement('label'),input=document.createElement('input');labelEl.append(label);input.type=type;input.value=event[key];input.dataset.field=key;input.required=true;input.setAttribute('aria-label',label+' for moment '+(index+1));if(max)input.maxLength=max;labelEl.append(input);fields.append(labelEl);}row.append(fields);const labelEl=document.createElement('label'),desc=document.createElement('textarea');labelEl.append('A little description');desc.rows=2;desc.maxLength=150;desc.dataset.field='description';desc.value=event.description;desc.setAttribute('aria-label','Description for moment '+(index+1));labelEl.append(desc);row.append(labelEl);target.append(row);});$('#add-event').disabled=events.length>=10;}
function sendPreview(){if(!preview.getAttribute('src')){/* first render: load the invitation straight with the current details (no extra page hop) */preview.src='reference/render.html'+(previewMark()?'?wm=1':'')+'#card='+encodeConfig(config);return;}preview.contentWindow?.postMessage({type:'wedcanvas:config',config},location.origin);}
function updateContact(){const email=form.elements.rsvpMethod.value==='email';$('#contact-label').textContent=email?'Your RSVP email address':'Your WhatsApp number, with country code';form.elements.rsvpContact.type=email?'email':'tel';form.elements.rsvpContact.placeholder=email?'you@example.com':'+91 98765 43210';$('#contact-help').textContent=`Guests review and send their reply in ${email?'their email app':'WhatsApp'}. Replies to your published link are also saved in your Guest RSVPs inbox.`;}
function refresh(save=true){config=readForm();updateContact();$('#theme-label').textContent=eventThemes[config.theme].name.toUpperCase();refreshPhotos();$('#open-full').href=invitationUrl(config,location.href);$('#compare-designs').href='reference/collection.html#card='+encodeConfig(config);sendPreview();updatePrices();if(save){try{localStorage.setItem(STORAGE,JSON.stringify(config));$('#save-status').textContent='Draft saved on this device';queueCloudSave();}catch{$('#save-status').textContent='Draft not saved · create a link to keep it';}}}
form.addEventListener('input',event=>{clearFieldError(event.target);clearTimeout(updateTimer);updateTimer=setTimeout(()=>refresh(),220);});form.addEventListener('change',event=>{clearTimeout(updateTimer);refresh();if(event.target.name==='theme')preview.contentWindow?.postMessage({type:'wedcanvas:replay'},location.origin);});form.addEventListener('submit',e=>e.preventDefault());
$('#add-event').addEventListener('click',()=>{const events=readRawEvents();if(events.length>=10)return;events.push({time:form.elements.time.value||config.time,title:'A special moment',description:''});renderEvents(events);refresh();$('#event-editor').lastElementChild.querySelector('[data-field=title]').focus();});
$('#event-editor').addEventListener('click',event=>{const button=event.target.closest('button[data-action]');if(!button)return;const events=readRawEvents(),index=Number(button.dataset.index),action=button.dataset.action;if(action==='remove')events.splice(index,1);else{const other=index+(action==='up'?-1:1);if(other>=0&&other<events.length)[events[index],events[other]]=[events[other],events[index]];}renderEvents(events);refresh();});
window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===preview.contentWindow&&event.data?.type==='wedcanvas:ready')sendPreview();});preview.addEventListener('load',sendPreview);$('#replay-preview').addEventListener('click',()=>preview.contentWindow?.postMessage({type:'wedcanvas:replay'},location.origin));
/* Inline errors: the message sits next to the field (described by it), the field's step is shown and the field gets focus. */
function clearFieldError(input){if(!input||!input._wzErr)return;input._wzErr.remove();input._wzErr=null;input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');}
function friendlyMessage(input){if(input.validity?.valueMissing){const name=(input.closest('label')?.querySelector('.wz-label')?.firstChild?.textContent||'').trim();return name?'Please add '+name.charAt(0).toLowerCase()+name.slice(1)+' to continue.':'This is needed to continue.';}return input.validationMessage||'Please check this field.';}
function showFieldError(input,message){clearFieldError(input);const step=wizard?wizard.panelOf(input):0;if(step&&wizard.current!==step)wizard.show(step,{focus:false});input.closest('details')?.setAttribute('open','');const err=document.createElement('span');err.className='wz-error';err.id='wz-err-'+(++errorSeq);err.setAttribute('aria-hidden','true');err.textContent=message||friendlyMessage(input);const host=input.type==='radio'?input.closest('fieldset')||input.parentElement:input.closest('label')||input.parentElement;host.append(err);input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',err.id);input._wzErr=err;try{input.focus();}catch{}}
const hiddenField=el=>{const h=el.closest('[hidden]');return !!h&&!h.matches('.wz-panel');};
/* validate(scope): the whole form before a link is made or paid for, or one wizard step (report:false only checks). */
function validate(scope=form,{report=true,skipHidden=false}={}){const inScope=el=>!!el&&scope.contains(el)&&!(skipHidden&&hiddenField(el));const fail=(input,message)=>{if(message)input.setCustomValidity(message);if(report)showFieldError(input,message||friendlyMessage(input));return false;};for(const input of form.querySelectorAll('input,textarea,select')){if(!inScope(input))continue;input.setCustomValidity('');clearFieldError(input);if(input.dataset.referencePath?.endsWith('.dateISO')&&!validReferenceDate(input.value))input.setCustomValidity('Enter a valid event date and time, such as 2026-12-12T18:00:00+05:30.');if(!input.checkValidity())return fail(input,input.validity.customError?input.validationMessage:'');}for(const key of ['photoUrl','groomPhoto','bridePhoto','venuePhotoUrl']){const input=form.elements[key];if(inScope(input)&&input.value&&!safeImageUrl(input.value))return fail(input,'Upload a photograph or use a direct HTTPS image URL.');}const gallery=form.elements.gallery;const urls=gallery.value.split('\n').map(s=>s.trim()).filter(Boolean);const galleryLimit=window.__ewGalleryLimit||4;if(inScope(gallery)&&(urls.length>galleryLimit||urls.some(u=>!safeImageUrl(u))))return fail(gallery,urls.length>galleryLimit?('Add up to '+galleryLimit+' HTTPS image URLs, one per line.'):'Add only direct HTTPS image URLs, one per line.');const rsvp=form.elements.rsvpContact;const realUser=window.EWAuth?.session();if(realUser&&!realUser.fake&&!rsvpDestination(config)){if(inScope(rsvp))return fail(rsvp,config.rsvpContact?(config.rsvpMethod==='email'?'Enter a valid email address.':'Include the country code, for example +91 9876543210.'):'Add your WhatsApp number or email so guests can send their replies.');}if(config.rsvpContact&&!rsvpDestination(config)&&inScope(rsvp))return fail(rsvp,config.rsvpMethod==='email'?'Enter a valid email address.':'Include the country code, for example +91 9876543210.');const video=form.elements.videoUrl;if(inScope(video)&&video.value.trim()&&!videoEmbedUrl(video.value.trim()))return fail(video,'Paste a YouTube, Instagram or Facebook video link.');return true;}
/* A wizard step may be left going forward when its visible fields are valid. */
function validateStep(n,{report=true}={}){const panel=document.querySelector('.wz-panel[data-step="'+n+'"]');if(!panel||!form.contains(panel))return true;if(report){clearTimeout(updateTimer);refresh();}return validate(panel,{report,skipHidden:true});}
function openSigninGate(){$('#signin-dialog').showModal();}
async function openShare(){clearTimeout(updateTimer);refresh();if(!validate())return;let sessionUser=window.EWAuth?.session();if(!sessionUser||sessionUser.fake){/* no account yet: it is created only after the payment succeeds, from the fields on the Review step */if(wizard&&wizard.current!==REVIEW_STEP){wizard.go(REVIEW_STEP);return;}if(!collectSignup())return;openPayDialog();return;}payState.signup=null;let entitled=!!sessionUser?.admin;if(!entitled){try{const r=await fetch('/api/entitlements');if(r.ok){const d=await r.json();entitled=!!d.admin||(d.designs||[]).includes(config.theme)||(d.designs||[]).includes('ALL');}}catch{}}if(!entitled){openPayDialog();return;}publishShare();}
async function publishShare(){let url=invitationUrl(config,location.href);if(!browserOnlySession()){try{const response=await fetch('/api/invitations'+(latestInvitationId?'?replace='+latestInvitationId:''),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(config)});const result=await response.json();if(!response.ok)throw Error(result.error);latestInvitationId=result.id;url=new URL(result.url,location.href).href}catch(error){$('#save-status').textContent=error.message||'Using a complete invitation link.'}}$('#share-url').value=url;$('#share-open').href=url;$('#copy-status').textContent='';const warnings=[];if(config.audioUrl.startsWith('local-audio:'))warnings.push('The uploaded song is stored on this device. Sign in and upload it before sharing with guests on other devices.');if(!rsvpDestination(config))warnings.push('Add an RSVP contact if you want guests to send replies.');if(config.address===DEFAULTS.address)warnings.push('The sample venue address is still present. Add your actual address before sharing.');$('#share-alerts').textContent=warnings.join(' ');$('#share-workspace').hidden=false;$('#share-dialog').showModal();}
const signOutBtn=$('#signout-top');if(signOutBtn){const su=window.EWAuth?.session();if(su&&!su.fake){signOutBtn.hidden=false;signOutBtn.addEventListener('click',()=>window.EWAuth.signOut());}}
$('#share-top').addEventListener('click',primaryAction);$('#share-bottom').addEventListener('click',payAction);$('#share-close').addEventListener('click',()=>$('#share-dialog').close());$('#signin-close').addEventListener('click',()=>$('#signin-dialog').close());$('#copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#share-url').value);$('#copy-status').textContent='Invitation link copied.';}catch{$('#share-url').focus();$('#share-url').select();$('#copy-status').textContent='Select and copy the highlighted link manually.';}});
$('#reset-draft').addEventListener('click',()=>$('#reset-dialog').showModal());$('#reset-cancel').addEventListener('click',()=>$('#reset-dialog').close());$('#reset-confirm').addEventListener('click',()=>{songUploadVersion++;const songInput=$('[data-song-upload]');songInput.disabled=false;songInput.value='';config=normalizeConfig(DEFAULTS);fillForm();refresh();preview.contentWindow?.postMessage({type:'wedcanvas:replay'},location.origin);$('#reset-dialog').close();});
fillForm();refresh(false);

// Cloud drafts are owned by the signed-in visitor. Legacy device drafts remain recoverable.
let cloudReady=false,cloudSaving=false,cloudPending=false,cloudTimer;
function queueCloudSave(){cloudPending=true;if(cloudReady){clearTimeout(cloudTimer);cloudTimer=setTimeout(saveCloud,500);}}
async function saveCloud(){if(!cloudReady||cloudSaving||!cloudPending)return;cloudSaving=true;cloudPending=false;const snapshot=JSON.stringify(config);try{const r=await fetch('/api/studio',{method:'PUT',headers:{'Content-Type':'application/json'},body:snapshot});if(!r.ok)throw Error();$('#save-status').textContent='Invitation saved to your account';updateCompletion();}catch{$('#save-status').textContent='Cloud save unavailable · device draft kept';}finally{cloudSaving=false;if(cloudPending)saveCloud();}}
if(typeof fetch==='function'&&!browserOnlySession()){const initial=JSON.stringify(config);fetch('/api/studio').then(async r=>{if(!r.ok)return;const data=await r.json();cloudReady=true;if(data.config&&!location.hash.includes('card=')&&JSON.stringify(config)===initial){/* A design picked on the homepage (?template=) wins over the saved draft's design, so the paywall charges for what was chosen. */config=normalizeConfig({...data.config,...(Object.hasOwn(eventThemes,selectedTheme)?{theme:selectedTheme}:{})});fillForm();refresh(false);$('#save-status').textContent='Invitation loaded from your account';}else if(cloudPending||location.hash.includes('card=')){cloudPending=true;saveCloud();}}).catch(()=>{});}

form.addEventListener('change',async event=>{
 const input=event.target,key=input.dataset.invitationUpload,file=input.files?.[0];if(!key||!file)return;
 const status=$('#'+key+'-status');input.disabled=true;status.textContent='Uploading photograph…';
 try{if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP photograph.');let result;if(browserOnlySession()){result={url:await prepareLocalPhoto(file)};}else{const data=new FormData();data.set('file',await compressPhoto(file));const response=await fetch('/api/invitation-photos',{method:'POST',body:data});result=await response.json();if(!response.ok)throw Error(result.error||'Sign in to upload, or open the demo studio.');}form.elements[key].value=result.url;refresh();status.textContent='Photo uploaded. Your invitation preview is updated.';}catch(error){status.textContent=error.message;}finally{input.disabled=false;input.value='';}
});
form.addEventListener('click',event=>{const button=event.target.closest('[data-clear-image]');if(!button)return;const key=button.dataset.clearImage;form.elements[key].value='';$('#'+key+'-status').textContent='Photo removed from this invitation.';refresh();});

form.addEventListener('change',async event=>{const input=event.target;if(!input.matches('[data-song-upload]')||!input.files?.[0])return;input.disabled=true;const uploadVersion=++songUploadVersion,file=input.files[0],status=$('#song-status');status.textContent='Uploading song…';try{await validateSong(file);if(uploadVersion!==songUploadVersion)return;let url;if(browserOnlySession())url=await prepareLocalSong(file);else{const data=new FormData();data.set('file',file);const r=await fetch('/api/invitation-audio',{method:'POST',body:data});const result=await r.json();if(!r.ok)throw Error(result.error||'Song upload failed.');url=result.url;}if(uploadVersion!==songUploadVersion)return;form.elements.audioUrl.value=url;form.elements.audioName.value=file.name;form.elements.music.checked=true;refresh();status.textContent=file.name+(url.startsWith('local-audio:')?' · Saved on this device. Sign in and upload to share across devices.':' · Guests will hear this song.');}catch(error){if(uploadVersion===songUploadVersion)status.textContent=error.message;}finally{if(uploadVersion===songUploadVersion){input.disabled=false;input.value='';}}});
$('#remove-song').addEventListener('click',()=>{songUploadVersion++;const input=$('[data-song-upload]');input.disabled=false;input.value='';form.elements.audioUrl.value='';form.elements.audioName.value='';refresh();$('#song-status').textContent='Song removed. Upload a song to add invitation music.';});

// Design unlock payments. Prices and available gateways come from /api/pricing.
const payState={design:null,pricing:null,addon:null,coupon:null,signup:null};
const GATEWAY_LABELS={razorpay:'Razorpay · UPI, cards & netbanking',cashfree:'Cashfree · UPI, cards & netbanking',phonepe:'PhonePe · UPI & cards',payu:'PayU · UPI, cards & netbanking'};
const inr=p=>'₹'+(p/100).toLocaleString('en-IN');
function resetCoupon(){payState.coupon=null;if($('#pay-coupon'))$('#pay-coupon').value='';if($('#pay-coupon-msg'))$('#pay-coupon-msg').textContent='';}
function openPayDialog(){resetCoupon();const acctPhone=($('#acct-phone')?.value||'').replace(/\D/g,'').slice(-10);if(acctPhone&&!$('#pay-phone').value)$('#pay-phone').value=acctPhone;payState.design=config.theme;payState.addon=null;$('#pay-error').textContent='';$('#pay-design-line').textContent='Unlock '+eventThemes[config.theme].name+' to create your shareable invitation link and QR.';$('#pay-dialog').showModal();loadPricing();}
async function loadPricing(){try{const r=await fetch('/api/pricing');if(!r.ok)throw Error();payState.pricing=await r.json();renderPay();}catch{$('#pay-error').textContent='Could not load prices. Please close and try again.';}}
function renderPay(){const d=payState.pricing;if(!d)return;const row=payState.addon?(d.addons||[]).find(x=>x.id===payState.addon):d.designs.find(x=>x.id===payState.design);if(row){$('#pay-regular').textContent=row.launchActive?inr(row.regular):'';$('#pay-current').textContent=inr(row.current);const save=$('#pay-save');if(row.launchActive&&row.regular>row.current){save.hidden=false;save.textContent='Save '+inr(row.regular-row.current);}else save.hidden=true;$('#pay-offer-note').textContent=row.launchActive?'🎉 Grand Opening launching price · limited period':'';const payNow=payState.coupon?payState.coupon.final:row.current;if(payState.coupon){$('#pay-regular').textContent=inr(row.current);$('#pay-current').textContent=inr(payNow);}$('#pay-now').textContent='Pay '+inr(payNow)+(payState.addon?' & add':' & unlock');}
 const pass=d.designs.find(x=>x.id==='ALL'),passBtn=$('#pay-pass');if(pass&&payState.design!=='ALL'&&!payState.addon){passBtn.hidden=false;passBtn.textContent='Or unlock ALL 11 designs with the All-Designs Pass — '+inr(pass.current)+(pass.launchActive?' (was '+inr(pass.regular)+')':'');}else passBtn.hidden=true;
 const ready=d.gateways||[];$('#pay-soon').hidden=ready.length>0;$('#pay-body').hidden=ready.length===0;
 const list=$('#pay-gateways');list.replaceChildren();ready.forEach((g,i)=>{const label=document.createElement('label');label.className='ewp-gateway';const radio=document.createElement('input');radio.type='radio';radio.name='ewp-gateway';radio.value=g;if(i===0)radio.checked=true;const span=document.createElement('span');span.textContent=GATEWAY_LABELS[g]||g;label.append(radio,span);list.append(label);});}
$('#pay-pass').addEventListener('click',()=>{resetCoupon();payState.addon=null;payState.design='ALL';$('#pay-design-line').textContent='The All-Designs Pass unlocks every design for your wedding.';renderPay();});
$('#pay-close').addEventListener('click',()=>$('#pay-dialog').close());
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.append(s);});}
function onPaid(vd){$('#pay-dialog').close();if(vd&&vd.signedIn){/* the account now exists and is signed in: open the invitation workspace */location.replace('/dashboard');return;}if(payState.addon){payState.addon=null;$('#save-status').textContent='Payment received — your add-on is active.';initAddons();return;}$('#save-status').textContent='Payment received — your design is unlocked.';publishShare();}
async function startPayment(){const phone=$('#pay-phone').value.replace(/\D/g,''),err=$('#pay-error');if(!/^[6-9]\d{9}$/.test(phone)){err.textContent='Please enter a valid 10-digit mobile number.';return;}const gateway=document.querySelector('input[name="ewp-gateway"]:checked')?.value;if(!gateway){err.textContent='Please choose a payment option.';return;}const btn=$('#pay-now');btn.disabled=true;err.textContent='';
 try{const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({designId:payState.addon||payState.design,gateway,phone,coupon:payState.coupon?payState.coupon.code:undefined,signup:payState.signup||undefined})});const data=await r.json();if(!r.ok)throw Error(data.error||'Payment could not be started.');
if(data.relogin){/* an earlier unpaid account was recognised and signed in: continue as that account */await window.EWAuth.refresh();payState.signup=null;document.body.classList.remove('mode-guest');document.body.classList.add('mode-unpaid');btn.disabled=false;return startPayment();}
  if(data.gateway==='razorpay'){await loadScript('https://checkout.razorpay.com/v1/checkout.js');const rzp=new window.Razorpay({key:data.key_id,order_id:data.order_id,amount:data.amount,currency:'INR',name:'Easy Wedding',description:'Invitation design unlock',prefill:{contact:phone},theme:{color:'#75152e'},handler:async response=>{try{const v=await fetch('/api/checkout/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:data.orderId,paymentId:response.razorpay_payment_id,signature:response.razorpay_signature})});const vd=await v.json();if(!v.ok)throw Error(vd.error||'Payment verification failed.');onPaid(vd);}catch(e){err.textContent=e.message;btn.disabled=false;if(!$('#pay-dialog').open)$('#pay-dialog').showModal();}},modal:{ondismiss:()=>{btn.disabled=false;if(!$('#pay-dialog').open)$('#pay-dialog').showModal();}}});$('#pay-dialog').close();rzp.open();}
  else if(data.gateway==='cashfree'){sessionStorage.setItem(payState.addon?'ew_addon_after_pay':'ew_publish_after_pay','1');await loadScript('https://sdk.cashfree.com/js/v3/cashfree.js');const cf=window.Cashfree({mode:data.mode==='live'?'production':'sandbox'});cf.checkout({paymentSessionId:data.payment_session_id,redirectTarget:'_self'});}
  else if(data.gateway==='phonepe'){sessionStorage.setItem(payState.addon?'ew_addon_after_pay':'ew_publish_after_pay','1');location.href=data.redirect_url;}
  else if(data.gateway==='payu'){sessionStorage.setItem(payState.addon?'ew_addon_after_pay':'ew_publish_after_pay','1');const f=document.createElement('form');f.method='POST';f.action=data.action;for(const [k,v] of Object.entries(data.fields)){const i=document.createElement('input');i.type='hidden';i.name=k;i.value=v;f.append(i);}document.body.append(f);f.submit();}
 }catch(e){err.textContent=e.message;btn.disabled=false;}}
$('#pay-now').addEventListener('click',startPayment);
$('#pay-coupon-apply').addEventListener('click',async()=>{const msg=$('#pay-coupon-msg'),code=($('#pay-coupon').value||'').trim();if(!code){payState.coupon=null;msg.textContent='';renderPay();return;}msg.textContent='Checking…';
try{const r=await fetch('/api/coupon/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,designId:payState.addon||payState.design})});const d=await r.json();if(!r.ok)throw Error(d.error||'This coupon is not valid.');payState.coupon=d;msg.textContent='Coupon '+d.code+' applied — you save '+inr(d.discount)+'.';renderPay();}
catch(e){payState.coupon=null;msg.textContent=e.message;renderPay();}});
(async()=>{const q=new URLSearchParams(location.search),orderId=q.get('order_id'),payFlag=q.get('payment');if(!orderId&&!payFlag)return;history.replaceState(null,'',location.pathname);
 const afterPay=()=>{if(sessionStorage.getItem('ew_addon_after_pay')){sessionStorage.removeItem('ew_addon_after_pay');$('#save-status').textContent='Payment received — your add-on is active.';initAddons();}else if(sessionStorage.getItem('ew_publish_after_pay')){sessionStorage.removeItem('ew_publish_after_pay');openShare();}};
 if(orderId){try{const v=await fetch('/api/checkout/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId})});if(v.ok){const vd=await v.json().catch(()=>({}));if(vd.signedIn){location.replace('/dashboard');return;}$('#save-status').textContent='Payment received — thank you!';afterPay();}}catch{}}
 else if(payFlag==='success'){$('#save-status').textContent='Payment received — thank you!';afterPay();}
 else if(payFlag==='failed'){$('#save-status').textContent='Payment was not completed. You can try again when you create your link.';}})();

// Advanced add-ons (section 07). Prices from /api/pricing, ownership from /api/entitlements.
const ADDON_NAMES={'addon-personal':'Personal Invitations','addon-language-hi':'Extra Language — Hindi','addon-pdf':'Print-ready PDF','addon-gallery':'Premium Gallery','addon-shortlink':'Custom Short Link'};
const ADDON_DESCS={'addon-personal':'A special link for every guest, with their own name on the invitation — plus who opened it and who replied.','addon-language-hi':'Guests can also read your invitation in Hindi.','addon-pdf':'A beautiful printable PDF card of your invitation, with your link and QR.','addon-gallery':'Gallery photos: 4 are FREE with every design. With this add-on, you get 12 gallery photos.','addon-shortlink':'Your own short address, like easywedding.in/rahul-weds-seema.'};
let ewEntitlements=[],ewMyInvitations=[];
const ewOwns=id=>ewEntitlements.includes(id)||(id==='addon-personal'&&ewEntitlements.includes('ALL'));
function openAddonPay(id){resetCoupon();payState.addon=id;payState.design=null;$('#pay-error').textContent='';$('#pay-design-line').textContent='Add '+(ADDON_NAMES[id]||'this add-on')+' to your wedding — one-time payment, yours with this account.';$('#pay-dialog').showModal();loadPricing();}
function fillInviteSelect(sel){if(!sel)return;sel.replaceChildren();if(!ewMyInvitations.length){const o=document.createElement('option');o.textContent='Publish your invitation first';o.value='';sel.append(o);return;}for(const inv of ewMyInvitations){const o=document.createElement('option');o.value=inv.id;o.textContent=(inv.partner1||'')+' & '+(inv.partner2||'');sel.append(o);}}
function updatePdfLink(){const sel=$('#pdf-invite'),a=$('#pdf-open');if(!sel||!a)return;a.href=sel.value?('/pdf?id='+sel.value):'/pdf';}
function updateSlugStatus(msg){const st=$('#slug-status');if(st)st.textContent=msg||'';}
function previewMark(){const e=window.__ewEnt||[];return !(e.includes('ALL')||e.includes(config.theme));}
/* Owners see their invitation without the preview watermark. */
async function loadEntitlements(){try{const r=await fetch('/api/entitlements');if(r.ok){const d=await r.json();ewEntitlements=d.admin?['ALL']:(d.designs||[]);}}catch{}window.__ewEnt=ewEntitlements;if(/[?]wm=1/.test(preview.getAttribute('src')||'')&&!previewMark())preview.src=preview.getAttribute('src').replace('?wm=1','');}
loadEntitlements();
async function initAddons(){
 window.__ewGalleryLimit=12;
 const list=$('#addons-list');if(!list)return;
 let pricing=null;try{const r=await fetch('/api/pricing');if(r.ok)pricing=await r.json();}catch{}
 try{const r=await fetch('/api/entitlements');if(r.ok){const d=await r.json();ewEntitlements=d.admin?['ALL','addon-personal','addon-language-hi','addon-pdf','addon-gallery','addon-shortlink']:(d.designs||[]);}}catch{}
 window.__ewEnt=ewEntitlements;
 list.replaceChildren();
 for(const a of (pricing?.addons||[])){
  const card=document.createElement('div');card.className='addon-card';
  const info=document.createElement('div');const h=document.createElement('strong');h.textContent=ADDON_NAMES[a.id]||a.id;const p=document.createElement('p');p.textContent=ADDON_DESCS[a.id]||'';info.append(h,p);
  const right=document.createElement('div');right.className='addon-buy';
  if(ewOwns(a.id)){const s=document.createElement('span');s.className='addon-owned';s.textContent=(a.id==='addon-personal'&&ewEntitlements.includes('ALL')&&!ewEntitlements.includes('addon-personal'))?'Included with your Pass ✓':'Unlocked ✓';right.append(s);}
  else{const b=document.createElement('button');b.type='button';b.className='primary';b.textContent='Add · '+inr(a.current);b.addEventListener('click',()=>openAddonPay(a.id));right.append(b);}
  card.append(info,right);list.append(card);
 }
 const lh=form.elements['lang-hi'];if(lh){lh.disabled=!ewOwns('addon-language-hi');lh.closest('label')?.classList.toggle('is-locked',lh.disabled);}
 try{const r=await fetch('/api/my-invitations');if(r.ok){const d=await r.json();ewMyInvitations=d.invitations||[];}}catch{}
 fillInviteSelect($('#slug-invite'));fillInviteSelect($('#pdf-invite'));updatePdfLink();
 try{const r=await fetch('/api/short-links');if(r.ok){const d=await r.json();const mine=(d.links||[])[0];if(mine){$('#slug-input').value=mine.slug;const sel=$('#slug-invite');if(sel)sel.value=mine.invitationId;updateSlugStatus('Your short link is live: easywedding.in/'+mine.slug);}}}catch{}
}
$('#pdf-invite')?.addEventListener('change',updatePdfLink);
$('#slug-save')?.addEventListener('click',async()=>{
 const slug=($('#slug-input')?.value||'').trim().toLowerCase(),invitationId=$('#slug-invite')?.value||'';
 if(!ewOwns('addon-shortlink')){updateSlugStatus('Unlock the Custom Short Link add-on first (above).');return;}
 if(!invitationId){updateSlugStatus('Publish your invitation first, then save your short link.');return;}
 updateSlugStatus('Saving…');
 try{const r=await fetch('/api/short-links',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,invitationId})});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not save.');updateSlugStatus('Your short link is live: easywedding.in/'+d.slug);}catch(e){updateSlugStatus(e.message);}
});
initAddons();

// ---- Wizard flow: steps 1-7 details (live preview) → 8 review, account & payment → 9 your invitation (owners) ----
let latestInvitationId=null;
function isOwner(){return document.body.classList.contains('mode-owner');}
function primaryAction(){if(isOwner()){updateOwnerLink();return;}openPreviewStep();}
/* The pay button on the Review step: owners save their link, everyone else goes to account + payment. */
function payAction(){if(isOwner()){updateOwnerLink();return;}clearTimeout(updateTimer);refresh();openShare();}
/* Full-screen preview (watermarked until the design is paid for). Free for everyone, no checks needed. */
/* Inside the Android app (window.EWApp bridge) the app shows the preview in its own full-screen WebView instead. */
const PREVIEW_TIMEOUT_MS=10000;let previewTimer=null;
function previewStatus(){let s=$('#pv-status');if(!s){s=document.createElement('div');s.id='pv-status';s.className='pv-status';s.setAttribute('role','status');$('#preview-full').before(s);}return s;}
function previewLoaded(){const frame=$('#preview-full');if(frame.dataset.loading!=='1')return;frame.dataset.loading='';clearTimeout(previewTimer);const s=$('#pv-status');if(s){s.hidden=true;s.replaceChildren();}}
function previewSlow(href){const frame=$('#preview-full');if(frame.dataset.loading!=='1')return;const s=previewStatus(),p=document.createElement('p'),a=document.createElement('a');p.textContent='Your preview is taking longer than usual.';a.href=href;a.target='_blank';a.rel='noopener';a.className='primary pv-newtab';a.textContent='Open preview in a new tab';s.replaceChildren(p,a);s.hidden=false;s.classList.add('pv-slow');}
function openPreviewStep(){clearTimeout(updateTimer);refresh();const src='reference/render.html'+(previewMark()?'?wm=1':'')+'#card='+encodeConfig(config);if(window.EWApp&&typeof window.EWApp.openPreview==='function'&&window.EWApp.openPreview(new URL(src,location.href).href))return;
 $('#pv-title').textContent=eventThemes[config.theme].name+' · your preview';$('#pv-continue').textContent='Make it yours →';$('#pv-continue').hidden=isOwner();
 const frame=$('#preview-full'),dialog=$('#preview-dialog'),status=previewStatus();status.classList.remove('pv-slow');status.textContent='Loading your preview…';status.hidden=false;
 frame.dataset.loading='1';clearTimeout(previewTimer);previewTimer=setTimeout(()=>previewSlow(new URL(src,location.href).href),PREVIEW_TIMEOUT_MS);frame.src=src;
 if(typeof dialog.showModal==='function'){try{dialog.showModal();}catch{dialog.setAttribute('open','');}}else dialog.setAttribute('open','');}
$('#preview-full').addEventListener('load',previewLoaded);
$('#pv-back').addEventListener('click',()=>{$('#preview-dialog').close();});
$('#pv-continue').addEventListener('click',()=>{$('#preview-dialog').close();openShare();});
$('#preview-dialog').addEventListener('close',()=>{clearTimeout(previewTimer);const frame=$('#preview-full');frame.dataset.loading='';frame.src='about:blank';});
async function migrateLocalPhotos(){
 const nodes=[...form.querySelectorAll('input,textarea')].filter(n=>typeof n.value==='string'&&n.value.includes('data:image/'));
 if(!nodes.length)return;
 const found=new Set();for(const n of nodes)for(const m of n.value.matchAll(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g))found.add(m[0]);
 const map=new Map();let done=0;
 for(const dataUrl of found){
  $('#save-status').textContent='Saving your photos… '+(++done)+' of '+found.size;
  const blob=await (await fetch(dataUrl)).blob();const ext=blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg';
  const data=new FormData();data.set('file',new File([blob],'photo.'+ext,{type:blob.type}));
  const r=await fetch('/api/invitation-photos',{method:'POST',body:data});const result=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(result.error||'A photo could not be saved. Please upload it again.');
  map.set(dataUrl,result.url);
 }
 for(const n of nodes){let v=n.value;for(const [from,to] of map)v=v.split(from).join(to);n.value=v;}
 refresh();
}
function collectSignup(){
const err=$('#acct-error'),name=($('#acct-name').value||'').trim(),email=($('#acct-email').value||'').trim().toLowerCase(),pass=$('#acct-pass').value||'';
const stop=(message,field)=>{err.textContent=message;if(wizard&&wizard.current!==REVIEW_STEP)wizard.show(REVIEW_STEP,{focus:false});const input=$(field);if(input){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','acct-error');try{input.focus();}catch{}}return false;};
err.textContent='';for(const id of ['#acct-name','#acct-email','#acct-pass'])$(id)?.removeAttribute('aria-invalid');
if(!name)return stop('Please enter your name for the account.','#acct-name');
if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))return stop('Please enter a valid email address.','#acct-email');
if(pass.length<8)return stop('Choose a password of at least 8 characters.','#acct-pass');
payState.signup={name,email,password:pass};
return true;
}
function setOverviewLink(url){$('#ov-link').value=url;$('#ov-open').href=url;$('#ov-wa').href='https://wa.me/?text='+encodeURIComponent('You are invited! Open our wedding invitation: '+url);renderQr(url);}
async function renderQr(url){try{const img=$('#ov-qr');img.src=await window.QRCode.toDataURL(url,{margin:1,width:480});img.hidden=false;const dl=$('#ov-qr-dl');if(dl){dl.href=img.src;dl.hidden=false;}}catch{}}
async function updateOwnerLink(){
 clearTimeout(updateTimer);refresh();if(!validate())return;const st=$('#ov-status');st.textContent='Saving…';
 try{const r=await fetch('/api/invitations'+(latestInvitationId?'?replace='+latestInvitationId:''),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(config)});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not update the link.');latestInvitationId=d.id;setOverviewLink(new URL(d.url,location.href).href);st.textContent='Saved — your guests see the latest details at the same link.';}
 catch(e){st.textContent=e.message;}
}
function ownerSetup(owned){
 const root=$('#owner-overview');
 root.innerHTML='<p class="eyebrow">YOUR INVITATION · ACTIVE ✓</p><h3 id="ov-title"></h3><p class="ov-sub">Payment received — your account is active. Change anything in the steps above, then press Save &amp; update link.</p><label class="ov-label">Your share link<input id="ov-link" readonly placeholder="Your link appears here"></label><div class="ov-actions"><button id="ov-copy" class="primary" type="button">Copy link</button><a id="ov-wa" class="secondary" target="_blank" rel="noopener">Share on WhatsApp</a><a id="ov-open" class="secondary" target="_blank" rel="noopener">Open invitation ↗</a><button id="ov-update" class="secondary" type="button">Save &amp; update link</button></div><div class="ov-extra"><figure class="ov-qr-card"><img id="ov-qr" alt="QR code for your invitation" hidden width="120" height="120"><a id="ov-qr-dl" class="secondary" download="easy-wedding-invitation-qr.png" hidden>Download QR</a></figure><div class="ov-links"><a class="primary ov-dash" href="/dashboard">Open my dashboard</a><p><a href="/rsvps">Guest replies (RSVP)</a> · <a href="/guests">Guest list</a></p><p class="ov-sub">Log in any time at easywedding.in to change your details, photos and song — your link stays the same.</p></div></div><p id="ov-status" role="status"></p>';
 root.hidden=false;const locked=$('#wz-locked');if(locked)locked.hidden=true;
 const all=owned.includes('ALL');
 document.querySelectorAll('#theme-options .theme-card').forEach(card=>{const v=card.querySelector('input')?.value;card.hidden=!all&&!owned.includes(v);});$('#change-design')?.remove();
 const legend=document.querySelector('.theme-fieldset legend span');if(legend)legend.textContent=all?'Your designs':'Your template';
 const help=document.querySelector('.theme-help');if(help)help.hidden=true;const cmp=$('#compare-designs');if(cmp)cmp.hidden=true;
 /* owners of more than one design switch between them in step 1 */
 const fieldset=document.querySelector('.theme-fieldset');if(fieldset)fieldset.hidden=[...document.querySelectorAll('#theme-options .theme-card')].filter(c=>!c.hidden).length<=1;
 if(!all&&!owned.includes(config.theme)){config=normalizeConfig({...config,theme:owned[0]});fillForm();refresh(false);}
 $('#ov-title').textContent=eventThemes[config.theme].name;
 form.addEventListener('change',()=>{$('#ov-title').textContent=eventThemes[config.theme].name;});
 $('#ov-copy').addEventListener('click',async()=>{const st=$('#ov-status');try{await navigator.clipboard.writeText($('#ov-link').value);st.textContent='Link copied.';}catch{$('#ov-link').select();st.textContent='Select and copy the highlighted link.';}});
 $('#ov-update').addEventListener('click',updateOwnerLink);
 $('#share-top').textContent='Save & update link';$('#share-bottom').textContent='Save & update link';
 const home=document.querySelector('.header-actions a.secondary');if(home)home.hidden=true;
 fetch('/api/my-invitations').then(r=>r.ok?r.json():{invitations:[]}).then(d=>{const first=(d.invitations||[])[0];if(first){latestInvitationId=first.id;setOverviewLink(new URL('/invite?id='+first.id,location.href).href);}else{$('#ov-status').textContent='Setting up your invitation link…';migrateLocalPhotos().catch(()=>{}).then(()=>updateOwnerLink());}}).catch(()=>{});
}
async function initFlow(){
 if(new URLSearchParams(location.search).has('demo'))return;
 const path=location.pathname.replace(/\/+$/,'');
 let user=null,owned=[];
 try{const s=await (await fetch('/api/session')).json();user=s.user||null;}catch{}
 if(user){try{const r=await fetch('/api/entitlements');if(r.ok){const d=await r.json();owned=d.admin?['ALL']:(d.designs||[]).filter(x=>!x.startsWith('addon-'));}}catch{}}
 const entitled=owned.length>0;
 if(path==='/dashboard'){if(!user){location.replace('/login?next=%2Fdashboard');return;}if(!entitled){location.replace('/studio');return;}}
 const b=document.body;b.classList.toggle('mode-guest',!user);b.classList.toggle('mode-unpaid',!!user&&!entitled);b.classList.toggle('mode-owner',entitled);
 if(entitled){ownerSetup(owned);const title=$('#wz-title'),designName=$('#wz-design-name');if(title&&designName)title.replaceChildren('Your ',designName,' invitation.');const sub=$('.wz-sub');if(sub)sub.textContent='Change any step, then press Save & update link. Your link stays the same.';wizard?.setMode('owner');updatePrices();document.dispatchEvent(new CustomEvent('ew:owner'));return;}
 $('#share-top').textContent='Preview & continue →';
 const home=document.querySelector('.header-actions a.secondary');if(home)home.textContent='Home';
 if(user)$('#save-status').textContent='Finish your details and payment to activate your invitation.';
 updatePrices();
}

// ---- Prices: price chips beside the preview and on Review, the pay button, the phone bar ----
function updatePrices(){
 const theme=eventThemes[config.theme]||eventThemes['premium-original'],row=priceRow(payPricing,config.theme),chip=fillPriceChips(document,theme.name,row);
 const title=$('#wz-design-name');if(title)title.textContent=theme.name;
 const name=$('#pb-design'),price=$('#pb-price');
 if(name)name.textContent=theme.name;
 if(price){price.replaceChildren();if(chip.was){const s=document.createElement('s');s.textContent=chip.was;const b=document.createElement('b');b.textContent=' '+chip.now;price.append('One-time · ',s,b);}else price.append('One-time · '+chip.now);}
 if(!isOwner()){const pay=$('#share-bottom');if(pay)pay.textContent='Make it yours · '+chip.now+' →';}
 const bar=$('#pb-pay');if(bar)bar.textContent='Make it yours · '+chip.now;
}
if(typeof fetch==='function')fetch('/api/pricing').then(r=>r.ok?r.json():null).then(d=>{if(d){payPricing=d;updatePrices();}}).catch(()=>{});
form.addEventListener('change',event=>{if(event.target.name==='theme')updatePrices();});

// ---- Review summary (step 8) ----
function renderSummary(){
 const dl=$('#wz-summary');if(!dl)return;
 const photos=['photoUrl','groomPhoto','bridePhoto','venuePhotoUrl'].filter(k=>config[k]).length;
 let when=config.date,at=config.time;try{when=new Date(config.date+'T12:00:00Z').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});at=new Date('2000-01-01T'+config.time+':00Z').toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit',timeZone:'UTC'});}catch{}
 const rows=[['Names',[config.partner1,config.partner2].filter(Boolean).join(' & '),1],['Date',when+(at?' · '+at:''),2],['Place',[config.venue,config.city].filter(Boolean).join(', '),2],['Photos',photos+' of 4 added',3],['Song',config.audioUrl?'Yes · '+(config.audioName||'your song'):'Not added yet',4]];
 dl.replaceChildren();
 for(const [label,value,step] of rows){const row=document.createElement('div');row.className='wz-sum-row';const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=value||'—';const edit=document.createElement('button');edit.type='button';edit.className='wz-edit';edit.dataset.goto=String(step);edit.textContent='Edit';edit.setAttribute('aria-label','Edit '+label.toLowerCase());row.append(dt,dd,edit);dl.append(row);}
}
$('#wz-summary')?.addEventListener('click',event=>{const b=event.target.closest('[data-goto]');if(b)wizard?.show(Number(b.dataset.goto));});

// ---- Preview tabs: Invite (opens the card) | Opening (replays the opening) ----
let previewView='invite';
function setPreviewView(view){previewView=view;$('#wz-tab-invite')?.setAttribute('aria-pressed',String(view==='invite'));$('#replay-preview')?.setAttribute('aria-pressed',String(view==='opening'));}
$('#wz-tab-invite')?.addEventListener('click',()=>{setPreviewView('invite');preview.contentWindow?.postMessage({type:'wedcanvas:open'},location.origin);});
$('#replay-preview')?.addEventListener('click',()=>setPreviewView('opening'));
/* every edit reloads the preview at its cover; on the Invite view it opens again by itself */
window.addEventListener('message',event=>{if(previewView==='invite'&&event.origin===location.origin&&event.source===preview.contentWindow&&event.data?.type==='wedcanvas:ready')setTimeout(()=>preview.contentWindow?.postMessage({type:'wedcanvas:open'},location.origin),900);});
$('#wz-full')?.addEventListener('click',openPreviewStep);

// ---- The wizard itself ----
function rememberStep(n){try{localStorage.setItem(WIZARD_STORAGE,JSON.stringify({theme:config.theme,step:n}));}catch{}}
function savedStep(){try{const s=JSON.parse(localStorage.getItem(WIZARD_STORAGE)||'null');return s&&s.theme===config.theme&&s.step<DONE_STEP?Number(s.step)||0:0;}catch{return 0;}}
wizard=createWizard({validateStep,onStep:n=>{if(n===REVIEW_STEP)renderSummary();rememberStep(n);}});
function goStep(n){if(n===REVIEW_STEP&&wizard.current===REVIEW_STEP){payAction();return;}wizard.go(n);}
$('#pb-pay').addEventListener('click',()=>goStep(REVIEW_STEP));
$('#pb-preview')?.addEventListener('click',openPreviewStep);
updatePrices();
// ---- Owners: slim "N% complete" bar above the steps (GET /api/invitation-progress), refreshed after every cloud save ----
function updateCompletion(){
 if(!isOwner()||typeof fetch!=='function')return;
 fetch('/api/invitation-progress',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{
  if(!d||!Number.isFinite(Number(d.percent)))return;const card=$('#wz-card');if(!card)return;
  let box=$('#wz-complete');if(!box){box=document.createElement('div');box.id='wz-complete';box.className='wz-complete';box.innerHTML='<p class="wz-complete-text"></p><div class="wz-complete-bar" role="progressbar" aria-label="Invitation completion" aria-valuemin="0" aria-valuemax="100"><span></span></div>';card.prepend(box);}
  const pct=Math.max(0,Math.min(100,Math.round(Number(d.percent))));box.hidden=false;box.classList.toggle('done',!!d.complete);
  box.querySelector('.wz-complete-text').textContent=d.complete?'Your invitation is 100% complete.':'Your invitation is '+pct+'% complete';
  const bar=box.querySelector('.wz-complete-bar');bar.setAttribute('aria-valuenow',String(pct));bar.firstElementChild.style.width=pct+'%';
 }).catch(()=>{});
}
document.addEventListener('ew:owner',updateCompletion);
wizard.start(new URLSearchParams(location.search).get('step')?0:savedStep());
initFlow();

/* In the app (EWApp bridge present) the form's small status lines are easy to miss and the live-preview
   pane is hidden, so mirror every status update (photo/song upload, cloud save) into a big toast the
   couple cannot miss. Website behaviour is unchanged. */
if(window.EWApp){
  const toast=document.createElement('div');toast.id='app-toast';toast.setAttribute('role','status');
  document.body.appendChild(toast);let toastTimer;
  const showToast=text=>{const t=(text||'').trim();if(!t)return;toast.textContent=t;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),4000);};
  const watch=el=>{new MutationObserver(()=>showToast(el.textContent)).observe(el,{childList:true,characterData:true,subtree:true});};
  document.querySelectorAll('[id$="-status"]').forEach(watch);
}
