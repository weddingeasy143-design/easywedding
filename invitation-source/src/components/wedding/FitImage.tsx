// src/components/wedding/FitImage.tsx
// Beautiful "fit" image: sharp full photo on top of a blurred,
// scaled-up copy of itself filling the empty space (no ugly letterbox).

"use client";

import Image from "next/image";
import { useState } from "react";

export default function FitImage({
  src,
  alt,
  width,
  height,
  className = "",
  imgClassName = "",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  imgClassName?: string;
}) {
  /* The frame takes the photograph's own shape (within sane limits), so the
     whole photo fills it — never a small strip floating in a blur, and never
     cropped. Fixed-height slots (gallery stage) keep their frame. */
  const [ratio, setRatio] = useState<number | null>(null);
  const fixedHeight = className.includes("h-full");
  const style =
    !fixedHeight && ratio
      ? { aspectRatio: String(Math.min(1.8, Math.max(0.6, ratio))) }
      : undefined;
  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* blurred backdrop fills the empty space */}
      <Image
        src={src}
        alt=""
        aria-hidden
        width={width}
        height={height}
        loading="lazy"
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-[0.85] saturate-[1.2]"
      />
      {/* sharp full photo on top */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={(e) => {
          const t = e.currentTarget as unknown as HTMLImageElement;
          if (t?.naturalWidth && t?.naturalHeight)
            setRatio(t.naturalWidth / t.naturalHeight);
        }}
        className={`relative h-full w-full object-contain ${imgClassName}`}
      />
    </div>
  );
}
