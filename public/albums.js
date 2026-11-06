/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* My Albums: free-draft builder (upload, reorder, delete, flipbook preview)
   and the Save Forever permanent-storage payment, wired through the site's
   existing gateways exactly like a design unlock. */
import { compressPhoto } from './photo-upload.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = p => '₹' + (Math.round(Number(p) || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtDate = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); };
const phoneOk = v => /^[6-9]\d{9}$/.test(String(v || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''));
async function api(path, opts) {
  const r = await fetch(path, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(d.error || 'Something went wrong. Please try again.');
  return d;
}
const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

let user = null, features = null, pricing = null, albums = [], current = null;

function badge(a) {
  if (a.storage === 'permanent') return '<span class="fx-badge forever">Saved forever</span>';
  if (a.expired) return '<span class="fx-badge expired">Draft expired</span>';
  return '<span class="fx-badge draft">Free draft · until ' + esc(fmtDate(a.expiresAt)) + '</span>';
}
function renderList() {
  const list = $('#album-list');
  $('#album-empty').hidden = albums.length > 0;
  list.innerHTML = albums.map(a =>
    '<article class="fx-tile">' +
    (a.photos && a.photos[0] ? '<div class="fx-cover"><img src="' + esc(a.photos[0].url) + '" alt=""></div>' : '<div class="fx-cover" style="display:flex;align-items:center;justify-content:center;font:italic 700 20px Georgia,serif;color:var(--fx-gold-dark)">No photos yet</div>') +
    '<div class="fx-body"><h3>' + esc(a.title) + '</h3><span>' + badge(a) + '</span>' +
    '<span class="fx-meta">' + (a.photos ? a.photos.length : 0) + ' photo' + (a.photos && a.photos.length === 1 ? '' : 's') + (a.weddingDate ? ' · ' + esc(fmtDate(a.weddingDate)) : '') + '</span>' +
    '<div class="fx-btnrow"><button class="fx-btn small" data-open="' + esc(a.id) + '" type="button">Open album</button></div></div></article>').join('');
  list.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => { const a = albums.find(x => x.id === b.dataset.open); if (a) openAlbum(a); }));
}
async function refresh() {
  const d = await api('/api/albums');
  albums = d.albums || [];
  renderList();
  if (current) { const a = albums.find(x => x.id === current.id); if (a) { current = a; renderBuilder(); } }
}
function openAlbum(a) { current = a; renderBuilder(); $('#builder').hidden = false; $('#builder').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function renderBuilder() {
  const a = current; if (!a) return;
  $('#builder-title').textContent = a.title;
  $('#builder-badge').innerHTML = badge(a);
  const f = $('#details-form');
  f.title.value = a.title; f.partner1.value = a.partner1 || ''; f.partner2.value = a.partner2 || ''; f.weddingDate.value = a.weddingDate || '';
  f.isPublic.checked = !!a.isPublic;
  $('#public-row').style.display = a.storage === 'permanent' ? 'flex' : 'none';
  $('#builder-status').textContent =
    a.storage === 'permanent' ? 'This album is saved forever. Share the link with family, or turn sharing off any time above.'
    : a.expired ? 'This free draft expired on ' + fmtDate(a.expiresAt) + '. You can still view it here, but photos can no longer be added.'
    : 'Free draft — kept until ' + fmtDate(a.expiresAt) + '. Save Forever before then to keep this album permanently.';
  $('#forever-btn').style.display = a.storage === 'permanent' ? 'none' : '';
  $('#forever-price').textContent = features ? inr(features.album.pricePaise) : '';
  const share = $('#share-box');
  if (a.storage === 'permanent' && a.shareUrl) { share.hidden = false; $('#share-link').value = location.origin + a.shareUrl; }
  else share.hidden = true;
  const rcpt = $('#album-receipt');
  if (a.storage === 'permanent' && a.storageOrderId) { rcpt.hidden = false; rcpt.href = '/api/receipts/order/' + a.storageOrderId; } else rcpt.hidden = true;
  const pinBox = $('#pin-box');
  pinBox.hidden = a.storage !== 'permanent';
  if (a.storage === 'permanent') { $('#pin-state').textContent = a.hasSharePin ? 'Share PIN: ON — guests need the PIN to open the shared album.' : 'Share PIN: off — anyone with the link can view.'; $('#pin-note').textContent = ''; }
  $('#photo-input').disabled = a.expired;
  $('#photo-grid').innerHTML = (a.photos || []).map((p, i) =>
    '<div class="fx-photo"><img src="' + esc(p.url) + '" alt="">' + (i === 0 ? '<span class="fx-cover-tag">COVER</span>' : '') +
    '<div class="fx-pbtns"><button type="button" data-mv="-1" data-id="' + esc(p.id) + '" aria-label="Move earlier">←</button><button type="button" data-mv="1" data-id="' + esc(p.id) + '" aria-label="Move later">→</button><button type="button" data-del="' + esc(p.id) + '" aria-label="Delete photo">✕</button></div></div>').join('')
    || '<p class="fx-note">No photos yet — add your first photo above; it becomes the cover.</p>';
  $('#photo-grid').querySelectorAll('[data-mv]').forEach(b => b.addEventListener('click', () => movePhoto(b.dataset.id, Number(b.dataset.mv))));
  $('#photo-grid').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deletePhoto(b.dataset.del)));
}
async function movePhoto(id, dir) {
  const ids = current.photos.map(p => p.id), i = ids.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  try { const d = await api('/api/albums/' + current.id + '/reorder', json('POST', { order: ids })); current = d.album; const ix = albums.findIndex(x => x.id === current.id); if (ix >= 0) albums[ix] = current; renderList(); renderBuilder(); }
  catch (e) { $('#photo-error').textContent = e.message; }
}
async function deletePhoto(id) {
  if (!confirm('Remove this photo from the album? It will be deleted permanently.')) return;
  try { const d = await api('/api/albums/' + current.id + '/photos/' + id, { method: 'DELETE' }); current = d.album; const ix = albums.findIndex(x => x.id === current.id); if (ix >= 0) albums[ix] = current; renderList(); renderBuilder(); }
  catch (e) { $('#photo-error').textContent = e.message; }
}
async function banner(html, bad) {
  $('#pay-banner').innerHTML = '<div class="fx-alert' + (bad ? ' bad' : '') + '">' + html + '</div>';
}
async function verifyReturn(orderId) {
  try {
    const d = await api('/api/albums/save-forever/verify', json('POST', { orderId }));
    if (d.album) { banner('Your album is now <b>saved forever</b>. Find its share link in the album below.'); current = d.album; await refresh(); openAlbum(d.album); }
  } catch (e) { banner('We could not confirm that payment yet. If money was deducted, do not pay again — it will reflect shortly, or message us on WhatsApp and we will sort it out.', true); }
  history.replaceState(null, '', '/albums');
}

