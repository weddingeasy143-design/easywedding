# Current verification — royal red identity and scroll motion

Date: 14 October 2026.

## Result

The hero red (#75152e) continues through every homepage chapter and across the
login/help dialogs, planner, studio and collection shell. Buttons have larger
56–64 px primary targets, gold gradients, raised shadows, hover shine and press
feedback; smaller navigation/mobile variants preserve at least 44 px targets.
Deep red panel levels and ivory/gold foregrounds replace the older cream shell.
Existing invitation designs retain their own source renderer and artwork.

The homepage hero has a GSAP entrance and ambient invitation motion. A shared
IntersectionObserver/WAAPI manager animates every major chapter/card group,
including dynamically inserted templates, planner views and editor sections.
Decorative floral geometry moves with visible chapter scroll progress. Visible
pause controls, saved preferences, system reduced motion, offscreen/hidden-page
pause, keyboard-focus visibility and disconnected-node cleanup are implemented.

## Automated evidence

Production build passes. **98 automated tests pass, zero failures**, including
all existing planner, forms, uploads, studio, source invitation and backend
regressions. `qa/royal-motion.test.mjs` adds dynamic registration, actual motion
state changes, keyboard focus, cleanup, pause persistence, reduced-motion
fallbacks, theme integration and actual bundled GSAP context teardown/resume.
Declared text/label/gold surface pairs and CTA gradient stops meet 4.5:1.
These token checks do not constitute a complete rendered accessibility audit.

Logs: `qa/royal-red-evidence/build.txt` and `tests.txt`. The complete suite was
run with `--test-concurrency=1` to keep the DOM integration checks reproducible.

## Verification limits

No browser/device screenshots or physical viewport measurements were performed
for this revision. The managed preview workflow's required browser-control
capability is unavailable. Responsive rules cover narrow mobile through desktop,
but visual layout, actual computed contrast and motion feel remain unverified.
Historical browser evidence below belongs to previous versions.

The preserved hosting project returns project-not-found. No live deployment was
made. The updated archive can be tested locally with `npm ci` and `npm run dev`.

Status: source implementation, production build and automated checks passed;
browser visual verification and live deployment remain unavailable.

---

# Previous verification — Premium Original + 10 source invitations

Date: 14 October 2026.

## Implemented result

The user-supplied React source is now the common renderer for eleven invitations.
Premium Original is item 01 and the new-draft default. It uses original royal
artwork; the existing ten theme IDs retain their distinct scenes, palettes,
frames and opening motions. Homepage, planner, studio and comparison collection
all expose the same ordering. The supplied 13 sections, 4 events, 11 gallery
photos and complete content flow are retained. The editor supports 23 photos,
2 optional QR uploads and 136 reference controls plus the main couple settings.

## Evidence from this revision

`npm run build` succeeds. `npm test` passes **93 tests, zero failures**. Logs are
`qa/premium-source-evidence/build.txt` and `qa/premium-source-evidence/tests.txt`.
The new `qa/premium-source.test.mjs` executes the actual generated `entry.js` and
`source-app.js` in JSDOM, including its data bootstrap and React effects.

Verified in all eleven designs: Premium ordering, personalized names and family
text, edited section titles, 4 events/11 gallery items, Open Invitation button,
doors/skip, 13-section main view, event details, next gallery photo, motion
preference, replay, retained snapshot hash and no observed JavaScript errors.
Additional checks cover optional Ganesh removal, empty photos, complete shared
configuration, review-only RSVP links, all eleven collection cards and exactly
one preview iframe at a time. Existing ownership, upload, snapshot, planner,
privacy and editor regression checks remain passing. Palette tests check 4.5:1
text and button contrast for the declared theme surface tokens.

Corrections made during verification: photo-framing select initialization,
source-ready signaling after React listeners mount, preserved source heading
bindings, clearable gallery entries without seed-photo flashes, and synchronized
pause/reduced-motion handling across decorative motion and gallery autoplay.

## Explicit limits

These are build and DOM checks, not visual browser verification. Browser/mobile
screenshots, actual rendered contrast, physical-device music playback and live
cross-device hosting were not verified for this revision. The available managed
preview workflow did not include its required browser-control capability.
Historical screenshots and contrast tables below apply only to the older
captured-component renderer; they must not be treated as evidence for this build.

The hosting service returns project-not-found for the preserved project ID, so
no live deployment was made. Original demo authentication is unchanged. The
reference provides only a video cover/coming-soon state, not a playable film.
RSVP and blessings prepare a reply for a guest to send in WhatsApp/email; no
message or payment was sent. QR/UPI destinations start empty and remain optional.

Current status: build and automated behavior checks passed; visual browser
review and live deployment remain unverified.

---

# Historical verification — previous renderer

# Previous verification — ten wedding worlds, readable text and transparent Ganesh

Date: 9 October 2026. Reference flow: https://chandan-pinki-wedding.vercel.app/.

The current task is ten distinct versions of the complete reference invitation, followed by the user's corrections for unreadable dark-template text and an animated Ganesh image above the invocation in every template. The latest correction requires a transparent image with no background.

## Result and scope

Ten invitation designs are implemented: Ivory Jasmine, Crimson Vows, Botanical Forever, Golden Phere, Peacock Promise, Wisteria Vows, Champagne Forever, Starlit Vows, Blush Lotus and Sacred Courtyard. Each retains the reference's 13-section journey, 17 photograph positions, two optional personal QR uploads and 109 editable controls. The ten internal IDs remain compatible with saved invitations. Theme changes preserve photographs, song selection, wedding details and reference edits.

Each design has separate high-resolution ceremony artwork, a coordinated transparent botanical palette, paper/ink colours, couple-name typography, frame geometry and opening choreography. Independent botanical movement continues through all 13 sections. Animation pauses offscreen, while the document is hidden and with reduced motion; replay cleanup avoids duplicate art or animation observers.

A real 320 × 320 RGBA Ganesh portrait is shown above **Shree Ganeshaya Namah** on the opening card, first family section and full invitation card. It has 47,141 fully transparent pixels and zero alpha in all four corners. Native opening checks confirm transparent image and wrapper backgrounds in all ten designs. The former rectangular sheen layer is absent. The image fits without cropping; gentle floating motion and a separate soft radial halo provide animation without a photo backdrop.

Gold Ganesh is the new default, including previous version-2 empty drafts. The editor retains the three colour choices and an explicit No icon option. Version 3 preserves the deliberate choice through edits, saves and copied links. A live editor check selected No icon, confirmed version 3 and `none` in the guest renderer, then restored Gold Ganesh. All 109 reference controls remain bound.

## Source and rendered comparison

The locally captured current source, artwork and factories are retained in `qa/exact-reference/current-source`. This revision deliberately adds design variation rather than claiming ten pixel-identical copies. The reference remains the authority for the page order, content capacity, controls and interaction flow.

`qa/ten-varieties/family-comparison.jpg` combines the reference and current Crimson introduction in one image, both at 1348 × 926. `introduction-comparison.jpg` contains focused native-resolution crops. Both combined inputs were visually inspected. The crops use different vertical offsets to align the original introduction with the newly requested Ganesh placement; they are not presented as equal-position pixel comparisons.

- Typography: the reference's script/display/sans hierarchy is retained, with intentional Great Vibes, Garden Script and editorial serif variations. Names, headings and small labels remain readable. The added portrait moves the introduction and portraits lower, as intended.
- Spacing: desktop navigation, balanced bride/groom portrait columns and wedding medallion preserve the reference composition. Mobile keeps the stacked flow. Ten main-page measurements show document width equal to the 375 px content viewport, with no horizontal overflow.
- Colour: theme paper, panel, text, muted labels, accent ink and inverse buttons are coordinated. Text on photography uses a separate cream foreground and dark scene treatment instead of reusing the paper token. Opening artwork stays visible around the paper card.
- Assets: all ten real ceremony scenes and six botanical palettes are served locally. Ganesh uses transparent raster artwork; it is not drawn with a substitute symbol. Final ten-card opening checks show every Ganesh loaded. Native main checks report zero broken completed images.
- Copy and function: all 13 sections, the reference photo capacity, editable English invocation and wedding information remain. Wedding detail dialogs were opened and closed in every palette; all their sampled text passes the surface audit. The actual desktop closing scene shows readable names, date and Replay, and a native click on Replay returns to the initial reveal.

## Contrast verification

The native DOM audit examines 177 selected text nodes per design, including headings, body text, labels, placeholders, countdowns, captions, navigation and closing copy. It uses computed colours, ancestor surfaces and gradient sampling at the text position. Photo captions/video controls use a brightest-white photo bound; closing copy uses the minimum 88% dark scene scrim. This is a CSS surface audit supported by visual inspection, not a pixel-by-pixel or physical-device accessibility certification.

| Design ID | Sections | Text nodes | Lowest sampled ratio | Findings below required ratio |
|---|---:|---:|---:|---:|
| ivory-arch | 13 | 177 | 4.989:1 | 0 |
| royal-prestige | 13 | 177 | 7.374:1 | 0 |
| garden | 13 | 177 | 5.235:1 | 0 |
| haldi | 13 | 177 | 5.119:1 | 0 |
| mehndi | 13 | 177 | 5.682:1 | 0 |
| sangeet | 13 | 177 | 4.906:1 | 0 |
| reception | 13 | 177 | 5.154:1 | 0 |
| midnight-noor | 13 | 177 | 8.145:1 | 0 |
| blush-mehraab | 13 | 177 | 4.984:1 | 0 |
| emerald-darbar | 13 | 177 | 4.78:1 | 0 |

The audit checks 4.5:1 for ordinary text and 3:1 for large text/icons. No selected text falls below its required ratio. Wedding dialog text is separately audited in `dialog-audit.json`. Evidence and computed surfaces are retained in `text-contrast-audit.json`, `ganesh-audit.json` and `opening-ganesh-audit.json`.

## Resolved findings

| Severity | Observed issue | Correction and evidence |
|---|---|---|
| P1 | Hardcoded dark headings/event colours disappeared on dark paper. | Map inline event, timeline and dialog lettering to theme ink; all ten Wedding dialogs pass the native surface audit. |
| P1 | The source's pale medallion made light lettering invisible. | Match its gradient to the actual paper/panel palette. Before/after full screenshots are paired in `medallion-contrast-comparison.jpg`. |
| P1 | Countdown, photo captions, movie labels and closing text reused unsuitable foregrounds. | Separate paper, inverse-control and on-photo text tokens; stronger caption/film/closing vignettes pass the final audit. |
| P2 | Faint navigation and small labels lost contrast after transparency. | Use the verified muted/accent ink at full opacity; final sampled ratios are recorded above. |
| P1 | The Ganesh slot was empty by default and absent before the first invocation. | Default Gold and add the actual portrait before both full-page invocations; all ten native checks load the transparent image. |
| P2 | An inherited sheen left a rectangular glow behind the transparent image. | Replace the opening portrait treatment with transparent image/wrapper layers and a radial halo; final native mobile capture is clear. |
| P2 | An old captured component-name assumption hid navigation instead of gating music. | Identify the actual music component when generating bindings; native desktop navigation remains visible with no uploaded song, and the empty song control is hidden. |

No unresolved P0/P1/P2 finding remains in this ten-template visual, contrast and Ganesh scope.

## Verification and delivery

`npm run build` succeeds. `npm test` passes **89 tests, zero failures**. Logs are `qa/dashboard-evidence/ten-varieties-build.txt` and `ten-varieties-tests.txt`. Coverage includes distinct artwork/choreography, palette contrast, preservation across all ten selections, legacy Ganesh defaults and explicit-current-choice links, motion pause/cleanup, reference photo capacity, QR bounds, wedding time synchronization, immutable guest snapshots, D1 ownership/CSRF/R2 guards and existing project regressions.

Final browser images are `collection-final.jpg`, `starlit-opening-final.jpg`, `crimson-family-final.jpg` and `crimson-closing-final.jpg`. The gallery and editor are kept open as live previews. Mobile is a 390 × 844 browser frame, not a physical phone. Production source and all reproducible build inputs are packaged in the updated project ZIP.

The reference still supplies a video-cover/coming-soon state. Existing forms prepare reviewable replies, and guests send them; no external message or payment was sent in this review. A deployed cross-device session and audible physical-device music playback are outside this local visual check. This revision does not publish the site.

final result: passed

---

# Previous verification history

The following reports describe earlier revisions and earlier test counts.

# Previous verification — exact wedding reference recreation

Date: 8 October 2026. Target: https://chandan-pinki-wedding.vercel.app/.

The latest instruction requests the full supplied invitation rather than the previous original redesign. All ten existing invitation IDs route to the same complete reference experience. The editor retains separate photographs and editable content throughout the page.

## Current source and evidence

The live reference changed during this implementation. The latest captured Turbopack component factories, site configuration, wedding data, two stylesheets, and 64 successfully downloaded assets are retained in `qa/exact-reference/current-source`. The build adapts the actual reference components and localizes their artwork/fonts; it does not approximate the layout from a screenshot. JavaScript is syntax-checked and bundled as `public/reference/entry.js`.

Evidence in `qa/exact-final` includes current source and implementation screenshots, paired opening comparisons, desktop/mobile family comparisons, focused typography/portrait crops, a personalized invitation with two uploaded sample portraits, Wedding event details and the full-size gallery viewer. `opening-comparison.jpg` and `comparison.jpg` each combine source and implementation in one image input and were visually inspected together.

Desktop opening screenshots are 1363 × 936. The source and implementation card bounds both measured x=449.5, y=128.3125, width=464, height=679.375. Main desktop captures are 1348 × 926. Mobile checks use matching 390 × 844 browser frames; these are emulated viewports, not physical devices. Mobile screenshots were compared at the same crop and dimensions.

## Fidelity review

- Typography: the localized source font files reproduce the script headings/couple names, serif body text and spaced small labels. Name baselines, heading size and paragraph rhythm match the current source in desktop and mobile comparisons.
- Spacing: opening card bounds match exactly. Floral corners, arched portraits, central wedding medallion, family names, navigation and the mobile stacked layout align in the paired screenshots.
- Colors: source ivory paper, maroon headings/buttons, gold borders and soft botanical tones are retained. Differences in individual moving petals or glow intensity reflect different animation frames.
- Assets: the latest source florals, doors, Ganesh artwork, photographs, decorative images and fonts are served locally. Source mode provides the original data for comparison; personalized mode uses the editor's uploads and text. The final personal preview has both uploaded portraits and no broken images.
- Copy: all 13 scroll sections are present. Current source capacity is three story chapters, three festivities and six gallery images. Personal names, family information, event time, venue and closing date follow saved values. There are 17 photograph positions, two optional personal UPI QR images and 109 editable reference controls.

## Fixes and severity

| Severity | Observed problem | Resolution and verification |
|---|---|---|
| P1 | Previous redesign omitted the exact reference layout and photo capacity. | Replaced the guest rendering with the complete current source flow; browser shows all 13 sections and the editor exposes all 19 image inputs. |
| P0 | Very long photo snapshot links could freeze QR generation. | UTF-8 length guard skips oversized encoding; short guest links still encode. Regression and live-page responsiveness checks pass. |
| P0 | Hiding an optional Ganesh image could prevent opening completion. | Preserve the source load callback while hiding its visual output. Optional-image opening verified. |
| P1 | Source hash cleanup removed personalized photos/details after refresh. | Disable only that source cleanup in the adapted factory. Real browser reload retained the full 207,784-character configuration URL, two uploaded portraits and the edited parent names. |
| P1 | Raw runtime imports could leave the page loading indefinitely. | Syntax validation and a bundled entry eliminate the dependency-loading failure; desktop, mobile and personal previews reach all 13 sections. |
| P2 | Earlier capture used the old opening size, four events and five gallery images. | Updated to the current captured factories/assets; opening bounds match, and three event/six gallery capacity is verified. |
| P2 | Four-event saved data could map Wedding into the old Mehendi position. | Migrate by event ID; the new regression preserves Wedding identity and its personalized timestamp. |
| P2 | Closing date was hardcoded to the reference date. | Derive it from the personal wedding timestamp. The browser shows 12 • 12 • 2026 and event details show 12 December 2026 at 8:00 PM. |

No unresolved P0, P1 or P2 findings remain within this local recreation scope. The source's minor mobile overflow is inherited by the faithful opening layout; the primary controls remain usable.

## Functional verification

Live browser checks cover initial reveal, Open Invitation, scrolling sections, Replay Invitation, edited portraits/family content, persistence after refresh, Wedding event details and close, sixth gallery selection and full-size viewer, Copy Link and review dialogs for RSVP and blessings. The RSVP review contains the supplied local test guest/message and correct couple names. Blessings review contains the written wish. Both prepare a manual email reply; no external message was sent and the UI does not claim backend receipt. Source reference forms were never submitted.

The final editor contains 109 bound reference controls and 19 image inputs. The personal guest page has 13 sections, two data-URL portraits in the family section, the edited parents and zero broken images. Current reference runtime error inspection returned no reference application errors. Browser extension metadata errors and errors from earlier deliberately invalid QA URLs are excluded from this final application result.

Automated verification: `npm test` passes 83 tests with zero failures. Production build succeeds, including parsing/bundling of the adapted source and generation of all editable bindings. Logs are in `qa/dashboard-evidence/exact-reference-tests.txt` and `qa/dashboard-evidence/exact-reference-build.txt`. Coverage includes editor serialization, 17-photo/two-QR capacity, date/time synchronization, legacy event migration, QR limits, immutable guest snapshots, ownership/CSRF/storage guards and the existing project regressions.

## Practical limits

The reference supplies a video-cover/coming-soon state rather than a playable wedding film. Uploaded wedding music is supported; this review does not claim audible physical-device playback. Local photo-heavy demo links are long and do not produce QR codes; authenticated immutable short guest links are implemented and backend-tested, but this turn did not publish the project. Real authentication/provider generation and a deployed cross-device account session were not exercised. These limits do not change the observed visual reproduction.

final result: passed

---

# Historical verification

The following reports describe earlier revisions and are not the current design target or current test count.

## 2026-10-07 — Premium redesign of all ten wedding invitations

Scope: use the friend’s Chandan/Pinki wedding site as a quality benchmark, while retaining ten distinct wedding themes and the existing editor. This is an original redesign, not a pixel clone.

Implemented: larger desktop invitation, theme-matched paper and typography, HD floral wings, three generated transparent botanical palettes, independent moving floral layers through the whole page, opening envelope with couple names, skip/replay, section navigation and reading progress, arched full-frame couple portrait, date reveal/countdown, wedding timeline details dialog, gallery transitions, venue and RSVP. Optional Ganesh and uploaded-song behavior remain supported. Wedding-only English presets and compatible saved IDs remain intact.

Visual iterations: replaced the narrow old desktop layout and heavy outlined text; matched bouquet colors across palettes; fixed envelope front lettering depth; centred inherited Champagne lettering; paused the hidden opening backdrop. Browser screenshots cover all ten desktop hero palettes. Side-by-side reference comparison was inspected for spacing, floral framing, hierarchy and readable names. Intentional differences: own backgrounds and original type/layout; one joint uploaded couple photo instead of reference’s two separate portraits; wedding-only event timeline.

Chrome checks: all ten themes at 320 px iframe width reported no horizontal overflow and no broken displayed images. Ivory and Courtyard were additionally inspected at 390 px. Fictional generated couple photo loaded at 720 px natural width; settled gallery screenshot shows both heads and full framing. Celebration navigation and details dialog opened and closed in the browser; date, time, description and directions matched configured fields. Live browser screenshot evidence is in qa/premium-invitations. Browser-extension metadata errors were observed; these are not application errors. These checks emulate viewport widths, not physical mobile devices. No new audible-device playback claim.

Automated verification: 74 tests pass, including all-ten open/skip/replay, conditional navigation, photo state and event-details behavior. Production build passes. Evidence: qa/dashboard-evidence/premium-tests.txt and premium-build.txt.

Final result: passed for this redesign scope. Deployment and physical-device/audio review are outside this local verification.

## 2026-10-06 — Windows localhost startup fix

The supplied Windows screenshot showed Miniflare ERR_MODULE_PARSE for public/audio-upload.js when running npm run dev. The preview configuration now explicitly treats imported .js files as ES modules, matching the worker test configuration. Actual Vite startup with the corrected configuration reached VITE ready without the module parsing error. The host was set to 127.0.0.1 for the execution environment; the project default host/port remains 0.0.0.0:4173. This verifies startup, not a new browser or audible playback check.

## 2026-10-06 — Song lifecycle and saved-draft follow-up

1. Rapidly replacing a song while the old player is starting no longer lets that player's late completion pause the new song. Old-player error events cannot switch the current sound state off. Obsolete pause callbacks do not override newer playback. A regression check reproduces the old failure and passes after the fix.
2. Removing a song or resetting the studio during upload invalidates the pending response. It cannot restore a discarded song or overwrite the reset form. The file input becomes usable immediately. Dashboard uploads also guard against removal and replacement of the target profile while waiting.
3. Legacy unedited Haldi/Mehndi/Sangeet/Reception invitation presets migrate to wedding wording and a wedding timeline. Matching default fields change; personalized names, venue, custom wording and custom timelines remain intact. Internal IDs remain compatible.
4. New DOM integration coverage checks signed-in upload, replace, remove, all-ten theme switching, Ganesh selection, cloud save and reopened drafts with stubbed cloud endpoints. Server upload/privacy/range regressions remain covered separately by Miniflare. No audible device-playback claim is made.
5. Final verification: 73 automated tests pass; production build passes. Live browser verification and demo-only cross-device song limitations remain as documented below.

## 2026-10-06 — Wedding-only invitations, uploaded song and optional Ganesh

1. Ten wedding-only choices now use ten fresh generated HD artworks. User-facing names: Ivory Jasmine, Crimson Vows, Botanical Forever, Golden Phere, Peacock Promise, Wisteria Vows, Champagne Forever, Starlit Vows, Blush Lotus and Sacred Courtyard. Legacy internal theme IDs remain compatible with saved links. Invitation presets are separate from planner event/wardrobe themes. The invitation event picker includes weddings only. Defaults and ceremony headings are English, with no Devanagari invocation.
2. Both workspace and standalone studio put optional Ganesh selection above couple photo, and song upload directly underneath couple photo. Three Ganesh colour choices and No icon. Selected image replaces the former top invocation; No icon hides the heading. Controls/configuration survive drafts and copied invitation links.
3. Uploaded MP3/WAV/OGG/M4A song plays on user opening, loops, and obeys mute/replay/hidden-tab pause. Replay rewinds the selected song to the beginning. The generative score and SFX do not mix with uploaded songs. Changing/removing a song stops the old player; pause cancels pending playback. Original score is the fallback when no song is selected.
4. Signed-in song upload is bounded to 20 MB, checks MIME and matching file header, requires same-origin requests, stores invitation audio separately from private assets, and supports byte range playback. Link-viewable audio stays within the deployed site audience, matching invitation photo semantics. Demo/local songs use IndexedDB; their links can play on this browser/device only. Both editors clearly state this boundary; signed-in upload is required for cross-device song sharing.
5. New artwork assets: ten 1024 x 1536 wedding backgrounds, plus transparent Ganesh PNG. All ten inspected together for unwanted architecture; no Taj Mahal, minarets or domes visible. Envelope interior, hero, curtains and venue fallback use fresh theme artwork. Camera motion, independent botanical depth planes, petals, atmosphere and theme symbols animate the backgrounds. Reduced motion remains supported. Intrinsic hero content flow accommodates the optional icon and long family details.
6. Verification: 69 automated tests pass, including all-ten wedding preset checks, optional Ganesh render/removal, editor control order, shared media configuration, audio validation, exact uploaded-track player selection, pending playback cancellation, authenticated upload/CSRF/public audio retrieval/range responses, plus existing opening/replay and account privacy tests. Production build passes. All 11 artwork assets are present in production output; all ten WebP backgrounds decode successfully.
7. Evidence limit: artwork review is an asset contact sheet, not a live browser screenshot. This session's cloud browser cannot connect to the isolated local shell preview; therefore no claim of live visual/device playback verification is made. Historical screenshots/GIF describe earlier revisions.

## 2026-10-06 — All ten invitation motion upgrade

1. Invitation background: nine HD bouquets in three independently scrolling depth planes, perspective movement, pointer parallax, twenty floating petals, moving wallpaper, three atmospheric light planes and animated vine strokes.
2. Ceremony themes: all ten configurations select their matching lotus, diya, sun, stars or mandala. Three medallions remain single instances during theme changes. Each theme has explicit hero, light and motif tempos. Diya moves and glows without spinning.
3. Lifecycle: motion pauses while sealed or hidden; reduced motion disables camera, floral, symbol and vine movement. Existing user-started sound/mute control remains shared.
4. Verification: 63 automated tests pass and production build passes. The extended floral test verifies all ten motif mappings, no duplicated scene or medallions, distinct scroll depth values and hidden-tab cancellation. Existing all-ten opening/replay and interaction regressions pass.
5. Visual verification limit: this run could not access the local preview from the cloud browser. Servers were started, but browser requests returned connection refused; shell runtime uses isolated network namespaces. No new screenshot or recording is presented as evidence for this upgrade. Previously saved screenshots/GIF document the previous revision only.

## Clearly visible animated floral background correction

The earlier treatment clipped botanical graphics into narrow edge strips. Removed that clipping and added visible 260–320 px floral clusters, a repeating floral wallpaper through the full card, larger vine artwork and petals distributed across the card width. A continuous theme-coloured centre veil keeps text readable without separate rectangular text panels. Desktop also has large animated floral arrangements in the surrounding page background.

Motion is stronger and clearly visible: bouquets sway, rotate and breathe over a seven-second cycle; larger petals drift over eleven seconds; the surrounding desktop arrangements sway over ten seconds. All motion respects reduced-motion and pauses when the invitation is sealed or the document is hidden. The existing synchronized sound cues remain connected.

Verified the actual Chrome rendering after opening and scrolling the invitation. Captured 28 real browser frames over 5.1 seconds into qa/invitation-evidence/invitation-background-motion.gif; this is a recording of the implemented animation. Full desktop screenshot and live preview show the background artwork. Build succeeds and all 63 regression tests pass. Previous sections describe earlier iterations.

## Invitation studio — readable lettering, continuous florals and synchronized sound

Updated all ten invitation templates. Names use bold ivory lettering, a fine stroke and layered soft shadows on a continuous dark hero scrim. Removed the older pale hero panel that interfered with white text. Body copy, dates, timelines, venue details, closing names and RSVP controls use light/dark palettes selected for each theme; script headings are stronger without losing their wedding character.

Actual Chrome measurements for all ten templates: body text contrast 11.41–15.40:1 and section-heading contrast 8.12–14.04:1 against the template paper. Names have font weight 700 and explicit shadows. These numerical ratios describe section text against its paper background, not pixel-by-pixel contrast over hero photography. Hero photography was visually checked in the live ivory invitation, with a continuous scrim behind the lettering. Per-template measurements are in qa/dashboard-evidence/invitation-theme-visibility.json.

Added a single full-height botanical scene under the entire invitation: scalable vine borders, nine high-resolution floral bouquets and twelve drifting petals. Background coverage matches the full card height in all ten templates (approximately 4,375–4,874 px in the studio preview), with a protected clear centre for text. Scrolling changes vine depth/rotation; bouquets sway, petals drift and chapter dividers glimmer. The scene reaches the RSVP and closing footer. Motion stops when sealed or hidden, respects reduced-motion preferences and uses one scroll animation-frame request rather than an always-running scroll loop. Reconfiguration does not duplicate scenes.

Original procedural chimes and soft filtered petal swishes are synchronized with seal opening, arrival, section entrance, date reveal and RSVP opening. They share the music/sound control and require user-started audio. Section cues are throttled and fire once per chapter to avoid repeated scroll noise. Synthesis, mute/suspended gating and lifecycle are regression-tested. In Chrome, opened the invitation via its seal, scrolled to the footer, revealed the date, toggled sound off/on and saved screenshots; no application errors were observed. No third-party audio recordings are used.

Validation: build successful and all 63 tests pass, including a ten-theme open/date-reveal/RSVP/replay lifecycle check, full-height floral idempotence/scroll/hidden-page handling, and sound cue scheduling. Raw browser screenshots are under qa/invitation-evidence. Earlier sections below record prior tasks and historical counts.

## Auto-fit background match correction

Removed the flat portrait mat that made fitted photographs look like rectangular inserts. Personal photographs now blend into the theme paper with transparent edge transitions, while preserving their full framing and proportional scale. Bright neutral studio backgrounds are softened from their connected border pixels; central pale clothing is protected. Dark or mixed-colour backgrounds bypass this neutral-background removal and retain their original content with edge blending. This is a conservative studio-backdrop treatment, not general AI segmentation of arbitrary outdoor backgrounds.

Verified both separate sample portraits in a dark Starlit Phere poster and an ivory Lotus Mandap poster in Chrome. Heads remain complete; faces and clothing stay visible; the contrasting studio rectangles are removed. Saved the corrected ivory poster to the design collection. Added pixel-level regressions for studio-background transparency, face/pale-clothing preservation, and non-destructive handling of dark/mixed backgrounds. Build succeeds; all 60 tests pass. After this renderer change, all 180 photo/opacity renders, 30 font renders and 20 invitation photo/theme roundtrips completed successfully.

## Latest verification — sample portraits, fonts and photo auto-fit

Generated two distinct fictional adult Indian wedding portraits: Aarav (groom) and Diya (bride). Uploaded both through the browser and verified their separate identity mapping in the AI assistant, profile and overview. The QA fixtures and reproducible checks are included in the project.

Cards and posters now offer five independent lettering choices for each partner: Classic serif, Wedding calligraphy, Romantic script, Heritage serif and Modern minimal. Choices persist per celebration and apply to both formats, live regeneration, saved artwork and PNG output. Fonts are packaged locally and loaded before drawing.

Fixed cropped heads: personal photographs use full-image proportional fitting rather than centre cropping. Foreground arched portraits reserve space above the head. This applies to separate portraits and wide joint photos, both formats and all three layouts; background photographs also fit without cropping. Verified the corrected wedding poster in Chrome and saved it to the collection successfully.

Validation: build successful; 58 automated tests passed. The production canvas renderer produced 180 combinations (10 themes × 2 formats × 3 layouts × opacity 0/20/100) and 30 font variants (5 fonts × 2 formats × 3 layouts), with distinct opacity/font pixel outputs and correct dimensions. Both samples round-tripped through all 10 invitation themes (20 checks). A real wedding-plan PDF was exported. Selected PNGs, the PDF, render summary and test logs are under qa/sample-evidence and qa/dashboard-evidence. A regression confirms full-image drawing and preserved aspect ratios for tall individual and wide joint photographs.

AI assistant fixes: selected art direction now matches the brief; photo removal/upload and reference changes update it; blank/oversized prompts are rejected; partner labels follow names; video validates both references; unsupported imports and excessive media sizes show errors. Local JPEG references transfer without private API requests. Result MIME/session checks, retry after save failure, timeout cleanup and allowed localhost companion origins are tested. Browser verification covered prompt copy, landscape video brief, both loaded reference photographs and the helpful missing-companion message.

Verification boundary: external ChatGPT/Canva/Gemini generation on a signed-in provider account remains unverified because the browser has no installed companion/provider session. The companion protocol is regression-tested, but these tests do not prove provider generation. Browser download capture was unavailable; production PNG/PDF bytes were validated directly. Earlier sections below record historical checks and counts.

## Wardrobe duplicate-image fix

Fixed shared image mappings: Mehendi previously reused Haldi; Sangeet and Reception reused Wedding. Added three independently generated, event-specific high-resolution outfit references. All five events now have distinct image bytes, outfit suggestions and image descriptions. Reception copy/swatches match its silver saree and charcoal tuxedo. Image sizing preserves full outfits on desktop/mobile rather than cropping neckline or footwear.

Clicked all five tabs in Chrome and confirmed every distinct asset decoded successfully with object-fit contain. Added duplicate-image hash regression plus all-tab/matching bride-groom shopping-save test. Build succeeds and 50 tests pass. Generated assets/prompts are documented in asset-prompts.md.

## Wedding stationery redesign

Replaced the separate rectangular text panels with a continuous ivory/deep-maroon paper composition and a smooth vertical photo wash. Rebalanced the heading, couple names, portrait and event details; arched foreground portraits use fine gold edging. The portrait layout now uses a continuous cinematic tonal fade rather than a block behind the text. Background opacity controls remain per-event and all exported canvases use the new composition.

Verified in Chrome: ivory wedding card, Haldi at 100% background opacity and royal poster. Rendered all ten themes to real 1080×1520 PNGs plus portrait/editorial posters. Build successful and all 48 regression tests pass. Updated contact sheet contains actual exported outputs. Sample photograph is a QA fixture, not the user's couple photo.

## Text visibility with photo backgrounds

Added theme-aware ivory/deep-maroon contrast panels behind headings, couple names, date/venue and closing text. Light themes use deep ink and darker gold; dark themes use ivory and pale gold. Portrait layout receives a dark text scrim. These treatments are independent of the background slider and apply to generated previews, saved designs and PNG output. Chrome visually verified the Haldi card at 100% photo opacity with readable names and event details. Build successful; 48 regression tests pass.

## Card and poster background opacity slider

Added an accessible 0–100% background photo slider, default 20%. Each event saves its own setting. Generated previews repaint automatically after slider input; PNG download and saved designs use the same canvas. Foreground portraits remain unchanged. All three layouts and both output formats read the saved opacity. Download/save stay disabled while the latest preview renders to prevent stale exports.

Chrome verified 0%, 100% and 60% with updated preview and re-enabled export controls. Regression tests cover defaults, zero/full strength, invalid bounds and per-event persistence. Build successful; 48 tests pass.

## Overview photograph update — 6 October 2026

The overview now automatically displays the invitation couple photo in an ivory and gold portrait frame. If no joint photo exists, it shows an event-card photo, then the individual profile photographs, with initial placeholders for missing photos. The change-photo button opens the invitation upload view; the add-photo button opens profile uploads. Photo removal updates the overview automatically. Portrait entrance uses the existing reveal lifecycle; hover uses restrained image scaling and respects reduced motion.

Verified in Chrome: uploaded image decoded successfully at 208 × 210 display pixels; change-photo action reached upload controls. At a 390-pixel iframe viewport the document had no horizontal overflow (client and scroll width both 375 pixels). Fixed the mobile date/countdown overlap. Screenshot uses a sample test photograph. Build succeeds and all 46 tests pass, including a new upload-to-overview/removal regression.

## Live browser follow-up — 6 October 2026

Verified in Chrome against the running local demo: couple photo upload, opened invitation, loaded background photo with computed opacity 0.2 and couple-background-drift animation; all ten theme buttons selected successfully; copy invitation link; event dress-code edit; budget starter categories; task completion; wardrobe save; vendor search and quote transfer; AI prompt refresh and copy; generated card and saved collection; PDF generation reached the download modal; wedding profile save. Screenshot: ../output/dashboard-live.jpg.

Fixed during this pass: PDF export restored flattened text instead of its responsive label markup, causing a duplicate label. It now restores the original markup. Download anchors now attach to the document, retain object URLs for 30 seconds, report PNG encoding failure, and show download feedback.

The cloud browser download capture timed out for both blob PNG and data-URL PDF. Download completion on the user's computer is therefore not claimed. Production PNG/PDF output validity is separately covered by the native renderer evidence. External provider generation and live account synchronization require the user's service environment and remain unverified. This follow-up verifies the named flows; it does not claim every possible button/state was manually clicked.

# Latest workspace revision

Dashboard, preset exports, floral motion and local photo upload changes are documented in `dashboard-qa.md`. Build passes and 45 automated tests pass. Final live browser/mobile checks remain limited by unavailable browser controls after a session timeout. The earlier homepage review below is retained as history.

# Logo, motion and invitation themes — design QA

Result: passed build and 40 automated tests.

## Current changes

- Supplied RGBA logo copied unchanged; framed in homepage header/footer and studio header.
- Homepage-only GSAP choreography, line-drawn gold arches, layered title entrance, floating card, staggered section reveals and dashboard panels. Native scrolling remains in place.
- Off-screen/background hero loops pause. Reduced-motion media context reverts motion. Script-unavailable homepage retains existing IntersectionObserver fallback; no-JS content is visible. Keyboard focus reveals its containing card.
- Exactly ten studio themes, including six wedding themes and four celebration themes. Lotus/diya/mandala/sun/star SVG ornaments remain sharp at any scale. Hindi invocations and sacred-vow captions are real text.
- Ivory artwork replaced with floral palace HD image; Royal artwork replaced with HD Baraat. Ivory contrast and Royal maroon panel adjusted for new backgrounds. Invitation heading blur removed from supplemental Motion animation.
- Wedding ceremony presets contain separate times for Ganesh puja, Baraat, Jaimala/saat phere and dinner. Existing serialized invitation content is preserved.

## Verification

- Build passes; 40 tests pass, including ten-theme artwork/ornament coverage and ceremony preset checks.
- Live homepage desktop inspected at 1348px. Supplied logo and sharp hero stationery visible.
- Live 390px mobile frame: client width 375px, scroll width 375px; scroll link reveals feature heading and cards without horizontal overflow.
- Lotus Mandap opening checked in live frame; typography panel and ceremonial motif render. Contrast corrected after visual review. Royal Baraat selected and seal opening checked in live studio.
- Reduced-motion behavior inspected in implementation/styles; browser media emulation was not available.
- No production deployment performed. Live development preview kept running for user inspection.

## Themes

Lotus Mandap · Royal Baraat · Sacred Phere · Marigold Morning · Mehndi Courtyard · Sangeet Soirée · The Golden Evening · Starlit Phere · Lotus Vows · Peacock Darbar.

# Homepage sharp-artwork revision — design QA

final result: passed

## Result and acceptance target

The user reported blur across homepage artwork and specifically the hero's
floating invitation and template-selector cutouts. The current version removes
all 30 small reference crops from served homepage markup and styles. It keeps the
accepted scrolling layout and cream/maroon/gold visual direction.

The page remains Hero → Everything → How it works → Invitation Studio →
Dashboard → Sample stories → Closing CTA → Footer. Earlier reference-fidelity
and layout reviews are retained in `qa/homepage-evidence/iterations/`.

## Resolution changes

| Surface | Previous source | Current result |
| --- | --- | --- |
| Hero floating invitation | 171 × 268 crop | New 1024 × 1536 floral palace artwork with real HTML names/date |
| Hero template thumbnails | 39-pixel-wide crops | Full Royal Baraat, Midnight Noor and Garden originals; widths 1024, 1008 and 941 pixels |
| Feature overview/events/budget | 94–110-pixel crops | Native HTML/CSS previews with real text, vector icons and a CSS budget chart |
| Feature invitation/cards/wardrobe | 73–117-pixel crops | New invitation artwork, existing sharp Haldi artwork, new 1254 × 1254 wardrobe photo |
| Planning steps | 79–80-pixel-high crops | Native workspace, event-plan and share graphics; new 1536 × 1024 celebration photo |
| Main dashboard | 430 × 210 screenshot | Native responsive HTML dashboard; real typography and vector icons |
| Royal Baraat theme | 115 × 136 crop | New 1024 × 1536 miniature-style baraat artwork |
| Story avatars | 44–46-pixel crops | Three new 1254 × 1254 fictional portraits |
| Logo/socials/botanical decoration | Tiny raster crops | Scalable monogram, SVG icons and botanical border |
| Closing CTA | 1180 × 180 crop | New 2172 × 724 candle/velvet photograph with a contrast overlay |

Eight images were created individually with the built-in ImageGen tool. Asset
prompts, dimensions and provenance are in `asset-prompts.md`. Original generated
PNGs were encoded to WebP losslessly, without resizing. Every RGB pixel and
image dimension was checked after encoding. The sharp existing invitation
collection and the accepted hero background remain in use.

## Browser verification and evidence

Evidence directory: `qa/homepage-evidence/sharp-artwork/`.

- `hero.jpg`: floating card typography and full-source hero thumbnails inspected.
- `features.jpg`: native preview text, chart, cards and photos inspected.
- `mobile-tablet.jpg`: mobile feature cards and tablet planning-step previews.
- `studio.jpg`: all five invitation previews, including new Royal Baraat.
- `dashboard.jpg`: native dashboard with sharp typography and source photo.
- `stories.jpg`: three regenerated avatar portraits.
- `footer.jpg`: sharp candle banner, monogram and social SVGs.

Desktop browser viewport: 1363 × 936 CSS pixels; page client/scroll width 1348.
Responsive verification used 390 × 844 and 900 × 844 same-origin iframes. Client
and scroll widths were 375/375 and 885/885 respectively: no horizontal page
overflow. The temporary responsive wrapper was removed before the final build.

Hero card source: 1024 × 1536, displayed at approximately 235 × 339 including
rotation. Hero thumbnail sources were 1024 × 1536, 1008 × 2240 and 941 × 1672,
displayed at 46 × 65. All loaded successfully. The new artwork is not a scaled-up
version of a small source crop. Default logged-out state, fonts loaded, dialogs
closed. Reduced-motion/no-JavaScript visibility fallbacks remain unchanged.

## Checks

- Existing same-page navigation and scroll behavior verified in the live page.
- Every image/style asset reference exists. No old feature, step, dashboard,
  portrait, social, logo or decoration crop is referenced by served code.
- Main links, invitation themes and account interactions covered by existing
  automated checks. Native preview visuals have no nested interactive controls
  and are hidden from assistive technology; their parent links/buttons retain
  descriptive accessible names.
- Final `npm run build`: successful. Final `npm test`: 38 passed, 0 failed.
- No new application console errors in the browser. Browser-extension metadata
  errors are external to the app. The test runner's existing JSDOM navigation
  limitation is informational; its logged-out navigation check passed.
- Source ZIP includes current assets, prompts and QA evidence. Replaced crops are
  archived as historical evidence and are not included in the served asset tree.
- No deployment was performed. Local preview remains running for the user's
  explicit request to inspect it within this conversation.

final result: passed
