import {useMotionPreference} from "../../../adapters/motion-preference";
import {copyText} from "../../../adapters/copy";
// src/components/wedding/SurpriseAwaits.tsx
// Opening beat 0 — "A Little Surprise Awaits..." (matches the user's Canva
// reference 100%). Single TAP TO REVEAL button; after the tap every
// remaining beat plays automatically — no more intermediate taps.
"use client";

import { motion } from "framer-motion";
import { ChevronRightIcon } from "./icons";
import { SITE_TEXTS } from "@/content/wedding";

/** Glowing interlocked hearts (SVG, no emoji). */
function TwinHearts() {
  const reduce=useMotionPreference();
  return (
    <div className="relative">
      <svg
        viewBox="0 0 120 80"
        className="h-20 w-30 text-[#ffd98a] drop-shadow-[0_0_18px_rgba(255,200,100,0.9)]"
        aria-hidden
      >
        <defs>
          <filter id="heartGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g fill="none" stroke="currentColor" strokeWidth="3" filter="url(#heartGlow)">
          <path d="M48 62 C28 48 18 36 18 26 C18 16 26 10 34 10 C40 10 45 13 48 18 C51 13 56 10 62 10 C70 10 78 16 78 26 C78 36 68 48 48 62 Z" />
          <path d="M72 62 C52 48 42 36 42 26 C42 16 50 10 58 10 C64 10 69 13 72 18 C75 13 80 10 86 10 C94 10 102 16 102 26 C102 36 92 48 72 62 Z" opacity="0.92" />
        </g>
        <path
          d="M60 14 c-2-4-8-4-8 1 c0 3 4 5 8 8 c4-3 8-5 8-8 c0-5-6-5-8-1z"
          fill="#fff"
          className="drop-shadow-[0_0_10px_rgba(255,255,255,0.95)]"
        />
      </svg>
      {/* sparkles */}
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-[#ffe9b8]"
          style={{
            left: `${15 + i * 24}%`,
            top: `${10 + (i % 2) * 55}%`,
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1.2, 0.6] }}
          transition={{ duration: 2 + i * 0.4, repeat: reduce ? 0 : Infinity, delay: i * 0.3 }}
          aria-hidden
        />
      ))}
    </div>
  );
}

/** Small golden divider with a heart in the middle. */
function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#d9a441] sm:w-24" />
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-[#e8b84b]">
        <path d="M12 21s-7.5-4.9-10-9.3C.4 8.6 2.4 5 5.7 5c2 0 3.4 1.1 4.3 2.6h4c.9-1.5 2.3-2.6 4.3-2.6 3.3 0 5.3 3.6 3.7 6.7C19.5 16.1 12 21 12 21z" />
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#d9a441] sm:w-24" />
    </div>
  );
}

function GiftIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="8" width="18" height="4" rx="1" fill="#e8b84b" />
      <rect x="5" y="12" width="14" height="9" rx="1" fill="#f3cd72" />
      <rect x="10.8" y="8" width="2.4" height="13" fill="#b98a2f" />
      <path
        d="M12 8c-4 0-5.5-1.5-5.5-3.2C6.5 3 8 2.5 9.2 3.4 10.6 4.5 12 8 12 8zm0 0c4 0 5.5-1.5 5.5-3.2 0-1.8-1.5-2.3-2.7-1.4C13.4 4.5 12 8 12 8z"
        stroke="#e8b84b"
        strokeWidth="1.6"
        fill="none"
      />
    </svg>
  );
}

export default function SurpriseAwaits({ onReveal }: { onReveal: () => void }) {
  const reduce=useMotionPreference();
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/opening/surprise-bg.webp)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0b28]/55 via-transparent to-[#1a0b28]/70" aria-hidden />

      {/* floating petals */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-[#ff5f7e]/80"
          style={{
            width: 6 + (i % 3) * 3,
            height: 8 + (i % 3) * 3,
            left: `${6 + i * 9}%`,
            top: -20,
          }}
          animate={{ y: ["0vh", "105vh"], x: [0, 30, -20, 0], rotate: [0, 180, 360], opacity: [0, 1, 1, 0.9] }}
          transition={{ duration: 9 + (i % 4) * 2, repeat: reduce ? 0 : Infinity, delay: i * 0.9, ease: "linear" }}
          aria-hidden
        />
      ))}

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <TwinHearts />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <GoldDivider className="mt-2" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.9 }}
          className="mt-4 font-display text-5xl tracking-wide text-white sm:text-6xl"
        >
          {copyText(0,"A Little")}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.9 }}
          className="font-script text-6xl leading-tight text-[#f3cd72] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-7xl"
        >
          {copyText(1,"Surprise Awaits...")}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <GoldDivider className="mt-3" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.9 }}
          className="mt-4 max-w-xs font-display text-xl italic leading-relaxed text-white/95 sm:max-w-sm sm:text-2xl"
        >
          {copyText(2,"Something beautiful is about to begin...")}{" "}
          <span aria-hidden>❤️💕</span>
        </motion.p>

        {/* THE button */}
        <motion.button
          type="button"
          onClick={onReveal}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.97 }}
          className="group relative mt-8 flex w-full max-w-sm items-center gap-4 rounded-full border-2 border-[#f3cd72] bg-gradient-to-b from-[#a3162e] to-[#7c1023] px-6 py-4 shadow-[0_0_35px_rgba(243,205,114,0.55),0_10px_30px_rgba(0,0,0,0.45)]"
          aria-label="Tap to reveal the invitation"
        >
          <span className="animate-pulse">
            <GiftIcon />
          </span>
          <span className="flex-1 text-center font-display text-2xl tracking-wide text-white">
            {SITE_TEXTS.tapToReveal}
          </span>
          <span className="text-[#f3cd72] transition group-hover:translate-x-1">
            <ChevronRightIcon size={24} />
          </span>
          {/* glow pulse ring */}
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#f3cd72]"
            animate={{ opacity: [0.7, 0], scale: [1, 1.12] }}
            transition={{ duration: 1.8, repeat: reduce ? 0 : Infinity, ease: "easeOut" }}
            aria-hidden
          />
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <GoldDivider className="mt-6" />
        </motion.div>
      </div>

      {/* footer credits */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute inset-x-0 bottom-6 z-10 text-center"
      >
        <p className="font-display text-sm tracking-wide text-white/90">
          <span aria-hidden>❤️</span> Crafted with Easy Wedding{" "}
          <span aria-hidden>❤️</span>
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.42em] text-[#f3cd72]">
          Wedding Invitation
        </p>
      </motion.div>
    </div>
  );
}
