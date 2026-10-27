// src/lib/site-fonts.ts — client-safe font options (no server imports).
// Curated Google Fonts for an Indian wedding invitation: elegant scripts,
// royal serifs and clean body fonts — the styles you see on Instagram,
// Facebook and YouTube wedding posts.

export const FONT_ROLES = ["script", "display", "body"] as const;
export type FontRole = (typeof FONT_ROLES)[number];

export interface FontOption {
  /** Google Fonts family name, e.g. "Allura". */
  id: string;
  /** Weight(s) to request from Google Fonts. */
  weights: string;
}

export const FONT_ROLE_LABELS: Record<FontRole, string> = {
  script: "Script (names & big headings)",
  display: "Display (section headings)",
  body: "Body (paragraphs & labels)",
};

export const SCRIPT_FONTS: FontOption[] = [
  { id: "Great Vibes", weights: "400" },
  { id: "Allura", weights: "400" },
  { id: "Parisienne", weights: "400" },
  { id: "Pinyon Script", weights: "400" },
  { id: "Dancing Script", weights: "400;500;600;700" },
  { id: "Sacramento", weights: "400" },
  { id: "Tangerine", weights: "400;700" },
  { id: "Alex Brush", weights: "400" },
  { id: "Italianno", weights: "400" },
  { id: "Rouge Script", weights: "400" },
];

export const DISPLAY_FONTS: FontOption[] = [
  { id: "Cormorant Garamond", weights: "400;500;600;700" },
  { id: "Playfair Display", weights: "400;500;600;700" },
  { id: "Cinzel Decorative", weights: "400;700;900" },
  { id: "Marcellus", weights: "400" },
  { id: "Cormorant", weights: "400;500;600;700" },
  { id: "EB Garamond", weights: "400;500;600;700" },
  { id: "Fraunces", weights: "400;500;600;700" },
  { id: "Prata", weights: "400" },
];

export const BODY_FONTS: FontOption[] = [
  { id: "Inter", weights: "400;500;600;700" },
  { id: "Jost", weights: "400;500;600" },
  { id: "Montserrat", weights: "400;500;600;700" },
  { id: "Poppins", weights: "400;500;600" },
  { id: "Nunito Sans", weights: "400;600;700" },
  { id: "Quicksand", weights: "400;500;600;700" },
  { id: "Mulish", weights: "400;500;600;700" },
];

export const FONT_OPTIONS: Record<FontRole, FontOption[]> = {
  script: SCRIPT_FONTS,
  display: DISPLAY_FONTS,
  body: BODY_FONTS,
};

export type SiteFonts = Record<FontRole, string>;

export const DEFAULT_FONTS: SiteFonts = {
  script: "Great Vibes",
  display: "Cormorant Garamond",
  body: "Inter",
};

/** Fallback stacks appended after the chosen family (self-hosted next/font). */
const FALLBACKS: Record<FontRole, string> = {
  script: '"Great Vibes", "Allura", cursive',
  display: '"Cormorant Garamond", "Playfair Display", serif',
  body: '"Inter", "Montserrat", ui-sans-serif, system-ui, sans-serif',
};

/** CSS font-family value for a role, e.g. `"Allura", "Great Vibes", "Allura", cursive`. */
export function fontFamilyCss(role: FontRole, family: string): string {
  const safe = family.replace(/[";]/g, "");
  return `"${safe}", ${FALLBACKS[role]}`;
}

/** Build the Google Fonts stylesheet URL for the selected families. */
export function googleFontsUrl(fonts: SiteFonts): string {
  const opt = (role: FontRole): FontOption | undefined =>
    FONT_OPTIONS[role].find((f) => f.id === fonts[role]);
  const parts = (Object.keys(FONT_OPTIONS) as FontRole[]).map((role) => {
    const o = opt(role);
    const fam = (o?.id ?? DEFAULT_FONTS[role]).replace(/ /g, "+");
    const w = o?.weights ?? "400";
    return `family=${fam}:wght@${w}`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

/** Validate a stored family name; fall back to the default when unknown. */
export function sanitizeFonts(raw: unknown): SiteFonts {
  const out: SiteFonts = { ...DEFAULT_FONTS };
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    for (const role of FONT_ROLES) {
      const v = r[role];
      if (
        typeof v === "string" &&
        FONT_OPTIONS[role].some((f) => f.id === v.trim())
      ) {
        out[role] = v.trim();
      }
    }
  }
  return out;
}
