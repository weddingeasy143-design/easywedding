/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Features-section template strip: tap a design and its animated invitation
   preview plays in a dialog on this page (same preview the studio uses). */
import {referenceDesigns} from './reference-designs.js';

const strip = document.querySelector('#feature-template-strip');
const dialog = document.querySelector('#template-preview-dialog');

if (dialog) {
  const frame = dialog.querySelector('#tpl-frame');
  const title = dialog.querySelector('#tpl-title');
  const makeLink = dialog.querySelector('#tpl-make');
  const loading = dialog.querySelector('#tpl-loading');
  const wrap = dialog.querySelector('.tpl-frame-wrap');
  let pollTimer = null;
  let startedAt = 0;

  /* The invitation is designed for a 360–430px phone. On shorter desktop
     windows the shell used to shrink the frame below that range and the
     big display type broke mid-word, so the frame always renders at a
     fixed 390px phone width and is scaled down to fit the shell — the
     same treatment the studio preview uses. */
  function fitPreview() {
    if (!wrap || !frame) return;
    const cs = getComputedStyle(wrap);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const padT = parseFloat(cs.paddingTop) || 0;
    const padB = parseFloat(cs.paddingBottom) || 0;
    const innerW = wrap.clientWidth - padL - padR;
    const innerH = wrap.clientHeight - padT - padB;
    if (!innerW || !innerH) return;
    const s = Math.min(1, innerW / 390);
    frame.style.left = (padL + Math.max(0, (innerW - 390 * s) / 2)) + 'px';
    frame.style.top = padT + 'px';
    frame.style.width = '390px';
    frame.style.height = Math.round(innerH / s) + 'px';
    frame.style.transform = s < 1 ? 'scale(' + s + ')' : '';
  }
  if (wrap && window.ResizeObserver) new ResizeObserver(() => fitPreview()).observe(wrap);
  window.addEventListener('resize', () => { if (dialog.open) fitPreview(); });

  function stopAutoplay() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  /* Speed (2026-11-19): warm the preview's heavy files before the tap.
     Measured on a slow phone connection, one preview click used to download
     ~3 MB in a strict sequence (the app bundle twice, then four data files
     one after another, then the first pictures). The bundle, the data files
     and the design's first picture are now prefetched at the lowest priority
     when a design card is seen, hovered or touched, so the tap itself mostly
     waits for the app to run. Shared files warm once; each design's own
     files warm once per design. Data-saver and 2G connections are skipped. */
  const GATE_IMAGE = {
    'mandir-darwaza': 'assets/mandir-darwaza/doors-closed.webp',
    'ram-mandir': 'assets/ram-mandir/hero-scene.webp'
  };
  const frugal = !!(navigator.connection &&
    (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || '')));
  const warmedDesigns = new Set();
  let sharedWarmed = false;
  let warmingStopped = false;
  function prefetch(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.append(link);
  }
  function warmPreview(id) {
    if (warmingStopped || frugal || !id) return;
    if (!sharedWarmed) {
      sharedWarmed = true;
      ['reference/entry.js', 'reference/source-app.js',
       'reference/source-data.json', 'reference/demos.json'].forEach(prefetch);
    }
    if (warmedDesigns.has(id)) return;
    warmedDesigns.add(id);
    prefetch('reference/render.html?template=' + id);
    prefetch('demo-configs/' + id + '.json');
    if (GATE_IMAGE[id]) prefetch(GATE_IMAGE[id]);
  }
  const warmFromEvent = (event) => {
    const trigger = event.target.closest && event.target.closest('[data-preview]');
    if (trigger) warmPreview(trigger.dataset.preview);
  };
  ['pointerover', 'touchstart', 'focusin'].forEach((type) =>
    document.addEventListener(type, warmFromEvent, { passive: true }));
  /* A card the visitor keeps looking at (visible ~1 s) warms its own design
     too; a card that merely scrolls past does not. Only ONE card dwells at a
     time (the first unwarm​ed one on screen, in catalog order): warming
     several cards together was measured to backfire on slow connections —
     the prefetch queue was still downloading at tap time and competed with
     the preview itself. All warming stops the moment a preview opens. */
  let cardWatcher = null;
  let dwellEl = null;
  let dwellTimer = null;
  function cancelDwell() {
    if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
    dwellEl = null;
  }
  function stopWarming() {
    warmingStopped = true;
    cancelDwell();
    if (cardWatcher) { cardWatcher.disconnect(); cardWatcher = null; }
  }
  if ('IntersectionObserver' in window && !frugal) {
    cardWatcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        const id = el.dataset.preview || el.dataset.warmId;
        if (!id) return;
        if (entry.isIntersecting) {
          if (!dwellEl && !warmedDesigns.has(id)) {
            dwellEl = el;
            dwellTimer = setTimeout(() => { dwellEl = null; dwellTimer = null; warmPreview(id); }, 900);
          }
        } else if (dwellEl === el) cancelDwell();
      });
    }, { rootMargin: '100px' });
    document.querySelectorAll('[data-preview]').forEach((el) => cardWatcher.observe(el));
  }

  function press(el, doc) {
    /* The invitation app reacts to pointer presses, not a bare .click().
       Events are built with the frame's own constructors: ones made in this
       window are rejected (the cross-window `view`) or ignored inside it. */
    const view = doc.defaultView || window;
    const Pointer = view.PointerEvent || view.MouseEvent;
    const Mouse = view.MouseEvent;
    const opts = { bubbles: true, cancelable: true, view };
    try {
      el.dispatchEvent(new Pointer('pointerdown', opts));
      el.dispatchEvent(new Mouse('mousedown', opts));
      el.dispatchEvent(new Pointer('pointerup', opts));
      el.dispatchEvent(new Mouse('mouseup', opts));
      el.dispatchEvent(new Mouse('click', opts));
    } catch (err) { el.click(); }
  }

  function findByText(doc, pattern) {
    /* The live control whose text matches, or null. The app unmounts
       inactive screens, so a match is what is on screen now. */
    const view = doc.defaultView;
    const candidates = [...doc.querySelectorAll('button, a, [role="button"], div, span')]
      .filter((el) => {
        if (!pattern.test((el.textContent || '').trim())) return false;
        const r = el.getBoundingClientRect();
        /* Rendered and near the frame: a generous margin is needed because
           the card's open button can sit just below the frame's fold. */
        return r.width > 0 && r.height > 0 && r.bottom > -50 && r.right > -50 &&
          r.top < (view ? view.innerHeight + 200 : 1e9) &&
          r.left < (view ? view.innerWidth + 200 : 1e9);
      });
    if (!candidates.length) return null;
    candidates.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
    let target = candidates.find((el) => el.tagName === 'BUTTON') || candidates[0];
    for (let i = 0; i < 5 && target; i++) {
      if (target.tagName === 'BUTTON' || target.tagName === 'A' ||
          target.getAttribute('role') === 'button' || target.onclick) break;
      target = target.parentElement;
    }
    return target || candidates[0];
  }

  /* Preview choreography state (owner's rule): the preview waits at the
     Tap to Reveal screen for the visitor's own tap, plays through the
     reveal beats, then holds at the Open Invitation cover for 10 seconds
     before pressing it once — only if the visitor hasn't taken over by
     scrolling or keyboard (their taps are part of the flow). */
  let coverSince = 0;
  let coverPressed = false;

  function hideLoading() {
    if (loading) loading.hidden = true;
  }

  function tick() {
    let doc = null;
    try { doc = frame.contentDocument; } catch (err) { doc = null; }
    /* invite first shows its own "Preparing…" page, then hands over to
       reference/render.html. Keep our loader up until the real card is there. */
    const onCard = !!doc && !!doc.body && /\/reference\/render\.html$/.test(doc.location.pathname);
    if (onCard) {
      /* The visitor has started scrolling the invitation: the driver must
         never press anything again, or its cover press (the button is still
         near the top) throws them back to the top. */
      if (doc.defaultView && doc.defaultView.scrollY > 24) { stopAutoplay(); return; }
      const text = doc.body.textContent || '';
      /* The loader can come down once the app itself has mounted (the
         runtime's "Preparing…" placeholder is replaced by the real card). */
      const root = doc.querySelector('#reference-root');
      if ((root && root.children.length && !doc.querySelector('.invitation-loading')) || text.length > 3000) hideLoading();
      /* The Open Invitation cover is the one place the driver still acts —
         and only after a 10-second hold (owner's choreography): the preview
         reaches the cover through the visitor's own tap on Tap to Reveal,
         waits 10 s there, then presses Open Invitation exactly once. A
         visitor who taps the cover themselves opens it instantly through
         the app (and the opened card ends the driver's work); scrolling or
         keyboard input stops the driver first (see the frame listener). */
      const cover = findByText(doc, /open invitation/i);
      if (cover) {
        hideLoading();
        if (!coverSince) coverSince = Date.now();
        if (!coverPressed && Date.now() - coverSince >= 10000) {
          coverPressed = true;
          press(cover, doc);
          stopAutoplay();
        }
        return;
      }
      /* Nothing to drive while the visitor is at the reveal screen or the
         beats are playing. If they opened the card themselves, we are done. */
      const opened = !!doc.querySelector('#rsvp') ||
        [...doc.querySelectorAll('button')].some((b) => /replay invitation/i.test(b.textContent || ''));
      if (opened) stopAutoplay();
    }
    const elapsed = Date.now() - startedAt;
    if (elapsed > 15000) hideLoading();
    if (elapsed > 90000) stopAutoplay();
  }

  /* Focus moves into the invitation once it is tapped; keep Esc closing the
     preview, and hide the frame's own scrollbar inside the phone screen. */
  frame.addEventListener('load', () => {
    try {
      const view = frame.contentWindow;
      view.addEventListener('keydown', (event) => { if (event.key === 'Escape') dialog.close(); });
      view.document.documentElement.style.scrollbarWidth = 'none';
      /* Wheel and touch scrolling move the page directly (no CSS smoothing lag) and never chain to the page behind. */
      view.document.documentElement.style.scrollBehavior = 'auto';
      view.document.documentElement.style.overscrollBehavior = 'contain';
      /* Real scrolling or keyboard input means the visitor is exploring on
         their own: stop the driver. Taps are NOT a stop signal — they are
         part of the choreography itself (the Tap to Reveal tap, beat skips,
         and the cover's own button, which always opens instantly when the
         visitor presses it). If taps stopped the driver, the required first
         tap would kill the cover's 10-second hold before it began. */
      /* Only real input counts (isTrusted): the driver's own synthetic
         cover press must not stop itself. */
      ['wheel', 'keydown'].forEach((type) => view.addEventListener(type, (event) => { if (event.isTrusted) stopAutoplay(); }, { passive: true }));
    } catch (err) { /* about:blank or navigated away */ }
  });

  function openPreview(design) {
    stopWarming();
    title.textContent = design.name;
    makeLink.href = '/studio?template=' + design.id;
    if (loading) loading.hidden = false;
    coverSince = 0;
    coverPressed = false;
    startedAt = Date.now();
    requestAnimationFrame(fitPreview);
    frame.src = 'reference/render.html?template=' + design.id;
    stopAutoplay();
    /* 250 ms (was 900): the loader overlay used to linger up to ~0.9 s after
       the invitation was already on screen behind it. */
    pollTimer = setInterval(tick, 250);
  }

  if (strip) Object.values(referenceDesigns).forEach((design, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ftpl-card';
    button.dataset.dialog = 'template-preview-dialog';
    button.setAttribute('aria-label', 'Play the ' + design.name + ' invitation preview');

    const figure = document.createElement('span');
    figure.className = 'ftpl-figure';
    const image = document.createElement('img');
    image.src = design.scene;
    image.alt = '';
    image.loading = 'lazy';
    figure.append(image);
    if (design.premium) {
      const badge = document.createElement('span');
      badge.className = 'ftpl-badge';
      badge.textContent = 'PREMIUM';
      figure.append(badge);
    }
    const play = document.createElement('span');
    play.className = 'ftpl-play';
    play.innerHTML = '<i data-lucide="play" class="icon"></i>';
    figure.append(play);

    const name = document.createElement('span');
    name.className = 'ftpl-name';
    name.textContent = String(index + 1).padStart(2, '0') + ' · ' + design.name;
    const hint = document.createElement('span');
    hint.className = 'ftpl-hint';
    hint.textContent = 'Tap to play';

    button.append(figure, name, hint);
    button.dataset.warmId = design.id;
    if (cardWatcher) cardWatcher.observe(button);
    button.addEventListener('pointerenter', () => warmPreview(design.id));
    button.addEventListener('focus', () => warmPreview(design.id));
    button.addEventListener('click', () => openPreview(design));
    strip.append(button);
  });

  /* Pricing cards, hero thumbnails and the studio band all play the same
     preview. Delegated, because the studio band is rebuilt by another module;
     links keep their invite href as the no-JS fallback. */
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-preview]');
    const design = trigger && referenceDesigns[trigger.dataset.preview];
    if (!design) return;
    event.preventDefault();
    if (!dialog.open) {
      document.querySelectorAll('dialog[open]').forEach((d) => d.close());
      dialog.showModal();
    }
    openPreview(design);
  });

  if (window.lucide) window.lucide.createIcons();

  dialog.addEventListener('close', () => {
    stopAutoplay();
    frame.src = 'about:blank';
  });
}

/* Card prices are refreshed from the pricing API by catalog.js. */
