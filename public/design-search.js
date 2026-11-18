/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Catalogue design search for the homepage (landing.html).
   Three abilities, all client-side over the 13 cards already in the DOM
   (names/prices stay whatever the page + /api/pricing put there):
   1. Typo tolerance — Levenshtein fuzzy match (short words distance <=1,
      longer words <=2) plus prefix/substring fallback.
   2. Synonyms — Hindi<->English and meaning groups (mandir=temple,
      haldi=yellow, mor=peacock ...). A query word matches a design when it
      lands in the same group as any of the design's words.
   3. No empty page — when nothing matches, the popular designs stay on
      screen under a "Ye designs aapko pasand aa sakte hain" panel with a
      spelling hint and a reset button. */
(function () {
  'use strict';

  /* ---- Synonym groups: every word in a group means the same thing. ---- */
  var GROUPS = [
    ['mandir', 'temple', 'मंदिर'],
    ['darwaza', 'darwaja', 'gate', 'gates', 'door', 'doors', 'entry', 'entrance', 'दरवाज़ा'],
    ['ram', 'rama', 'राम', 'ayodhya'],
    ['phere', 'phera', 'wedding', 'shaadi', 'shadi', 'vivah', 'marriage', 'शादी', 'फेरे'],
    ['haldi', 'turmeric', 'हल्दी', 'yellow', 'peeli', 'peela', 'पीला'],
    ['mehndi', 'mehendi', 'mehandi', 'henna', 'मेहंदी'],
    ['golden', 'gold', 'sona', 'sunehra', 'sunahra', 'sunehri', 'सोना', 'सुनहरा'],
    ['rose', 'gulab', 'गुलाब'],
    ['blush', 'pink', 'gulabi', 'गुलाबी'],
    ['garden', 'bagh', 'baag', 'bagiya', 'botanical', 'phool', 'flowers', 'बाग', 'फूल'],
    ['star', 'stars', 'taara', 'tara', 'sitara', 'starlit', 'starlight', 'तारा'],
    ['midnight', 'night', 'raat', 'रात', 'moonlit', 'moon', 'chand', 'chaand', 'चाँद'],
    ['noor', 'light', 'roshni', 'रोशनी', 'candlelight'],
    ['royal', 'raja', 'king', 'shaahi', 'shahi', 'prestige', 'राजा'],
    ['lotus', 'kamal', 'कमल'],
    ['ivory', 'white', 'safed', 'सफ़ेद', 'cream'],
    ['jasmine', 'chameli', 'juhi', 'चमेली'],
    ['peacock', 'mor', 'mayur', 'मोर'],
    ['champagne', 'party', 'celebration', 'jashn', 'जश्न'],
    ['darbar', 'court', 'mahal', 'palace', 'courtyard', 'aangan', 'महल', 'दरबार'],
    ['sacred', 'pavitra', 'holy', 'divine', 'पवित्र'],
    ['crimson', 'red', 'laal', 'lal', 'लाल'],
    ['vows', 'promise', 'waada', 'vada', 'kasam', 'वादा'],
    ['forever', 'hamesha', 'हमेशा'],
    ['wisteria', 'violet', 'purple', 'baingani'],
    ['emerald', 'panna', 'green', 'hara', 'hariyali', 'हरा'],
    ['premium', 'cinematic', 'film', 'original'],
    ['curtain', 'parda', 'परदा'],
    ['marigold', 'genda', 'गेंदा'],
    ['terracotta', 'mitti'],
    ['sangeet', 'music', 'dance', 'naach', 'gaana', 'gana', 'संगीत', 'नाच', 'गाना'],
    ['reception', 'pritibhoj'],
    ['feather', 'pankh', 'पंख'],
    ['leaf', 'patta', 'nature'],
    ['silk', 'resham'],
    ['arch', 'mehraab']
  ];

  /* Extra search words per design (the visible name + style line + slug are
     read from the card itself, so they can never go stale). */
  var KEYWORDS = {
    'mandir-darwaza': ['mandir', 'temple', 'darwaza', 'gate', 'golden', 'dharmik', 'bhakti', 'magical', 'hindu'],
    'ram-mandir': ['ram', 'mandir', 'temple', 'ayodhya', 'lotus', 'kamal', 'golden', 'countdown', 'dharmik'],
    'premium-original': ['premium', 'original', 'cinematic', 'curtain', 'parda', 'darwaza', 'doors', 'photos', 'film'],
    'royal-prestige': ['royal', 'raja', 'shaahi', 'crimson', 'red', 'laal', 'rose', 'gulab', 'gate', 'darwaza', 'vows', 'mahal', 'prestige'],
    'mehndi': ['mehndi', 'mehendi', 'henna', 'peacock', 'mor', 'mayur', 'feather', 'pankh', 'promise', 'waada', 'green'],
    'midnight-noor': ['midnight', 'raat', 'night', 'star', 'taara', 'starlit', 'moonlit', 'chand', 'noor', 'roshni', 'vows'],
    'haldi': ['haldi', 'turmeric', 'yellow', 'peeli', 'golden', 'gold', 'marigold', 'genda', 'phere', 'shaadi'],
    'ivory-arch': ['ivory', 'white', 'safed', 'jasmine', 'chameli', 'arch', 'mehraab', 'silk', 'resham'],
    'garden': ['garden', 'bagh', 'botanical', 'phool', 'leaf', 'patta', 'green', 'hara', 'forever', 'nature'],
    'sangeet': ['sangeet', 'music', 'dance', 'naach', 'gaana', 'wisteria', 'violet', 'purple', 'vows', 'party'],
    'reception': ['reception', 'champagne', 'party', 'celebration', 'jashn', 'candlelight', 'noor', 'forever', 'pritibhoj'],
    'blush-mehraab': ['blush', 'pink', 'gulabi', 'lotus', 'kamal', 'mehraab', 'arch', 'petal', 'pankhudi'],
    'emerald-darbar': ['emerald', 'panna', 'green', 'hara', 'darbar', 'court', 'mahal', 'palace', 'courtyard', 'aangan', 'sacred', 'pavitra', 'terracotta']
  };

  /* Shown when a search finds nothing — never an empty page. */
  var POPULAR = ['mandir-darwaza', 'ram-mandir', 'premium-original'];

  function tokenize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097F]+/g, ' ')
      .split(/\s+/)
      .filter(function (t) { return t.length > 0; });
  }

  function levenshtein(a, b) {
    var m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)
        );
      }
      var tmp = prev; prev = cur; cur = tmp;
    }
    return prev[n];
  }

  /* word -> set of every synonym of that word (including itself). */
  var SYN = {};
  GROUPS.forEach(function (group) {
    group.forEach(function (word) {
      if (!SYN[word]) SYN[word] = {};
      group.forEach(function (other) { SYN[word][other] = true; });
    });
  });

  function buildDesign(card, index) {
    var id = card.getAttribute('data-design');
    var raw = {};
    tokenize(id).forEach(function (t) { raw[t] = true; });
    var nameEl = card.querySelector('.cat-name');
    var styleEl = card.querySelector('.ewp-style');
    if (nameEl) tokenize(nameEl.textContent).forEach(function (t) { raw[t] = true; });
    if (styleEl) tokenize(styleEl.textContent).forEach(function (t) { raw[t] = true; });
    (KEYWORDS[id] || []).forEach(function (t) { raw[t] = true; });
    /* Expanded set: raw words + all their synonyms (marked as synonym hits). */
    var syn = {};
    Object.keys(raw).forEach(function (t) {
      var group = SYN[t];
      if (group) Object.keys(group).forEach(function (s) { if (!raw[s]) syn[s] = true; });
    });
    return {
      id: id,
      el: card,
      index: index,
      raw: raw,
      syn: syn,
      all: Object.keys(raw).concat(Object.keys(syn))
    };
  }

  /* Best score of one query word against one design. 0 = no match. */
  function scoreWord(q, design) {
    if (design.raw[q]) return 100;
    if (design.syn[q]) return 85;
    if (q.length < 3) return 0;
    var best = 0;
    /* Typo tolerance: short words distance <=1, longer words <=2 — and a
       distance-2 hit must share the first two letters, so real words like
       "garden" never fuzzy-land on "golden". */
    var maxDist = q.length <= 5 ? 1 : 2;
    for (var i = 0; i < design.all.length; i++) {
      var t = design.all[i];
      if (t.length < 3) continue;
      var s = 0;
      if (t.indexOf(q) === 0 || q.indexOf(t) === 0) s = 60;              /* prefix */
      else if (t.indexOf(q) >= 0 || q.indexOf(t) >= 0) s = 45;           /* substring */
      else if (Math.abs(t.length - q.length) <= maxDist) {
        var d = levenshtein(q, t);
        if (d === 1) s = 38;
        else if (d === 2 && maxDist === 2 && t.slice(0, 2) === q.slice(0, 2)) s = 26;
      }
      if (s > best) best = s;
    }
    return best;
  }

  function init() {
    var input = document.getElementById('design-search-input');
    var clearBtn = document.getElementById('design-search-clear');
    var status = document.getElementById('design-search-status');
    var panel = document.getElementById('design-suggest');
    var panelQuery = document.getElementById('design-suggest-query');
    var resetBtn = document.getElementById('design-search-reset');
    var grid = document.querySelector('.cat-grid');
    if (!input || !grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.cat-card[data-design]'));
    if (!cards.length) return;
    var designs = cards.map(buildDesign);
    var originalOrder = cards.slice();
    var extras = Array.prototype.slice.call(
      document.querySelectorAll('.cat-section .cat-pass, .cat-section .cat-note')
    );

    /* The owner's "Show on site" switch (set by catalog.js from /api/pricing)
       outranks search: a card carrying data-owner-hidden is never brought
       back by searching, clearing or the suggestion panel. */
    function ownerHidden(el) { return el.hasAttribute('data-owner-hidden'); }

    function restore() {
      designs.forEach(function (d) { d.el.hidden = ownerHidden(d.el); });
      originalOrder.forEach(function (el) { grid.appendChild(el); });
      extras.forEach(function (el) { el.hidden = ownerHidden(el); });
      if (panel) panel.hidden = true;
      if (status) status.textContent = '';
    }

    function apply() {
      var query = input.value.trim();
      if (clearBtn) clearBtn.hidden = query.length === 0;
      var words = tokenize(query).filter(function (t) { return t.length > 1; });
      if (!words.length) { restore(); return; }

      var pool = designs.filter(function (d) { return !ownerHidden(d.el); });
      var scored = pool.map(function (d) {
        var matched = 0, total = 0;
        words.forEach(function (q) {
          var s = scoreWord(q, d);
          if (s > 0) { matched++; total += s; }
        });
        return { d: d, matched: matched, total: total };
      });
      var full = scored.filter(function (r) { return r.matched === words.length; });
      var results = full.length
        ? full
        : scored.filter(function (r) { return r.matched > 0; });
      results.sort(function (a, b) {
        return (b.matched - a.matched) || (b.total - a.total) || (a.d.index - b.d.index);
      });

      extras.forEach(function (el) { el.hidden = true; });

      if (!results.length) {
        /* Suggestion mode: popular designs stay visible, never a blank page.
           Owner-hidden popular designs drop out; if all three are hidden,
           the first visible designs take their place. */
        var popularIds = POPULAR.filter(function (id) {
          return pool.some(function (d) { return d.id === id; });
        });
        if (!popularIds.length) popularIds = pool.slice(0, 3).map(function (d) { return d.id; });
        var popular = {};
        popularIds.forEach(function (id) { popular[id] = true; });
        designs.forEach(function (d) { d.el.hidden = ownerHidden(d.el) || !popular[d.id]; });
        originalOrder.forEach(function (el) { grid.appendChild(el); });
        if (panelQuery) panelQuery.textContent = '\u201C' + query + '\u201D';
        if (panel) panel.hidden = false;
        if (status) status.textContent = '';
        return;
      }

      if (panel) panel.hidden = true;
      var keep = {};
      results.forEach(function (r) { keep[r.d.id] = true; });
      designs.forEach(function (d) { d.el.hidden = ownerHidden(d.el) || !keep[d.id]; });
      results.forEach(function (r) { grid.appendChild(r.d.el); });
      if (status) {
        status.textContent = results.length === 1
          ? '1 design mila — \u201C' + query + '\u201D ke liye'
          : results.length + ' designs mile — \u201C' + query + '\u201D ke liye';
      }
    }

    function reset() {
      input.value = '';
      apply();
      input.focus();
    }

    input.addEventListener('input', apply);
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') reset(); });
    if (clearBtn) clearBtn.addEventListener('click', reset);
    if (resetBtn) resetBtn.addEventListener('click', reset);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