/* ---------------- Save Forever payment dialog ---------------- */
function openPay() {
  const dlg = $('#pay-dialog');
  $('#pay-amount').textContent = inr(features.album.pricePaise);
  $('#pay-phone').value = user.phone || '';
  $('#pay-error').textContent = '';
  const ready = (pricing && pricing.gateways || []).filter(g => g.ready);
  $('#pay-ready').hidden = !ready.length;
  $('#pay-soon').hidden = !!ready.length;
  $('#pay-go').style.display = ready.length ? '' : 'none';
  if (!ready.length) $('#pay-wa').href = 'https://wa.me/918789991983?text=' + encodeURIComponent('Namaste Easy Wedding! I want to save my wedding album forever. Please help.');
  $('#pay-gateways').innerHTML = ready.map((g, i) => '<label class="fx-gateway"><input type="radio" name="gw" value="' + esc(g.id) + '"' + (i === 0 ? ' checked' : '') + '> ' + esc(g.label || g.id) + '</label>').join('');
  dlg.showModal();
}
async function payGo() {
  const phone = $('#pay-phone').value;
  if (!phoneOk(phone)) { $('#pay-error').textContent = 'Please enter a valid 10-digit mobile number.'; return; }
  const gw = (document.querySelector('input[name="gw"]:checked') || {}).value;
  if (!gw) { $('#pay-error').textContent = 'Please choose a payment option.'; return; }
  const btn = $('#pay-go'); btn.disabled = true; $('#pay-error').textContent = '';
  try {
    const d = await api('/api/albums/' + current.id + '/save-forever', json('POST', { gateway: gw, phone: phone.replace(/\D/g, '') }));
    if (d.gateway === 'razorpay') {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      const rzp = new window.Razorpay({ key: d.key_id, order_id: d.order_id, amount: d.amount, currency: 'INR', name: 'Easy Wedding', description: 'Wedding album storage — Save Forever', handler: async r => {
        try { const v = await api('/api/albums/save-forever/verify', json('POST', { orderId: d.orderId, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature })); $('#pay-dialog').close(); if (v.album) { current = v.album; await refresh(); openAlbum(v.album); banner('Payment confirmed — your album is <b>saved forever</b>.'); } }
        catch (e) { $('#pay-dialog').close(); banner(e.message, true); }
      }, modal: { ondismiss: () => { btn.disabled = false; } } });
      rzp.open();
    } else if (d.gateway === 'cashfree') {
      sessionStorage.setItem('albumOrder', d.orderId);
      await loadScript('https://sdk.cashfree.com/js/v3/cashfree.js');
      window.Cashfree({ mode: d.mode === 'live' ? 'production' : 'sandbox' }).checkout({ paymentSessionId: d.payment_session_id, redirectTarget: '_self' });
    } else if (d.gateway === 'phonepe') {
      sessionStorage.setItem('albumOrder', d.orderId);
      location.href = d.redirect_url;
    } else if (d.gateway === 'payu') {
      const form = document.createElement('form'); form.method = 'POST'; form.action = d.action;
      Object.entries(d.fields || {}).forEach(([k, v]) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; form.appendChild(i); });
      document.body.appendChild(form); form.submit();
    }
  } catch (e) { $('#pay-error').textContent = e.message; btn.disabled = false; }
}

