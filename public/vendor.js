/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Vendor dashboard: profile + payout details, portfolio, bookings inbox and a
   transparent earnings table (gross, platform commission, net — per booking,
   using the commission % snapshotted when each booking was confirmed). */
import { compressPhoto } from './photo-upload.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = p => '₹' + (Math.round(Number(p) || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtDate = iso => { if (!iso) return '—'; const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso); return isNaN(d) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
const phoneOk = v => /^[6-9]\d{9}$/.test(String(v || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''));
async function api(path, opts) { const r = await fetch(path, opts); const d = await r.json().catch(() => ({})); if (!r.ok) throw Error(d.error || 'Something went wrong. Please try again.'); return d; }
const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
const badge = s => '<span class="fx-badge ' + (s === 'approved' || s === 'confirmed' || s === 'completed' ? 'approved' : s === 'rejected' || s === 'suspended' || s === 'cancelled' ? 'rejected' : 'pending') + '">' + esc(s[0].toUpperCase() + s.slice(1)) + '</span>';

let me = null, categories = [];
async function load() {
  me = await api('/api/vendor/me');
  if (!me.vendor) { $('#noreg').hidden = false; $('#dash').hidden = true; return; }
  $('#noreg').hidden = true; $('#dash').hidden = false;
  render();
}
function render() {
  const v = me.vendor, t = me.totals || {};
  $('#dash-title').textContent = v.businessName;
  $('#dash-code').textContent = v.vendorCode ? 'Vendor ID: ' + v.vendorCode + ' — your permanent Easy Wedding identity. Quote it for any support question.' : '';
  const st = $('#status-box');
  if (v.status === 'pending') st.innerHTML = '<div class="fx-alert"><b>Under review.</b> Our team is checking your business. You can add portfolio photos and payout details now — your profile goes live in the directory the moment it is approved.</div>';
  else if (v.status === 'approved') st.innerHTML = '<div class="fx-alert" style="border-color:#a9d3b2;background:#f0f8f1"><b>Your profile is live</b> in the <a href="/vendors?v=' + esc(v.id) + '">vendor directory</a>.' + (v.verified ? ' You carry the <b>✓ Easy Wedding Verified</b> badge.' : '') + '</div>';
  else if (v.status === 'rejected') st.innerHTML = '<div class="fx-alert bad"><b>Not approved.</b>' + (v.statusReason ? ' Reason: ' + esc(v.statusReason) + '.' : '') + ' You are welcome to fix the details below and contact us on WhatsApp.</div>';
  else if (v.status === 'suspended') st.innerHTML = '<div class="fx-alert bad"><b>Profile suspended.</b>' + (v.statusReason ? ' ' + esc(v.statusReason) : '') + ' Please contact Easy Wedding support.</div>';
  $('#payout-alert').innerHTML = v.hasPayoutDetails ? '' :
    '<div class="fx-alert"><b>Add your payout details</b> (bank account + IFSC, in “Profile &amp; payout details” below). They are required before your first payout can be sent — and they stay private.</div>';
  $('#kpis').innerHTML =
    kpi('Confirmed bookings', String((me.bookings || []).filter(b => b.status === 'confirmed' || b.status === 'completed').length)) +
    kpi('Total booked (gross)', inr(t.grossPaise)) +
    kpi('Platform commission', inr(t.commissionPaise)) +
    kpi('Your earnings (net)', inr(t.netPaise)) +
    kpi('Payable to you', inr(t.payableToVendorPaise)) +
    kpi('Commission you owe', inr(t.commissionOwedPaise));
  const done = (me.bookings || []).filter(b => b.finalPaise != null);
  $('#earn-body').innerHTML = done.map(b =>
    '<tr><td>' + esc(b.customerName || 'Customer') + '<br><span class="fx-note">' + esc(fmtDate(b.eventDate)) + '</span></td><td>' + esc(b.eventType || 'Event') + '</td><td>' + inr(b.finalPaise) + '</td><td>' + inr(b.commissionPaise) + ' <span class="fx-note">(' + esc(b.commissionPercent) + '%)</span></td><td><b>' + inr(b.netPaise) + '</b></td><td>' + badge(b.status) + (b.payoutId ? '<br><span class="fx-note">Settled</span>' : '') + '<br><a href="/api/receipts/booking/' + esc(b.id) + '" target="_blank" rel="noopener" class="fx-note">Receipt</a></td></tr>').join('')
    || '<tr><td colspan="6" class="fx-note">No confirmed bookings yet. When you confirm a booking, its gross amount, the platform commission and your net appear here — paise-exact.</td></tr>';
  $('#earn-note').textContent = 'Commission is charged only on bookings that happen, at the rate in force when you confirmed each booking. Protected Booking: payments made through Easy Wedding are released to you after the event.';
  $('#payouts-list').innerHTML = (me.payouts || []).length ? '<h3 style="font:italic 700 19px Georgia,serif;color:var(--fx-maroon)">Settlements received</h3>' + me.payouts.map(p =>
    '<div class="fx-card" style="margin:8px 0">' + (p.kind === 'commission_receipt' ? 'Commission paid to Easy Wedding' : 'Payout received') + ' · <b>' + inr(p.amountPaise) + '</b> · ' + esc(fmtDate(p.createdAt)) + (p.reference ? ' · Ref: ' + esc(p.reference) : '') + ' · ' + p.bookingCount + ' booking(s)</div>').join('') : '';
  /* Inbox */
  $('#inbox').innerHTML = (me.bookings || []).map(b =>
    '<div class="fx-card" style="margin:10px 0"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start"><div style="flex:1;min-width:220px"><b>' + esc(b.customerName || 'Customer') + '</b> · ' + esc(b.eventType || 'Event') + ' · ' + esc(fmtDate(b.eventDate)) + (b.city ? ' · ' + esc(b.city) : '') +
    '<br><span class="fx-note">Phone: ' + esc(b.phone) + (b.budgetPaise ? ' · Budget ' + inr(b.budgetPaise) : '') + (b.finalPaise ? ' · Final ' + inr(b.finalPaise) : '') + '</span>' +
    (b.message ? '<br><span style="white-space:pre-wrap">' + esc(b.message) + '</span>' : '') + '</div>' + badge(b.status) + '</div>' +
    '<div class="fx-btnrow"><a class="fx-btn small ghost" href="/api/receipts/booking/' + esc(b.id) + '" target="_blank" rel="noopener">Receipt</a></div>' +
    (b.status === 'requested' ? '<div class="fx-btnrow"><input type="number" min="1" step="100" placeholder="Final amount ₹" data-amt="' + esc(b.id) + '" style="padding:11px;border:1px solid var(--fx-line);border-radius:10px;font:16px system-ui,sans-serif;max-width:190px"><button class="fx-btn small" data-accept="' + esc(b.id) + '" type="button">Confirm booking</button><button class="fx-btn small ghost" data-vcancel="' + esc(b.id) + '" type="button">Decline</button></div>' : '') +
    (b.status === 'confirmed' ? '<div class="fx-btnrow"><button class="fx-btn small" data-complete="' + esc(b.id) + '" type="button">Mark event completed</button><button class="fx-btn small ghost" data-vcancel="' + esc(b.id) + '" type="button">Cancel booking</button></div>' : '') +
    '</div>').join('') || '<p class="fx-note">No booking requests yet. Share your profile link to get your first request.</p>';
  $('#inbox').querySelectorAll('[data-accept]').forEach(btn => btn.addEventListener('click', async () => {
    const amt = Number((document.querySelector('[data-amt="' + btn.dataset.accept + '"]') || {}).value);
    if (!amt || amt <= 0) { alert('Enter the final amount the customer agreed, in ₹.'); return; }
    try { await api('/api/vendor/bookings/' + btn.dataset.accept + '/accept', json('POST', { finalAmount: amt })); await load(); } catch (e) { alert(e.message); }
  }));
  $('#inbox').querySelectorAll('[data-complete]').forEach(btn => btn.addEventListener('click', async () => { try { await api('/api/vendor/bookings/' + btn.dataset.complete + '/status', json('POST', { status: 'completed' })); await load(); } catch (e) { alert(e.message); } }));
  $('#inbox').querySelectorAll('[data-vcancel]').forEach(btn => btn.addEventListener('click', async () => { if (!confirm('Cancel this booking?')) return; try { await api('/api/vendor/bookings/' + btn.dataset.vcancel + '/status', json('POST', { status: 'cancelled' })); await load(); } catch (e) { alert(e.message); } }));
  /* Portfolio */
  $('#photo-grid').innerHTML = (v.photos || []).map((p, i) =>
    '<div class="fx-photo"><img src="' + esc(p.url) + '" alt="">' + (i === 0 ? '<span class="fx-cover-tag">COVER</span>' : '') + '<div class="fx-pbtns"><button type="button" data-delphoto="' + esc(p.id) + '">Remove</button></div></div>').join('')
    || '<p class="fx-note">No portfolio photos yet.</p>';
  $('#photo-grid').querySelectorAll('[data-delphoto]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Remove this photo permanently?')) return;
    try { await api('/api/vendor/photos/' + btn.dataset.delphoto, { method: 'DELETE' }); await load(); } catch (e) { $('#photo-error').textContent = e.message; }
  }));
  /* Profile form */
  const f = $('#profile-form');
  f.businessName.value = v.businessName; f.ownerName.value = v.ownerName; f.city.value = v.city;
  f.phone.value = v.phone || ''; f.whatsapp.value = v.whatsapp || ''; f.email.value = v.email || '';
  f.startingPrice.value = Math.round((v.startingPricePaise || 0) / 100); f.about.value = v.about || '';
  $('#p-category').innerHTML = categories.map(c => '<option value="' + esc(c.id) + '"' + (c.id === v.category ? ' selected' : '') + '>' + esc(c.label) + '</option>').join('');
  const p = v.payout || {};
  f.payoutHolder.value = p.holder || ''; f.payoutAccount.value = p.account || ''; f.payoutIfsc.value = p.ifsc || ''; f.payoutUpi.value = p.upi || ''; f.payoutPan.value = p.pan || '';
}
function kpi(label, val) { return '<div class="fx-kpi"><small>' + label + '</small><b>' + val + '</b></div>'; }

