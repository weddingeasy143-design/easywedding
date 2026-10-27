// src/components/wedding/Ornaments.tsx
// Reusable generated ornamental assets (Canva-grade artwork, REFERENCE LOCK).
// All decorative images sit on warm ivory (#FFF7E8) and blend with page bg.
// Text always stays real HTML — never baked into images.
"use client";

import Image from "next/image";

/** Full-width hanging floral toran for the top of screens/sections. */
export function GarlandTop({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none relative w-full overflow-hidden ${className}`} aria-hidden>
      <Image
        src="/ornaments/garland-toran.webp"
        alt=""
        width={1600}
        height={533}
        className="h-auto w-full object-cover object-top"
        priority={false}
      />
      {/* soft blend into page background */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-ivory" />
    </div>
  );
}

/** Golden filigree floral corners (top-left / top-right). */
export function FloralCorners({ className = "", sizePct = 22 }: { className?: string; sizePct?: number }) {
  const maskL = {
    WebkitMaskImage: "radial-gradient(circle at 0% 0%, black 52%, transparent 88%)",
    maskImage: "radial-gradient(circle at 0% 0%, black 52%, transparent 88%)",
  } as const;
  const maskR = {
    WebkitMaskImage: "radial-gradient(circle at 100% 0%, black 52%, transparent 88%)",
    maskImage: "radial-gradient(circle at 100% 0%, black 52%, transparent 88%)",
  } as const;
  return (
    <>
      <Image
        src="/ornaments/floral-corner.webp"
        alt=""
        width={900}
        height={600}
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 select-none ${className}`}
        style={{ ...maskL, width: `clamp(64px, ${sizePct}%, 200px)`, height: "auto" }}
      />
      <Image
        src="/ornaments/floral-corner.webp"
        alt=""
        width={900}
        height={600}
        aria-hidden
        className={`pointer-events-none absolute right-0 top-0 -scale-x-100 select-none ${className}`}
        style={{ ...maskR, width: `clamp(64px, ${sizePct}%, 200px)`, height: "auto" }}
      />
    </>
  );
}

/** Golden lotus flourish divider (image) — richer than the CSS divider. */
export function GoldFlourishDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`max-w-[280px] ${className}`} aria-hidden>
      <Image
        src="/ornaments/gold-divider-flourish.webp"
        alt=""
        width={900}
        height={300}
        className="h-auto w-full"
      />
    </div>
  );
}

/** Hanging brass bells + lanterns strip for section tops. */
export function BellsStrip({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none relative w-full overflow-hidden ${className}`} aria-hidden>
      <Image
        src="/ornaments/hanging-bells.webp"
        alt=""
        width={1400}
        height={466}
        className="h-auto w-full object-cover object-top"
      />
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-ivory" />
    </div>
  );
}
