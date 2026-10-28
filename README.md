# Easy Wedding

An Indian wedding planner with a public homepage, invitation studio, event cards,
budget tracker, wardrobe suggestions, vendor directory and checklist.

## Go live on Cloudflare (accounts, payments, unlock)

How it works: couples register/login with email + password (PBKDF2 hashes, HttpOnly
session cookie, stored in D1). Planning and all invitation previews are free. When a
couple publishes an invitation the studio asks them to pay for that design (or the
All-Designs Pass) with Razorpay or Cashfree; the design unlocks as soon as the
payment is verified (client signature check) or the gateway webhook arrives.
Prices live in D1 and are edited at `/admin.html`.

1. Install and build: `npm ci`, then `npm run build` (needs Python 3; on Windows
   `python` is used automatically, or set `PYTHON`).
2. Create storage once:
   ```bash
   npx wrangler d1 create easy-wedding        # paste the id into wrangler.jsonc
   npx wrangler r2 bucket create easy-wedding-photos
   npm run db:migrate                          # applies drizzle/*.sql
   ```
3. Add secrets (names and where to find each key: `.dev.vars.example`):
   ```bash
   npx wrangler secret put ADMIN_EMAIL
   npx wrangler secret put RAZORPAY_KEY_ID
   npx wrangler secret put RAZORPAY_KEY_SECRET
   npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
   npx wrangler secret put CASHFREE_APP_ID
   npx wrangler secret put CASHFREE_SECRET_KEY
   npx wrangler secret put CASHFREE_ENV          # sandbox or production
   ```
   Keys from secrets override anything typed into the admin panel and are never
   written to D1. Use `rzp_test_…` / Cashfree sandbox keys first, then swap to live.
4. Deploy: `npm run deploy`.
5. Webhooks (so a payment unlocks even if the buyer closes the tab):
   - Razorpay → `https://<domain>/api/payments/webhook/razorpay`, events
     `payment.captured` and `order.paid`, secret = `RAZORPAY_WEBHOOK_SECRET`.
   - Cashfree → `https://<domain>/api/payments/webhook/cashfree` (signed with
     the Cashfree secret key).
6. Register on the site with the `ADMIN_EMAIL` address to open `/admin.html`.
   There you can switch the shop open, edit prices, see orders, **unlock a design
   manually** for a couple who paid you directly (UPI/WhatsApp), and **reset a
   password** for a couple who forgot theirs (there is no email provider yet).

Before switching on live payments, review the Terms of service and Refunds &
cancellations text in `public/landing.html` (footer dialogs) — Razorpay and
Cashfree check for both when activating an account.

