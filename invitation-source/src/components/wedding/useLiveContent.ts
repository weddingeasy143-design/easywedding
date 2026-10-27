// src/components/wedding/useLiveContent.ts
// Client hook: fetch live DB-backed content for the public site.
// /api/wedding is force-dynamic (always fresh) and already merges DB rows
// with seed fallbacks server-side, so admin edits appear on the next page
// load with no cache delay. Falls back to seeds if the fetch fails.
"use client";

import { useEffect, useState } from "react";
import {
  EVENTS,
  GALLERY_SEED,
  STORY_SEED,
  type WeddingEvent,
} from "@/content/wedding";

export interface LiveGalleryItem {
  id: string;
  src: string;
  caption: string | null;
  isCover: boolean;
  focus: string;
  fit?: "cover" | "contain";
}

export interface LiveStoryEntry {
  id: string;
  title: string;
  dateLabel: string | null;
  description: string;
  photo: string | null;
  photoFit?: "cover" | "contain";
  sortOrder: number;
}

export interface LiveContent {
  events: WeddingEvent[];
  gallery: LiveGalleryItem[];
  story: LiveStoryEntry[];
}

// Easy Wedding snapshots already contain the complete source content. Reading
// them immediately prevents old seed photographs flashing before personalization.
export function useLiveContent(): LiveContent {
  return (window as any).__easyWedding.wedding;
}
