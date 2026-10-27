# Homepage artwork replacement

Created with the built-in ImageGen tool on 5 October 2026. Each asset was
generated separately, visually inspected and copied into the project. Original
PNG outputs were encoded as lossless WebP without resizing. Dimensions and every
RGB pixel were checked after conversion. These are fictional promotional images.

## Generated assets and prompts

All prompts request a single final website image, sharp details, the established
maroon/ivory/antique-gold palette, no watermark and no unintended lettering.

- `public/assets/homepage/invitation-art.webp` — 1024 × 1536.
  Product mockup: portrait floral Indian wedding invitation artwork, flat and
  straight-on. Ivory handmade paper, blush roses and sage foliage at the upper
  corners, thin double metallic gold border and scalloped Mughal arch. Detailed
  Rajasthan palace and garden in the bottom quarter. Central half remains plain
  ivory for live HTML typography. Crisp fine line work, no perspective or blur,
  no text, no drop shadow, no extra objects.
- `public/assets/homepage/wardrobe-hd.webp` — 1254 × 1254.
  Photoreal editorial fashion photo: full-length Indian bride and groom in a
  light ivory heritage courtyard. Bride in deep maroon lehenga with antique gold
  embroidery; groom in ivory silk sherwani and maroon stole. Front-facing natural
  pose, complete outfits and shoes, space above and below, realistic skin and
  fabric. Sharp natural daylight and deep depth of field. No lettering or blur.
- `public/assets/homepage/royal-baraat-hd.webp` — 1024 × 1536.
  Portrait royal Indian miniature invitation illustration: ornate golden
  Rajasthan palace arch, baraat in the lower half, ivory-clad groom on a decorated
  white horse, musicians and festive guests in saffron/maroon/ivory. Antique
  paper, maroon drapery, gold frame and delicate floral border. Clean pale ivory
  space in the upper middle for names. Crisp flat artwork, no text or blur.
- `public/assets/homepage/celebrate-hd.webp` — 1536 × 1024.
  Photoreal wedding photograph: waist-up Indian bride and groom in maroon lehenga
  and ivory sherwani, with flower garlands, sharing relaxed joyful smiles after
  their wedding. Elegant floral mandap and warm ivory palace courtyard. Natural
  skin, expressions, jewellery and fabric. Balanced daylight, sharp couple and
  flowers, no haze, text, watermark or artificial glowing particles.
- `public/assets/homepage/portrait-riya-hd.webp` — 1254 × 1254.
  Square fictional bridal head-and-shoulders portrait: smiling 27-year-old Indian
  bride, warm medium complexion, straight dark hair, maroon dupatta, small gold
  earrings and tiny bindi. Upright centered head, direct eye contact and gentle
  closed-mouth smile. Sharp eyes, natural skin and fabric, even daylight and
  simple warm ivory background. No facial blur or plastic retouching.
- `public/assets/homepage/portrait-sneha-hd.webp` — 1254 × 1254.
  Square fictional portrait: cheerful 26-year-old Indian woman, warm brown skin,
  long dark wavy hair, sage silk sari, delicate gold earrings and tiny bindi.
  Natural smile, upright centered head and direct eye contact. Sharp natural skin
  and fabric in even daylight, simple warm beige background. No face blur,
  glamour retouching or lettering.
- `public/assets/homepage/portrait-meera-hd.webp` — 1254 × 1254.
  Square fictional bridal portrait: smiling 28-year-old Indian woman, natural
  medium complexion, neatly styled dark hair, cream/gold sari, gold earrings and
  small red bindi. Upright centered head, gentle expression and direct eye contact.
  Bright even light, sharp eyes, skin and jewellery, warm ivory background. No
  blur, artificial airbrushing, lettering or watermark.
- `public/assets/homepage/candles-hd.webp` — 2172 × 724.
  Photoreal wide 3:1 wedding CTA banner: lit brass candlesticks and maroon roses
  concentrated at the far left; deep burgundy velvet across the width. The center
  and right two thirds remain clean dark negative space for real text and buttons.
  Fine gold accents and natural candle glow, crisp metal/flowers, no haze, blurry
  filter, lettering, humans or watermark.

