// src/components/wedding/OpeningPreloader.tsx
// Aggressively preload ALL opening sequence images via JavaScript.
// Runs immediately on page load — guarantees images are in memory+decoded
// before the user reaches each stage. No stutter, even for first-time users.
"use client";

import { useEffect } from "react";

const OPENING_IMAGES = [
  "/ornaments/ganesh/base.webp",
  "/ornaments/opening-realistic.webp",
  "/ornaments/royal-door-bg.webp",
  "/ornaments/palace-night.webp",
];

// Main site hero images — preloaded during opening so "Open Invitation"
// reveals the main site instantly with zero jerk or loading flash
const MAIN_SITE_IMAGES = [
  "/photos/159504_11_ahh7.jpg",
  "/photos/159506_9_wx3k.jpg",
];

export default function OpeningPreloader() {
  useEffect(() => {
    // Preload with high priority — decode images so animations never stutter
    const preload = (src: string) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      // Force decode so it's ready in GPU memory
      img.decode?.().catch(() => {});
    };
    OPENING_IMAGES.forEach(preload);
    // Stagger main-site preload slightly so opening images win the race
    const t = setTimeout(() => MAIN_SITE_IMAGES.forEach(preload), 1500);
    return () => clearTimeout(t);
  }, []);

  return null;
}
