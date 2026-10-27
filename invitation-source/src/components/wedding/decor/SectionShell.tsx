// src/components/wedding/decor/SectionShell.tsx
// Royal section wrapper: warm ivory with subtle paper texture, gold ornament
// borders top + bottom, optional floral corners — the dense royal reference look.
"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import FloralCorners from "./FloralCorners";
import { GoldFlourishDivider } from "../Ornaments";

interface SectionShellProps {
  children: ReactNode;
  id?: string;
  className?: string;
  innerClassName?: string;
  /** show floral corners */
  floral?: boolean;
  /** gold flourish divider at top of section */
  topOrnament?: boolean;
  /** gold flourish divider at bottom of section */
  bottomOrnament?: boolean;
  /** alternate ivory-deep background band */
  band?: boolean;
}

export default function SectionShell({
  children,
  id,
  className,
  innerClassName,
  floral = true,
  topOrnament = false,
  bottomOrnament = false,
  band = false,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "paper-grain relative scroll-mt-20 overflow-hidden py-16 sm:py-20",
        band && "bg-ivory-deep/70",
        className
      )}
    >
      {/* warm vignette so sections feel rich, not flat */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 40%, rgba(232,200,118,0.10) 0%, transparent 70%)",
        }}
      />
      {floral && <FloralCorners variant="top" sizePct={20} opacity={0.95} />}
      <div className={cn("relative mx-auto max-w-5xl px-5 sm:px-8 lg:max-w-7xl lg:px-12", innerClassName)}>
        {topOrnament && (
          <GoldFlourishDivider className="mx-auto mb-8 max-w-[220px]" />
        )}
        {children}
        {bottomOrnament && (
          <GoldFlourishDivider className="mx-auto mt-10 max-w-[220px]" />
        )}
      </div>
    </section>
  );
}
