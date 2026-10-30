// src/content/wedding.ts
//
// SINGLE SOURCE OF TRUTH for all wedding content.
// Public sections AND admin read from here as the seeded default;
// admin edits override via the database (see src/server/wedding/settings.ts).

export interface WeddingEvent {
  id: string;
  name: string;
  tagline: string;
  dateISO: string; // local date-time of the event
  dateLabel: string;
  timeLabel: string;
  venue: string;
  address: string;
  description: string;
  dressCode?: string;
  theme: "haldi" | "mehendi" | "wedding" | "reception";
  image: string;
  imageFit?: "cover" | "contain";
  mapUrl: string;
  enabled: boolean;
  sortOrder: number;
}

// ── live-site overrides ────────────────────────────────────────────────
// The root layout server-renders <script id="__SITE_CONFIG__"> carrying the
// admin-configured content (and music URLs) before client hydration, so every
// existing `COUPLE.x` / `VENUE.x` / `WEDDING_DATE_ISO` import keeps working
// with zero component changes. Falls back to the seeds below when the DB
// is unreachable or no overrides exist.
interface SiteContentOverrides {
  groomName?: unknown;
  brideName?: unknown;
  headline?: unknown;
  quote?: unknown;
  invitationMessage?: unknown;
  weddingDateISO?: unknown;
  heroPhoto?: unknown;
  heroPhotoFit?: unknown;
  invitationPhoto?: unknown;
  invitationPhotoFit?: unknown;
  venueName?: unknown;
  venueAddressLines?: unknown;
  venuePin?: unknown;
  venuePhoto?: unknown;
  venueMapUrl?: unknown;
  // family intro (editable at /admin/couple)
  groomPhoto?: unknown;
  groomPhotoFocus?: unknown;
  groomPhotoFit?: unknown;
  groomRelationLabel?: unknown;
  groomParents?: unknown;
  groomAddress?: unknown;
  bridePhoto?: unknown;
  bridePhotoFocus?: unknown;
  bridePhotoFit?: unknown;
  brideRelationLabel?: unknown;
  brideParents?: unknown;
  brideAddress?: unknown;
  siteTexts?: {
    tapToReveal?: unknown;
    openInvitation?: unknown;
    tapToBegin?: unknown;
    youreInvited?: unknown;
    thankYouTitle?: unknown;
    thankYouMessage?: unknown;
    footerText?: unknown;
    mandapTitle?: unknown;
    mandapLine1?: unknown;
    mandapLine2?: unknown;
    mandapLine3?: unknown;
  };
}

function readSiteContentOverrides(): SiteContentOverrides {
  if (typeof document === "undefined") return {};
  try {
    const el = document.getElementById("__SITE_CONFIG__");
    const text = el?.textContent;
    if (!text) return {};
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object" && "content" in parsed) {
      const c = (parsed as { content: unknown }).content;
      if (c && typeof c === "object") return c as SiteContentOverrides;
    }
  } catch {
    // malformed JSON — ignore and use seeds
  }
  return {};
}

const SITE_OVERRIDES = readSiteContentOverrides();

function ovStr(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim().length > 0 ? v : fallback;
}

/** For photo URLs: explicit "" means "removed" (show nothing), only undefined/null falls back. */
function ovPhoto(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  return v; // empty string = intentionally removed
}

function ovStrArr(v: unknown, fallback: string[]): string[] {
  return Array.isArray(v) &&
    v.length > 0 &&
    v.every((x) => typeof x === "string")
    ? (v as string[])
    : fallback;
}

const COUPLE_SEED = {
  groom: "Rupesh",
  bride: "Usha",
  headline: "Two Hearts, One Beautiful Journey",
  invitationMessage:
    "With the blessings of our families,\nwe cordially invite you to be a part\nof our special day.",
  quote: "Different Roots, Same Dreams — A Lifetime Together",
  heroPhoto: "/reference/assets/current-4d31a609d04f.jpg",
  invitationPhoto: "/reference/assets/current-49b574202f26.jpg",
};

