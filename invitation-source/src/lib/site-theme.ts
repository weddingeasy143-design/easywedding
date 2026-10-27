// src/lib/site-theme.ts — client-safe theme constants (no server imports).
// The server module src/server/wedding/site-config.ts re-exports these.

export const THEME_KEYS = [
  "maroon",
  "maroonDeep",
  "gold",
  "goldLight",
  "goldDeep",
  "ivory",
  "cream",
  "bark",
  "barkSoft",
] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];
export type ThemeColors = Record<ThemeKey, string>;

export const THEME_LABELS: Record<ThemeKey, string> = {
  maroon: "Maroon (primary)",
  maroonDeep: "Maroon deep (shading)",
  gold: "Gold (accents)",
  goldLight: "Gold light (highlights)",
  goldDeep: "Gold deep (borders)",
  ivory: "Ivory (background)",
  cream: "Cream (cards)",
  bark: "Bark (body text)",
  barkSoft: "Bark soft (muted text)",
};

/** Maps theme keys to the Tailwind v4 @theme CSS variable names. */
export const THEME_CSS_VARS: Record<ThemeKey, string> = {
  maroon: "--color-maroon",
  maroonDeep: "--color-maroon-deep",
  gold: "--color-gold",
  goldLight: "--color-gold-light",
  goldDeep: "--color-gold-deep",
  ivory: "--color-ivory",
  cream: "--color-cream",
  bark: "--color-bark",
  barkSoft: "--color-bark-soft",
};

export const DEFAULT_THEME: ThemeColors = {
  maroon: "#8d1730",
  maroonDeep: "#6d1025",
  gold: "#c99a3d",
  goldLight: "#e8c876",
  goldDeep: "#a67c2a",
  ivory: "#fff7e8",
  cream: "#fdf3dd",
  bark: "#5e2f21",
  barkSoft: "#8a5240",
};

export const THEME_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
}> = [
  {
    id: "royal-red",
    name: "Royal Red",
    description: "Classic maroon & gold (default)",
    colors: { ...DEFAULT_THEME },
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Deep green & champagne gold",
    colors: {
      maroon: "#0f5c46",
      maroonDeep: "#0a4434",
      gold: "#c9a24a",
      goldLight: "#eed48a",
      goldDeep: "#a5812f",
      ivory: "#f7f6ea",
      cream: "#fdfbe9",
      bark: "#2e3a2c",
      barkSoft: "#4c5a48",
    },
  },
  {
    id: "royal-blue",
    name: "Royal Blue",
    description: "Midnight blue & antique gold",
    colors: {
      maroon: "#1f3a5f",
      maroonDeep: "#152a47",
      gold: "#c99a3d",
      goldLight: "#e8c876",
      goldDeep: "#a67c2a",
      ivory: "#f2f5fa",
      cream: "#fafcff",
      bark: "#232c3d",
      barkSoft: "#3d4a61",
    },
  },
  {
    id: "blush-rose",
    name: "Blush Rose",
    description: "Soft rose & warm gold",
    colors: {
      maroon: "#a13d5c",
      maroonDeep: "#7d2c46",
      gold: "#c99a5e",
      goldLight: "#f0d3a0",
      goldDeep: "#a5763a",
      ivory: "#fdf6f0",
      cream: "#fffaf5",
      bark: "#4a2c33",
      barkSoft: "#6e4a52",
    },
  },
];
