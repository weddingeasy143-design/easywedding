// src/components/wedding/decor/HangingBells.tsx
// Hanging brass bells + lanterns strip for the top of screens/sections.
"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

export default function HangingBells({
  className,
  blendTo = "#fff7e8",
}: {
  className?: string;
  /** background color to blend the strip bottom into */
  blendTo?: string;
}) {
  return (
    <div
      className={cn("pointer-events-none relative w-full overflow-hidden", className)}
      aria-hidden
    >
      <Image
        src="/ornaments/hanging-bells.webp"
        alt=""
        width={1400}
        height={466}
        className="h-auto w-full object-cover object-top"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-10"
        style={{
          background: `linear-gradient(to bottom, transparent, ${blendTo})`,
        }}
      />
    </div>
  );
}
