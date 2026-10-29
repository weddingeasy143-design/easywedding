/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. */
/* Your data, your control: a complete ZIP of everything we hold about an account, and a permanent erase. (DPDP Act 2023 — rights to access and erasure.) */

const enc=new TextEncoder();
const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
export function crc32(bytes){let c=0xFFFFFFFF;for(let i=0;i<bytes.length;i++)c=CRC_TABLE[(c^bytes[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}

function dosDateTime(date){
 const t=((date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1))&0xFFFF;
 const d=(((date.getFullYear()-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate())&0xFFFF;
 return {time:t,date:d};
}

/* A small, dependency-free ZIP writer (method "store"). Entries are produced lazily, one file in memory at a time, so a large account never exhausts the Worker. */
export function zipStream(entries){
 const iterator=entries[Symbol.asyncIterator]?entries[Symbol.asyncIterator]():entries[Symbol.iterator]();
 const central=[];let offset=0,done=false;const stamp=dosDateTime(new Date());
 const u16=(v)=>[v&255,(v>>>8)&255],u32=(v)=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
 return new ReadableStream({
  async pull(controller){
   if(done)return;
   const next=await iterator.next();
   if(!next.done){
    const {name,data}=next.value,nameBytes=enc.encode(name),bytes=data instanceof Uint8Array?data:enc.encode(String(data)),crc=crc32(bytes);
    const header=new Uint8Array([0x50,0x4B,0x03,0x04,...u16(20),...u16(0x0800),...u16(0),...u16(stamp.time),...u16(stamp.date),...u32(crc),...u32(bytes.length),...u32(bytes.length),...u16(nameBytes.length),...u16(0)]);
    controller.enqueue(header);controller.enqueue(nameBytes);if(bytes.length)controller.enqueue(bytes);
    central.push({nameBytes,crc,size:bytes.length,offset});offset+=header.length+nameBytes.length+bytes.length;
    return;
   }
   let size=0;
   for(const e of central){
    const rec=new Uint8Array([0x50,0x4B,0x01,0x02,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(stamp.time),...u16(stamp.date),...u32(e.crc),...u32(e.size),...u32(e.size),...u16(e.nameBytes.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(e.offset)]);
    controller.enqueue(rec);controller.enqueue(e.nameBytes);size+=rec.length+e.nameBytes.length;
   }
   controller.enqueue(new Uint8Array([0x50,0x4B,0x05,0x06,...u16(0),...u16(0),...u16(central.length),...u16(central.length),...u32(size),...u32(offset),...u16(0)]));
   done=true;controller.close();
  }
 });
}

const safeName=s=>String(s||'file').replace(/[^A-Za-z0-9._-]+/g,'_').replace(/^\.+/,'').slice(0,80)||'file';
const parse=text=>{try{return JSON.parse(text);}catch{return text;}};
const pretty=v=>JSON.stringify(v,null,2);

async function* exportEntries(env,user){
 const d=env.DB,id=user.id,rows=async(sql,...b)=>(await d.prepare(sql).bind(...b).all()).results||[];
 const account=await d.prepare('SELECT id,email,name,created_at FROM users WHERE id=?').bind(id).first();
 yield {name:'README.txt',data:`Easy Wedding — your data\nExported on ${new Date().toISOString()}\n\nThis ZIP holds everything Easy Wedding stores about your account (${user.email}).\n\n  account.json        your name, email and sign-up date\n  workspace.json      your wedding plan: events, budget, tasks, vendors, outfits, profile\n  invitation-draft.json  your invitation studio draft\n  invitations/        every published invitation (JSON)\n  rsvps.json          guest replies to your invitations\n  personal-guests.json  personal invitation guest list\n  bookings.json       vendor bookings and payments you recorded\n  orders.json         your purchases (card, UPI and bank details are never stored by us)\n  designs-unlocked.json  designs unlocked for your account\n  files/              photographs, songs and PDFs you uploaded\n\nYour password is never included: we store it only as a one-way hash.\nTo delete everything permanently, use Profile > Your data in the dashboard.\n`};
 yield {name:'account.json',data:pretty({id:account?.id,name:account?.name,email:account?.email,createdAt:account?.created_at})};
 const ws=await d.prepare('SELECT data,revision,updated_at FROM workspaces WHERE owner=?').bind(id).first();
 yield {name:'workspace.json',data:pretty(ws?{revision:ws.revision,updatedAt:ws.updated_at,plan:parse(ws.data)}:{plan:null})};
 const draft=await d.prepare('SELECT data,updated_at FROM studio_drafts WHERE owner=?').bind(id).first();
 yield {name:'invitation-draft.json',data:pretty(draft?{updatedAt:draft.updated_at,draft:parse(draft.data)}:{draft:null})};
 const invs=await rows('SELECT invitation_id,partner1,partner2,created_at FROM invitation_owners WHERE owner=?',id);
 for(const inv of invs){
  const object=await env.BUCKET?.get('invitation-snapshots/'+inv.invitation_id);
  yield {name:'invitations/'+safeName(inv.invitation_id)+'.json',data:pretty({id:inv.invitation_id,createdAt:inv.created_at,partner1:inv.partner1,partner2:inv.partner2,invitation:object?parse(await object.text()):null})};
 }
 yield {name:'rsvps.json',data:pretty(await rows('SELECT r.id,r.invitation_id,r.name,r.attendance,r.guests,r.message,r.song,r.phone,r.created_at FROM rsvps r WHERE r.invitation_id IN (SELECT invitation_id FROM invitation_owners WHERE owner=?) ORDER BY r.created_at',id))};
 yield {name:'personal-guests.json',data:pretty(await rows('SELECT id,invitation_id,name,phone,viewed_at,rsvped_at,created_at FROM personal_guests WHERE owner=? ORDER BY created_at',id))};
 const bookings=await rows('SELECT * FROM bookings WHERE user_id=? ORDER BY created_at',id);
 for(const b of bookings){b.items=await rows('SELECT service,amount_paise FROM booking_items WHERE booking_id=?',b.id);b.payments=await rows('SELECT amount_paise,paid_on,mode,note,created_at FROM booking_payments WHERE booking_id=? ORDER BY paid_on',b.id);}
 yield {name:'bookings.json',data:pretty(bookings)};
 yield {name:'orders.json',data:pretty(await rows('SELECT id,design_id,amount_paise,discount_paise,coupon,gateway,gateway_order_id,gateway_payment_id,status,created_at FROM orders WHERE user_id=? ORDER BY created_at',id))};
 yield {name:'designs-unlocked.json',data:pretty(await rows('SELECT design_id,order_id,granted_at FROM entitlements WHERE user_id=?',id))};
 const used=new Set();
 for(const a of await rows('SELECT id,filename,mime,size,created_at FROM assets WHERE owner=? ORDER BY created_at',id)){
  let object=null;if(env.BUCKET)for(const key of ['invitation/'+a.id,'invitation-audio/'+a.id,a.id]){object=await env.BUCKET.get(key);if(object)break;}
  if(!object)continue;
  const ext=/\.[A-Za-z0-9]{1,5}$/.test(a.filename||'')?'':({'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','application/pdf':'.pdf','audio/mpeg':'.mp3','audio/mp3':'.mp3','video/mp4':'.mp4'})[a.mime]||'';
  let name='files/'+safeName(a.filename)+ext;if(used.has(name))name='files/'+a.id.slice(0,8)+'-'+safeName(a.filename)+ext;used.add(name);
  yield {name,data:new Uint8Array(await object.arrayBuffer())};
 }
}

export function exportAccountZip(env,user){return zipStream(exportEntries(env,user));}

/* Permanent erase. Payment records that Indian tax and accounting law requires us to keep are made anonymous (no name, email, mobile or password
   data) unless eraseOrders is set, which deletes them too. */
export async function eraseAccountData(env,userId,{eraseOrders=false}={}){
 const d=env.DB;
 const rows=async(sql,...b)=>(await d.prepare(sql).bind(...b).all()).results||[];
 if(env.BUCKET){
  const keys=[];
  for(const a of await rows('SELECT id FROM assets WHERE owner=?',userId))keys.push(a.id,'invitation/'+a.id,'invitation-audio/'+a.id);
  for(const i of await rows('SELECT invitation_id FROM invitation_owners WHERE owner=?',userId))keys.push('invitation-snapshots/'+i.invitation_id);
  for(let i=0;i<keys.length;i+=500)await env.BUCKET.delete(keys.slice(i,i+500));
 }
 const inv='SELECT invitation_id FROM invitation_owners WHERE owner=?',bk='SELECT id FROM bookings WHERE user_id=?';
 const statements=[
  d.prepare(`DELETE FROM rsvps WHERE invitation_id IN (${inv})`).bind(userId),
  d.prepare('DELETE FROM personal_guests WHERE owner=?').bind(userId),
  d.prepare('DELETE FROM short_links WHERE owner=?').bind(userId),
  d.prepare('DELETE FROM invitation_owners WHERE owner=?').bind(userId),
  d.prepare('DELETE FROM assets WHERE owner=?').bind(userId),
  d.prepare(`DELETE FROM booking_items WHERE booking_id IN (${bk})`).bind(userId),
  d.prepare(`DELETE FROM booking_payments WHERE booking_id IN (${bk})`).bind(userId),
  d.prepare('DELETE FROM bookings WHERE user_id=?').bind(userId),
  d.prepare('DELETE FROM studio_drafts WHERE owner=?').bind(userId),
  d.prepare('DELETE FROM workspaces WHERE owner=?').bind(userId),
  d.prepare('DELETE FROM entitlements WHERE user_id=?').bind(userId),
  d.prepare('DELETE FROM sessions WHERE user_id=?').bind(userId),
  eraseOrders?d.prepare('DELETE FROM orders WHERE user_id=?').bind(userId):d.prepare('UPDATE orders SET signup_name=NULL,signup_email=NULL,signup_hash=NULL,phone_hash=NULL WHERE user_id=?').bind(userId),
  d.prepare('DELETE FROM users WHERE id=?').bind(userId)
 ];
 await d.batch(statements);
 return {deleted:true,ordersErased:!!eraseOrders};
}
