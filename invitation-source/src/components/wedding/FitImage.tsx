// src/components/wedding/FitImage.tsx
// Beautiful "fit" image: sharp full photo on top of a blurred,
// scaled-up copy of itself filling the empty space (no ugly letterbox).

"use client";

import Image from "next/image";

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
  return (
    <div className={`relative overflow-hidden ${className}`}>
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
        className={`relative h-full w-full object-contain ${imgClassName}`}
      />
    </div>
  );
}
