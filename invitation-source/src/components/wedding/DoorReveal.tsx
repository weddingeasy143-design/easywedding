import {useMotionPreference} from "../../../adapters/motion-preference";
// src/components/wedding/DoorReveal.tsx
// Screen 02 — two carved royal door panels glide open (~1.4s), golden light
// bloom washes through, petals fall, monogram appears, then a cinematic
// light-dissolve (NOT a plain fade) hands off to the main invitation.
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { COUPLE } from "@/content/wedding";
import PetalField from "./PetalField";
import { HeartIcon } from "./icons";

const DOOR_DELAY = 0.7; // brief pause — builds anticipation before the doors part
const DOOR_DURATION = 2.8; // slow, stately, grand reveal
const BLOOM_DELAY_MS = (DOOR_DELAY + DOOR_DURATION) * 1000 + 120;
const DONE_DELAY_MS = BLOOM_DELAY_MS + 1100;

function DoorPanel({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  const profile=(window as any).__easyWedding.motion;
  return (
    <motion.div
      className={`absolute inset-y-0 z-20 ${isLeft ? "left-0" : "right-0"} w-1/2`}
      data-theme-door={side}
      initial={profile.doorInitial}
      animate={profile.door(isLeft)}
      transition={{ duration: profile.duration, delay: DOOR_DELAY, ease: [0.65, 0, 0.35, 1] }}
      style={{ willChange: "transform" }}
      aria-hidden
    >
      <div className="relative h-full w-full overflow-hidden bg-[#4a211a] shadow-2xl">
        {/* carved golden door texture */}
        <Image
          src="/ornaments/royal-door-bg.webp"
          alt=""
          fill
          className={`object-cover ${isLeft ? "" : "-scale-x-100"}`}
          priority
        />
        {/* warm varnish wash + vignette for carved depth */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(58,22,10,0.42) 0%, rgba(58,22,10,0.12) 30%, rgba(58,22,10,0.12) 70%, rgba(30,10,5,0.55) 100%)",
          }}
        />
        <div
          className={`absolute inset-y-0 ${isLeft ? "right-0" : "left-0"} w-10 bg-gradient-to-l from-black/50 to-transparent ${isLeft ? "" : "rotate-180"}`}
        />
        {/* gold frame inlay */}
        <div
          className={`absolute inset-3 border-2 border-gold-light/80 ${isLeft ? "rounded-r-[44%] border-l-0" : "rounded-l-[44%] border-r-0"}`}
        />
        <div
          className={`absolute inset-6 border border-gold/50 ${isLeft ? "rounded-r-[42%] border-l-0" : "rounded-l-[42%] border-r-0"}`}
        />
        {/* ornamental medallions */}
        <div className="absolute inset-0 flex flex-col items-center justify-evenly">
          {[0, 1, 2].map((i) => (
            <svg
              key={i}
              width="54"
              height="54"
              viewBox="0 0 54 54"
              className="text-gold-light/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="27" cy="27" r="20" />
              <circle cx="27" cy="27" r="13" />
              <path d="M27 7 L31 23 L47 27 L31 31 L27 47 L23 31 L7 27 L23 23 Z" />
              <circle cx="27" cy="27" r="3.5" fill="currentColor" stroke="none" />
            </svg>
          ))}
        </div>
        {/* brass door knob */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? "right-5" : "left-5"} h-11 w-11 rounded-full bg-gradient-to-br from-gold-light via-gold to-gold-deep shadow-[0_2px_12px_rgba(0,0,0,0.6)] ring-2 ring-[#2a120a]`}
        />
        {/* center edge gold highlight */}
        <div
          className={`absolute inset-y-0 ${isLeft ? "right-0" : "left-0"} w-1.5 bg-gradient-to-b from-gold-light/70 via-gold/40 to-transparent`}
        />
      </div>
    </motion.div>
  );
}

export default function DoorReveal({ onDone }: { onDone: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [bloom, setBloom] = useState(false);
  const reduce = useMotionPreference() ?? false;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(true), 350);
    const t2 = setTimeout(() => setBloom(true), reduce ? 400 : BLOOM_DELAY_MS);
    const t3 = setTimeout(
      () => doneRef.current(),
      reduce ? 900 : DONE_DELAY_MS
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reduce]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden bg-[#2b120c]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // cinematic light-dissolve: bloom to white-gold + gentle push-in, not a plain fade
      exit={
        reduce
          ? { opacity: 0 }
          : {
              opacity: 0,
              scale: 1.1,
              filter: "brightness(2.2) saturate(1.2)",
              transition: { duration: 0.75, ease: [0.4, 0, 0.2, 1] },
            }
      }
      role="dialog"
      aria-label="Opening the invitation doors"
      // safety: tap anywhere to skip the animation and continue
      onClick={() => doneRef.current()}
    >
      {/* illuminated palace courtyard revealed behind the doors */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0.3, scale: 1.08 }}
        animate={revealed ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: DOOR_DURATION + 0.4, delay: DOOR_DELAY, ease: "easeOut" }}
        style={{ willChange: "transform, opacity" }}
        aria-hidden
      >
        <Image
          src="/ornaments/palace-night.webp"
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* warm light wash so the monogram stays readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 82% 62% at 50% 44%, rgba(255,236,190,0.62) 0%, rgba(246,199,111,0.28) 42%, transparent 76%)",
          }}
        />
      </motion.div>

      {/* golden light bloom — washes over the scene after doors fully open */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: bloom ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(ellipse 72% 56% at 50% 45%, rgba(255,242,205,0.95) 0%, rgba(255,216,145,0.55) 45%, transparent 78%)",
        }}
        aria-hidden
      />
      {/* depth glow at the doorway floor */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-2/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 0.9 : 0 }}
        transition={{ duration: 1.6, delay: 0.9 }}
        style={{
          background:
            "linear-gradient(to top, rgba(43,18,12,0.88), transparent)",
        }}
        aria-hidden
      />

      {/* petals fall BEHIND the doors — visible through the opening gap */}
      {(revealed || reduce) && !reduce && (
        <div className="absolute inset-0 z-[5]" aria-hidden>
          <PetalField count={16} />
        </div>
      )}

      {/* monogram + caption appear through the light, after the bloom */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        initial={{ opacity: 0, scale: 0.92, y: 14 }}
        animate={bloom ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      >
        <p className="flex items-center justify-center gap-3 font-script text-7xl text-maroon-deep drop-shadow-[0_2px_14px_rgba(255,240,200,0.95)] sm:text-8xl lg:gap-5 lg:text-9xl">
          {COUPLE.groom[0]} <HeartIcon size={40} className="shrink-0 lg:h-[56px] lg:w-[56px]" /> {COUPLE.bride[0]}
        </p>
        <p className="mt-4 font-script text-3xl text-[#5b2a1e] drop-shadow-[0_1px_8px_rgba(255,240,200,0.9)] sm:text-4xl lg:text-5xl">
          Our Story Begins…
        </p>
      </motion.div>

      <DoorPanel side="left" />
      <DoorPanel side="right" />

      {/* outer gold frame */}
      <div className="pointer-events-none absolute inset-2 z-10 border border-gold/60 sm:inset-4" aria-hidden />
      <div className="pointer-events-none absolute inset-[14px] z-10 border border-gold/25 sm:inset-[26px]" aria-hidden />
    </motion.div>
  );
}
