/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Catalogue homepage prices. The HTML ships with the launch prices (no-JS and
   search engines see them); this refreshes every card, the Pass and the offer
   strip from /api/pricing so an admin price edit shows here too. Any failure
   keeps the printed prices. */

/* paise → "₹1,199" (Indian digit grouping: ₹1,00,000). */
export const rupees = (paise) => '₹' + Math.round(paise / 100).toLocaleString('en-IN');

/* Whole-number discount, 0 when there is none. */
export const percentOff = (regular, current) =>
  regular > current && current > 0 ? Math.round((regular - current) / regular * 100) : 0;

export function applyPricing(doc, pricing) {
  if (!pricing || !Array.isArray(pricing.designs)) return false;
  let lowest = 0;
  let anyLaunch = false;
  pricing.designs.forEach((row) => {
    if (!row || typeof row.id !== 'string' || !(row.current > 0)) return;
    if (row.id !== 'ALL') {
      if (!lowest || row.current < lowest) lowest = row.current;
      if (row.launchActive) anyLaunch = true;
    }
    const card = doc.querySelector('[data-design="' + row.id.replace(/["\\]/g, '') + '"]');
    if (!card) return;
    const off = percentOff(row.regular, row.current);
    const set = (selector, text, show = true) => card.querySelectorAll(selector).forEach((el) => {
      el.textContent = text;
      el.hidden = !show;
    });
    set('[data-price-now]', rupees(row.current));
    set('[data-buy-price]', rupees(row.current));
    set('[data-price-was]', rupees(row.regular), off > 0);
    set('[data-off]', off + '% off', off > 0);
  });
  if (lowest) {
    doc.querySelectorAll('[data-offer-from]').forEach((el) => { el.textContent = rupees(lowest); });
    /* Only call it an offer while a launch price is actually on. */
    doc.querySelectorAll('[data-offer-label]').forEach((el) => {
      el.textContent = anyLaunch ? 'Grand opening offer — every design from' : 'Every design from';
    });
    doc.querySelectorAll('[data-offer-note]').forEach((el) => { el.hidden = !anyLaunch; });
  }
  return true;
}

if (typeof document !== 'undefined' && document.querySelector('[data-design]')) {
  fetch('/api/pricing')
    .then((r) => (r.ok ? r.json() : null))
    .then((pricing) => applyPricing(document, pricing))
    .catch(() => {});
}
