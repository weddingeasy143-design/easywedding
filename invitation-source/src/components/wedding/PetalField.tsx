// src/components/wedding/PetalField.tsx
// Falling petal layer using the .petal utility from globals.css.
// Renders ~count petals with randomized position/size/duration/drift.
"use client";

import { useMemo } from "react";

const PETAL_COLORS: Record<string, string[]> = {
  rose: [
    "radial-gradient(ellipse at 30% 30%, #ffd9e3 0%, #f7a8bc 55%, #e8789a 100%)",
    "radial-gradient(ellipse at 30% 30%, #ffe9b8 0%, #f5c86e 55%, #d99a35 100%)",
    "radial-gradient(ellipse at 30% 30%, #fff3f6 0%, #f9c9d4 60%, #eda9ba 100%)",
  ],
  // barat / Indian wedding — marigold, deep orange, festive red-gold
  marigold: [
    "radial-gradient(ellipse at 30% 30%, #ffe066 0%, #fab005 55%, #e67700 100%)",
    "radial-gradient(ellipse at 30% 30%, #ffa94d 0%, #f76707 55%, #d9480f 100%)",
    "radial-gradient(ellipse at 30% 30%, #ff8787 0%, #e03131 55%, #a61e4d 100%)",
    "radial-gradient(ellipse at 30% 30%, #fff3bf 0%, #ffd43b 60%, #f08c00 100%)",
  ],
};

interface PetalSpec {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  color: string;
}

export default function PetalField({
  count = 14,
  className,
  palette = "rose",
}: {
  count?: number;
  className?: string;
  palette?: keyof typeof PETAL_COLORS;
}) {
  const colors = PETAL_COLORS[palette] ?? PETAL_COLORS.rose;
  const petals = useMemo<PetalSpec[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 97.3 + 13) % 100,
        size: 10 + ((i * 37) % 14),
        duration: 9 + ((i * 53) % 80) / 10,
        delay: -((i * 61) % 120) / 10,
        drift: ((i * 29) % 20) - 10,
        color: colors[i % colors.length]!,
      })),
    [count, colors]
  );

  return (
    <div className={className} aria-hidden>
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.78,
            borderRadius: "62% 4% 62% 4%",
            background: p.color,
            boxShadow: "0 1px 3px rgba(141,23,48,.18)",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ["--petal-drift" as string]: `${p.drift}vw`,
          }}
        />
      ))}
    </div>
  );
}
