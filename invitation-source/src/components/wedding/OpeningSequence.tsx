import {copyText} from "../../../adapters/copy";
import {useMotionPreference} from "../../../adapters/motion-preference";
// src/components/wedding/OpeningSequence.tsx
// 3-beat cinematic opening sequence (user-approved):
//  1. Ganesh Ji (0-3s)      — full-screen divine idol, petals, blessing
//     (100% reference-matched, untouched)
//  2. Name-reveal curtain (3-10s) — red silk curtain with invitation
//     messages ("You're Invited" + "Two Families…"), then parts
//     left+right revealing the couple's names with light rays + petals
//  3. Final (10s+) — existing RoyalOpening as-is (Open Invitation → doors)
//
// Auto-advances, 0.5s crossfades.
// Tap anywhere skips to the next beat (beats 1-2 only — the final beat's
// Open Invitation button is the only way forward from there).
// prefers-reduced-motion: jumps straight to the final beat.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ORDERED_COUPLE } from "@/content/wedding";
import PetalField from "./PetalField";
import SurpriseAwaits from "./SurpriseAwaits";
import RoyalOpening from "./RoyalOpening";
import { OPENING_ACTS } from "./openings/index";
import { startMusic } from "@/lib/music";

// ─────────────────────────────────────────────
// BEAT TEXTS — editable later from Admin
// ─────────────────────────────────────────────
const BEAT_TEXTS = {
  ganeshBlessing: "Shree Ganeshaya Namah",
  curtainTitle: copyText(3,"You're Invited"),
  curtainLines: [copyText(26,"Two Families"), copyText(27,"One Celebration"), copyText(28,"A Lifetime of Love")],
} as const;

const EASE = [0.22, 1, 0.36, 1] as const;

type Beat = 0 | 1 | 2 | 3;
/**
 * auto-advance dwell per beat (ms):
 * beat 0 (surprise) waits for the TAP TO REVEAL button,
 * beat 1 (ganesh) 3s, beat 2 (curtain) auto-plays 4.5s, beat 3 via its button
 */
const BEAT_MS: Record<Beat, number> = { 0: 0, 1: 3000, 2: 4500, 3: 0 };

/* ── Beat 1 — Ganesh Ji (premium cinematic) ─────────────────
   Single artwork, slow dignified Ken Burns drift, divine light rays,
   fine gold dust. No gimmicks — pure elegance. */
function BeatGanesh({ onReady }: { onReady: () => void }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#fdf6ec]">
      {/* artwork — slow cinematic push-in, dignified and calm */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1.02 }}
        transition={{ duration: 4.5, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ willChange: "transform, opacity" }}
      >
        <Image
          src="/ornaments/ganesh/base.webp"
          alt="Lord Ganesha — Shri Ganeshaya Namah"
          fill
          className="source-ganesh-beat object-contain"
          priority
          sizes="100vw"
          onLoad={onReady}
          onError={onReady}
        />
      </motion.div>

      {/* divine light rays from above — very subtle */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,240,200,0.14) 0%, transparent 35%)",
          willChange: "opacity",
        }}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.7] }}
        transition={{ duration: 3, ease: "easeOut" }}
      />

      {/* warm vignette for cinematic depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 60%, rgba(60,25,8,0.22) 100%)",
        }}
        aria-hidden
      />

      {/* fine gold dust — sparse and elegant */}
      <PetalField count={8} className="pointer-events-none absolute inset-0 opacity-70" />
    </div>
  );
}

/* ── royal seal medallion that clasps the closed curtain ────
   Sits exactly on the centre seam (covers it); breaks apart as the
   curtain opens. */
