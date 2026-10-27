// src/components/wedding/decor/RoyalFrame.tsx
// Ornate golden frame: double gold border + SVG corner flourishes + inner glow.
// Wrap any card/screen content to give it the dense royal reference look.
"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Single ornamental corner flourish (SVG filigree). */
export function CornerFlourish({
  className = "",
  size = 64,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      width={size}
      height={size}
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d="M4 92 V34 Q4 4 34 4 H92"
        stroke="url(#rfGold)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M12 92 V38 Q12 12 38 12 H92"
        stroke="#c99a3d"
        strokeWidth="1.2"
        opacity="0.7"
      />
      {/* filigree curls */}
      <path
        d="M20 60 Q20 44 36 44 Q48 44 48 32 Q48 22 40 20"
        stroke="#c99a3d"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M60 20 Q44 20 44 36 Q44 48 32 48 Q22 48 20 56"
        stroke="#c99a3d"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="20" cy="72" r="3.2" fill="#c99a3d" opacity="0.9" />
      <circle cx="72" cy="20" r="3.2" fill="#c99a3d" opacity="0.9" />
      <path d="M4 92 L16 80 M92 4 L80 16" stroke="#e8c876" strokeWidth="2.4" strokeLinecap="round" />
      <defs>
        <linearGradient id="rfGold" x1="0" y1="96" x2="96" y2="0">
          <stop offset="0" stopColor="#a67c2a" />
          <stop offset="0.5" stopColor="#e8c876" />
          <stop offset="1" stopColor="#a67c2a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface RoyalFrameProps {
  children: ReactNode;
  className?: string;
  /** corner flourish size in px */
  corners?: number;
  /** show the outer double border */
  border?: boolean;
}

/**
 * Wraps content in an ornate royal frame.
 * - outer: double gold border with soft glow
 * - 4 corner flourishes (SVG filigree)
 * - subtle warm inner tint
 */
export default function RoyalFrame({
  children,
  className,
  corners = 64,
  border = true,
}: RoyalFrameProps) {
  return (
    <div
      className={cn(
        "relative",
        border &&
          "border border-[#c99a3d]/70 shadow-[0_18px_50px_-20px_rgba(109,16,37,0.45)]",
        className
      )}
    >
      {border && (
        <div
          className="pointer-events-none absolute inset-[5px] border border-[#c99a3d]/35"
          aria-hidden
        />
      )}
      <CornerFlourish
        size={corners}
        className="pointer-events-none absolute -left-2 -top-2 z-10"
      />
      <CornerFlourish
        size={corners}
        className="pointer-events-none absolute -right-2 -top-2 z-10 rotate-90"
      />
      <CornerFlourish
        size={corners}
        className="pointer-events-none absolute -bottom-2 -right-2 z-10 rotate-180"
      />
      <CornerFlourish
        size={corners}
        className="pointer-events-none absolute -bottom-2 -left-2 z-10 -rotate-90"
      />
      {children}
    </div>
  );
}