## Scalable graphics

Overview, events, budget, three planning steps and the main dashboard are now
HTML/CSS previews with real typography and vector icons. The E monogram, social
icons and botanical borders are scalable graphics. Invitation names are HTML
placed over the newly generated blank stationery.

The existing full-resolution Midnight Noor, Blush Mehraab, Emerald Darbar, Haldi
and Garden artwork remains in use. Hero thumbnails now use full source images
instead of 39-pixel reference crops. Replaced reference crops are archived under
`qa/homepage-evidence/iterations/reference-crops/` and are not served by the app.

## Animated floral corner bouquet

`public/assets/floral/wedding-bouquet.webp` — lossless WebP from generated transparent PNG, 1254×1254. Reusable upper-left diagonal botanical bouquet: burgundy roses, ivory jasmine, saffron marigolds, antique gold stems and sage leaves, watercolor/engraved detail, transparent surrounding space, no text/card/palace. Full source PNG is retained. Used as animated guest-invitation corners and actual card-export artwork.

## Wardrobe correction — built-in imagegen
- `public/assets/wardrobe/mehendi-style.webp`: full-length couple, emerald printed lehenga, sage kurta and green Nehru jacket, daytime garden, visible henna.
- `public/assets/wardrobe/sangeet-style.webp`: full-length couple, violet mirror-work lehenga, midnight embroidered bandhgala, evening dance celebration.
- `public/assets/wardrobe/reception-style.webp`: full-length couple, silver embellished evening saree, charcoal tuxedo and bow tie, champagne ballroom.
Each generated separately through the built-in imagegen tool; no reuse between event tabs.

## End-to-end sample references — built-in imagegen
- `qa/fixtures/sample-bride.jpg`: fictional adult Indian bride, waist-up studio portrait, red silk saree, gold jewellery, ivory background.
- `qa/fixtures/sample-groom.jpg`: fictional adult Indian groom, waist-up studio portrait, ivory sherwani, maroon stole, ivory background.
Separate generated portraits used solely for isolated demo QA.

2026-10-07: Generated transparent ivory jasmine/cream rose, lavender wisteria/jasmine, and blush rose/lotus botanical clusters for independent background animation. Fictional Indian wedding couple portrait generated solely for QA; no default user photo was replaced. Assets: public/assets/floral/*-botanical.png and .webp; qa/fixtures/premium-sample-couple*.jpg.
# Ten invitation worlds — 9 October 2026

The full reference renderer now consumes the ten existing individual 1024 × 1536 wedding mandap artworks in `public/assets/wedding/`. It replaces only its scene/decorative image inputs; personal photographs and Ganesh icons retain their original image data. These assets also appear in the studio selectors.

Three new individual transparent foreground botanical assets were generated with the built-in image tool, visually inspected and converted to alpha-preserving WebP for animated section corners:

| File | Intrinsic pixels | Art direction |
|---|---|---|
| `floral/marigold-botanical.webp` | 1254 × 1254 | Golden Phere and Sacred Courtyard: realistic fine-art orange/gold marigolds, ivory jasmine, antique olive-gold foliage and diagonal drooping stems. |
| `floral/peacock-botanical.webp` | 1223 × 1286 | Peacock Promise: emerald peacock feathers with teal/sapphire eyes, white lotus, jasmine and cascading fern foliage. |
| `floral/lotus-botanical.webp` | 1024 × 1536 | Blush Lotus: detailed pink lotus blossoms/buds, white jasmine, dusty sage leaves and delicate diagonal tendrils. |

All prompts required an actual transparent background, an inward-facing corner spray, realistic fine-art botanical detail, and no text, frame or scenery. Original PNGs are retained. Marigold, peacock and lotus source alpha was verified. Existing ivory, rose and lavender botanical artwork supports the other worlds. Display sizes stay below intrinsic resolution.