function RoyalSeal({ gone, topClass = "top-[27%]" }: { gone: boolean; topClass?: string }) {
  const reduce=useMotionPreference();
  return (
    <motion.div
      className={`pointer-events-none absolute left-1/2 ${topClass} -translate-x-1/2`}
      aria-hidden
      initial={false}
      animate={
        gone
          ? { opacity: 0, scale: 1.6, rotate: 25 }
          : { opacity: 1, scale: 1, rotate: 0 }
      }
      transition={{ duration: 0.55, ease: "easeInOut" }}
    >
      <motion.div
        animate={gone ? {} : { rotate: 360 }}
        transition={
          gone ? {} : { duration: 40, repeat: reduce ? 0 : Infinity, ease: "linear" }
        }
        className="relative flex h-28 w-28 items-center justify-center lg:h-40 lg:w-40"
      >
        {/* seal body */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 38% 32%, #b3233a 0%, #7c1225 55%, #4d0a16 100%)",
            boxShadow:
              "0 0 0 3px #e8c876, 0 0 0 6px rgba(232,200,118,0.35), 0 10px 30px rgba(0,0,0,0.55), 0 0 44px rgba(232,200,118,0.35)",
          }}
        />
        {/* inner mandala */}
        <svg
          width="104"
          height="104"
          viewBox="0 0 160 160"
          fill="none"
          className="relative"
        >
          <circle cx="80" cy="80" r="70" stroke="#e8c876" strokeWidth="1.6" opacity="0.9" />
          <circle cx="80" cy="80" r="60" stroke="#e8c876" strokeWidth="1" strokeDasharray="4 5" opacity="0.7" />
          {Array.from({ length: 12 }, (_, i) => (i * 360) / 12).map((a) => (
            <g key={a} transform={`rotate(${a} 80 80)`}>
              <path
                d="M80 26 C87 42 87 52 80 61 C73 52 73 42 80 26 Z"
                stroke="#e8c876"
                strokeWidth="1.4"
                opacity="0.9"
              />
              <circle cx="80" cy="33" r="2.4" fill="#e8c876" opacity="0.9" />
            </g>
          ))}
          <circle cx="80" cy="80" r="30" stroke="#e8c876" strokeWidth="1.4" opacity="0.9" />
          <text
            x="80"
            y="97"
            textAnchor="middle"
            fill="#e8c876"
            fontSize="44"
            fontFamily="serif"
            opacity="0.95"
          >
            ॥
          </text>
        </svg>
      </motion.div>
    </motion.div>
  );
}

const SILK_BG =
  "repeating-linear-gradient(90deg, rgba(0,0,0,0.30) 0px, rgba(0,0,0,0) 22px, rgba(255,225,225,0.06) 40px, rgba(0,0,0,0) 58px, rgba(0,0,0,0.30) 80px)," +
  "linear-gradient(180deg, #9c1c30 0%, #741223 42%, #52101c 75%, #3d0a14 100%)";

/* ── one half of the parting red silk curtain ────────── */
function CurtainPanel({ side, open }: { side: "left" | "right"; open: boolean }) {
  const isLeft = side === "left";
  return (
    <motion.div
      className={`pointer-events-none absolute inset-y-0 ${isLeft ? "left-0" : "right-0"} w-[50.5%]`}
      initial={false}
      animate={{ x: open ? (isLeft ? "-104%" : "104%") : "0%" }}
      transition={{
        duration: 1.6,
        ease: [0.76, 0, 0.24, 1], // theatrical — research-backed premium curve
        delay: isLeft ? 0 : 0.09, // staggered panels (90ms)
      }}
      aria-hidden
    >
      <div className="relative h-full w-full" style={{ background: SILK_BG }}>
        {/* subtle dark meeting seam (no gold bar cutting through text) */}
        <div
          className={`absolute inset-y-0 ${isLeft ? "right-0" : "left-0"} w-[2px]`}
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.55) 100%)",
            boxShadow: isLeft
              ? "3px 0 8px rgba(0,0,0,0.45)"
              : "-3px 0 8px rgba(0,0,0,0.45)",
          }}
        />
        {/* outer edge shading */}
        <div
          className={`absolute inset-y-0 ${isLeft ? "left-0" : "right-0"} w-10 bg-gradient-to-r from-black/45 to-transparent ${isLeft ? "" : "rotate-180"}`}
        />
        {/* top light + bottom depth */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
    </motion.div>
  );
}

/* ── magical flower burst — petals erupt from the seal point ── */
function FlowerBurst({ fire }: { fire: boolean }) {
  // scale burst distances on desktop so the explosion fills wide screens
  const wide =
    typeof window !== "undefined" && window.innerWidth >= 1024 ? 1.9 : 1;
  const petals = Array.from({ length: 26 }, (_, i) => {
    const angle = (i / 26) * Math.PI * 2 + (i % 3) * 0.12;
    const dist = (130 + ((i * 47) % 120)) * wide;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      size: (9 + ((i * 31) % 12)) * (wide > 1 ? 1.3 : 1),
      color: [
        "#fab005",
        "#f76707",
        "#e03131",
        "#ffd43b",
        "#ff8787",
      ][i % 5]!,
      rotate: (i * 137) % 360,
      delay: (i % 5) * 0.03,
    };
  });
  if (!fire) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-20" aria-hidden>
      {petals.map((p, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{
            width: p.size,
            height: p.size * 0.8,
            borderRadius: "62% 4% 62% 4%",
            background: `radial-gradient(ellipse at 30% 30%, ${p.color}, ${p.color}cc)`,
            boxShadow: "0 1px 4px rgba(141,23,48,.3)",
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y + 60,
            opacity: 0,
            scale: 1.1,
            rotate: p.rotate,
          }}
          transition={{ duration: 1.6, delay: p.delay, ease: [0.15, 0.85, 0.45, 1] }}
        />
      ))}
    </div>
  );
}

