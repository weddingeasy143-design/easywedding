import QRCode from 'qrcode-core';
import {invitationQRCode} from '../../public/reference-qr.js';
const toDataURL=(value:string,options:any)=>invitationQRCode(value,options,(text:string,settings:any)=>QRCode.toDataURL(text,settings));
export default {...QRCode,toDataURL};
