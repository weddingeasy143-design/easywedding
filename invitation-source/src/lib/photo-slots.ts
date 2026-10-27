// src/lib/photo-slots.ts
// Central registry of every photo slot on the website.
// Each slot declares its display aspect ratio + recommended upload dimensions.
// Admin uploaders show "Recommended: W × H px" and the image editor
// defaults its crop frame to the slot's aspect ratio — so any uploaded
// photo can be fitted perfectly in one step.

export interface PhotoSlot {
  /** stable key, e.g. "couple.hero" */
  id: string;
  /** human label shown in admin */
  label: string;
  /** display aspect ratio w/h, e.g. 3/4 = 0.75 */
  ratio: number;
  /** ratio label, e.g. "3:4" */
  ratioLabel: string;
  /** recommended upload size in px */
  width: number;
  height: number;
}

export const PHOTO_SLOTS: Record<string, PhotoSlot> = {
  "couple.hero": {
    id: "couple.hero",
    label: "Hero photo (couple)",
    ratio: 9 / 16,
    ratioLabel: "9:16",
    width: 1080,
    height: 1920,
  },
  "couple.invitation": {
    id: "couple.invitation",
    label: "Invitation card photo",
    ratio: 3 / 4,
    ratioLabel: "3:4",
    width: 900,
    height: 1200,
  },
  "family.groom": {
    id: "family.groom",
    label: "Groom photo",
    ratio: 3 / 4,
    ratioLabel: "3:4",
    width: 900,
    height: 1200,
  },
  "family.bride": {
    id: "family.bride",
    label: "Bride photo",
    ratio: 3 / 4,
    ratioLabel: "3:4",
    width: 900,
    height: 1200,
  },
  "events.card": {
    id: "events.card",
    label: "Event card photo",
    ratio: 16 / 10,
    ratioLabel: "16:10",
    width: 1280,
    height: 800,
  },
  "story.photo": {
    id: "story.photo",
    label: "Story photo",
    ratio: 3 / 4,
    ratioLabel: "3:4",
    width: 900,
    height: 1200,
  },
  "venue.photo": {
    id: "venue.photo",
    label: "Venue photo",
    ratio: 16 / 10,
    ratioLabel: "16:10",
    width: 1280,
    height: 800,
  },
  "gallery.photo": {
    id: "gallery.photo",
    label: "Gallery photo",
    ratio: 4 / 3,
    ratioLabel: "4:3",
    width: 1200,
    height: 900,
  },
  "share.couple": {
    id: "share.couple",
    label: "Share section illustration",
    ratio: 4 / 5,
    ratioLabel: "4:5",
    width: 800,
    height: 1000,
  },
};

export function slotHint(id: string): string {
  const s = PHOTO_SLOTS[id];
  if (!s) return "";
  return `Recommended: ${s.width} × ${s.height} px (${s.ratioLabel})`;
}
