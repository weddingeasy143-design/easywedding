/* Easy Wedding — third-party tracking loader (Google Analytics 4, Microsoft
   Clarity, Meta Pixel) behind ONE consent gate. The three IDs come from the
   boss settings via /api/site-info; a service whose ID is empty is never
   loaded. Nothing loads until the visitor presses Accept on the cookie
   banner, and the choice is remembered in localStorage (ew_consent).
   This runs alongside the first-party Visitor Intelligence (vi.js), which
   is a separate, always-on anonymous system and is not touched by consent.
   Every step is guarded — if anything fails, the page simply carries on. */
(() => {
  try {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    if (/^\/(boss|admin)/.test(path)) return;
    const safe = (fn, fb) => { try { return fn(); } catch { return fb; } };
    if (safe(() => localStorage.getItem('ew_notrack') === '1', false)) return;

    let ids = null;          // {ga4Id, clarityId, metaPixelId} once fetched
    let loaded = false;      // trackers injected
    const queue = [];        // events waiting for consent + load

    /* ---- event plumbing ------------------------------------------------ */
    function sendToTrackers(name, params) {
      const p = params && typeof params === 'object' ? params : {};
      if (ids.ga4Id && typeof window.gtag === 'function') {
        try { window.gtag('event', name, p); } catch {}
      }
      if (ids.metaPixelId && typeof window.fbq === 'function') {
        try {
          if (name === 'purchase') window.fbq('track', 'Purchase', { value: Number(p.value) || 0, currency: p.currency || 'INR' });
          else if (name === 'begin_payment') window.fbq('track', 'InitiateCheckout', { value: Number(p.value) || 0, currency: p.currency || 'INR' });
          else if (name === 'view_design') window.fbq('track', 'ViewContent', { content_ids: p.design ? [String(p.design)] : [], content_type: 'product' });
          else if (name === 'page_view') window.fbq('track', 'PageView');
          else window.fbq('trackCustom', name, p);
        } catch {}
      }
    }
    function fire(name, params) {
      if (loaded) { sendToTrackers(name, params); return; }
      if (queue.length < 25) queue.push([name, params]);
    }
    /* Public hook for the rest of the site (studio payment flow etc.). */
    window.ewTrack = (name, params) => { try { if (typeof name === 'string' && name) fire(name, params); } catch {} };

    /* ---- loaders (standard vendor snippets, guarded) -------------------- */
    function loadGa4(id) {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', id); // sends the automatic page_view
    }
    function loadClarity(id) {
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', id);
    }
    function loadPixel(id) {
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', id);
      window.fbq('track', 'PageView');
    }
    function loadAll() {
      if (loaded || !ids) return;
      loaded = true;
      try { if (ids.ga4Id) loadGa4(ids.ga4Id); } catch {}
      try { if (ids.clarityId) loadClarity(ids.clarityId); } catch {}
      try { if (ids.metaPixelId) loadPixel(ids.metaPixelId); } catch {}
      autoEvents();
      while (queue.length) { const [n, p] = queue.shift(); sendToTrackers(n, p); }
    }

    /* ---- automatic events ------------------------------------------------ */
    function autoEvents() {
      const m = path.match(/^\/design\/([a-z0-9-]+)/i);
      if (m) fire('view_design', { design: m[1] });
      if (path === '/reference/render.html' || path === '/invite') {
        /* The invitation render carries the design in its #card= config. */
        try {
          const h = new URLSearchParams(location.hash.slice(1));
          if (h.has('card')) {
            const bin = atob(h.get('card').replace(/-/g, '+').replace(/_/g, '/'));
            const cfg = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
            if (cfg && typeof cfg.theme === 'string' && cfg.theme) fire('view_design', { design: cfg.theme });
          }
        } catch {}
      }
      if (path === '/studio') fire('start_studio', {});
    }
    /* WhatsApp clicks count from the first moment, consent or not — they sit
       in the queue and are only ever sent after the visitor accepts. */
    document.addEventListener('click', e => {
      try {
        const a = e.target && e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        if (/wa\.me\/|api\.whatsapp\.com|whatsapp\.com\/send/.test(href)) fire('click_whatsapp', {});
      } catch {}
    }, true);

    /* ---- consent banner --------------------------------------------------- */
    function showBanner() {
      if (document.getElementById('ew-consent')) return;
      const bar = document.createElement('div');
      bar.id = 'ew-consent';
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Cookie consent');
      bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9990;background:#fff8ea;border-top:2px solid #75152e;color:#4a1522;padding:10px 14px;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:center;font:14px/1.45 system-ui,sans-serif;box-shadow:0 -4px 18px rgba(74,21,34,.18)';
      const text = document.createElement('span');
      text.textContent = 'Hum aapke anubhav ko behtar banane ke liye cookies use karte hain.';
      const accept = document.createElement('button');
      accept.type = 'button';
      accept.textContent = 'Accept';
      accept.style.cssText = 'background:#75152e;color:#fff6e0;border:0;border-radius:999px;padding:8px 22px;font:600 14px system-ui,sans-serif;cursor:pointer';
      const decline = document.createElement('button');
      decline.type = 'button';
      decline.textContent = 'Decline';
      decline.style.cssText = 'background:transparent;color:#75152e;border:1.5px solid #75152e;border-radius:999px;padding:7px 20px;font:600 14px system-ui,sans-serif;cursor:pointer';
      accept.addEventListener('click', () => {
        safe(() => localStorage.setItem('ew_consent', 'granted'));
        bar.remove();
        loadAll();
      });
      decline.addEventListener('click', () => {
        safe(() => localStorage.setItem('ew_consent', 'denied'));
        queue.length = 0;
        bar.remove();
      });
      bar.append(text, accept, decline);
      (document.body || document.documentElement).appendChild(bar);
    }

    /* ---- start ------------------------------------------------------------ */
    const consent = safe(() => localStorage.getItem('ew_consent'), '');
    fetch('/api/site-info').then(r => (r.ok ? r.json() : null)).then(d => {
      const t = (d && d.tracking) || {};
      ids = {
        ga4Id: typeof t.ga4Id === 'string' ? t.ga4Id : '',
        clarityId: typeof t.clarityId === 'string' ? t.clarityId : '',
        metaPixelId: typeof t.metaPixelId === 'string' ? t.metaPixelId : ''
      };
      const anyId = !!(ids.ga4Id || ids.clarityId || ids.metaPixelId);
      if (!anyId) { queue.length = 0; return; }  // nothing configured: no banner, no loads
      if (consent === 'granted') loadAll();
      else if (consent !== 'denied') {
        if (document.body) showBanner();
        else document.addEventListener('DOMContentLoaded', showBanner, { once: true });
      }
    }).catch(() => {});
  } catch {}
})();