export const COUPLE = {
  groom: ovStr(SITE_OVERRIDES.groomName, COUPLE_SEED.groom),
  bride: ovStr(SITE_OVERRIDES.brideName, COUPLE_SEED.bride),
  headline: ovStr(SITE_OVERRIDES.headline, COUPLE_SEED.headline),
  invitationMessage: ovStr(
    SITE_OVERRIDES.invitationMessage,
    COUPLE_SEED.invitationMessage
  ),
  quote: ovStr(SITE_OVERRIDES.quote, COUPLE_SEED.quote),
  heroPhoto: ovPhoto(SITE_OVERRIDES.heroPhoto, COUPLE_SEED.heroPhoto),
  heroPhotoFit: ovStr(SITE_OVERRIDES.heroPhotoFit, "cover") as "cover" | "contain",
  invitationPhoto: ovPhoto(
    SITE_OVERRIDES.invitationPhoto,
    COUPLE_SEED.invitationPhoto
  ),
  invitationPhotoFit: ovStr(SITE_OVERRIDES.invitationPhotoFit, "contain") as "cover" | "contain",
};

export const WEDDING_DATE_ISO = ovStr(
  SITE_OVERRIDES.weddingDateISO,
  "2026-11-26T20:00:00+05:30"
);

// ── family intro (first section of the home page) ───────────────────────
// groomPhotoFocus / bridePhotoFocus: "x,y" percentages used as CSS
// object-position so any uploaded photo auto-frames on the face.
const FAMILY_SEED = {
  groomPhoto: "/reference/assets/current-234c8f91fdc1.jpg",
  groomPhotoFocus: "62,22",
  groomPhotoFit: "cover",
  groomRelationLabel: "Son of",
  groomParents: "Shri Rajesh Sharma & Shrimati Sunita Sharma",
  groomAddress:
    "Civil Lines, Jaipur,\nRajasthan \u2013 302001",
  bridePhoto: "/reference/assets/current-823d1cc4ff47.jpg",
  bridePhotoFocus: "38,60",
  bridePhotoFit: "cover",
  brideRelationLabel: "Daughter of",
  brideParents: "Shri Vikram Mehta & Shrimati Anjali Mehta",
  brideAddress:
    "Malviya Nagar, Jaipur,\nRajasthan \u2013 302017",
};

function ovFit(v: unknown, fallback: string): "cover" | "contain" {
  return v === "contain" ? "contain" : fallback === "contain" ? "contain" : "cover";
}

export const FAMILY = {
  groomPhoto: ovPhoto(SITE_OVERRIDES.groomPhoto, FAMILY_SEED.groomPhoto),
  groomPhotoFocus: ovStr(
    SITE_OVERRIDES.groomPhotoFocus,
    FAMILY_SEED.groomPhotoFocus
  ),
  groomPhotoFit: ovFit(SITE_OVERRIDES.groomPhotoFit, FAMILY_SEED.groomPhotoFit),
  groomRelationLabel: ovStr(
    SITE_OVERRIDES.groomRelationLabel,
    FAMILY_SEED.groomRelationLabel
  ),
  groomParents: ovStr(SITE_OVERRIDES.groomParents, FAMILY_SEED.groomParents),
  groomAddress: ovStr(SITE_OVERRIDES.groomAddress, FAMILY_SEED.groomAddress),
  bridePhoto: ovPhoto(SITE_OVERRIDES.bridePhoto, FAMILY_SEED.bridePhoto),
  bridePhotoFocus: ovStr(
    SITE_OVERRIDES.bridePhotoFocus,
    FAMILY_SEED.bridePhotoFocus
  ),
  bridePhotoFit: ovFit(SITE_OVERRIDES.bridePhotoFit, FAMILY_SEED.bridePhotoFit),
  brideRelationLabel: ovStr(
    SITE_OVERRIDES.brideRelationLabel,
    FAMILY_SEED.brideRelationLabel
  ),
  brideParents: ovStr(SITE_OVERRIDES.brideParents, FAMILY_SEED.brideParents),
  brideAddress: ovStr(SITE_OVERRIDES.brideAddress, FAMILY_SEED.brideAddress),
};

const SITE_TEXTS_SEED = {
  tapToReveal: "Tap to Reveal",
  openInvitation: "Open Invitation",
  tapToBegin: "Tap to begin",
  youreInvited: "You're Invited",
  thankYouTitle: "Thank You!",
  thankYouMessage: "Thank you for being part of our special day.",
  footerText: "Made with love for Rupesh & Usha",
  mandapTitle: "You're Invited",
  mandapLine1: "Two Families",
  mandapLine2: "One Celebration",
  mandapLine3: "A Lifetime of Love",
};

