import {useMotionPreference} from "../../../adapters/motion-preference";
// src/components/wedding/GaneshIdol.tsx
// Divine 3D Ganesh idol — GRAND sequenced entrance (trending wedding card style):
// Phase 1: idol emerges small + blurred with a divine light burst ring.
// Phase 2: settles at top with 3D depth — gentle perspective tilt sway,
// floating, halo glow pulse, twinkling sparkles, light-sheen sweep.
// The parent delays all text until this entrance completes.
"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { SparkleIcon } from "./icons";

const EASE = [0.22, 1, 0.36, 1] as const;

/** grand entrance: emerge from light — small/blurred → full divine presence */
const entrance = {
  hidden: { opacity: 0, scale: 0.45, filter: "blur(18px)", y: 26 },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 1.7, ease: EASE },
  },
} as const;

export default function GaneshIdol({ className = "" }: { className?: string }) {
  const reduce = useMotionPreference() ?? false;

  const sparks = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        left: `${6 + ((i * 47) % 88)}%`,
        top: `${4 + ((i * 37) % 90)}%`,
        size: 9 + ((i * 5) % 8),
        delay: 1.6 + ((i * 0.8) % 3.4),
        dur: 2.4 + ((i * 7) % 18) / 10,
      })),
    []
  );

  return (
    <div
      className={`relative ${className}`}
      aria-label="Lord Ganesha"
      style={{ perspective: 800 }}
    >
      {/* divine light-burst ring on entrance */}
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold-light/70"
          aria-hidden
          initial={{ opacity: 0.9, scale: 0.3 }}
          animate={{ opacity: 0, scale: 2.6 }}
          transition={{ duration: 1.8, delay: 0.35, ease: "easeOut" }}
        />
      )}

      {/* divine halo glow behind the idol */}
      <motion.div
        className="pointer-events-none absolute -inset-8 rounded-full"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle, rgba(255,205,110,0.6) 0%, rgba(255,190,90,0.25) 48%, transparent 72%)",
        }}
        initial={{ opacity: 0 }}
        animate={
          reduce
            ? { opacity: 0.8 }
            : { opacity: [0, 0.85, 0.6, 1, 0.75] }
        }
        transition={{ duration: reduce ? 0 : 2.2, delay: reduce ? 0 : 0.4 }}
      />
      {/* ...then infinite gentle pulse once settled */}
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute -inset-8 rounded-full"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle, rgba(255,205,110,0.5) 0%, rgba(255,190,90,0.2) 48%, transparent 72%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3.6, repeat: reduce ? 0 : Infinity, ease: "easeInOut", delay: 2.4 }}
        />
      )}

      {/* entrance wrapper */}
      <motion.div
        className="relative h-full w-full"
        variants={entrance}
        initial={reduce ? "show" : "hidden"}
        animate="show"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* 3D presence: gentle perspective tilt sway + float (trending card depth) */}
        <motion.div
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={
            reduce
              ? undefined
              : {
                  y: [0, -7, 0],
                  rotateX: [0, 4, 0, -4, 0],
                  rotateY: [0, -5, 0, 5, 0],
                }
          }
          transition={{ duration: 7, repeat: reduce ? 0 : Infinity, ease: "easeInOut", delay: 2.2 }}
        >
          {/* celestial fade — soft edges melt into the card, no hard crop */}
          <div
            className="relative h-full w-full overflow-hidden"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 72% 62% at 50% 44%, black 58%, transparent 78%)",
              maskImage:
                "radial-gradient(ellipse 72% 62% at 50% 44%, black 58%, transparent 78%)",
              transform: "translateZ(36px)",
            }}
          >
            <Image
              src="/ornaments/ganesh-divine.webp"
              alt="Lord Ganesha"
              fill
              className="object-cover object-top"
              priority
              sizes="180px"
            />
            {/* slow light-sheen sweep across the idol */}
            {!reduce && (
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
              >
                <div className="idol-sheen absolute inset-y-[-20%] left-0 w-1/3 bg-gradient-to-r from-transparent via-[rgba(255,244,214,0.32)] to-transparent" />
              </div>
            )}
          </div>
          {/* 3D drop shadow beneath for depth */}
          <div
            className="pointer-events-none absolute -bottom-3 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-[100%] bg-[#5b2a12]/25 blur-md"
            aria-hidden
            style={{ transform: "translateZ(-20px)" }}
          />
        </motion.div>
      </motion.div>

      {/* twinkling sparkles around the idol (start after entrance) */}
      {!reduce &&
        sparks.map((s, i) => (
          <span
            key={i}
            className="twinkle-star pointer-events-none absolute text-[#e9c46a]"
            aria-hidden
            style={{
              left: s.left,
              top: s.top,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          >
            <SparkleIcon size={s.size} />
          </span>
        ))}
    </div>
  );
}
