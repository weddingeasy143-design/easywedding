/* Easy Wedding — Visitor Intelligence tracker. First-party and anonymous:
   no name, no contact detail, no raw IP ever leaves the browser (the server
   only stores a salted hash of it). The visitor id is ISSUED BY THE SERVER
   (this script never invents one) and kept in the ew_vid cookie for a year.
   Every step is guarded — if anything fails, the page simply carries on. */
(() => {
  try {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    if (/^\/(boss|admin)/.test(path)) return;
    const safe = (fn, fb) => { try { return fn(); } catch { return fb; } };
    if (safe(() => localStorage.getItem('ew_notrack') === '1', false)) return;

    const readCookie = () => { const m = document.cookie.match(/(?:^|;\s*)ew_vid=([0-9a-f-]{36})/i); return m ? m[1] : ''; };
    let vid = readCookie();
    let sess = safe(() => sessionStorage.getItem('ew_vi_s'), '');
    if (!sess) { sess = 's' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); safe(() => sessionStorage.setItem('ew_vi_s', sess)); }

    /* Campaign capture: first-touch is kept once; last-touch refreshes on
       every campaign arrival (UTM parameters or an ad click id). */
    const q = new URLSearchParams(location.search);
    const touch = {}; let hasTouch = false;
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']) {
      const v = q.get(k); if (v) { touch[k] = v.slice(0, 120); hasTouch = true; }
    }
    if (hasTouch) {
      if (!safe(() => localStorage.getItem('ew_vi_ft'), '')) safe(() => localStorage.setItem('ew_vi_ft', JSON.stringify(touch)));
      safe(() => localStorage.setItem('ew_vi_lt', JSON.stringify(touch)));
    }
    const ft = safe(() => JSON.parse(localStorage.getItem('ew_vi_ft') || 'null'), null);
    const lt = safe(() => JSON.parse(localStorage.getItem('ew_vi_lt') || 'null'), null);

    /* Light device fingerprint: canvas + font widths + hardware hints,
       hashed with SHA-256. Only used to re-link this same device when the
       cookie was cleared — never sent in raw form. */
    let fpPromise = null;
    const fingerprint = () => {
      if (fpPromise) return fpPromise;
      fpPromise = (async () => {
        try {
          const c = document.createElement('canvas'); c.width = 240; c.height = 48;
          const x = c.getContext('2d'); if (!x) return '';
          x.textBaseline = 'top'; x.font = '16px Arial'; x.fillStyle = '#123';
          x.fillText('EasyWedding 2026', 4, 4); x.font = '13px Georgia'; x.fillText('visitor intel 42', 4, 24);
          const parts = [c.toDataURL(), String(navigator.hardwareConcurrency || ''), String(screen.width) + 'x' + String(screen.height), String(screen.colorDepth || ''), (Intl.DateTimeFormat().resolvedOptions().timeZone || ''), navigator.language || ''];
          for (const f of ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact']) { x.font = '16px ' + f + ',monospace'; parts.push(String(Math.round(x.measureText('mmmmmmmmmmlli').width * 100))); }
          const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('|')));
          return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
        } catch { return ''; }
      })();
      return fpPromise;
    };

    let firstDone = false;
    async function send(evt) {
      try {
        const fp = await Promise.race([fingerprint(), new Promise(r => setTimeout(() => r(''), 350))]);
        const payload = { v: vid || '', fp, sess, t: evt.t, p: path, r: document.referrer || '', tmpl: evt.tmpl || '', d: evt.d || '', scr: screen.width + 'x' + screen.height, tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || '').slice(0, 60), lang: (navigator.language || '').slice(0, 20) };
        if (evt.t === 'pageview') { if (ft) payload.ft = ft; if (lt) payload.lt = lt; }
        const bodyTxt = JSON.stringify(payload);
        if (!firstDone) {
          /* First send uses fetch so we can learn the server-issued vid and
             store it (the server also sets it as a cookie). */
          firstDone = true;
          const res = await fetch('/api/vi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: bodyTxt, keepalive: true }).catch(() => null);
          if (res && res.ok) {
            const d = await res.json().catch(() => null);
            if (d && typeof d.vid === 'string' && d.vid !== vid) {
              vid = d.vid;
              safe(() => { document.cookie = 'ew_vid=' + vid + '; Max-Age=31536000; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : ''); });
            }
          }
          return;
        }
        if (navigator.sendBeacon && navigator.sendBeacon('/api/vi', new Blob([bodyTxt], { type: 'application/json' }))) return;
        fetch('/api/vi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: bodyTxt, keepalive: true }).catch(() => {});
      } catch {}
    }

    send({ t: 'pageview' });
    if (path === '/studio') send({ t: 'studio', d: 'page' });
    if (/\/(pricing|checkout|payment)/.test(path)) send({ t: 'pricing', d: 'page' });

    document.addEventListener('click', e => {
      try {
        const t = e.target;
        const pv = t.closest && t.closest('[data-preview]');
        if (pv) { send({ t: 'preview', tmpl: String(pv.dataset.preview || '').slice(0, 40) }); return; }
        if (t.closest && t.closest('#pb-pay,#share-bottom')) { send({ t: 'pricing', d: 'pay-open' }); return; }
        const a = t.closest && t.closest('a[href]');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        if (/wa\.me\/|api\.whatsapp\.com|whatsapp\.com\/send/.test(href)) { send({ t: 'whatsapp' }); return; }
        try { const u = new URL(href, location.href); if (u.origin === location.origin && (u.pathname.replace(/\/+$/, '') || '/') === '/studio') send({ t: 'studio', d: 'link' }); } catch {}
      } catch {}
    }, true);

    /* The studio payment dialog opening is a pricing/payment view. */
    const pd = document.querySelector('#pay-dialog');
    if (pd && window.MutationObserver) new MutationObserver(() => { if (pd.open) send({ t: 'pricing', d: 'dialog' }); }).observe(pd, { attributes: true, attributeFilter: ['open'] });
  } catch {}
})();