/* ── Beat 2 — Name-reveal curtain ─────────────────────────────
   Closed: silk panels clasped by a royal seal, invitation messages
   in gold. The seal breaks with a magical flash + flower burst, then
   the panels part into a grand marigold shower revealing the names. */
function BeatCurtain({ onDone, autoPlay = false }: { onDone: () => void; autoPlay?: boolean }) {
  const reduce=useMotionPreference();
  const [sealGone, setSealGone] = useState(false);
  const [open, setOpen] = useState(false);

  // Auto-play: the seal shatters on its own shortly after the beat starts,
  // panels part, marigold shower reveals the names — then auto-continues.
  // (Legacy tap path kept for manual use.)
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (!autoPlay) return;
    const t1 = setTimeout(() => setSealGone(true), 900);
    const t2 = setTimeout(() => setOpen(true), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [autoPlay]);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onDoneRef.current(), 3200);
    return () => clearTimeout(t);
  }, [open ]);

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sealGone) {
      setSealGone(true);
      setTimeout(() => setOpen(true), 450);
    } else if (open) {
      onDoneRef.current();
    }
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#FFF7E8]"
      onClick={autoPlay ? undefined : handleTap}
      style={autoPlay ? undefined : { cursor: "pointer" }}
    >
      {/* revealed names layer (under the curtain) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {/* rotating light rays */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        >
          <motion.div
            className="rays-spin h-[135vmax] w-[135vmax]"
            initial={{ opacity: 0 }}
            animate={{ opacity: open ? 0.55 : 0 }}
            transition={{ duration: 1.2 }}
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(232,200,118,0.45) 0deg 7deg, transparent 7deg 15deg)",
              WebkitMaskImage:
                "radial-gradient(circle, black 0%, transparent 68%)",
              maskImage: "radial-gradient(circle, black 0%, transparent 68%)",
            }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={open ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
        >
          <p className="font-script text-7xl leading-[1.12] text-[#8d1730] lg:text-9xl">
            {ORDERED_COUPLE[0].name}
          </p>
          <p className="my-1 font-display text-lg italic text-[#5e2f21]/80 lg:text-2xl">
            weds
          </p>
          <p className="font-script text-7xl leading-[1.12] text-[#8d1730] lg:text-9xl">
            {ORDERED_COUPLE[1].name}
          </p>
          {/* one-shot golden shimmer across names — premium, not infinite */}
          {open && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "linear-gradient(105deg, transparent 30%, rgba(255,225,160,0.5) 50%, transparent 70%)",
                mixBlendMode: "overlay",
              }}
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: "100%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.6, times: [0, 0.2, 0.8, 1], delay: 1.2, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      </div>

      {open && (
        <>
          {/* grand barat-style marigold shower */}
          <PetalField
            count={44}
            palette="marigold"
            className="pointer-events-none absolute inset-0"
          />
          <PetalField
            count={14}
            palette="rose"
            className="pointer-events-none absolute inset-0"
          />
        </>
      )}

      {/* the silk curtain halves */}
      <CurtainPanel side="left" open={open} />
      <CurtainPanel side="right" open={open} />

      {/* rich golden ambience behind the closed curtain */}
      {!open && (
        <>
          <div
            className="pointer-events-none absolute left-1/2 top-[30%] h-[46vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(ellipse, rgba(255,205,120,0.28) 0%, rgba(255,180,100,0.10) 45%, transparent 70%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(20,2,6,0.55) 100%)",
            }}
            aria-hidden
          />
        </>
      )}

      {/* magical golden flash as the seal breaks */}
      {sealGone && !open && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          aria-hidden
          initial={{ opacity: 0, scale: 0.25 }}
          animate={{ opacity: [0, 0.95, 0], scale: [0.25, 1.4, 2.4] }}
          transition={{ duration: 1.1, times: [0, 0.35, 1], ease: "easeOut" }}
          style={{
            background:
              "radial-gradient(circle, rgba(255,226,150,0.95) 0%, rgba(255,200,110,0.45) 40%, transparent 70%)",
          }}
        />
      )}
      {/* second wave — light burst as curtains reach 60% open */}
      {open && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          aria-hidden
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1.2, 1.8] }}
          transition={{ duration: 1.2, times: [0, 0.4, 1], delay: 0.9, ease: "easeOut" }}
          style={{
            background:
              "radial-gradient(circle, rgba(255,230,170,0.8) 0%, rgba(255,200,110,0.3) 45%, transparent 70%)",
          }}
        />
      )}
      {/* flower burst from the seal point */}
      <FlowerBurst fire={sealGone} />

      {/* invitation messages on the closed curtain — absolute zones so
          nothing ever overlaps the seal or the centre seam */}
      <motion.div
        className="pointer-events-none absolute inset-0 text-center"
        aria-hidden
        initial={false}
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <p className="absolute inset-x-0 top-[9%] px-8 font-display text-[2.4rem] font-semibold leading-tight tracking-wide text-[#f6e2a0] drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] lg:text-5xl">
          {BEAT_TEXTS.curtainTitle}
        </p>
        <div className="absolute inset-x-0 top-[19%] flex items-center justify-center gap-3">
          <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#c99a3d]" />
          <span className="text-[#e8c876]">✦</span>
          <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#c99a3d]" />
        </div>
        {/* the three lines sit well below the seal — clear on every screen */}
        <div className="absolute inset-x-0 top-[47%] flex flex-col gap-3 px-8 lg:top-[50%] lg:gap-4">
          {BEAT_TEXTS.curtainLines.map((line) => (
            <p
              key={line}
              className="font-display text-[1.3rem] font-medium tracking-[0.22em] text-[#f6e2a0] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] lg:text-2xl"
            >
              {line.toUpperCase()}
            </p>
          ))}
        </div>
      </motion.div>

      {/* royal seal clasping the panels shut */}
      {!open && <RoyalSeal gone={sealGone} />}

      {/* tap hint — hidden in auto-play mode */}
      {!autoPlay && !sealGone && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] text-center font-display text-sm uppercase tracking-[0.35em] text-[#f6e2a0]/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          ✦&nbsp; Tap to reveal &nbsp;✦
        </motion.p>
      )}

      {/* warm light washing the curtain top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-44"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,220,150,0.22), transparent)",
        }}
        aria-hidden
      />
    </div>
  );
}

/* ── Orchestrator ─────────────────────────────────────── */
export default function OpeningSequence({ onOpen }: { onOpen: () => void }) {
  const reduce = useMotionPreference() ?? false;
  const [beat, setBeat] = useState<Beat>(0);
  const showGanesh=(window as any).__easyWedding.config.ganeshIcon!=="none";
  /* Per-design opening act (beats 0 and 2 only). Premium Original has no
     entry in OPENING_ACTS and keeps the shared beats untouched; beat 3
     (the Open Invitation cover) is shared by every design. */
  const ewGlobal=(window as any).__easyWedding||{};
  const designId:string=ewGlobal.design?.id||ewGlobal.config?.theme||"";
  const act=OPENING_ACTS[designId];

  // Ganesh aarti from the very start (plays on first tap if autoplay blocks)
  useEffect(() => {
    startMusic("aarti");
  }, []);

  // Preload Ganesh artwork during the surprise screen so beat 1 never waits.
  useEffect(() => {
    const img = new window.Image();
    img.src = "/assets/wedding/ganesh.png";
  }, []);

  // Track when the Ganesh image is actually ready to display.
  const [ganeshReady, setGaneshReady] = useState(false);
  useEffect(() => {
    if (beat === 1) setGaneshReady(false);
  }, [beat]);

  // beats 1 (ganesh) and 2 (curtain) auto-advance; beat 0 waits for the
  // TAP TO REVEAL button; beat 3 advances via its OPEN INVITATION button.
  // Ganesh beat: minimum 3.5s AFTER the image is ready — never skips early.
  useEffect(() => {
    if (reduce || (beat !== 1 && beat !== 2)) return;
    if (beat === 1 && !ganeshReady) return; // wait for image
    const t = setTimeout(
      () => setBeat((b) => (b === 1 ? 2 : b === 2 ? 3 : b)),
      beat === 1 ? 3500 : BEAT_MS[beat]
    );
    return () => clearTimeout(t);
  }, [beat, reduce, ganeshReady]);

  // reduced motion: straight to the final beat
  if (reduce) {
    return <RoyalOpening onOpen={onOpen} />;
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden bg-[#2b120c]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      role="dialog"
      aria-label="Wedding invitation cinematic opening"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={beat}
          className="h-full w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {beat === 0 && (act ? <act.Reveal onReveal={() => setBeat(showGanesh?1:2)} /> : <SurpriseAwaits onReveal={() => setBeat(showGanesh?1:2)} />)}
          {beat === 1 && <BeatGanesh onReady={() => setGaneshReady(true)} />}
          {beat === 2 && (act ? <act.Curtain onDone={() => setBeat(3)} autoPlay /> : <BeatCurtain onDone={() => setBeat(3)} autoPlay />)}
          {beat === 3 && <RoyalOpening onOpen={onOpen} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
