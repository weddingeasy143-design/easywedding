/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* The "Make it yours" wizard: one step of the studio form at a time.
   The form, its field names and the payment flow stay in studio.js; this
   module only shows/hides the step panels, keeps the step list, progress bar,
   Back/Continue buttons and browser history in sync, and formats prices. */

export const WIZARD_STEPS = ['The couple', 'Date & place', 'Photos', 'Wedding song', 'Your words', 'The functions', 'Good to know', 'Review & make it yours', 'Done'];
export const REVIEW_STEP = 8;
export const DONE_STEP = 9;

/* paise → "₹1,199" with Indian digit grouping (₹1,00,000). */
export const rupees = (paise) => '₹' + Math.round(Number(paise) / 100).toLocaleString('en-IN');
/* Whole-number discount, 0 when there is none. */
export const percentOff = (regular, current) =>
  regular > current && current > 0 ? Math.round((regular - current) / regular * 100) : 0;

/* The launch prices printed on the catalogue: used until /api/pricing answers, or if it never does. */
export const FALLBACK_PRICES = {'premium-original': {regular: 99900, current: 79900}, ALL: {regular: 249900, current: 149900}, default: {regular: 69900, current: 59900}};
export function priceRow(pricing, id) {
  const row = pricing && Array.isArray(pricing.designs) ? pricing.designs.find((x) => x && x.id === id && x.current > 0) : null;
  if (row) return {regular: row.regular > 0 ? row.regular : row.current, current: row.current, live: true};
  const f = FALLBACK_PRICES[id] || FALLBACK_PRICES.default;
  return {regular: f.regular, current: f.current, live: false};
}
/* {now:'₹599', was:'₹699', off:'14% off'} — was/off are empty when there is no discount. */
export function priceChip(row) {
  const off = percentOff(row.regular, row.current);
  return {now: rupees(row.current), was: off ? rupees(row.regular) : '', off: off ? off + '% off' : ''};
}
export function fillPriceChips(doc, name, row) {
  const chip = priceChip(row);
  doc.querySelectorAll('[data-price-chip]').forEach((el) => {
    const set = (sel, text) => el.querySelectorAll(sel).forEach((n) => { n.textContent = text; n.hidden = !text; });
    set('[data-chip-name]', name);
    set('[data-chip-now]', chip.now);
    set('[data-chip-was]', chip.was);
    set('[data-chip-off]', chip.off);
  });
  return chip;
}
export const stepLabel = (position, total, title) => 'Step ' + position + ' of ' + total + ' · ' + title;

/**
 * createWizard({doc, win, validateStep, onStep})
 *  validateStep(n,{report}) → true when step n may be left going forward
 *  onStep(n) → called after a step is shown
 */
