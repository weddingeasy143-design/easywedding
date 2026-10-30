import QRCode from 'qrcode-core';
import {invitationQRCode} from '../../public/reference-qr.js';
// The browser build of qrcode's toDataURL() demands a canvas element and
// rejects without one, and its toString() promise never settles inside the
// bundled app — both left the Share section's QR box blank forever. Build
// the QR matrix with QRCode.create() (pure data, no canvas, no promise)
// and render the SVG ourselves, returned as a data URL for the <img>.
const toDataURL=(value:string,options:any)=>invitationQRCode(value,options,async(text:string,settings:any)=>{
 const qr=(QRCode as any).create(text,{errorCorrectionLevel:'M'});
 const size=qr.modules.size,data=qr.modules.data;
 const margin=settings?.margin??2,dark=settings?.color?.dark??'#000000',light=settings?.color?.light??'#ffffff';
 const total=size+margin*2;let rects='';
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(data[y*size+x])rects+='<rect x="'+(x+margin)+'" y="'+(y+margin)+'" width="1" height="1"/>';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+total+' '+total+'" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="'+light+'"/><g fill="'+dark+'">'+rects+'</g></svg>';
 return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));
});
export default {...QRCode,toDataURL};
