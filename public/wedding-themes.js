/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
import {eventThemes} from './event-themes.js';
const directions={
 'premium-original':['Premium Original','original royal invitation, silk curtain, carved doors, antique gold'],
 'ivory-arch':['Ivory Jasmine','ivory silk, jasmine mandap, golden sunrise'],
 'royal-prestige':['Crimson Vows','crimson roses, carved wood mandap, antique gold'],
 garden:['Botanical Forever','sage botanicals, orchid garden, soft cream'],
 haldi:['Golden Phere','saffron silk wedding mandap, sacred fire, amber light'],
 mehndi:['Peacock Promise','emerald, peacock feathers, lotus garden'],
 sangeet:['Wisteria Vows','lavender wisteria wedding canopy, silver lanterns'],
 reception:['Champagne Forever','champagne roses, modern garden mandap, candlelight'],
 'midnight-noor':['Starlit Vows','midnight wedding mandap, jasmine and starlight'],
 'blush-mehraab':['Blush Lotus','rose petal aisle, blush lotus, floral canopy'],
 'emerald-darbar':['Sacred Courtyard','terracotta columns, emerald silk, brass diyas']
};
export const weddingThemes=Object.fromEntries(Object.entries(directions).map(([key,[name,mood]])=>[key,{...eventThemes[key]||eventThemes['royal-prestige'],name,mood,composition:({'ivory-arch':'heirloom','royal-prestige':'royal',garden:'botanical',haldi:'sunlit',mehndi:'pavilion',sangeet:'wisteria',reception:'champagne','midnight-noor':'starlit','blush-mehraab':'romantic','emerald-darbar':'courtyard'})[key],botanicalImage:'floral/'+(['royal-prestige','blush-mehraab'].includes(key)?'rose':['sangeet','midnight-noor'].includes(key)?'lavender':'ivory')+'-botanical.webp',event:'Wedding',image:key==='premium-original'?'../ornaments/opening-realistic.webp':'wedding/'+key+'.webp',headline:'Together, we begin forever',message:'Together with our families, we invite you to celebrate our wedding and bless the beginning of our life together.'}]));
export function weddingPreset(theme){const key=Object.hasOwn(weddingThemes,theme)?theme:'ivory-arch',t=weddingThemes[key];return {theme:key,occasion:'The wedding celebration of',blessing:t.headline,message:t.message,events:[{time:'17:00',title:'Family welcome',description:'A warm welcome to our loved ones.'},{time:'18:00',title:'Baraat & wedding ceremony',description:'Join us as our families come together.'},{time:'19:00',title:'Jaimala & seven sacred vows',description:'A lifetime of love begins with seven promises.'},{time:'20:30',title:'Dinner & blessings',description:'Celebrate our new beginning with us.'}]};}
export const ganeshOptions={none:'No icon',gold:'Gold Ganesh',vermilion:'Vermilion Ganesh',ivory:'Ivory Ganesh'};
export function ganeshMarkup(selection){return selection&&selection!=='none'&&Object.hasOwn(ganeshOptions,selection)?'<img class="ganesh-icon ganesh-'+selection+'" src="assets/wedding/ganesh.png" alt="Lord Ganesh">':'';}
