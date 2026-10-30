// src/components/wedding/VideoSection.tsx
// The invitation film is injected by the enhance layer (reference-enhance.js)
// only when the couple has actually added a film link. This component used to
// render a fake player — a still photo, a fixed "0:00 / 1:28" bar and a play
// button that only showed a "coming soon" toast — even when no film existed.
// It now renders nothing: a film section exists only when a real film exists.
"use client";

export default function VideoSection() {
  return null;
}