Unpaid previews: an invitation opened without a published `?id` (for example the
studio's "Open full screen" link) shows a PREVIEW watermark and an unlock banner.
Only a paid, published link (`/invite.html?id=…`) shows the clean invitation.

Local preview with test keys: copy `.dev.vars.example` to `.dev.vars`, fill test
keys, run `npm run dev` (http://localhost:4173). `npm test` builds first, then runs
`qa/*.test.mjs`.

## Current update — scroll choreography and visible button hover (15 October 2026)

The homepage now uses scroll-linked GSAP timelines: each feature and planning
card lifts into place as it enters the viewport, invitation previews settle
from a gentle tilt, the dashboard gains depth, and stories and the final CTA
arrive in coordinated stages. Scrolling back reverses the movement. Gold
chapter ornaments and the hero invitation move at different depths, with
native scrolling retained. Short sections finish revealing at the page bottom.

Homepage buttons now have a visible gold sweep, a pointer-positioned highlight,
a small magnetic lift, moving arrows and press feedback. Dedicated light layers
sit above the button surface and beneath the text. The final CTA's scroll
animation leaves its hover transform available. Touch users retain press
feedback; keyboard focus is visible and immediately exposes its chapter.

Pause motion and system reduced-motion settings stop the new effects. Content
stays readable if the animation libraries are unavailable. Dynamically loaded
invitation cards participate without duplicate scroll triggers. The royal red
palette and all eleven invitation designs remain included.

Run `npm ci`, then `npm run dev` from this folder and open
`http://localhost:4173/`. Use **Resume motion** if you previously paused motion.
Your operating system's reduced-motion preference is respected.

Production build and **102 automated tests pass**. Focused interaction checks
also passed after the final CTA refinement. Evidence is in
`qa/premium-motion-evidence/`. Checks exercise pointer entry/move/leave, button
actions, dynamically inserted cards, keyboard focus, pause/resume, readable
fallbacks, and actual bundled GSAP/ScrollTrigger teardown and rebuild.
Browser/device visual verification was unavailable in this environment;
this update is delivered as runnable source, without a new live deployment.

Implementation: `public/homepage-premium.js`, `public/homepage-premium.css`,
`public/landing.html` and the homepage handoff in `public/royal-motion.js`.

## Previous update — royal red website and premium motion (14 October 2026)

The homepage hero's **#75152e royal red** now anchors the homepage, login/help
dialogs, planner, invitation studio and design collection. Deep red panels,
antique gold borders and readable ivory text create one continuous identity.
The original imagery and all eleven invitation experiences remain integrated.

Homepage primary buttons are larger (64 px on desktop), with gold gradients,
raised shadows, hover shine, arrow feedback and a responsive press effect.
Mobile buttons retain generous touch targets. Navigation, final CTA, forms,
workspace actions and studio sharing controls use the same button treatment.

Every homepage chapter has scroll entrances: features, planning steps,
invitation cards, dashboard preview, stories, final CTA and footer blocks.
Decorative gold floral geometry follows the visible chapters as you scroll.
The shared motion manager also registers newly rendered planner cards, studio
sections and all eleven collection cards. It uses native scrolling on the
homepage and progressive enhancement, so content is readable without animation.

**Pause motion** is available on each website page and persists across pages.
System reduced-motion changes are respected immediately. Animations pause while
hidden or offscreen; focused controls become visible immediately. Pausing also
stops the planner's smooth-scroll/parallax engine and the homepage hero effects.

### Run this version locally

Extract the archive, open the `easy-wedding-project` folder, then run:

```sh
npm ci
npm run dev
```

Open `http://localhost:4173/`. Preview files are included in the archive.
Use `/index.html?demo=1` for the planner, `/studio.html?demo=1` for the editor,
and `/reference/collection.html` for Premium Original plus ten designs.

To regenerate the invitation and deployment build, install Node.js 22+ and
Python 3, then run `npm run build`. The build invokes Python as `python3`.

### Verified scope

Production build passes and **98 automated tests pass**. New checks cover
runtime registration of dynamic cards, keyboard focus, hidden-tab pause, the
saved motion preference, live reduced-motion changes and actual bundled GSAP
hero teardown/resume. Declared red/ivory/gold surfaces and CTA gradient stops
pass 4.5:1 text-contrast checks. Logs are in `qa/royal-red-evidence/`.

Browser/device visual verification remains unperformed because the managed
preview environment does not expose its required browser-control capability.
The preserved hosting project still returns not found, so this version is
provided as updated runnable source and has not been deployed live.

Implementation: `public/royal-theme.css`, `public/royal-motion.js`,
`public/homepage-motion.js` and the existing planner motion engine in
`public/cinematic.js`. Earlier project notes follow below.

## Previous update — Premium Original + 10 designs (14 October 2026)

The supplied `chandan-pinki-wedding-source` frontend now powers the invitation.
**01 Premium Original** is first and selected for a new invitation. The original
royal artwork, opening sequence and complete page structure are retained, with
Easy Wedding personalization and the existing optional transparent Ganesh.
The next ten entries retain separate artwork, palettes, typography and motion:
Ivory Jasmine, Crimson Vows, Botanical Forever, Golden Phere, Peacock Promise,
Wisteria Vows, Champagne Forever, Starlit Vows, Blush Lotus and Sacred Courtyard.

Every design uses the same complete source: **13 sections, 23 photo positions,
4 events, 11 gallery photographs, 2 optional QR uploads and 136 reference
controls**, in addition to the main names/date/venue/song controls. The homepage,
planner and studio all present Premium first. Switching a design preserves the
couple's content. Existing ten theme IDs and saved links remain compatible.

Open `/reference/collection.html` to compare all eleven. Previews load one full
invitation at a time, with phone/desktop widths, Skip opening, full-screen and
Use this design controls. The studio is at `/studio.html?demo=1`. New photo-fit
controls support Fill frame and Show whole photo. The guest can pause decorative
motion and gallery autoplay; operating-system reduced-motion preferences also
apply. Empty gallery slots remain empty. Forms prepare reviewable WhatsApp or
email replies and do not claim that a backend has received them.

### Start this revision

Requirements: Node.js 22+ and Python 3.

```sh
npm ci
npm run build
npm run dev
```

Open `http://localhost:4173/` for the website, or
`http://localhost:4173/reference/collection.html` for all eleven invitations.
Run `npm test` for the automated checks.

### Source and verification

- `invitation-source/src/` contains the supplied React/TSX components, content
  and styles. `invitation-source/adapters/` connects them to the existing editor.
- `scripts/build-source.mjs` compiles the source and generates its editable
  fields, CSS and runtime. `public/reference-model.js` applies saved content.
- `public/photos/`, `public/ornaments/`, `public/opening/` and related media
  preserve the supplied assets. `public/reference/collection.*` is the gallery.
- The original Next.js admin/database backend is not a second server in this
  project. Existing Easy Wedding APIs continue to handle drafts and uploads.
- Production build passes; all **93 automated tests pass**. Tests execute the
  actual compiled React invitation in a DOM environment across all eleven
  designs, including opening buttons, doors, details, gallery and replay.
- Browser/device visual QA has **not** been run for this revision. Screenshots
  dated 9 October and earlier in `qa/` belong to the previous renderer. See
  `design-qa.md` for the current verification scope and limitations.
- The original hosting project ID is preserved. The hosting service reports
  that project as not found, so this revision has not been deployed live.

The three requested design/motion sources were read and used. Twenty local
skills were validated, but permanent skill saving failed with HTTP 422; their
installation is not confirmed as saved to the account.

The sections below retain earlier project history. Their capacities and visual
results describe those older revisions, not the current source integration.

## Previous invitation — ten wedding worlds (9 October 2026)

The complete reference invitation now has ten distinct styles. Each owns its
high-resolution ceremony scene, transparent botanical artwork, palette,
name typography, portrait framing and opening choreography. All retain the
same 13-section invitation, 17 photograph positions, two optional QR uploads
and 109 editable controls. Switching styles preserves photos and written details.

| Invitation | Design and motion |
|---|---|
| Ivory Jasmine | Ivory paper, jasmine, silk reveal |
| Crimson Vows | Deep crimson, roses, hinged royal gates |
| Botanical Forever | Sage paper, garden foliage, leaf unfold |
| Golden Phere | Saffron and gold, marigolds, rising curtain |
| Peacock Promise | Emerald and teal, peacock feathers, fan opening |
| Wisteria Vows | Lavender, wisteria, cascading veil |
| Champagne Forever | Champagne paper, editorial serif, candlelight dissolve |
| Starlit Vows | Midnight blue, silver, moonlit rise |
| Blush Lotus | Blush paper, lotus flowers, petal bloom |
| Sacred Courtyard | Terracotta and ivory, marigolds, courtyard fold |

Use **Compare all 10 invitations** in the studio to explore the live gallery at
`/reference/collection.html`. Each card opens the complete invitation and shares
the editor's current content. Botanical artwork moves throughout every section;
motion pauses outside the viewport or while the page is hidden and respects
reduced-motion settings. Dark styles also adapt decorative paper surfaces,
medallions, inputs and dialog lettering for readable contrast. Countdown digits,
photo captions, video controls, blessing cards and the closing scene use readable
foregrounds matched to their actual backgrounds.

A crisp transparent Ganesh portrait floats above **Shree Ganeshaya Namah** on
the opening card and both invitation introductions in every design. It has no
photo backdrop or rectangular panel. Gold is now the default, including old
empty drafts. The editor retains vermilion, ivory and an explicit No icon choice.
New configuration version 3 preserves that choice when saving or sharing.
Ganesh motion pauses offscreen, in hidden tabs and with reduced motion.

Production build succeeds and all 89 automated tests pass. Current visual and
browser evidence is under `qa/ten-varieties`; `design-qa.md` records validation.

## Previous invitation — exact reference recreation (8 October 2026)

All ten saved template IDs now open the full reference layout from the supplied
Chandan/Pinki wedding site. The opening reveal, floral card, animated doors and
13 scroll sections use the locally captured artwork, fonts and motion components.
The invitation editor exposes 17 photograph positions, two optional personal UPI
QR uploads, and 109 editable controls: separate bride/groom portraits, family
information, three story chapters, three festivities, venue, six gallery images,
video cover, RSVP, blessings, sharing and thank-you.

`invite.html` routes to `reference/render.html`. The build regenerates localized
assets/components with `scripts/build-reference.py` and editable field bindings
with `scripts/reference-fields.py`; their captured inputs live in `qa/exact-reference`.
The current live source's Turbopack components and assets are retained in
`qa/exact-reference/current-source`. Its exact motion components are adapted
through `current-components.js`, then bundled with the editor data into `entry.js`.
Uploads and all personalized text travel with the invitation configuration.
Signed-in guest links save an immutable snapshot through `/api/invitations`.
Large device-only snapshot links skip QR encoding to keep the page responsive;
short guest links still generate a QR code. Forms prepare a reviewable WhatsApp
or email reply, which the guest sends. They never claim a reply was received by
an unavailable backend. The reference video has no playable film supplied; the
same preview state is preserved. Upload a wedding song below the couple photo.

The older redesign notes below describe previous revisions. `design-qa.md` records
current validation and any material limits. This archive includes all build inputs.

## Previous update — sharp homepage artwork

The supplied cream, maroon and gold design is now a spacious scrolling homepage.
The user requested distinct sections instead of fitting the entire mockup into
one desktop screen.

- A full first-screen wedding hero with clear account buttons and a scroll cue.
- Eight newly generated high-resolution wedding images, including the hero
  invitation, Royal Baraat, wardrobe, celebration, story portraits and CTA.
- Full-resolution hero template thumbnails, live invitation typography and
  scalable dashboard, planning-step, budget, logo and icon graphics.
- Lossless WebP assets; no upscaled screenshot cutouts in the current homepage.
- Separate sections in this order: hero, Everything, How it works, Invitation
  Studio, dashboard, sample stories, closing CTA and footer.
- Larger feature cards, a four-step planning grid and a full invitation gallery.
- Sticky navigation, section indicators and a subtle reading-progress line.
- Content reveals once as it enters the viewport, with visible no-JavaScript and
  reduced-motion fallbacks. Keyboard focus reveals any card immediately.
- Responsive layouts and working links to the existing planner and themes.
- Locally served images, fonts and icons; no new API or CDN dependencies.

The reference, visual comparisons and screenshots are in `qa/homepage-evidence/`.
The current visual review is in `design-qa.md`; artwork prompts and dimensions
are in `asset-prompts.md`. This source archive excludes reproducible `dist/`
output and installed dependencies; `npm run build` regenerates the full build.
Earlier compact-layout evidence
is retained as history, not as the target for this revision.

## Run locally

Use Node.js 22 or newer and Python 3. Install the locked dependencies:

```sh
npm ci
npm run dev
```

Open the address printed by Vite. The public homepage opens at `/`; use a feature tile for a sample wedding. The local development API uses Miniflare
with persistent preview D1/R2 data under `.sites-runtime/`.

```sh
npm run build
npm test
```

The build writes the static client to `dist/client/` and the Worker entry point to
`dist/server/index.js`. D1 migrations and hosting metadata are packaged in
`dist/.openai/`. `build.mjs` also rebuilds the optional companion ZIP from source.

## Existing functionality and remaining work

The existing temporary login is preserved, as requested. It accepts non-empty
inputs and stores its plan in this browser. It is not a production email/password
account system. The hosted Worker also retains its platform-session-backed D1/R2
routes; this update does not change authentication or the database schema.

Browser-only photographs are compressed into invitation snapshot links; very large
links may be impractical to share and do not receive a QR code. Device-only uploaded
songs require a signed-in upload for playback on another device. Hosted invitation
photos retain their resolution and require an authenticated account with a working
R2 binding. Back up your plan before
clearing browser storage. Real account authentication and cross-device sync remain
separate future work.

The testimonial names and figures are illustrative content from the supplied
mockup and are labeled as such. Support and social profiles still need real
contact details; their buttons show this status instead of linking to an invented
address. The FAQ opens from the header and footer rather than inserting a new
section into the supplied design.

The original hosting project ID is preserved. No live deployment was made in
this update because that project was not available to the current account.

## Assets

Original project assets and fonts retain their bundled licenses. Small promotional
illustrations were extracted from the user-supplied design, with editable text and
controls implemented in HTML. The photographic hero background was generated to
match that reference. Icons use the locally bundled Lucide distribution; its
license is in `public/assets/vendor/LUCIDE-LICENSE`.

## Logo, homepage motion and Hindu ceremony themes

The supplied transparent Easy Wedding logo is included unchanged in `public/assets/brand/`. `brand.css` frames its transparent padding. Homepage choreography is isolated in `homepage-motion.js`: drawn gold arches, layered hero entrance, floating invitation, staggered scroll reveals and dashboard assembly. Native scrolling and keyboard access remain available. GSAP media contexts revert animation when reduced motion is requested; ongoing hero effects pause off screen and when the page is hidden.

The studio has exactly ten selectable themes: Lotus Mandap, Royal Baraat, Sacred Phere, Marigold Morning, Mehndi Courtyard, Sangeet Soirée, The Golden Evening, Starlit Phere, Lotus Vows and Peacock Darbar. Six wedding themes plus Haldi, Mehendi, Sangeet and Reception cover the celebrations. Existing theme IDs and saved links remain compatible. Scalable lotus, diya, mandala, sunshine and star ornaments accompany Hindi ceremonial headings. Wedding presets include Ganesh puja, Baraat, Jaimala and saat phere with independent editable times.

## Dashboard and invitation photo revision

Dashboard style polish lives in `workspace-polish.css`. `floral-motion.js/css` place the transparent bouquet as animated corners across guest invitation themes and the workspace overview; offscreen/background loops pause. Card exports also use this artwork. The shared `photo-upload.js` prepares browser-only image uploads; strict bounded JPEG data URLs now survive invitation configuration, copied links and preview rendering. Local photos are compressed for storage and produce longer invitation links; cloud uploads retain their original resolution. Planner-to-studio navigation preserves local/demo mode.

See `dashboard-qa.md` for tested actions, actual exported card/PDF evidence and remaining live-browser checks. External AI generation still requires the installed companion and the user's provider account. It is not a built-in automatic image/video backend.

Uploaded couple photographs automatically appear in card/poster backgrounds at 20% opacity, as well as their existing foreground placement. Guest invitation previews also use a 20% photo backdrop behind their hero text. No separate toggle is needed.

Final motion polish adds dialog, toast, photo, budget-ring and design-gallery feedback. View changes dispose old motion handles and observers. Dynamic reduced-motion settings reset animated properties; floral and 20% photo backdrop loops pause offscreen/background. `qa/motion-lifecycle.test.mjs` verifies those lifecycle behaviors.
