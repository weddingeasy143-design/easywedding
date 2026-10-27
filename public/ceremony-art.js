/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Scalable ceremonial ornaments: no baked-in text or low resolution cutouts. */
export const ceremonyMotifs={
 'ivory-arch':{label:'Ivory Jasmine',invocation:'',symbol:'lotus',ritual:'Seven vows. One beautiful beginning.'},
 'royal-prestige':{label:'Crimson Vows',invocation:'',symbol:'diya',ritual:'A royal welcome. A sacred promise.'},
 garden:{label:'Botanical Forever',invocation:'',symbol:'lotus',ritual:'Together through seven sacred steps.'},
 haldi:{label:'Golden Phere',invocation:'',symbol:'sun',ritual:'Seven promises around the sacred fire.'},
 mehndi:{label:'Peacock Promise',invocation:'',symbol:'mandala',ritual:'A beautiful promise of forever.'},
 sangeet:{label:'Wisteria Vows',invocation:'',symbol:'stars',ritual:'Our wedding. Our forever.'},
 reception:{label:'Champagne Forever',invocation:'',symbol:'stars',ritual:'Celebrate the beginning of our forever.'},
 'midnight-noor':{label:'Starlit Vows',invocation:'',symbol:'diya',ritual:'Sacred vows beneath a sky of stars.'},
 'blush-mehraab':{label:'Blush Lotus',invocation:'',symbol:'lotus',ritual:'Two hearts. Seven vows. A lifetime.'},
 'emerald-darbar':{label:'Sacred Courtyard',invocation:'',symbol:'mandala',ritual:'A celebration blessed with love.'}
};
const shapes={lotus:'<path d="M60 58C32 39 44 18 60 6c16 12 28 33 0 52Z"/><path d="M60 58C33 62 16 48 15 26c24-1 39 12 45 32ZM60 58c27 4 44-10 45-32-24-1-39 12-45 32Z"/><path d="M21 63h78M34 69h52"/>',diya:'<path d="M22 43h76c-6 22-20 28-38 28S28 65 22 43Z"/><path d="M60 39c-18-13-3-27 0-33 10 12 17 24 0 33Z"/><path d="M33 77h54M45 83h30"/>',sun:'<circle cx="60" cy="43" r="18"/>'+Array.from({length:12},(_,i)=>'<path transform="rotate('+i*30+' 60 43)" d="M60 13V3"/>').join(''),mandala:Array.from({length:8},(_,i)=>'<ellipse transform="rotate('+i*45+' 60 43)" cx="60" cy="29" rx="9" ry="20"/>').join('')+'<circle cx="60" cy="43" r="6"/>',stars:'<path d="m60 8 6 25 25 6-25 6-6 25-6-25-25-6 25-6Z"/><path d="m99 8 3 9 9 3-9 3-3 9-3-9-9-3 9-3ZM20 56l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/>'};
export function ornament(theme){const m=ceremonyMotifs[theme]||ceremonyMotifs.garden;return '<svg class="ceremony-symbol" viewBox="0 0 120 90" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shapes[m.symbol]+'</svg>';}
