/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* My bookings: vendors (pandal, light, DJ, catering…), what is booked, the advance, every payment, the balance, and a PDF. */
const CATEGORIES=[['pandal','Pandal / Tent'],['light','Light'],['dj','DJ / Sound'],['catering','Catering / Cook'],['decoration','Decoration'],['photo','Photo / Video'],['mehndi','Mehndi artist'],['makeup','Makeup'],['transport','Transport'],['bulk','Multiple services (bulk)'],['other','Other']];
const CAT_NAME=Object.fromEntries(CATEGORIES);
const QUICK=['Pandal','Light','DJ','Catering','Decoration'];
const MODES=[['upi','UPI'],['cash','Cash'],['bank','Bank transfer'],['cheque','Cheque'],['card','Card']];
const $$=s=>document.querySelector(s);
const rupees=p=>'₹'+(p/100).toLocaleString('en-IN',{maximumFractionDigits:2});
const pdfMoney=p=>'Rs '+(p/100).toLocaleString('en-IN',{maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10);
const niceDate=d=>d?new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'';
function h(tag,props,...kids){const n=document.createElement(tag);for(const [k,v] of Object.entries(props||{})){if(k==='class')n.className=v;else if(k.startsWith('on'))n.addEventListener(k.slice(2),v);else if(v===true)n.setAttribute(k,'');else if(v!==false&&v!=null)n.setAttribute(k,v);}for(const kid of kids.flat()){if(kid==null||kid===false)continue;n.append(kid.nodeType?kid:document.createTextNode(String(kid)));}return n;}
async function api(path,method='GET',body){const r=await fetch(path,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Something went wrong. Please try again.');return d;}

let root,state={bookings:[],editing:null,adding:false,addingPayment:null,message:''};

function totals(list){return list.reduce((a,b)=>({total:a.total+b.total,paid:a.paid+b.paid,balance:a.balance+b.balance}),{total:0,paid:0,balance:0});}

function serviceRow(item={}){
 const row=h('div',{class:'bk-svc'},h('input',{class:'bk-svc-name',placeholder:'Service (e.g. Pandal)',maxlength:'80',value:item.service||''}),h('input',{class:'bk-svc-amt',type:'number',min:'0',step:'1',inputmode:'decimal',placeholder:'Amount ₹',value:item.amount!=null?item.amount/100:''}),h('button',{type:'button',class:'bk-x','aria-label':'Remove service',onclick:()=>{if(row.parentElement.children.length>1)row.remove();}},'×'));
 return row;
}
function bookingForm(b){
 const edit=!!b;
 const svcs=h('div',{class:'bk-svcs'},...(edit?b.items:[{}]).map(serviceRow));
 const form=h('form',{class:'bk-form',novalidate:true},
  h('div',{class:'bk-grid'},
   h('label',null,'Vendor / contact name *',h('input',{name:'vendor',maxlength:'80',required:true,placeholder:'e.g. Raju Events',value:edit?b.vendor:''})),
   h('label',null,'Phone number',h('input',{name:'phone',type:'tel',maxlength:'20',placeholder:'+91 98765 43210',value:edit?b.phone:''})),
   h('label',null,'Type',h('select',{name:'category'},...CATEGORIES.map(([v,t])=>h('option',{value:v,selected:edit?b.category===v:v==='pandal'},t)))),
   h('label',null,'Event / service date',h('input',{name:'eventDate',type:'date',value:edit?b.eventDate:''}))),
  h('p',{class:'bk-sub'},'What is booked — add one line, or several for a bulk booking (e.g. pandal + light + DJ + catering from the same vendor).'),
  svcs,
  h('div',{class:'bk-quick'},h('button',{type:'button',class:'bk-link',onclick:()=>svcs.append(serviceRow())},'+ Add another service'),...QUICK.map(q=>h('button',{type:'button',class:'bk-chip',onclick:()=>{const empty=[...svcs.children].find(r=>!r.querySelector('.bk-svc-name').value);const row=empty||svcs.appendChild(serviceRow());row.querySelector('.bk-svc-name').value=q;row.querySelector('.bk-svc-amt').focus();}},'+ '+q))),
  edit?null:h('div',{class:'bk-grid bk-adv'},
   h('label',null,'Advance paid now ₹ (optional)',h('input',{name:'advance',type:'number',min:'0',step:'1',inputmode:'decimal',placeholder:'0'})),
   h('label',null,'Paid on',h('input',{name:'advDate',type:'date',value:today()})),
   h('label',null,'Paid by',h('select',{name:'advMode'},...MODES.map(([v,t])=>h('option',{value:v},t))))),
  h('label',null,'Note',h('input',{name:'note',maxlength:'300',placeholder:'Anything to remember',value:edit?b.note:''})),
  h('p',{class:'bk-error',role:'alert'}),
  h('div',{class:'bk-actions'},h('button',{type:'submit',class:'primary'},edit?'Save changes':'Save booking'),h('button',{type:'button',class:'secondary',onclick:()=>{state.adding=false;state.editing=null;draw();}},'Cancel')));
 form.addEventListener('submit',async e=>{e.preventDefault();const err=form.querySelector('.bk-error');err.textContent='';
  const fd=new FormData(form);
  const items=[...svcs.children].map(r=>({service:r.querySelector('.bk-svc-name').value.trim(),amount:r.querySelector('.bk-svc-amt').value||0})).filter(x=>x.service);
  if(!String(fd.get('vendor')).trim()){err.textContent='Please enter the vendor or contact name.';return;}
  if(!items.length){err.textContent='Add at least one service.';return;}
  const payload={vendor:fd.get('vendor'),phone:fd.get('phone'),category:fd.get('category'),eventDate:fd.get('eventDate'),note:fd.get('note'),items};
  if(!edit&&Number(fd.get('advance'))>0)payload.advance={amount:fd.get('advance'),paidOn:fd.get('advDate'),mode:fd.get('advMode')};
  try{if(edit){const d=await api('/api/bookings/'+b.id,'PUT',payload);state.bookings=state.bookings.map(x=>x.id===b.id?d.booking:x);}else{const d=await api('/api/bookings','POST',payload);state.bookings.unshift(d.booking);}
   state.adding=false;state.editing=null;state.message=edit?'Booking updated.':'Booking saved.';draw();}
  catch(ex){err.textContent=ex.message;}});
 return form;
}
function paymentForm(b){
 const form=h('form',{class:'bk-payform'},h('input',{name:'amount',type:'number',min:'0',step:'1',inputmode:'decimal',placeholder:'Amount ₹',required:true}),h('input',{name:'paidOn',type:'date',value:today()}),h('select',{name:'mode'},...MODES.map(([v,t])=>h('option',{value:v},t))),h('input',{name:'note',maxlength:'120',placeholder:'Note (optional)'}),h('button',{type:'submit',class:'primary'},'Add payment'),h('button',{type:'button',class:'secondary',onclick:()=>{state.addingPayment=null;draw();}},'Cancel'),h('span',{class:'bk-error',role:'alert'}));
 form.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(form);try{const d=await api('/api/bookings/'+b.id+'/payments','POST',Object.fromEntries(fd));state.bookings=state.bookings.map(x=>x.id===b.id?d.booking:x);state.addingPayment=null;state.message='Payment added.';draw();}catch(ex){form.querySelector('.bk-error').textContent=ex.message;}});
 return form;
}
function card(b){
 const pct=b.total?Math.min(100,Math.round(b.paid*100/b.total)):0;
 return h('article',{class:'bk-card'},
  h('header',null,h('div',null,h('h3',null,b.vendor),h('p',{class:'bk-meta'},h('span',{class:'bk-badge'},CAT_NAME[b.category]||'Other'),b.eventDate?' · '+niceDate(b.eventDate):'',b.phone?[' · ',h('a',{href:'tel:'+b.phone.replace(/[^\d+]/g,'')},'📞 '+b.phone)]:null)),
   h('div',{class:'bk-card-actions'},h('button',{class:'secondary',type:'button',onclick:()=>downloadPdf([b])},'PDF'),h('button',{class:'secondary',type:'button',onclick:()=>{state.editing=b.id;draw();}},'Edit'),h('button',{class:'secondary bk-danger',type:'button',onclick:async()=>{if(!confirm('Delete the booking with '+b.vendor+' and all its payments?'))return;try{await api('/api/bookings/'+b.id,'DELETE');state.bookings=state.bookings.filter(x=>x.id!==b.id);state.message='Booking deleted.';draw();}catch(ex){alert(ex.message);}}},'Delete'))),
  h('ul',{class:'bk-items'},...b.items.map(i=>h('li',null,h('span',null,i.service),h('b',null,rupees(i.amount))))),
  h('div',{class:'bk-money'},h('div',null,h('small',null,'Total'),h('b',null,rupees(b.total))),h('div',null,h('small',null,'Paid'),h('b',{class:'ok'},rupees(b.paid))),h('div',null,h('small',null,'Balance'),h('b',{class:b.balance>0?'due':'ok'},b.balance>0?rupees(b.balance):'Fully paid ✓'))),
  h('div',{class:'bk-bar','aria-label':pct+'% paid'},h('i',{style:'width:'+pct+'%'})),
  h('details',{class:'bk-pays',open:b.payments.length<=3},h('summary',null,'Payments ('+b.payments.length+')'),
   b.payments.length?h('ul',null,...b.payments.map(p=>h('li',null,h('span',null,niceDate(p.paidOn),p.mode?' · '+(MODES.find(m=>m[0]===p.mode)?.[1]||p.mode):'',p.note?' · '+p.note:''),h('b',null,rupees(p.amount)),h('button',{type:'button',class:'bk-x','aria-label':'Delete payment',onclick:async()=>{if(!confirm('Delete this payment entry?'))return;try{const d=await api('/api/bookings/'+b.id+'/payments/'+p.id,'DELETE');state.bookings=state.bookings.map(x=>x.id===b.id?d.booking:x);draw();}catch(ex){alert(ex.message);}}},'×')))):h('p',{class:'bk-empty'},'No payment yet.')),
  b.note?h('p',{class:'bk-note'},'📝 '+b.note):null,
  state.addingPayment===b.id?paymentForm(b):(b.balance>0?h('button',{type:'button',class:'primary bk-pay',onclick:()=>{state.addingPayment=b.id;draw();}},'+ Add payment'):null));
}
function draw(){
 const sum=totals(state.bookings);
 root.replaceChildren(
  h('div',{class:'bk-head'},h('div',null,h('p',{class:'eyebrow'},'MY BOOKINGS'),h('h2',null,'Vendors & payments'),h('p',{class:'bk-sub'},'Pandal, light, DJ, catering — who you booked, how much, the advance and every payment.')),
   h('div',{class:'bk-head-actions'},h('button',{type:'button',class:'primary',onclick:()=>{state.adding=true;state.editing=null;draw();}},'+ Add booking'),state.bookings.length?h('button',{type:'button',class:'secondary',onclick:()=>downloadPdf(state.bookings)},'Download all (PDF)'):null)),
  h('div',{class:'bk-sum'},h('div',null,h('small',null,'Total booked'),h('b',null,rupees(sum.total))),h('div',null,h('small',null,'Paid so far'),h('b',{class:'ok'},rupees(sum.paid))),h('div',null,h('small',null,'Balance due'),h('b',{class:sum.balance>0?'due':'ok'},rupees(sum.balance)))),
  state.message?h('p',{class:'bk-msg',role:'status'},state.message):null,
  state.adding?h('div',{class:'bk-card'},h('h3',null,'New booking'),bookingForm(null)):null,
  ...state.bookings.map(b=>state.editing===b.id?h('div',{class:'bk-card'},h('h3',null,'Edit booking'),bookingForm(b)):card(b)),
  !state.bookings.length&&!state.adding?h('p',{class:'bk-empty'},'No booking yet. Press “Add booking” to save your first vendor.'):null);
}

/* ---- PDF ---- */
async function downloadPdf(list){
 const {jsPDF}=await import('jspdf');
 const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
 const W=210,M=14,maroon=[117,21,46],gold=[201,154,61],ink=[51,36,29],soft=[253,241,231],green=[29,122,58],red=[179,38,30];
 const names=['groomName','brideName'].map(n=>document.querySelector('[name='+n+']')?.value?.trim()).filter(Boolean);
 const couple=names.join(' & ');
 let y=0,page=1;
 const footer=()=>{pdf.setFontSize(8);pdf.setTextColor(138,109,90);pdf.text('Easy Wedding · easywedding.in · generated '+new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}),M,289);pdf.text('Page '+page,W-M,289,{align:'right'});};
 const header=title=>{pdf.setFillColor(...maroon);pdf.rect(0,0,W,30,'F');pdf.setFillColor(...gold);pdf.rect(0,30,W,1.2,'F');pdf.setTextColor(255,247,232);pdf.setFont('helvetica','bold');pdf.setFontSize(19);pdf.text(title,M,15);pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.text(couple?couple+' · Wedding bookings':'Wedding bookings',M,23);pdf.setFont('helvetica','bold');pdf.setFontSize(13);pdf.text('Easy Wedding',W-M,15,{align:'right'});y=40;};
 const newPage=title=>{footer();pdf.addPage();page++;header(title);};
 const need=(h,title)=>{if(y+h>278)newPage(title);};
 const row=(cols,widths,opts={})=>{const h=opts.h||7;if(opts.fill){pdf.setFillColor(...opts.fill);pdf.rect(M,y-5,W-2*M,h,'F');}pdf.setFont('helvetica',opts.bold?'bold':'normal');pdf.setFontSize(opts.size||10);pdf.setTextColor(...(opts.color||ink));let x=M+2;cols.forEach((c,i)=>{const w=widths[i],align=i===cols.length-1&&opts.right!==false?'right':'left';pdf.text(String(c),align==='right'?x+w-4:x,y,{align,maxWidth:w-4});x+=w;});y+=h;};
 header(list.length>1?'Booking summary':'Booking details');
 if(list.length>1){
  const t=totals(list);
  pdf.setFillColor(...soft);pdf.roundedRect(M,y-2,W-2*M,24,3,3,'F');
  [['Total booked',pdfMoney(t.total),ink],['Paid so far',pdfMoney(t.paid),green],['Balance due',pdfMoney(t.balance),t.balance>0?red:green]].forEach(([k,v,c],i)=>{const x=M+6+i*60;pdf.setFontSize(8.5);pdf.setTextColor(138,109,90);pdf.setFont('helvetica','normal');pdf.text(k.toUpperCase(),x,y+5);pdf.setFont('helvetica','bold');pdf.setFontSize(14);pdf.setTextColor(...c);pdf.text(v,x,y+14);});
  y+=32;
  const widths=[70,38,34,40];row(['Vendor','Total','Paid','Balance'],widths,{bold:true,fill:maroon,color:[255,247,232],h:8});
  list.forEach((b,i)=>{need(9,'Booking summary');row([b.vendor+(b.phone?'  ·  '+b.phone:''),pdfMoney(b.total),pdfMoney(b.paid),pdfMoney(b.balance)],widths,{fill:i%2?null:soft,h:8,size:9.5});});
  y+=4;
 }
 list.forEach((b,idx)=>{
  if(list.length>1||idx>0){newPage('Booking details');}
  pdf.setTextColor(...maroon);pdf.setFont('helvetica','bold');pdf.setFontSize(17);pdf.text(b.vendor,M,y);y+=7;
  pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.setTextColor(93,70,54);
  const meta=[CAT_NAME[b.category]||'Other',b.eventDate?niceDate(b.eventDate):'',b.phone?'Contact: '+b.phone:''].filter(Boolean).join('   ·   ');pdf.text(meta,M,y);y+=9;
  row(['What was booked','Amount'],[140,42],{bold:true,fill:maroon,color:[255,247,232],h:8});
  b.items.forEach((i,k)=>{need(9,'Booking details');row([i.service,pdfMoney(i.amount)],[140,42],{fill:k%2?null:soft,h:8});});
  row(['Total',pdfMoney(b.total)],[140,42],{bold:true,h:9,size:11});
  y+=3;
  pdf.setFillColor(...soft);pdf.roundedRect(M,y-1,W-2*M,16,3,3,'F');
  [['PAID',pdfMoney(b.paid),green],['BALANCE',b.balance>0?pdfMoney(b.balance):'Fully paid',b.balance>0?red:green]].forEach(([k,v,c],i)=>{const x=M+6+i*90;pdf.setFontSize(8.5);pdf.setFont('helvetica','normal');pdf.setTextColor(138,109,90);pdf.text(k,x,y+5);pdf.setFont('helvetica','bold');pdf.setFontSize(13);pdf.setTextColor(...c);pdf.text(v,x,y+12);});
  y+=24;
  pdf.setFont('helvetica','bold');pdf.setFontSize(12);pdf.setTextColor(...maroon);pdf.text('Payment history',M,y);y+=7;
  row(['#','Date','Paid by / note','Amount'],[10,34,98,40],{bold:true,fill:maroon,color:[255,247,232],h:8});
  if(!b.payments.length){row(['','No payment yet','',''],[10,34,98,40],{h:8});}
  b.payments.forEach((p,k)=>{need(9,'Booking details');row([k+1,niceDate(p.paidOn),[(MODES.find(m=>m[0]===p.mode)?.[1]||p.mode||''),p.note].filter(Boolean).join(' · '),pdfMoney(p.amount)],[10,34,98,40],{fill:k%2?null:soft,h:8,size:9.5});});
  if(b.note){y+=4;pdf.setFont('helvetica','italic');pdf.setFontSize(9.5);pdf.setTextColor(93,70,54);pdf.text('Note: '+b.note,M,y,{maxWidth:W-2*M});}
 });
 footer();
 pdf.save((list.length>1?'wedding-bookings':'booking-'+list[0].vendor.replace(/[^a-z0-9]+/gi,'-').toLowerCase())+'.pdf');
}

async function init(){
 root=$$('#bookings');if(!root||!root.hidden&&root.childElementCount)return;
 root.hidden=false;root.textContent='Loading your bookings…';
 try{const d=await api('/api/bookings');state.bookings=d.bookings;draw();}catch(e){root.textContent=e.message;}
}
document.addEventListener('ew:owner',init,{once:true});
if(document.body.classList.contains('mode-owner'))init();
