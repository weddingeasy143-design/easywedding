import {copyText} from "../../../adapters/copy";
// src/components/wedding/ThankYou.tsx
// Screen 15 — cinematic ending with replay.
"use client";

import { SITE_TEXTS } from "@/content/wedding";
import { motion } from "framer-motion";
import Image from "next/image";
import { COUPLE } from "@/content/wedding";
import PetalField from "./PetalField";
import Reveal from "./Reveal";

export default function ThankYou({ onReplay }: { onReplay: () => void }) {
  return (
    <section id="thankyou" className="relative scroll-mt-20 overflow-hidden py-24 text-center sm:py-32">
      {/* illuminated palace / mandap night scene */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/ornaments/palace-night.webp"
          alt=""
          fill
          className="object-cover"
        />
        {/* cinematic dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a060f]/85 via-[#4a0b1c]/55 to-[#2a060f]/90" />
      </div>
      {/* warm light glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #f5c86e 0%, transparent 70%)" }}
        />
        <div
          className="absolute -left-16 bottom-10 h-56 w-56 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #e8789a 0%, transparent 70%)" }}
        />
        <div
          className="absolute -right-16 top-1/3 h-56 w-56 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #f5c86e 0%, transparent 70%)" }}
        />
        {/* string lights with twinkling bulbs */}
        <svg
          className="absolute inset-x-0 top-0 h-24 w-full text-gold-light/50"
          viewBox="0 0 400 96"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M0 10 Q100 60 200 24 T400 18" />
          {[40, 90, 145, 205, 265, 320, 365].map((x, i) => (
            <g key={i}>
              <line x1={x} y1={i % 2 ? 34 : 26} x2={x} y2={i % 2 ? 52 : 44} />
              <circle
                cx={x}
                cy={i % 2 ? 58 : 50}
                r="4"
                fill="currentColor"
                stroke="none"
                opacity="0.9"
                className="twinkle-star"
                style={{ animationDelay: `${i * 0.4}s`, transformOrigin: `${x}px ${i % 2 ? 58 : 50}px` }}
              />
            </g>
          ))}
        </svg>
        {/* second string of lights, lower */}
        <svg
          className="absolute inset-x-0 top-14 h-20 w-full text-gold-light/35"
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M0 8 Q120 50 240 20 T400 14" />
          {[60, 120, 180, 250, 310].map((x, i) => (
            <g key={i}>
              <line x1={x} y1={i % 2 ? 28 : 22} x2={x} y2={i % 2 ? 44 : 38} />
              <circle
                cx={x}
                cy={i % 2 ? 50 : 44}
                r="3.4"
                fill="currentColor"
                stroke="none"
                opacity="0.85"
                className="twinkle-star"
                style={{ animationDelay: `${0.6 + i * 0.5}s`, transformOrigin: `${x}px ${i % 2 ? 50 : 44}px` }}
              />
            </g>
          ))}
        </svg>
      </div>

      <PetalField count={12} />

      <div className="relative mx-auto max-w-2xl px-6 lg:max-w-4xl lg:px-12">
        <Reveal>
          <p className="font-script text-6xl text-gold-light sm:text-7xl lg:text-8xl">
            {SITE_TEXTS.thankYouTitle}
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.34em] text-ivory/80">
            {copyText(19,"For being a part of our beginning")}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="gold-divider mx-auto mt-8 max-w-[240px] text-gold-light" aria-hidden>
            <span>✦</span>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ivory/70">
            {copyText(20,"With love")}
          </p>
          <p className="mt-2 font-script text-5xl text-ivory sm:text-6xl lg:text-7xl">
            {COUPLE.groom} <span className="text-gold-light">&amp;</span> {COUPLE.bride}
          </p>
          <p className="mt-4 font-display text-lg font-semibold tracking-[0.3em] text-gold-light">
            {(window as any).__easyWedding.config.date.split("-").reverse().join(" • ")}
          </p>
        </Reveal>

        <Reveal delay={0.25}>
          <motion.button
            type="button"
            onClick={onReplay}
            whileTap={{ scale: 0.97 }}
            className="btn-royal mt-10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 12a9 9 0 1 0 2.6-6.3" />
              <path d="M3 4v5h5" />
            </svg>
            Replay Invitation
          </motion.button>
        </Reveal>
      </div>
    </section>
  );
}
