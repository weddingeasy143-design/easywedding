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
  let pollTimer = null;
  let startedAt = 0;

  function stopAutoplay() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
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

  function pressByText(doc, pattern) {
    /* State-driven: only presses a control that is actually on screen now.
       The app can swallow a press that lands before it is ready, so the
       caller re-checks the visible state on every tick instead of trusting
       that one press worked. */
    const view = doc.defaultView;
    const candidates = [...doc.querySelectorAll('button, a, [role="button"], div, span')]
      .filter((el) => {
        if (!pattern.test((el.textContent || '').trim())) return false;
        const r = el.getBoundingClientRect();
        /* Rendered and near the frame: the app unmounts inactive screens, so
           a match is the live control. A generous margin is needed because
           the card's open button can sit just below the frame's fold, and a
           synthetic press reaches it there. */
        return r.width > 0 && r.height > 0 && r.bottom > -50 && r.right > -50 &&
          r.top < (view ? view.innerHeight + 200 : 1e9) &&
          r.left < (view ? view.innerWidth + 200 : 1e9);
      });
    if (!candidates.length) return false;
    candidates.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
    let target = candidates.find((el) => el.tagName === 'BUTTON') || candidates[0];
    for (let i = 0; i < 5 && target; i++) {
      if (target.tagName === 'BUTTON' || target.tagName === 'A' ||
          target.getAttribute('role') === 'button' || target.onclick) break;
      target = target.parentElement;
    }
    press(target || candidates[0], doc);
    return true;
  }

  let idleTicks = 0;
  let pressTicks = 0;

  function hideLoading() {
    if (loading) loading.hidden = true;
  }

  function tick() {
    let doc = null;
    try { doc = frame.contentDocument; } catch (err) { doc = null; }
    /* invite.html first shows its own "Preparing…" page, then hands over to
       reference/render.html. Keep our loader up until the real card is there. */
    const onCard = !!doc && !!doc.body && /\/reference\/render\.html$/.test(doc.location.pathname);
    if (onCard) {
      const text = doc.body.textContent || '';
      /* Later stage first: once the card is showing, its open control is the
         goal — an off-screen leftover of the reveal screen must not starve it. */
      const pressed = pressByText(doc, /open invitation/i) || pressByText(doc, /tap to reveal/i);
      if (pressed || text.length > 3000) hideLoading();
      if (pressed) {
        idleTicks = 0;
        pressTicks += 1;
        /* Some reveals need a scratch or swipe a synthetic tap can't make.
           After ~9s of pressing, ask the invitation to open itself. */
        if (pressTicks >= 10) {
          try { frame.contentWindow.postMessage({ type: 'wedcanvas:open' }, location.origin); } catch (err) { /* frame gone */ }
        }
      } else {
        idleTicks += 1;
        /* Done only once the invitation itself is open (its RSVP section or
           replay control exists). Text length alone also matches the curtain
           and reveal screens, which stopped autoplay before the card. */
        const opened = !!doc.querySelector('#rsvp') ||
          [...doc.querySelectorAll('button')].some((b) => /replay invitation/i.test(b.textContent || ''));
        if (idleTicks >= 2 && opened) stopAutoplay();
      }
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
    } catch (err) { /* about:blank or navigated away */ }
  });

  function openPreview(design) {
    title.textContent = design.name;
    makeLink.href = 'studio.html?template=' + design.id;
    if (loading) loading.hidden = false;
    idleTicks = 0;
    pressTicks = 0;
    startedAt = Date.now();
    frame.src = 'invite.html?template=' + design.id;
    stopAutoplay();
    pollTimer = setInterval(tick, 900);
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
    button.addEventListener('click', () => openPreview(design));
    strip.append(button);
  });

  /* Pricing cards, hero thumbnails and the studio band all play the same
     preview. Delegated, because the studio band is rebuilt by another module;
     links keep their invite.html href as the no-JS fallback. */
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

/* The cards ship with launch prices; refresh them from /api/pricing so an
   admin price edit shows here too. Any failure keeps the printed prices. */
const rupees = (paise) => '₹' + Math.round(paise / 100).toLocaleString('en-IN');
fetch('/api/pricing').then((r) => (r.ok ? r.json() : null)).then((pricing) => {
  if (!pricing || !Array.isArray(pricing.designs)) return;
  pricing.designs.forEach((row) => {
    const card = document.querySelector('[data-design="' + CSS.escape(row.id) + '"]');
    const price = card && card.querySelector('.ewp-price');
    if (!price || !(row.current > 0)) return;
    const was = price.querySelector('s');
    const now = price.querySelector('strong');
    const save = price.querySelector('span');
    now.textContent = rupees(row.current);
    const discounted = row.regular > row.current;
    if (was) { was.textContent = rupees(row.regular); was.hidden = !discounted; }
    if (save) { save.textContent = 'Save ' + rupees(row.regular - row.current); save.hidden = !discounted; }
  });
}).catch(() => {});
