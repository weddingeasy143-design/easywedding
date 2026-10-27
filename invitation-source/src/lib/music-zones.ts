// src/lib/music-zones.ts
// Canonical music zones for the dynamic wedding music system.
// Each zone maps to one or more existing section element IDs on the page.
// The "opening" zone is special: it covers the pre-scroll opening sequence
// (Ganesh / curtain / doors), which has no scrollable section element.

export interface MusicZoneDef {
  id: string;
  /** Display name in admin */
  label: string;
  /** Section element IDs observed for this zone (first match wins) */
  sectionIds: string[];
  /** Mood reference for the user (from their brief — pick matching audio) */
  mood: string;
  /** Display-only recommended clip length, e.g. "10–20 seconds" */
  recommendedLength: string;
}

export const MUSIC_ZONES: MusicZoneDef[] = [
  {
    id: "opening",
    label: "Opening / Ganesh Ji",
    sectionIds: [],
    mood: "Divine Indian wedding instrumental — temple bells + flute + light shehnai. Calm, auspicious. No vocals.",
    recommendedLength: "10–20 seconds",
  },
  {
    id: "family",
    label: "Family Intro",
    sectionIds: ["family"],
    mood: "Soft elegant Indian instrumental — flute + light strings. Warm welcome.",
    recommendedLength: "20–40 seconds",
  },
  {
    id: "hero",
    label: "Hero / Couple Names",
    sectionIds: ["home"],
    mood: "Royal Indian wedding instrumental — soft shehnai + strings + cinematic rise. Elegant. No vocals.",
    recommendedLength: "10–20 seconds",
  },
  {
    id: "invitation",
    label: "Invitation Card",
    sectionIds: ["invitation"],
    mood: "Royal Indian wedding instrumental — soft shehnai + strings. Elegant. No vocals.",
    recommendedLength: "10–20 seconds",
  },
  {
    id: "story",
    label: "Our Story",
    sectionIds: ["story"],
    mood: "Romantic cinematic instrumental — soft piano + flute + strings. Warm and emotional. No vocals.",
    recommendedLength: "20–40 seconds",
  },
  {
    id: "events",
    label: "Events / Timeline",
    sectionIds: ["events", "timeline"],
    mood: "Festive Indian wedding instrumental — dholak + light percussion + shehnai. Happy but not loud. No vocals.",
    recommendedLength: "20–40 seconds",
  },
  {
    id: "venue",
    label: "Venue",
    sectionIds: ["venue"],
    mood: "Soft elegant Indian instrumental — flute + light strings. Keep volume lower. No vocals.",
    recommendedLength: "20–40 seconds",
  },
  {
    id: "gallery",
    label: "Gallery / Videos",
    sectionIds: ["gallery", "video"],
    mood: "Emotional romantic instrumental — piano + flute + cinematic strings. No vocals.",
    recommendedLength: "20–40 seconds",
  },
  {
    id: "rsvp",
    label: "RSVP / Blessings",
    sectionIds: ["rsvp", "blessings", "share"],
    mood: "Warm peaceful instrumental — soft flute/piano. No vocals.",
    recommendedLength: "20–40 seconds",
  },
  {
    id: "thankyou",
    label: "Thank You",
    sectionIds: ["thankyou"],
    mood: "Emotional wedding outro — piano + strings + soft Indian flute. Slow cinematic ending. No vocals.",
    recommendedLength: "20–40 seconds",
  },
];

/** Per-zone audio configuration (admin-editable, stored in wedding_config). */
export interface SectionMusicConfig {
  audioUrl: string; // Blob URL / https URL. "" = none assigned
  volume: number; // 0..1
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  loop: boolean;
  enabled: boolean;
  trimStart: number; // seconds — 0 = from the very beginning
  trimEnd: number; // seconds — 0 = till the very end
}

export const DEFAULT_ZONE_CONFIG: SectionMusicConfig = {
  audioUrl: "",
  volume: 0.7,
  fadeIn: 2.5,
  fadeOut: 2.5,
  loop: true,
  enabled: true,
  trimStart: 0,
  trimEnd: 0,
};

/** Built-in royalty-free fallbacks (used only when a zone has no upload). */
export const BUILTIN_FALLBACKS: Record<string, string> = {
  opening: "/music/ganesh-aarti.mp3",
  hero: "/music/wedding-celebration.mp3",
  invitation: "/music/wedding-celebration.mp3",
  family: "/music/wedding-celebration.mp3",
  story: "/music/wedding-celebration.mp3",
  events: "/music/wedding-celebration.mp3",
  venue: "/music/wedding-celebration.mp3",
  gallery: "/music/wedding-celebration.mp3",
  rsvp: "/music/wedding-celebration.mp3",
  thankyou: "/music/wedding-celebration.mp3",
};
