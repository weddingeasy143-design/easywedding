/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Vendors directory + vendor profile + customer booking (Protected Booking). */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var inr = function (p) { return '₹' + (Math.round(Number(p) || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 }); };
  var fmtDate = function (iso) { if (!iso) return '—'; var d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso); return isNaN(d) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
  var phoneOk = function (v) { return /^[6-9]\d{9}$/.test(String(v || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')); };
  var PROTECT = '<div class="fx-protect">🛡 <b>Protected Booking</b> — your payment stays safe with Easy Wedding and is released to the vendor only after your event.</div>';
  var VERIFIED = '<span class="fx-verified">✓ Easy Wedding Verified</span>';
  async function api(path, opts) { var r = await fetch(path, opts); var d = await r.json().catch(function () { return {}; }); if (!r.ok) throw Error(d.error || 'Something went wrong. Please try again.'); return d; }
  function json(method, body) { return { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }; }

  var user = null;
  function ratingLine(v) { return v.rating ? '<span class="fx-meta" style="color:#a5760f;font-weight:700">★ ' + Number(v.rating.average).toFixed(1) + ' · ' + v.rating.count + ' review' + (v.rating.count === 1 ? '' : 's') + '</span>' : ''; }
  function vendorCard(v) {
    return '<article class="fx-tile">' +
      (v.coverUrl ? '<div class="fx-cover"><img src="' + esc(v.coverUrl) + '" alt="" loading="lazy"></div>' : '<div class="fx-cover" style="display:flex;align-items:center;justify-content:center;font:italic 700 19px Georgia,serif;color:var(--fx-gold-dark);padding:12px;text-align:center">' + esc(v.categoryLabel) + '</div>') +
      '<div class="fx-body"><h3>' + esc(v.businessName) + '</h3>' +
      (v.verified ? '<span>' + VERIFIED + '</span>' : '') +
      '<span class="fx-meta">' + esc(v.categoryLabel) + ' · ' + esc(v.city) + '</span>' +
      ratingLine(v) +
      (v.startingPricePaise ? '<span class="fx-price">Starting ' + inr(v.startingPricePaise) + '</span>' : '<span class="fx-meta">Price on request</span>') +
      '<div class="fx-btnrow"><a class="fx-btn small" href="/vendors?v=' + esc(v.id) + '">View &amp; book</a></div></div></article>';
  }
  async function loadDirectory() {
    var cat = $('#f-category').value, city = $('#f-city').value.trim();
    var qs = new URLSearchParams(); if (cat) qs.set('category', cat); if (city) qs.set('city', city);
    var d = await api('/api/vendors' + (qs.toString() ? '?' + qs : ''));
    $('#vendor-grid').innerHTML = (d.vendors || []).map(vendorCard).join('');
    $('#vendor-empty').hidden = (d.vendors || []).length > 0;
  }
  function statusBadge(s) { return '<span class="fx-badge ' + (s === 'confirmed' || s === 'completed' ? 'approved' : s === 'cancelled' ? 'rejected' : 'pending') + '">' + esc(s[0].toUpperCase() + s.slice(1)) + '</span>'; }
  async function loadMyBookings() {
    if (!user) return;
    try {
      var d = await api('/api/vendor-bookings');
      var rows = d.bookings || [];
      $('#my-bookings-wrap').hidden = !rows.length;
      $('#my-bookings').innerHTML = rows.map(function (b) {
        return '<div class="fx-card" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><div style="flex:1;min-width:210px"><b>' + esc(b.vendorName || 'Vendor') + '</b> · ' + esc(b.eventType || 'Event') + '<br><span class="fx-note">' + esc(fmtDate(b.eventDate)) + (b.city ? ' · ' + esc(b.city) : '') + (b.finalPaise ? ' · Final ' + inr(b.finalPaise) : b.budgetPaise ? ' · Budget ' + inr(b.budgetPaise) : '') + (b.vendorCode ? '<br>Vendor ID: ' + esc(b.vendorCode) : '') + '</span>' +
          (b.status === 'completed' && !b.reviewed ? '<div style="margin-top:8px"><label style="font-size:13px">Your review <select data-stars="' + esc(b.id) + '" style="margin:0 4px"><option value="5">★★★★★ (5)</option><option value="4">★★★★ (4)</option><option value="3">★★★ (3)</option><option value="2">★★ (2)</option><option value="1">★ (1)</option></select></label><input data-rtext="' + esc(b.id) + '" maxlength="1000" placeholder="How was the service?" style="max-width:280px;margin-right:6px"><button class="fx-btn small" data-review="' + esc(b.id) + '" data-vendor="' + esc(b.vendorId) + '" type="button">Submit review</button></div>' : '') +
          (b.status === 'completed' && b.reviewed ? '<div class="fx-note" style="margin-top:6px">★ Thanks — your review is live on the vendor’s profile.</div>' : '') +
          '</div>' + statusBadge(b.status) +
          '<a class="fx-btn small ghost" href="/api/receipts/booking/' + esc(b.id) + '" target="_blank" rel="noopener">Receipt</a>' +
          (b.status === 'requested' || b.status === 'confirmed' ? '<button class="fx-btn small ghost" data-cancel="' + esc(b.id) + '" type="button">Cancel</button>' : '') + '</div>';
      }).join('') || '';
      $('#my-bookings').querySelectorAll('[data-cancel]').forEach(function (btn) { btn.addEventListener('click', async function () {
        if (!confirm('Cancel this booking request?')) return;
        try { await api('/api/vendor-bookings/' + btn.dataset.cancel, json('POST', { action: 'cancel' })); loadMyBookings(); } catch (e) { alert(e.message); }
      }); });
      $('#my-bookings').querySelectorAll('[data-review]').forEach(function (btn) { btn.addEventListener('click', async function () {
        var bid = btn.dataset.review;
        var stars = Number((document.querySelector('[data-stars="' + bid + '"]') || {}).value || 5);
        var text = (document.querySelector('[data-rtext="' + bid + '"]') || {}).value || '';
        try { await api('/api/vendors/' + encodeURIComponent(btn.dataset.vendor) + '/reviews', json('POST', { bookingId: bid, stars: stars, text: text })); loadMyBookings(); } catch (e) { alert(e.message); }
      }); });
    } catch {}
  }
  async function loadProfile(id) {
    var wrap = $('#profile-body');
    try {
      var d = await api('/api/vendors/' + encodeURIComponent(id)), v = d.vendor;
      $('#directory-wrap').hidden = true; $('#profile-wrap').hidden = false;
      document.title = v.businessName + ' · ' + v.categoryLabel + ' in ' + v.city + ' · Easy Wedding';
      wrap.innerHTML =
        '<section class="fx-hero" style="text-align:left;padding-top:4px"><p class="fx-kicker">' + esc(v.categoryLabel) + ' · ' + esc(v.city) + '</p>' +
        '<h1 class="fx-h1" style="margin-bottom:6px">' + esc(v.businessName) + '</h1>' +
        (v.vendorCode ? '<p class="fx-note" style="margin:0 0 6px">Vendor ID: ' + esc(v.vendorCode) + '</p>' : '') +
        (v.verified ? '<p>' + VERIFIED + ' <span class="fx-note">ID and address checked by the Easy Wedding team.</span></p>' : '') +
        (v.rating ? '<p style="margin:4px 0;color:#a5760f;font-weight:700">★ ' + Number(v.rating.average).toFixed(1) + ' · ' + v.rating.count + ' review' + (v.rating.count === 1 ? '' : 's') + ' <span class="fx-note" style="font-weight:400">from completed bookings</span></p>' : '') +
        '<p style="color:var(--fx-soft)">' + (v.startingPricePaise ? 'Starting at <b style="color:var(--fx-ink)">' + inr(v.startingPricePaise) + '</b>' : 'Price on request') + '</p></section>' +
        (v.photos && v.photos.length ? '<div class="fx-strip">' + v.photos.map(function (p) { return '<img src="' + esc(p.url) + '" alt="" loading="lazy">'; }).join('') + '</div>' : '') +
        (v.about ? '<section class="fx-card"><h2 class="fx-h2" style="margin-top:0">About</h2><p style="white-space:pre-wrap;margin:0">' + esc(v.about) + '</p></section>' : '') +
        ((d.reviews && d.reviews.length) ? '<section class="fx-card"><h2 class="fx-h2" style="margin-top:0">Customer reviews</h2>' + d.reviews.map(function (r) { return '<div style="border-top:1px solid #f0e7d8;padding:10px 0"><span style="color:#a5760f;font-weight:700">' + '★★★★★'.slice(0, r.stars) + '</span> <span class="fx-note">' + esc(r.customer) + ' · ' + esc(fmtDate(r.createdAt)) + '</span>' + (r.text ? '<p style="margin:6px 0 0;white-space:pre-wrap">' + esc(r.text) + '</p>' : '') + '</div>'; }).join('') + '</section>' : '') +
        PROTECT +
        '<section class="fx-card"><h2 class="fx-h2" style="margin-top:0">Book ' + esc(v.businessName) + '</h2>' +
        (user ? '<form id="book-form" class="fx-form">' +
          '<div class="fx-row2"><label>Event date<input name="eventDate" type="date" required></label><label>Event type<input name="eventType" maxlength="60" placeholder="Wedding, Reception, Haldi…" required></label></div>' +
          '<div class="fx-row2"><label>City<input name="city" maxlength="60" value="' + esc(v.city) + '" required></label><label>Your mobile number<input name="phone" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile number" required></label></div>' +
          '<label>Expected budget (₹) <small>optional</small><input name="budget" type="number" min="0" step="100" placeholder="e.g. 25000"></label>' +
          '<label>Message for the vendor<textarea name="message" rows="3" maxlength="800" placeholder="Tell them about your event…"></textarea></label>' +
          '<p class="fx-error" id="book-error" role="alert"></p><p class="fx-ok" id="book-ok"></p>' +
          '<div><button class="fx-btn" type="submit">Send booking request</button> <span class="fx-note">Free to request — the vendor confirms the final amount with you.</span></div></form>'
        : '<p class="fx-note">Please sign in to send a booking request.</p><div class="fx-btnrow"><a class="fx-btn" href="/login?next=' + encodeURIComponent('/vendors?v=' + v.id) + '">Sign in to book</a></div>') +
        '</section>';
      var form = $('#book-form');
      if (form) form.addEventListener('submit', async function (e) {
        e.preventDefault(); var f = new FormData(form); $('#book-error').textContent = ''; $('#book-ok').textContent = '';
        if (!phoneOk(f.get('phone'))) { $('#book-error').textContent = 'Please enter a valid 10-digit mobile number.'; return; }
        try {
          await api('/api/vendor-bookings', json('POST', { vendorId: v.id, eventDate: f.get('eventDate'), eventType: f.get('eventType'), city: f.get('city'), phone: String(f.get('phone')).replace(/\D/g, ''), budget: f.get('budget') ? Number(f.get('budget')) : undefined, message: f.get('message') }));
          $('#book-ok').textContent = 'Request sent! The vendor will confirm the final amount here. Track it under “My bookings” on the Vendors page.';
          form.reset(); loadMyBookings();
        } catch (err) { $('#book-error').textContent = err.message; }
      });
    } catch (e) {
      wrap.innerHTML = '<div class="fx-card"><h2 class="fx-h2" style="margin-top:0">Vendor not found</h2><p class="fx-note">This vendor may not be listed right now. <a href="/vendors">Browse all vendors</a>.</p></div>';
      $('#directory-wrap').hidden = true; $('#profile-wrap').hidden = false;
    }
  }
  (async function init() {
    try { var s = await (await fetch('/api/session')).json(); user = s.user || null; } catch { user = null; }
    try { var f = await api('/api/features'); ($('#f-category').innerHTML = '<option value="">All categories</option>' + (f.vendorCategories || []).map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.label) + '</option>'; }).join('')); } catch {}
    var q = new URLSearchParams(location.search);
    if (q.get('category')) $('#f-category').value = q.get('category');
    $('#filter-form').addEventListener('submit', function (e) { e.preventDefault(); loadDirectory().catch(function (err) { alert(err.message); }); });
    if (q.get('v')) loadProfile(q.get('v'));
    else { loadDirectory().catch(function () {}); loadMyBookings(); }
  })();
})();
