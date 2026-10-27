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

# Dashboard, invitation photos and motion — verification report

## Scope and result

The supplied signed-in screenshot guided the maroon / ivory / gold dashboard revision. Existing account data and route IDs are retained. The overview now has a compact hero, planning metrics before celebration cards, smaller image panels, the supplied logo and a consistent icon set. Floral artwork is a new transparent HD bouquet; its corner motion pauses outside the viewport and while the document is hidden. Reduced-motion CSS disables continuous floral animation and decorative transitions.

## Checks by flow

| Step | Flow | Health and evidence |
| --- | --- | --- |
| 1 | Overview / navigation | Ten workspace sections mounted in automated action checks. Overview screenshot captured during the previous live session; compact revised overview visually inspected then. Celebration links now have actual hrefs and keyboard focus. |
| 2 | Events | Add, edit, save, cancel removal and confirm removal tested in browser DOM integration. Editing dialog was also inspected live before the session timeout. New form labels corrected. |
| 3 | Invitations | All ten theme selection buttons change the encoded guest preview. Both local JPEG photos survive copied invitation configuration for every theme. Shared real-image compression tested against production preparation code. |
| 4 | Cards / posters | Production canvas code rendered all ten digital card PNGs plus Portrait and Editorial posters. Contact sheet inspected. Ivory card text contrast fixed; multiline headlines flattened for canvas. Download originals remain PNG; saved browser images are compressed JPEG. Generation/save error paths re-enable controls. |
| 5 | Wardrobe | Saving an outfit creates a shopping item; repeating it gives duplicate feedback. Shared shopping edit forms use consistent save logic and corrected labels. |
| 6 | Budget | Blank categories are idempotent; invalid overpayments are rejected; valid custom costs save. Existing add-more regression also passes. |
| 7 | Vendors | Create vendor and add quote/deposit to budget checked; existing search/filter/contact URL regressions pass. Phone calls and WhatsApp messages were not initiated. |
| 8 | Checklist | Add task, mark complete and reflect completed state checked. |
| 9 | Profile / backup | Wedding city persisted to local account storage; backup button produced the correct JSON filename. Photo uploads accept JPG/PNG/WebP up to 8 MB and resize for browser storage. |
| 10 | AI assistant | Refresh/download prompt tested. Missing companion produces actionable feedback. External provider generation is not verified and still requires the user's installed companion and provider account. |
| 11 | PDF export | Production jsPDF export rendered a valid 3-page PDF with wedding title and no JavaScript. |

## Fixes

- Browser-only photo data was previously stripped by invitation normalization. Bounded JPEG data URLs now pass a strict allowlist; HTML/SVG data remains rejected.
- Real local image preparation produces bounded JPEGs and preserves photo identity in invitation links. Cloud uploads retain original file resolution.
- Studio detects local sessions and demo mode; planner-to-studio links preserve demo mode. Local studio drafts skip cloud state loading.
- File inputs recover after a failed upload, including selecting the same file again.
- Floral corners appear in all guest invitation themes and exported heirloom/editorial cards; portrait cards retain the full-photo composition.
- Workspace motion is scoped to the current view, replacing overlapping Motion/GSAP choreography.
- Celebration navigation links are keyboard-reachable native links.
- New forms now say Add celebration / Add task / Save vendor / Add shopping item, rather than all saying Save cost.

## Evidence and limits

`qa/dashboard-evidence/cards/` contains outputs rendered from the production canvas implementation, not browser screenshots. `qa/dashboard-evidence/wedding-plan.pdf` is the actual PDF export. `qa/dashboard-evidence/render-results.txt` records render and real photo compression checks. 45 automated tests passed. Upload/removal integration tests cover both photographs across all ten themes; the image-decoding boundary is mocked there, while the separate real-image preparation check uses native decoding. Test counts are in `qa/dashboard-evidence/tests.txt`.

The live browser upload test timed out on 5 October. Browser controls were unavailable when work resumed on 6 October. Consequently, this is not a claim that every button was clicked and visually verified in a live browser: the remaining checks use DOM integration, real image preparation and production output rendering. Mobile visual QA for this dashboard revision and external AI/provider actions still need a live browser pass. Previously accepted homepage work remains in the project.

Local photo invitation links embed compressed photos and can be long. Cloud account links use uploaded photo paths. Browser-only accounts keep data on their device; use Download backup for an additional copy. Continuous floral animation follows reduced-motion settings; no WCAG compliance claim is made.

## Automatic couple-photo background

The selected event couple photograph (falling back to the shared invitation or partner photograph) is also composited into card and poster backgrounds at exactly 20% opacity. The main photo placement remains in heirloom/editorial layouts. Portrait Spotlight now uses a 20% photo backdrop. All ten interactive invitation themes add the uploaded couple photo behind hero text at CSS opacity 0.2; removal hides the backdrop automatically. Decorative flowers and text render above the background photograph.

## Final motion lifecycle polish

View transitions now stop old animations and dispose their viewport observers. Live reduced-motion changes reset inline transforms/opacity instead of leaving content dimmed. Floral roots are idempotent, clean up their images/listeners and pause outside the viewport or in a hidden document. Dialogs, toast feedback, uploaded photos, budget rings and saved designs have coordinated low-amplitude entrance motion. The 20% couple-photo backdrop drifts gently while the invitation hero is visible. Lifecycle regressions instrument Motion handles and viewport observers to test cleanup, hidden-page pause and media-preference changes. Live browser controls remain unavailable; visual animation timing and full browser click-through are not claimed as verified.
