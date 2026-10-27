// src/lib/music.ts
// Compatibility layer over the dynamic section-wise music engine
// (src/lib/dynamic-music.ts). Keeps the original public API so existing
// callers (MusicControl, OpeningSequence, page.tsx) work unchanged.
//
// New behaviour:
//  - startMusic() begins the "opening" (Ganesh) zone on first user gesture.
//  - celebrationTime() switches to scroll-driven section music (observers).
//  - Crossfades between zones are seamless (no hard cuts).
//  - toggleMusic() / stopMusic() keep the global Music ON/OFF control.

import { dynamicMusic } from "./dynamic-music";
import { BUILTIN_FALLBACKS } from "./music-zones";

export type TrackId = "aarti" | "wedding";

/** Back-compat export: effective URLs (custom when configured). */
export const TRACKS: Record<TrackId, string> = {
  get aarti() {
    return BUILTIN_FALLBACKS.opening;
  },
  get wedding() {
    return BUILTIN_FALLBACKS.hero;
  },
};

export function isMusicOn(): boolean {
  return dynamicMusic.isOn();
}

export function getDesiredTrack(): TrackId {
  return "wedding";
}

/**
 * Start music. Safe to call before any user gesture — playback begins on
 * the first tap if autoplay blocks it. Plays the "opening" zone.
 */
export function startMusic(_track?: TrackId): void {
  if((window as any).__easyWedding?.musicEnabled)void dynamicMusic.begin();
}

/**
 * The celebration begins (main doors opening). Switches from the fixed
 * opening zone to scroll-driven section music with seamless crossfade.
 * Respects the user's off choice.
 */
export function celebrationTime(): void {
  if (!dynamicMusic.isOn()) return;
  dynamicMusic.enterScrollMode();
}

/** Toggle from the floating control. */
export function toggleMusic(): boolean {
  const wasPlaying = dynamicMusic.isPlaying();
  void dynamicMusic.toggle();
  return !wasPlaying;
}

/** Full stop + reset (Replay Invitation). */
export function stopMusic(): void {
  dynamicMusic.reset();
}

export function subscribeMusic(fn: (on: boolean) => void): () => void {
  return dynamicMusic.subscribe(fn);
}

/** Legacy: switch track directly (mapped to a zone). */
export function setTrack(id: TrackId): void {
  void dynamicMusic.playZone(id === "aarti" ? "opening" : "hero");
}
