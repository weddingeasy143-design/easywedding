/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Features-section template strip: tap a design and its animated invitation
   preview plays in a dialog on this page (same preview the studio uses). */
import {referenceDesigns} from './reference-designs.js';

const strip = document.querySelector('#feature-template-strip');
const dialog = document.querySelector('#template-preview-dialog');

if (strip && dialog) {
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
    /* The invitation app reacts to pointer presses, not a bare .click(). */
    const opts = { bubbles: true, cancelable: true, view: doc.defaultView || window };
    try {
      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));
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

  function tick() {
    let doc = null;
    try { doc = frame.contentDocument; } catch (err) { doc = null; }
    if (doc && doc.body) {
      const text = doc.body.textContent || '';
      if (loading && !loading.hidden && text.trim().length > 0) {
        loading.hidden = true;
      }
      /* Later stage first: once the card is showing, its open control is the
         goal — an off-screen leftover of the reveal screen must not starve it. */
      if (pressByText(doc, /open invitation/i)) {
        idleTicks = 0; /* Card is on screen; pressed its open control. */
      } else if (pressByText(doc, /tap to reveal/i)) {
        idleTicks = 0; /* Reveal still on screen — pressed it (again if needed). */
      } else {
        idleTicks += 1;
        /* Both controls gone and a long page is showing: the invitation
           itself is open — done. (Short screens like the curtain, whose
           text is brief, never trigger this.) */
        if (idleTicks >= 4 && text.length > 3000) stopAutoplay();
      }
    }
    if (Date.now() - startedAt > 90000) stopAutoplay();
  }

  function openPreview(design) {
    title.textContent = design.name;
    makeLink.href = 'studio.html?template=' + design.id;
    if (loading) loading.hidden = false;
    idleTicks = 0;
    startedAt = Date.now();
    frame.src = 'invite.html?template=' + design.id;
    stopAutoplay();
    pollTimer = setInterval(tick, 900);
  }

  Object.values(referenceDesigns).forEach((design, index) => {
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

  if (window.lucide) window.lucide.createIcons();

  dialog.addEventListener('close', () => {
    stopAutoplay();
    frame.src = 'about:blank';
  });
}
