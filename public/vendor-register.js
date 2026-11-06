/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Vendor self-registration: creates an account first if signed out, then the
   business profile (lands as PENDING until the owner approves it in /boss). */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var phoneOk = function (v) { return /^[6-9]\d{9}$/.test(String(v || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')); };
  async function api(path, opts) { var r = await fetch(path, opts); var d = await r.json().catch(function () { return {}; }); if (!r.ok) throw Error(d.error || 'Something went wrong. Please try again.'); return d; }
  function json(method, body) { return { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }; }
  var user = null;
  (async function init() {
    try { var f = await api('/api/features'); $('#reg-category').innerHTML = '<option value="">Choose a category…</option>' + (f.vendorCategories || []).map(function (c) { return '<option value="' + c.id + '">' + c.label + '</option>'; }).join(''); if (f.vendorAgreement) { $('#agreement-text').textContent = f.vendorAgreement.text; $('#agreement-version').textContent = f.vendorAgreement.version; } } catch {}
    try { var s = await (await fetch('/api/session')).json(); user = s.user || null; } catch {}
    if (user) {
      $('#account-fields').hidden = true;
      $('#account-note').hidden = false;
      $('#account-note').textContent = 'Signed in as ' + (user.email || 'your account') + ' — the business will be linked to this account.';
      try { var me = await api('/api/vendor/me'); if (me.vendor) { $('#reg-form').hidden = true; $('#already').hidden = false; } } catch {}
    }
    $('#reg-form').addEventListener('submit', async function (e) {
      e.preventDefault(); var f = new FormData(e.target); var err = $('#reg-error'); err.textContent = '';
      if (!$('#agree').checked) { err.textContent = 'Please read and accept the vendor agreement (step 4) to continue.'; $('#agree').focus(); return; }
      if (!phoneOk(f.get('phone'))) { err.textContent = 'Please enter a valid 10-digit mobile number.'; return; }
      if (!phoneOk(f.get('whatsapp'))) { err.textContent = 'Please enter a valid 10-digit WhatsApp number.'; return; }
      try {
        if (!user) {
          var pw = String(f.get('accPassword') || '');
          if (pw.length < 8) { err.textContent = 'Please create a password of at least 8 characters.'; return; }
          var su = await api('/api/auth/signup', json('POST', { name: f.get('accName'), email: f.get('accEmail'), password: pw }));
          user = su.user || su;
        }
        await api('/api/vendors/register', json('POST', {
          businessName: f.get('businessName'), ownerName: f.get('ownerName'), category: f.get('category'), city: f.get('city'),
          phone: String(f.get('phone')).replace(/\D/g, ''), whatsapp: String(f.get('whatsapp')).replace(/\D/g, ''), email: f.get('email'),
          startingPrice: Number(f.get('startingPrice')), about: f.get('about'), agreementAccepted: true,
          payoutHolder: f.get('payoutHolder'), payoutAccount: f.get('payoutAccount'), payoutIfsc: f.get('payoutIfsc'), payoutUpi: f.get('payoutUpi'), payoutPan: f.get('payoutPan')
        }));
        $('#reg-form').hidden = true; $('#reg-done').hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (ex) { err.textContent = ex.message; }
    });
  })();
})();
