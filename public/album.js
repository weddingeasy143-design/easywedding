/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Wedding Album public page: the demo flipbook for everyone, and the viewer
   for a shared permanent album (?s=<token>). */
(function () {
  'use strict';
  var inr = function (p) { return '₹' + (Math.round(Number(p) || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 }); };
  async function get(path) { var r = await fetch(path); var d = await r.json().catch(function () { return {}; }); if (!r.ok) throw Error(d.error || 'Something went wrong.'); return d; }
  var q = new URLSearchParams(location.search), token = q.get('s');
  if (token) {
    document.getElementById('landing-wrap').hidden = true;
    document.getElementById('shared-wrap').hidden = false;
    function showShared(a) {
      document.getElementById('pin-unlock').hidden = true;
      document.getElementById('shared-title').textContent = a.title || 'Our Wedding Album';
      document.getElementById('shared-sub').textContent = [a.partner1, a.partner2].filter(Boolean).join('  ♥  ');
      document.title = (a.title || 'Wedding Album') + ' · Easy Wedding';
      window.EWFlipbook.mount(document.getElementById('shared-book'), a);
    }
    get('/api/albums/shared/' + encodeURIComponent(token)).then(function (d) {
      if (d.pinRequired) {
        document.getElementById('shared-title').textContent = (d.album && d.album.title) || 'Our Wedding Album';
        document.getElementById('shared-sub').textContent = 'This album is protected with a PIN.';
        document.getElementById('pin-unlock').hidden = false;
        return;
      }
      showShared(d.album);
    }).catch(function (e) {
      document.getElementById('shared-title').textContent = 'Album not found';
      document.getElementById('shared-sub').textContent = e.message === 'Album not found.' ? 'This link may be private, or the album is no longer shared.' : e.message;
    });
    document.getElementById('pin-go').addEventListener('click', async function () {
      var pin = document.getElementById('pin-code').value.trim();
      var err = document.getElementById('pin-error'); err.textContent = '';
      try {
        var r = await fetch('/api/albums/shared/' + encodeURIComponent(token) + '/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: pin }) });
        var d = await r.json().catch(function () { return {}; });
        if (!r.ok) throw Error(d.error || 'That PIN did not work.');
        showShared(d.album);
      } catch (e) { err.textContent = e.message; }
    });
    return;
  }
  get('/demo-album.json').then(function (demo) {
    window.EWFlipbook.mount(document.getElementById('demo-book'), demo);
  }).catch(function () {
    document.getElementById('demo-book').innerHTML = '<p class="fx-note" style="text-align:center">The demo album could not load just now. Please refresh.</p>';
  });
  get('/api/features').then(function (f) {
    if (f && f.album) {
      document.getElementById('fx-draft-days').textContent = f.album.draftDays;
      document.getElementById('fx-price').textContent = 'one-time ' + inr(f.album.pricePaise);
    }
  }).catch(function () {});
})();