(async function init() {
  let user = null;
  try { const s = await (await fetch('/api/session')).json(); user = s.user || null; } catch {}
  if (!user) { $('#login-box').hidden = false; return; }
  try { const f = await api('/api/features'); categories = f.vendorCategories || []; } catch {}
  $('#profile-form').addEventListener('submit', async e => {
    e.preventDefault(); const f = new FormData(e.target); $('#profile-error').textContent = ''; $('#profile-ok').textContent = '';
    if (!phoneOk(f.get('phone')) || !phoneOk(f.get('whatsapp'))) { $('#profile-error').textContent = 'Please enter valid 10-digit mobile and WhatsApp numbers.'; return; }
    try {
      const d = await api('/api/vendor/me', json('PUT', { businessName: f.get('businessName'), ownerName: f.get('ownerName'), category: f.get('category'), city: f.get('city'), phone: String(f.get('phone')).replace(/\D/g, ''), whatsapp: String(f.get('whatsapp')).replace(/\D/g, ''), email: f.get('email'), startingPrice: Number(f.get('startingPrice')), about: f.get('about'), payoutHolder: f.get('payoutHolder'), payoutAccount: f.get('payoutAccount'), payoutIfsc: f.get('payoutIfsc'), payoutUpi: f.get('payoutUpi'), payoutPan: f.get('payoutPan') }));
      me.vendor = d.vendor; render(); $('#profile-ok').textContent = 'Saved.';
    } catch (err) { $('#profile-error').textContent = err.message; }
  });
  $('#photo-input').addEventListener('change', async e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return; $('#photo-error').textContent = '';
    try {
      const ready = await compressPhoto(file, { maxEdge: 1600, targetBytes: 1400 * 1024 });
      const fd = new FormData(); fd.append('file', ready, ready.name || 'photo.jpg');
      await api('/api/vendor/photos', { method: 'POST', body: fd });
      await load();
    } catch (err) { $('#photo-error').textContent = err.message; }
  });
  await load();
})();
