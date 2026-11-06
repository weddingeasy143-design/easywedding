/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* 3D flipbook viewer: real page-turn leaves with depth and shadow, in plain
   vanilla JS + CSS 3D transforms (no library). One photo per page, printed
   album style; the cover is built from the album title + first photo.
   Usage: EWFlipbook.mount(element, {title, partner1, partner2, weddingDate,
   photos: [{url, caption}], badge}) */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function prettyDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    return isNaN(d) ? iso : d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function mount(root, album) {
    root.classList.add('fb-root');
    root.innerHTML = '';
    var photos = album.photos || [];
    var names = [album.partner1, album.partner2].filter(Boolean).join('  ♥  ');
    var leaves = [];
    /* Leaf 0 — the hard cover (first photo + title). */
    leaves.push({
      front: { cls: 'fb-cover', html:
        (album.badge ? '<span class="fb-badge">' + esc(album.badge) + '</span>' : '') +
        (photos[0] ? '<span class="fb-cover-photo"><img src="' + esc(photos[0].url) + '" alt=""></span>' : '') +
        '<span class="fb-cover-kicker">Our Wedding Album</span>' +
        '<span class="fb-cover-title">' + esc(album.title || 'Our Wedding') + '</span>' +
        (names ? '<span class="fb-cover-names">' + esc(names) + '</span>' : '') +
        (album.weddingDate ? '<span class="fb-cover-date">' + esc(prettyDate(album.weddingDate)) + '</span>' : '') },
      back: { cls: 'fb-inside', html: '<span class="fb-inside-mark">❦</span><span class="fb-inside-text">Every page, a moment<br>we never want to forget.</span>' }
    });
    photos.forEach(function (p, i) {
      leaves.push({
        front: { cls: 'fb-page', html: '<span class="fb-photo"><img src="' + esc(p.url) + '" alt="' + esc(p.caption || ('Wedding photo ' + (i + 1))) + '" loading="lazy"></span>' + (p.caption ? '<span class="fb-caption">' + esc(p.caption) + '</span>' : '') + '<span class="fb-pageno">' + (i + 1) + ' / ' + photos.length + '</span>' },
        back: { cls: 'fb-paperback', html: '<span class="fb-paperback-mark">❦</span>' }
      });
    });
    leaves.push({
      front: { cls: 'fb-endpage', html: '<span class="fb-end-mark">❦</span><span class="fb-end-text">The beginning of forever.</span>' + (names ? '<span class="fb-end-names">' + esc(names) + '</span>' : '') },
      back: { cls: 'fb-backcover', html: '<span class="fb-backcover-brand">Easy Wedding</span><span class="fb-backcover-sub">easywedding.in</span>' }
    });

    var stage = document.createElement('div'); stage.className = 'fb-stage';
    var book = document.createElement('div'); book.className = 'fb-book';
    stage.appendChild(book); root.appendChild(stage);
    var leafEls = leaves.map(function (leaf, i) {
      var el = document.createElement('div'); el.className = 'fb-leaf'; el.dataset.i = i;
      el.innerHTML =
        '<div class="fb-face fb-front ' + leaf.front.cls + '">' + leaf.front.html + '<span class="fb-shade"></span></div>' +
        '<div class="fb-face fb-back ' + leaf.back.cls + '">' + leaf.back.html + '<span class="fb-shade"></span></div>';
      book.appendChild(el);
      return el;
    });
    var bar = document.createElement('div'); bar.className = 'fb-bar';
    bar.innerHTML = '<button type="button" class="fb-btn" data-fb="prev" aria-label="Previous page">‹ Prev</button>' +
      '<span class="fb-count" role="status"></span>' +
      '<button type="button" class="fb-btn" data-fb="next" aria-label="Next page">Next ›</button>';
    root.appendChild(bar);
    var count = bar.querySelector('.fb-count');
    var prevBtn = bar.querySelector('[data-fb="prev"]'), nextBtn = bar.querySelector('[data-fb="next"]');

    var cur = 0, flipping = false; /* leaves[0..cur-1] are turned */
    function layout() {
      leafEls.forEach(function (el, i) {
        el.classList.toggle('turned', i < cur);
        el.style.zIndex = i < cur ? String(i + 1) : String(leafEls.length - i + 1);
      });
      count.textContent = cur === 0 ? 'Cover' : cur >= leafEls.length ? 'Back cover' : 'Page ' + cur + ' of ' + leafEls.length;
      prevBtn.disabled = cur === 0 || flipping;
      nextBtn.disabled = cur >= leafEls.length || flipping;
      book.classList.toggle('fb-open', cur > 0 && cur < leafEls.length);
    }
    function flip(dir) {
      if (flipping) return;
      var target = cur + dir;
      if (target < 0 || target > leafEls.length) return;
      flipping = true;
      var leaf = leafEls[dir > 0 ? cur : cur - 1];
      leaf.style.zIndex = String(leafEls.length + 10);
      leaf.classList.add('flipping');
      cur = target;
      /* Re-stack halfway through the turn, when the leaf is edge-on. */
      setTimeout(layout, 330);
      setTimeout(function () { leaf.classList.remove('flipping'); flipping = false; layout(); }, 680);
      layout();
    }
    nextBtn.addEventListener('click', function () { flip(1); });
    prevBtn.addEventListener('click', function () { flip(-1); });
    book.addEventListener('click', function (e) {
      var r = book.getBoundingClientRect();
      flip(e.clientX - r.left > r.width / 2 ? 1 : -1);
    });
    var tx = null;
    book.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
    book.addEventListener('touchend', function (e) {
      if (tx == null) return;
      var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 42) flip(dx < 0 ? 1 : -1);
    }, { passive: true });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') flip(1);
      if (e.key === 'ArrowLeft') flip(-1);
    });
    root.tabIndex = 0;
    layout();
    return { flip: flip, go: function (n) { cur = Math.max(0, Math.min(leafEls.length, n)); layout(); }, count: leafEls.length };
  }
  window.EWFlipbook = { mount: mount };
})();