export function createWizard({doc = document, win = window, validateStep = () => true, onStep = () => {}} = {}) {
  const $ = (s) => doc.querySelector(s);
  const panels = new Map([...doc.querySelectorAll('.wz-panel[data-step]')].map((p) => [Number(p.dataset.step), p]));
  const buttons = new Map([...doc.querySelectorAll('#flow-steps [data-step]')].map((b) => [Number(b.dataset.step), b]));
  let mode = 'guest', current = 1, started = false;
  const titleOf = (n) => WIZARD_STEPS[n - 1];
  /* Owners have paid already: no review/pay step. Guests reach Done only after payment. */
  const steps = () => WIZARD_STEPS.map((_, i) => i + 1).filter((n) => !(mode === 'owner' && n === REVIEW_STEP));
  const reachable = (n) => steps().includes(n) && (mode === 'owner' || n !== DONE_STEP);
  const clamp = (n) => {
    n = Math.round(Number(n));
    if (!Number.isFinite(n) || n < 1) return 1;
    if (n > DONE_STEP) n = DONE_STEP;
    if (!reachable(n)) n = mode === 'owner' ? DONE_STEP : REVIEW_STEP;
    return n;
  };
  const urlStep = () => {
    try { return Number(new URL(win.location.href).searchParams.get('step')) || 0; } catch { return 0; }
  };
  function urlFor(n) {
    const url = new URL(win.location.href);
    url.searchParams.set('step', String(n));
    return url.pathname + url.search + url.hash;
  }
  function render() {
    const list = steps(), pos = list.indexOf(current) + 1, total = list.length;
    panels.forEach((panel, n) => { panel.hidden = n !== current; });
    buttons.forEach((button, n) => {
      const li = button.closest('li');
      if (li) {
        li.hidden = !list.includes(n);
        li.classList.toggle('on', n === current);
        li.classList.toggle('done', n < current);
      }
      if (n === current) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
      button.disabled = !reachable(n);
      const number = button.querySelector('b');
      if (number) number.textContent = String(list.indexOf(n) + 1 || n);
    });
    const count = $('#wz-count');
    if (count) count.textContent = stepLabel(pos, total, titleOf(current));
    const fill = $('#wz-bar-fill');
    if (fill) fill.style.width = Math.round(pos / total * 100) + '%';
    const back = $('#wz-back'), next = $('#wz-next');
    const prev = list[list.indexOf(current) - 1], after = list[list.indexOf(current) + 1];
    if (back) { back.hidden = !prev; }
    if (next) {
      /* Review has its own pay button; Done is the end. */
      const show = after && reachable(after) && current !== REVIEW_STEP;
      next.hidden = !show;
      if (show) next.textContent = 'Continue to ' + titleOf(after) + ' →';
    }
    doc.body.dataset.wzStep = String(current);
    /* keep the current step chip in sight inside the sideways-scrolling list */
    const ol = $('#flow-steps'), chip = buttons.get(current);
    if (ol && chip && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = Math.max(0, chip.offsetLeft - ol.offsetLeft - (ol.clientWidth - chip.offsetWidth) / 2);
  }
  function show(n, {focus = true, push = true, replace = false} = {}) {
    current = clamp(n);
    render();
    if (push || replace) {
      try {
        if (replace) win.history.replaceState({wzStep: current}, '', urlFor(current));
        else if (urlStep() !== current) win.history.pushState({wzStep: current}, '', urlFor(current));
      } catch { /* history can be unavailable in sandboxed frames */ }
    }
    if (focus) {
      const card = $('#wz-card');
      /* bring the top of the step card back into view only when it has scrolled away */
      try {
        const top = card?.getBoundingClientRect?.().top;
        if (card && typeof top === 'number' && (top < 0 || top > (win.innerHeight || 800) * 0.6)) card.scrollIntoView?.({block: 'start', behavior: win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'auto' : 'smooth'});
      } catch {}
      const heading = panels.get(current)?.querySelector('h2');
      try { heading?.focus({preventScroll: true}); } catch { heading?.focus(); }
    }
    onStep(current);
    return current;
  }
  /* Moving forward checks every earlier step that has required fields (owners may jump freely). */
  function go(n, opts = {}) {
    const target = clamp(n);
    if (target > current) {
      const upTo = mode === 'owner' ? [current].filter((s) => s < target) : steps().filter((s) => s < target);
      for (const s of upTo) {
        if (!validateStep(s, {report: false})) {
          if (s !== current) show(s, opts);
          validateStep(s, {report: true});
          return false;
        }
      }
    }
    show(target, opts);
    return true;
  }
  function next() {
    const list = steps(), after = list[list.indexOf(current) + 1];
    if (!validateStep(current, {report: true})) return false;
    if (after && reachable(after)) show(after);
    return true;
  }
  function back() {
    const list = steps(), prev = list[list.indexOf(current) - 1];
    if (prev) show(prev);
  }
  function start(initial) {
    started = true;
    const wanted = initial || urlStep() || 1;
    /* Land on the first step that still needs something, never past it. */
    let landed = clamp(wanted);
    if (mode !== 'owner') for (const s of steps().filter((x) => x < landed)) if (!validateStep(s, {report: false})) { landed = s; break; }
    show(landed, {focus: false, push: false, replace: true});
  }
  /* The signed-in state arrives after the first paint. Owners open on Done unless the address
     asked for a step or they already moved; everyone else stays where they are. */
  function setMode(next, initial) {
    mode = next === 'owner' ? 'owner' : 'guest';
    if (started) start(initial || (mode === 'owner' && !askedStep && !moved ? DONE_STEP : current));
  }
  const askedStep = urlStep();
  let moved = false;
  const user = (fn) => (...args) => { moved = true; return fn(...args); };
  buttons.forEach((button, n) => button.addEventListener('click', user(() => go(n))));
  $('#wz-next')?.addEventListener('click', user(next));
  $('#wz-back')?.addEventListener('click', user(back));
  win.addEventListener('popstate', (event) => {
    const n = event.state?.wzStep || urlStep() || 1;
    go(n, {push: false});
  });
  return {
    start, go, show, next, back, setMode,
    get current() { return current; },
    get mode() { return mode; },
    steps,
    panelOf: (el) => Number(el?.closest?.('.wz-panel[data-step]')?.dataset.step) || 0,
  };
}
