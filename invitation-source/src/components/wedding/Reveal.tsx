import {useMotionPreference} from "../../../adapters/motion-preference";
// src/components/wedding/Reveal.tsx
// Scroll-reveal wrapper built on framer-motion (honours prefers-reduced-motion
// via globals.css .reveal fallback classes as well).
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const reduce = useMotionPreference();
  const profile=(window as any).__easyWedding.motion;
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : profile.enter(y)}
      whileInView={profile.shown}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: reduce ? 0.15 : 0.6, delay: reduce ? 0 : Math.min(delay,0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
