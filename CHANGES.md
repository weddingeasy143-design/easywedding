# Easy Wedding — changed files (27 Oct 2026)

Extract this zip into the **root of your GitHub repo** (the folder that has
`package.json`) and let it overwrite. Folder paths match the repo. No files
were deleted. 24 files: 5 new, 19 updated.

## New files
| File | What it does |
|---|---|
| `wrangler.jsonc` | Cloudflare Workers config (static files, D1 `DB`, R2 `BUCKET`). Fill `database_id` after `npx wrangler d1 create easy-wedding`. |
| `.dev.vars.example` | Names of every secret (ADMIN_EMAIL, RAZORPAY_*, CASHFREE_*) and where to find each key. |
| `.gitattributes` | Keeps LF line endings so Windows builds don't dirty the repo. |
| `public/pricing.css` | Styles for the Templates & Pricing section (moved out of inline `<style>`), mobile 2-column grid. |
| `qa/env-gateways.test.mjs` | Tests env payment keys, verify/webhook unlock, manual unlock, password reset. |

## Updated files
| File | Change |
|---|---|
| `public/landing.html` | Pricing section right after the hero, Preview buttons on every card, nav "Templates & Pricing", duplicate template strip removed, current design names, honest stats, add-on wording, FAQ, Terms + Refund dialogs, forgot-password help, Privacy lists Razorpay/Cashfree. |
| `public/landing.css` | Template preview plays in a small phone screen (desktop) / full-screen sheet (mobile), loader spinner, scroll lock. |
| `public/feature-templates.js` | Preview autoplay fixed (taps made inside the frame, auto-open fallback, real stop condition), loader waits for the card, Esc works, live prices from `/api/pricing`, one shared preview for all cards. |
| `public/homepage-templates.js` | Studio band cards open the same phone preview. |
| `public/homepage-premium.css` | Fixes mobile sideways scrolling (decorative circles clipped). |
| `public/landing.js` | `?auth=login&next=…` opens sign-in and returns the buyer to the studio. |
| `public/auth.js` | Sign-out clears the couple's draft from the device. |
| `public/studio.js` | "Start with this design" keeps the chosen design (no wrong-design charge). |
| `public/studio.html` | Sign-in gate returns to the studio; WhatsApp unlock when no gateway is on. |
| `public/reference-enhance.js` | Unpaid links show a PREVIEW watermark; paid links always show the published config. |
| `public/admin.html`, `public/admin.js` | Manual unlock form, password reset form, env-managed gateway note. |
| `server/worker.js` | Razorpay/Cashfree keys + ADMIN_EMAIL from Worker secrets (never stored in D1); `/api/admin/grant`; `/api/admin/reset-password`. |
| `build.mjs` | Works on Windows (`python`, UTF-8) and without `.openai/hosting.json`. |
| `package.json` | `pretest` builds first; `deploy` and `db:migrate` scripts. |
| `vite.config.js` | Local preview reads test keys from `.dev.vars`. |
| `qa/homepage.test.mjs` | External-host check runs in Node (works on Windows). |
| `.gitignore` | Ignores `.dev.vars`, `.env*` and `New folder/`. |
| `README.md` | "Go live on Cloudflare" guide. |

Checked: `npm test` → 119/119 pass.