export const SITE_TEXTS = {
  tapToReveal: ovStr(SITE_OVERRIDES.siteTexts?.tapToReveal, SITE_TEXTS_SEED.tapToReveal),
  openInvitation: ovStr(SITE_OVERRIDES.siteTexts?.openInvitation, SITE_TEXTS_SEED.openInvitation),
  tapToBegin: ovStr(SITE_OVERRIDES.siteTexts?.tapToBegin, SITE_TEXTS_SEED.tapToBegin),
  youreInvited: ovStr(SITE_OVERRIDES.siteTexts?.youreInvited, SITE_TEXTS_SEED.youreInvited),
  thankYouTitle: ovStr(SITE_OVERRIDES.siteTexts?.thankYouTitle, SITE_TEXTS_SEED.thankYouTitle),
  thankYouMessage: ovStr(SITE_OVERRIDES.siteTexts?.thankYouMessage, SITE_TEXTS_SEED.thankYouMessage),
  footerText: ovStr(SITE_OVERRIDES.siteTexts?.footerText, SITE_TEXTS_SEED.footerText),
  mandapTitle: ovStr(SITE_OVERRIDES.siteTexts?.mandapTitle, SITE_TEXTS_SEED.mandapTitle),
  mandapLine1: ovStr(SITE_OVERRIDES.siteTexts?.mandapLine1, SITE_TEXTS_SEED.mandapLine1),
  mandapLine2: ovStr(SITE_OVERRIDES.siteTexts?.mandapLine2, SITE_TEXTS_SEED.mandapLine2),
  mandapLine3: ovStr(SITE_OVERRIDES.siteTexts?.mandapLine3, SITE_TEXTS_SEED.mandapLine3),
};
export const WEDDING_DATE_LABEL = new Date(WEDDING_DATE_ISO).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata"});

const VENUE_SEED = {
  name: "The Garden Pavilion",
  addressLines: ["Palace Road, Civil Lines", "Jaipur, Rajasthan"],
  pin: "302001",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=The+Garden+Pavilion+Palace+Road+Civil+Lines+Jaipur",
  photo: "/reference/assets/current-a1240688e514.jpg",
};

const venueName = ovStr(SITE_OVERRIDES.venueName, VENUE_SEED.name);
const venueAddressLines = ovStrArr(
  SITE_OVERRIDES.venueAddressLines,
  VENUE_SEED.addressLines
);
const venuePin = ovStr(SITE_OVERRIDES.venuePin, VENUE_SEED.pin);
const venuePhoto = ovPhoto(SITE_OVERRIDES.venuePhoto, VENUE_SEED.photo);
const venueMapUrl = ovStr(SITE_OVERRIDES.venueMapUrl, VENUE_SEED.mapUrl);

export const VENUE = {
  name: venueName,
  addressLines: venueAddressLines,
  pin: venuePin,
  full: `${venueName}, ${venueAddressLines.join(", ")} - ${venuePin}`,
  mapUrl: venueMapUrl,
  photo: venuePhoto,
};