/* ---------------- init ---------------- */
(async function init() {
  const q = new URLSearchParams(location.search);
  try { const s = await (await fetch('/api/session')).json(); user = s.user || null; } catch { user = null; }
  if (!user) { $('#login-box').hidden = false; return; }
  $('#app').hidden = false;
  try { features = await api('/api/features'); $('#draft-days').textContent = features.album.draftDays; } catch {}
  try { pricing = await api('/api/pricing'); } catch {}
  $('#create-form').addEventListener('submit', async e => {
    e.preventDefault(); const f = new FormData(e.target); $('#create-error').textContent = '';
    try { const d = await api('/api/albums', json('POST', { title: f.get('title'), partner1: f.get('partner1'), partner2: f.get('partner2'), weddingDate: f.get('weddingDate') })); e.target.reset(); await refresh(); openAlbum(d.album); }
    catch (err) { $('#create-error').textContent = err.message; }
  });
  $('#details-form').addEventListener('submit', async e => {
    e.preventDefault(); const f = new FormData(e.target); $('#details-error').textContent = ''; $('#details-ok').textContent = '';
    try { const d = await api('/api/albums/' + current.id, json('PUT', { title: f.get('title'), partner1: f.get('partner1'), partner2: f.get('partner2'), weddingDate: f.get('weddingDate'), isPublic: f.get('isPublic') === 'on' })); current = d.album; await refresh(); $('#details-ok').textContent = 'Saved.'; }
    catch (err) { $('#details-error').textContent = err.message; }
  });
  $('#photo-input').addEventListener('change', async e => {
    const files = [...e.target.files]; e.target.value = ''; $('#photo-error').textContent = '';
    for (const file of files) {
      $('#upload-note').textContent = 'Adding ' + file.name + '…';
      try {
        const ready = await compressPhoto(file, { maxEdge: 1600, targetBytes: 1400 * 1024 });
        const fd = new FormData(); fd.append('file', ready, ready.name || 'photo.jpg'); fd.append('caption', '');
        const d = await api('/api/albums/' + current.id + '/photos', { method: 'POST', body: fd });
        const fresh = await api('/api/albums/' + current.id); current = fresh.album;
        const ix = albums.findIndex(x => x.id === current.id); if (ix >= 0) albums[ix] = current; renderList(); renderBuilder();
      } catch (err) { $('#photo-error').textContent = err.message; break; }
    }
    $('#upload-note').textContent = 'One tap per photo — we prepare it for your album automatically.';
  });
  $('#preview-btn').addEventListener('click', () => {
    if (!current.photos || !current.photos.length) { $('#photo-error').textContent = 'Add at least one photo to preview the flipbook.'; return; }
    window.EWFlipbook.mount($('#viewer-mount'), current);
    $('#viewer-dialog').showModal();
  });
  $('#viewer-close').addEventListener('click', () => $('#viewer-dialog').close());
  $('#forever-btn').addEventListener('click', openPay);
  $('#pay-cancel').addEventListener('click', () => $('#pay-dialog').close());
  $('#pay-go').addEventListener('click', payGo);
  $('#copy-link').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#share-link').value); $('#copy-link').textContent = 'Copied ✓'; setTimeout(() => $('#copy-link').textContent = 'Copy link', 1600); } catch {} });
  async function savePin(pin) {
    try { const d = await api('/api/albums/' + current.id, json('PUT', { title: current.title, partner1: current.partner1, partner2: current.partner2, weddingDate: current.weddingDate, isPublic: current.isPublic, sharePin: pin })); current = d.album; const ix = albums.findIndex(x => x.id === current.id); if (ix >= 0) albums[ix] = current; renderBuilder(); $('#pin-note').textContent = pin ? 'PIN saved.' : 'PIN removed.'; }
    catch (e) { $('#pin-note').textContent = e.message; }
  }
  $('#pin-set').addEventListener('click', () => { const pin = $('#pin-input').value.trim(); if (!/^\d{4}$/.test(pin)) { $('#pin-note').textContent = 'Enter exactly 4 digits.'; return; } savePin(pin); });
  $('#pin-remove').addEventListener('click', () => { $('#pin-input').value = ''; savePin(null); });
  $('#delete-album').addEventListener('click', async () => {
    if (!confirm('Delete this album and all its photos permanently?')) return;
    try { await api('/api/albums/' + current.id, { method: 'DELETE' }); current = null; $('#builder').hidden = true; await refresh(); }
    catch (e) { $('#photo-error').textContent = e.message; }
  });
  await refresh();
  const returnOrder = q.get('order_id') || sessionStorage.getItem('albumOrder');
  if (q.get('payment') === 'success' || returnOrder) { if (returnOrder) { sessionStorage.removeItem('albumOrder'); await verifyReturn(returnOrder); } }
})();
