import {useMotionPreference} from "../../../adapters/motion-preference";
import {copyText} from "../../../adapters/copy";
// src/components/wedding/RoyalOpening.tsx
// Screen 01 — photorealistic royal invitation, reference-faithful:
// ornate golden frame, abundant floral corners, 3D Ganesh idol, cinematic
// 2026-level entrance. Every word stays real HTML over the photo.
"use client";


import { useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { COUPLE, VENUE, WEDDING_DATE_LABEL, SITE_TEXTS } from "@/content/wedding";
import { useGuestName } from "@/lib/guest";

import GaneshIdol from "../../../adapters/Ganesh";
import { PinIcon, SparkleIcon } from "./icons";
import RoyalFrame from "./decor/RoyalFrame";
import FloralCorners from "./decor/FloralCorners";

/** ambient floating gold-dust particles */
function GoldDust({ reduce }: { reduce: boolean }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: `${(i * 61) % 100}%`,
        top: `${6 + ((i * 37) % 82)}%`,
        size: 3 + ((i * 7) % 4),
        dur: 5 + ((i * 13) % 7),
        delay: (i * 0.7) % 4,
      })),
    []
  );
  if (reduce) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-gold-light"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            boxShadow: "0 0 8px 2px rgba(232,200,118,0.55)",
          }}
          animate={{ y: [0, -46, 0], opacity: [0, 0.9, 0] }}
          transition={{
            duration: d.dur,
            delay: d.delay,
            repeat: reduce ? 0 : Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;

const stack: Variants = {
  hidden: {},
  // text begins only after Ganesh Ji's grand entrance completes (~2s)
  show: { transition: { staggerChildren: 0.16, delayChildren: 2.1 } },
};

const line: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.1, ease: EASE },
  },
};

// Date appears 2.5s after names — no blur, no flicker
const dateLine: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: EASE, delay: 2.5 },
  },
};

/** couple names draw in with a subtle letter-spacing settle */
const nameLine: Variants = {
  hidden: { opacity: 0, y: 16, letterSpacing: "0.06em" },
  show: {
    opacity: 1,
    y: 0,
    letterSpacing: "0em",
    transition: { duration: 1.2, ease: EASE },
  },
};