export const EVENTS: WeddingEvent[] = [
  {
    id: "haldi",
    name: "Haldi Ceremony",
    tagline: "Colours of Love",
    dateISO: "2026-11-24T20:00:00+05:30",
    dateLabel: "Tuesday, 24 November 2026",
    timeLabel: "8:00 PM",
    venue: VENUE.name,
    address: VENUE.full,
    description:
      "A little turmeric, a lot of love. Join us for a beautiful Haldi ceremony filled with love, laughter and vibrant colours as we begin our wedding celebrations.",
    dressCode: "Yellow / Traditional",
    theme: "haldi",
    image: "/reference/assets/current-6d739b6d29e5.png",
    mapUrl: VENUE.mapUrl,
    enabled: true,
    sortOrder: 1,
  },
  {
    id: "mehendi",
    name: "Mehendi Ceremony",
    tagline: "Mehendi Wali Shaam",
    dateISO: "2026-11-25T20:00:00+05:30",
    dateLabel: "Wednesday, 25 November 2026",
    timeLabel: "8:00 PM",
    venue: VENUE.name,
    address: VENUE.full,
    description:
      "An evening of intricate henna, music and joy. Come adorned in greens as we celebrate love painted in the most beautiful patterns.",
    dressCode: "Green / Festive",
    theme: "mehendi",
    image: "/reference/assets/current-cd4d616c71ec.jpg",
    mapUrl: VENUE.mapUrl,
    enabled: true,
    sortOrder: 2,
  },
  {
    id: "wedding",
    name: "The Wedding",
    tagline: "Two Souls, One Forever",
    dateISO: "2026-11-26T20:00:00+05:30",
    dateLabel: "Thursday, 26 November 2026",
    timeLabel: "8:00 PM",
    venue: VENUE.name,
    address: VENUE.full,
    description:
      "The moment we've been waiting for. Witness us exchange vows and begin our forever, surrounded by everyone we love.",
    dressCode: "Traditional / Festive",
    theme: "wedding",
    image: "/assets/samples/couple.webp",
    mapUrl: VENUE.mapUrl,
    enabled: true,
    sortOrder: 3,
  },
  {
    id: "reception",
    name: "Reception",
    // CRITICAL: Reception is 28 Nov 2026 at 4:00 PM — never 8:00 PM.
    tagline: "Let's Celebrate Our New Beginning",
    dateISO: "2026-11-28T16:00:00+05:30",
    dateLabel: "Saturday, 28 November 2026",
    timeLabel: "4:00 PM",
    venue: VENUE.name,
    address: VENUE.full,
    description:
      "Good people make good moments better. Join us for an evening of celebration, dinner and dance as we begin our new journey together.",
    dressCode: "Formal / Indo-Western",
    theme: "reception",
    image: "/reference/assets/current-62d344ffd89e.jpg",
    mapUrl: VENUE.mapUrl,
    enabled: true,
    sortOrder: 4,
  },
];

export const STORY_SEED = [
  {
    title: "How We Met",
    dateLabel: "",
    description:
      "A simple hello turned into a beautiful journey. Some meetings are written in the stars — ours was one of them.",
    photo: "/reference/assets/current-453f66ec8adf.jpg",
    sortOrder: 1,
  },
  {
    title: "Growing Together",
    dateLabel: "",
    description:
      "Through every moment, we found a stronger us. Laughter, dreams and a thousand little memories stitched us closer.",
    photo: "/reference/assets/current-f2081c44f71c.jpg",
    sortOrder: 2,
  },
  {
    title: "Forever Begins",
    dateLabel: "",
    description:
      "Now we're ready for our next chapter — and we want you beside us as it begins.",
    photo: "/reference/assets/current-929a30786e02.jpg",
    sortOrder: 3,
  },
];

export const GALLERY_SEED: { src: string; caption: string }[] = [
  { src: "/reference/assets/current-a2b48e5206c6.jpeg", caption: "Rupesh" },
  { src: "/reference/assets/current-d2442b9cc1f2.png", caption: "Usha" },
  { src: "/reference/assets/current-19a7ba2fa9e4.jpg", caption: "Together" },
  { src: "/reference/assets/current-0de6b0878e02.jpg", caption: "Blessed moments" },
  { src: "/reference/assets/current-6def8ed83b4f.jpg", caption: "Us" },
  { src: "/reference/assets/63fcd668c5.jpg", caption: "The Groom" },
  { src: "/assets/samples/venue.webp", caption: "The Venue" },
  { src: "/reference/assets/current-f6bc9164f3cb.jpg", caption: "On the road" },
  { src: "/reference/assets/current-790bf5cdb0ad.jpg", caption: "The Bride" },
  { src: "/assets/samples/bride.webp", caption: "Getting Ready" },
  { src: "/reference/assets/current-401929c9b24e.jpg", caption: "Memories" },
];

export const THEME_STYLES: Record<
  WeddingEvent["theme"],
  { gradient: string; accent: string; soft: string }
> = {
  haldi: {
    gradient: "from-amber-300 via-yellow-200 to-amber-100",
    accent: "#E8A020",
    soft: "#fef6dd",
  },
  mehendi: {
    gradient: "from-emerald-300 via-green-200 to-emerald-100",
    accent: "#2E7D4F",
    soft: "#e3f4ea",
  },
  wedding: {
    gradient: "from-rose-300 via-red-200 to-rose-100",
    accent: "#8D1730",
    soft: "#fbe9ec",
  },
  reception: {
    gradient: "from-sky-300 via-blue-200 to-indigo-100",
    accent: "#2A4A7F",
    soft: "#e8eef7",
  },
};
