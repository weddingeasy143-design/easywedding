// src/components/wedding/decor/FloralCorners.tsx
// Floral corner clusters — MODERN RESPONSIVE: proportional sizing.
// Flowers scale as % of container width, so they look IDENTICAL
// (proportionally) on mobile, laptop, desktop, landscape & portrait.
// No breakpoints = no inconsistency. Never overlaps content (z-index
// below card content, positioned at extreme corners with safe insets).
"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

interface FloralCornersProps {
  className?: string;
  /** "all" = 4 corners, "top" = top-left + top-right only */
  variant?: "all" | "top";
  /**
   * Size as % of container width (default 24).
   * Proportional = consistent on every device & orientation.
   */
  sizePct?: number;
  /** Legacy: Tailwind size classes (e.g. "w-32 sm:w-44") — overrides sizePct */
  size?: string;
  opacity?: number;
}

export default function FloralCorners({
  className,
  variant = "all",
  sizePct = 24,
  size,
  opacity = 1,
}: FloralCornersProps) {
  // Proportional size: % of container, clamped for sanity.
  // Legacy `size` prop (Tailwind classes) takes precedence when provided.
  const sizeStyle = size
    ? ({ opacity } as const)
    : ({
        width: `clamp(72px, ${sizePct}%, 220px)`,
        height: "auto",
        opacity,
      } as const);
  const sizeClass = size ?? "";

  const base = "pointer-events-none absolute select-none";
  // Flowers sit BEHIND card content (z-0) but ABOVE card background.
  // Card content should have relative z-10 to stay on top.
  const zBase = "z-0";

  const maskTL = {
    WebkitMaskImage: "radial-gradient(circle at 0% 0%, black 52%, transparent 88%)",
    maskImage: "radial-gradient(circle at 0% 0%, black 52%, transparent 88%)",
  } as const;
  const maskTR = {
    WebkitMaskImage: "radial-gradient(circle at 100% 0%, black 52%, transparent 88%)",
    maskImage: "radial-gradient(circle at 100% 0%, black 52%, transparent 88%)",
  } as const;
  const maskBL = {
    WebkitMaskImage: "radial-gradient(circle at 0% 100%, black 52%, transparent 88%)",
    maskImage: "radial-gradient(circle at 0% 100%, black 52%, transparent 88%)",
  } as const;
  const maskBR = {
    WebkitMaskImage: "radial-gradient(circle at 100% 100%, black 52%, transparent 88%)",
    maskImage: "radial-gradient(circle at 100% 100%, black 52%, transparent 88%)",
  } as const;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <Image
        src="/ornaments/floral-corner.webp"
        alt=""
        width={900}
        height={600}
        className={cn(base, zBase, "left-0 top-0", sizeClass)}
        style={{ ...sizeStyle, ...maskTL }}
      />
      <Image
        src="/ornaments/floral-corner.webp"
        alt=""
        width={900}
        height={600}
        className={cn(base, zBase, "right-0 top-0 -scale-x-100", sizeClass)}
        style={{ ...sizeStyle, ...maskTR }}
      />
      {variant === "all" && (
        <>
          <Image
            src="/ornaments/floral-corner.webp"
            alt=""
            width={900}
            height={600}
            className={cn(base, zBase, "bottom-0 left-0 -scale-y-100", sizeClass)}
            style={{ ...sizeStyle, ...maskBL }}
          />
          <Image
            src="/ornaments/floral-corner.webp"
            alt=""
            width={900}
            height={600}
            className={cn(base, zBase, "bottom-0 right-0 -scale-100", sizeClass)}
            style={{ ...sizeStyle, ...maskBR }}
          />
        </>
      )}
    </div>
  );
}