export default function RoyalOpening({ onOpen }: { onOpen: () => void }) {
  const reduce = useMotionPreference() ?? false;
  const guestName = useGuestName();


  // Preload door-reveal images so the gate animation never janks on first paint.
  useEffect(() => {
    for (const src of ["/ornaments/royal-door-bg.webp", "/ornaments/palace-night.webp"]) {
      const img = new window.Image();
      img.src = src;
    }
  }, []);
  const initialState = reduce ? "show" : "hidden";

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#2b120c]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      role="dialog"
      aria-label="Wedding invitation opening"
    >
      {/* photorealistic invitation backdrop — slow cinematic zoom-out */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        initial={
          reduce
            ? { scale: 1 }
            : { scale: 1.16, filter: "brightness(0.82) saturate(1.06)" }
        }
        animate={{ scale: 1, filter: "brightness(1) saturate(1)" }}
        transition={{ duration: reduce ? 0 : 2.6, ease: EASE }}
      >
        <Image
          src="/ornaments/opening-realistic.webp"
          alt=""
          fill
          className={`object-cover ${guestName && guestName.length > 20 ? "object-bottom" : "object-center"}`}
          priority
        />
        {/* rich warm blend at bottom for long names — keeps flowers vibrant */}
        {guestName && guestName.length > 20 && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
            aria-hidden
            style={{
              background:
                "linear-gradient(to top, rgba(120,50,10,0.28) 0%, rgba(120,50,10,0.10) 45%, transparent 100%)",
            }}
          />
        )}
      </motion.div>

      {/* gold shimmer sweep across the card */}
      {!reduce && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <motion.div
            className="absolute inset-y-[-10%]"
            initial={{ x: "-170%" }}
            animate={{ x: "430%" }}
            transition={{ duration: 2.1, delay: 0.9, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="h-full w-40 -skew-x-12 bg-gradient-to-r from-transparent via-[rgba(255,240,200,0.38)] to-transparent" />
          </motion.div>
        </div>
      )}

      {/* soft ivory scrim — keeps text readable over busy photo areas */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 64% at 50% 44%, rgba(255,247,232,0.94) 0%, rgba(255,247,232,0.82) 44%, rgba(255,247,232,0.34) 64%, transparent 78%)",
        }}
      />

      <GoldDust reduce={reduce} />

      {/* the invitation card — ornate royal frame, optically centered */}
      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center px-6 py-6 sm:max-w-lg sm:py-10 lg:max-w-lg lg:px-6 lg:py-2">
        {/* floral corners — attached to card, auto-adjust, no overlap */}
        <FloralCorners variant="all" sizePct={22} />
        <RoyalFrame
          corners={72}
          className="theme-opening-card relative z-10 w-full bg-[#fff7e8]/72 shadow-[0_30px_90px_-30px_rgba(90,20,30,0.55)] backdrop-blur-[2px]"
        >
          <div className="flex w-full flex-col items-center px-7 py-6 text-center sm:px-10 sm:py-9 lg:px-8 lg:py-4">
            {/* Ganesh Ji — grand 3D entrance FIRST, independent of text stagger */}
            <GaneshIdol className="h-[120px] w-[96px] sm:h-[148px] sm:w-[118px] lg:h-[95px] lg:w-[76px]" />

            {/* all names & text — stagger in only after Ganesh completes */}
            <motion.div
              variants={stack}
              initial={initialState}
              animate="show"
              className="flex w-full flex-col items-center"
            >
            <motion.p
              variants={line}
              className="mt-3 lg:mt-2 font-display text-[13px] lg:text-[11px] tracking-[0.24em] text-[#8a6a1f]"
            >
              {copyText(21,"Shree Ganeshaya Namah")}
            </motion.p>

            {guestName && (
              <motion.p
                variants={line}
                className={`mt-3 lg:mt-2 font-script text-[#C0392B] ${guestName.length > 20 ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl lg:text-3xl"} leading-tight px-4`}
              >
                Dear {guestName},
              </motion.p>
            )}
            <motion.p
              variants={line}
              className="mt-3 lg:mt-2 font-display text-xl font-semibold uppercase tracking-[0.18em] text-[#5e2f21] sm:text-2xl lg:text-lg"
            >
              You&rsquo;re Invited
            </motion.p>
            <motion.p
              variants={line}
              className="mt-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#5e2f21]/75"
            >
              {copyText(23,"To the wedding of")}
            </motion.p>

            <motion.h1
              variants={nameLine}
              className="mt-2 font-script leading-[1.08] lg:scale-90"
            >
              <span className="block text-6xl text-[#8d1730] drop-shadow-[0_2px_6px_rgba(255,250,235,0.85)] sm:text-7xl lg:text-8xl">
                {COUPLE.groom}
              </span>
              {/* prominent golden weds with flourish lines — Hero card style */}
              <span className="my-2 flex items-center justify-center gap-3 sm:my-3">
                <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9a227] sm:w-16" />
                <span className="font-script text-4xl italic leading-none text-[#8a6a1f] drop-shadow-[0_1px_4px_rgba(255,250,235,0.9)] sm:text-5xl lg:text-6xl">
                  weds
                </span>
                <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9a227] sm:w-16" />
              </span>
              <span className="block text-6xl text-[#8d1730] drop-shadow-[0_2px_6px_rgba(255,250,235,0.85)] sm:text-7xl lg:text-8xl">
                {COUPLE.bride}
              </span>
            </motion.h1>

            {/* wedding date — fast magical reveal 2.5s after names */}
            <motion.p
              variants={dateLine}
              className="mt-3 lg:mt-2 font-display text-lg font-bold uppercase tracking-[0.22em] sm:text-xl lg:text-base"
            >
              <span className="relative inline-block overflow-hidden px-2 py-1">
                {/* magical sparkle burst */}
                <span className="oc-magic-burst pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-gold" aria-hidden>✦</span>
                <span className="oc-magic-burst pointer-events-none absolute left-1/4 top-1/3 text-sm text-gold-light" aria-hidden style={{ animationDelay: "0.15s" }}>✦</span>
                <span className="oc-magic-burst pointer-events-none absolute right-1/4 bottom-1/3 text-sm text-gold-light" aria-hidden style={{ animationDelay: "0.25s" }}>✦</span>
                {/* date materializes with golden glow */}
                <span className="oc-date-magic oc-date-shimmer-text">{WEDDING_DATE_LABEL}</span>
                {/* quick golden sweep */}
                <span className="oc-golden-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#ffe9b0]/80 to-transparent" aria-hidden />
                {/* ambient twinkles */}
                <span className="date-sparkle pointer-events-none absolute -right-3 -top-1 text-xs text-gold" aria-hidden style={{ animationDelay: "2.5s" }}>✦</span>
                <span className="date-sparkle pointer-events-none absolute -left-2 top-0.5 text-[10px] text-gold-light" aria-hidden style={{ animationDelay: "3s" }}>✦</span>
              </span>
            </motion.p>

            <motion.p
              variants={line}
              className="mt-2 flex items-start justify-center gap-1.5 text-[13px] lg:text-[12px] leading-relaxed text-[#5e2f21]/85"
            >
              <PinIcon size={15} className="mt-0.5 shrink-0 text-[#8d1730]" />
              <span>
                {VENUE.name}, {VENUE.addressLines[0]}
                <br />
                {VENUE.addressLines[1]} — {VENUE.pin}
              </span>
            </motion.p>

            <motion.div variants={line} className="mt-5 lg:mt-3 flex w-full justify-center">
              <span className="relative inline-flex">
                {!reduce && (
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-full border-2 border-gold-light"
                    aria-hidden
                    animate={{ opacity: [0, 0.7, 0], scale: [1, 1.22, 1.45] }}
                    transition={{
                      duration: 2.2,
                      repeat: reduce ? 0 : Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ willChange: "transform, opacity" }}
                  />
                )}
                <motion.button
                  type="button"
                  onClick={onOpen}
                  className="btn-royal w-full sm:w-auto"
                  whileTap={{ scale: 0.97 }}
                  whileHover={reduce ? undefined : { scale: 1.03 }}
                >
                  {SITE_TEXTS.openInvitation}
                </motion.button>
              </span>
            </motion.div>

            <motion.p
              variants={line}
              className="mt-3 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#5e2f21]/60"
            >
              <SparkleIcon size={12} className="text-[#b8860b]" />
              {SITE_TEXTS.tapToBegin}
              <SparkleIcon size={12} className="text-[#b8860b]" />
            </motion.p>
            </motion.div>
          </div>
        </RoyalFrame>
      </div>

    </motion.div>
  );
}
