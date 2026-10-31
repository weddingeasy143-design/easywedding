// src/components/wedding/openings/sangeet.tsx
// Design: Sangeet — "Keep the Beat" (Wisteria Vows; Kochi; sangeet night)
// Beat 0 (Reveal): tap the beat three times — each tap makes the coded
// equalizer light field pulse harder and the ambient glow grow; on the
// third beat the field resolves in gold and the couple's names land as
// kinetic editorial typography, letter by letter, to the rhythm.
// Beat 2 (Curtain): a sequinned Austrian stage drape gathers upward in
// scallops, revealing the couple's names in the same kinetic type.
// 100% coded CSS/SVG — no external images.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ORDERED_COUPLE } from "@/content/wedding";
import { copyText } from "../../../../adapters/copy";
import PetalField from "../PetalField";

/* Sparkle burst — 10 tiny dots radiating at deterministic angles. */
const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 + (i % 2) * 0.18;
  const dist = 74 + ((i * 29) % 44);
  return {
    x: Math.cos(a) * dist,
    y: Math.sin(a) * dist,
    size: 4 + ((i * 7) % 4),
  };
});

/* Equalizer columns — 30 coded bars with deterministic heights/phases. */
const EQ_BARS = Array.from({ length: 30 }, (_, i) => ({
  height: 30 + ((i * 37 + 13) % 118),
  phase: (i % 5) * 0.11 + ((i * 7) % 3) * 0.05,
  hue: i % 6 === 5 ? "#e9c979" : i % 3 === 0 ? "#cab4d8" : "#9a7cac",
}));

/* Sequin specks on the drape — tiny deterministic glints. */
const SEQUINS = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 29 + 7) % 100,
  top: (i * 43 + 11) % 88,
  size: 2 + ((i * 11) % 3),
  delay: ((i * 17) % 20) / 10,
}));

/* Kinetic editorial name — letters scale/stagger in one by one. */
function KineticName({
  name,
  active,
  delay = 0,
  color = "#f4edfb",
  fontSize = "clamp(3.1rem, 15.5vw, 4.9rem)",
}: {
  name: string;
  active: boolean;
  delay?: number;
  color?: string;
  fontSize?: string;
}) {
  return (
    <span
      className="inline-flex flex-wrap items-baseline justify-center font-display font-semibold leading-[1.04]"
      style={{ color, fontSize }}
      role="text"
      aria-label={name}
    >
      {name.split("").map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          style={{ display: "inline-block" }}
          initial={{ opacity: 0, scale: 1.75, y: 30, rotate: -7 }}
          animate={active ? { opacity: 1, scale: 1, y: 0, rotate: 0 } : {}}
          transition={{
            type: "spring",
            stiffness: 330,
            damping: 19,
            delay: delay + i * 0.05,
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

/* The beat-reactive light field — equalizer bars that pulse with the taps.
   `level` (0–3) is the number of beats landed; `resolved` is the gold
   settle on the third beat. */
function LightField({ level, resolved }: { level: number; resolved: boolean }) {
  const energy = 0.34 + level * 0.22;
  return (
    <div
      className="pointer-events-none absolute inset-x-5 bottom-[19%] flex h-[38%] items-end justify-center gap-[3px]"
      aria-hidden
    >
      {EQ_BARS.map((bar, i) => {
        const peak = Math.min(1, energy + ((i * 13) % 10) / 26);
        return (
          <motion.span
            key={`${i}-${resolved ? "gold" : level}`}
            className="w-[7px] shrink-0 rounded-t-full"
            style={{
              height: bar.height,
              transformOrigin: "bottom center",
              background: resolved
                ? "linear-gradient(180deg, #f7e3ac 0%, #e9c979 55%, rgba(233,201,121,0.15) 100%)"
                : `linear-gradient(180deg, #f4edfb 0%, ${bar.hue} 52%, rgba(105,67,138,0.12) 100%)`,
              boxShadow: resolved
                ? "0 0 12px rgba(233,201,121,0.55)"
                : level > 0
                  ? "0 0 9px rgba(202,180,216,0.45)"
                  : "none",
            }}
            initial={false}
            animate={
              resolved
                ? { scaleY: [0.92, 1, 0.96, 1] }
                : { scaleY: [0.3, peak, 0.42, peak * 0.82, 0.3] }
            }
            transition={{
              duration: resolved ? 2.6 : 1.05 + bar.phase,
              repeat: Infinity,
              delay: bar.phase,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Beat 0 — Keep the Beat ────────────────────────────────────── */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const cfg =
    typeof window !== "undefined"
      ? (window as any).__easyWedding?.config
      : undefined;
  void cfg;

  const [taps, setTaps] = useState(0);
  const [burst, setBurst] = useState(false);
  const tapsRef = useRef(0);
  const finishingRef = useRef(false);
  const calledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const finish = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setBurst(true);
    // hold long enough for the kinetic names to land letter by letter
    timerRef.current = setTimeout(() => {
      if (calledRef.current) return;
      calledRef.current = true;
      onReveal();
    }, 1500);
  }, [onReveal]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    if (finishingRef.current) return;
    const next = tapsRef.current + 1;
    tapsRef.current = next;
    setTaps(next);
    if (next >= 3) finish();
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #241331 0%, #31204a 52%, #3a2050 100%)",
        touchAction: "none",
        cursor: "pointer",
      }}
      onPointerDown={onPointerDown}
      role="button"
      aria-label="Tap the beat three times to reveal the invitation"
    >
      {/* ambient glow — intensifies with every beat landed */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[38%] h-[74vmin] w-[74vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: burst
            ? "radial-gradient(circle, rgba(233,201,121,0.5) 0%, rgba(202,180,216,0.22) 52%, transparent 72%)"
            : "radial-gradient(circle, rgba(202,180,216,0.42) 0%, rgba(105,67,138,0.18) 55%, transparent 72%)",
          mixBlendMode: "screen",
        }}
        initial={false}
        animate={{
          opacity: 0.3 + taps * 0.22,
          scale: 0.85 + taps * 0.14,
          x: "-50%",
          y: "-50%",
        }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        aria-hidden
      />

      {/* tap ripple — one expanding ring per beat, keyed to the tap count */}
      {taps > 0 && !burst && (
        <motion.span
          key={taps}
          className="pointer-events-none absolute left-1/2 top-[30%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#cab4d8]"
          initial={{ scale: 0.45, opacity: 0.75, x: "-50%", y: "-50%" }}
          animate={{ scale: 2.3, opacity: 0, x: "-50%", y: "-50%" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          aria-hidden
        />
      )}

      {/* the beat-reactive light field */}
      <LightField level={taps} resolved={burst} />

      {/* equalizer baseline + floor glow */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[19%] h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(202,180,216,0.55) 25%, rgba(244,237,251,0.85) 50%, rgba(202,180,216,0.55) 75%, transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[19%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(202,180,216,0.08), rgba(0,0,0,0.35))",
        }}
        aria-hidden
      />

      {/* dhol medallion — thumps on every beat */}
      <div className="absolute inset-x-0 top-[9%] flex justify-center">
        <div className="relative flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute rounded-full border"
              style={{
                width: 138,
                height: 138,
                borderColor: burst ? "#e9c979" : "#9a7cac",
                boxShadow: burst ? "0 0 26px rgba(233,201,121,0.6)" : "none",
              }}
              animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.45,
                ease: "easeOut",
              }}
              aria-hidden
            />
          ))}
          <motion.svg
            key={taps}
            viewBox="0 0 160 160"
            className="relative h-32 w-32"
            initial={false}
            animate={{ scale: taps > 0 ? [1.14, 1] : 1 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            aria-hidden
          >
            <circle cx="80" cy="80" r="74" fill="#31204a" stroke="#9a7cac" strokeWidth="3" />
            <circle cx="80" cy="80" r="63" fill="none" stroke="#cab4d8" strokeWidth="1.4" strokeDasharray="3 6" strokeLinecap="round" />
            <circle cx="80" cy="80" r="52" fill="#3a2050" stroke="#9a7cac" strokeWidth="2" />
            {/* drum lacing — deterministic zigzag of short strokes */}
            {Array.from({ length: 12 }, (_, i) => (i * 360) / 12).map((a) => (
              <g key={a} transform={`rotate(${a} 80 80)`}>
                <line x1="80" y1="30" x2="88" y2="46" stroke="#cab4d8" strokeWidth="1.6" opacity="0.85" />
              </g>
            ))}
            <circle cx="80" cy="80" r="26" fill="#241331" stroke="#e9d9ff" strokeWidth="1.6" />
            <circle cx="80" cy="80" r="9" fill="#9a7cac" />
            <circle cx="80" cy="80" r="3.5" fill="#f4edfb" />
          </motion.svg>

          {/* sparkle burst on the third beat */}
          {burst && (
            <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
              {SPARKS.map((s, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full bg-[#f4edfb]"
                  style={{
                    width: s.size,
                    height: s.size,
                    boxShadow: "0 0 8px rgba(244,237,251,0.95)",
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                  animate={{ x: s.x, y: s.y, opacity: 0, scale: 1.15 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* third beat — the field resolves and the names land, letter by letter */}
      {burst && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <KineticName name={ORDERED_COUPLE[0].name} active={burst} delay={0.05} />
          <motion.p
            className="my-1 font-display text-xl italic text-[#e9c979]"
            initial={{ opacity: 0, scale: 1.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.34 }}
          >
            weds
          </motion.p>
          <KineticName name={ORDERED_COUPLE[1].name} active={burst} delay={0.42} />
        </div>
      )}

      {/* 1 · 2 · 3 beat markers */}
      {!burst && (
        <div
          className="absolute inset-x-0 bottom-[11%] flex items-center justify-center gap-5"
          aria-hidden
        >
          {[1, 2, 3].map((n) => (
            <motion.span
              key={n}
              className="flex h-9 w-9 items-center justify-center rounded-full border font-display text-base"
              style={{
                borderColor: taps >= n ? "#e9c979" : "#9a7cac",
                background: taps >= n ? "#69438a" : "transparent",
                color: "#f4edfb",
                boxShadow: taps >= n ? "0 0 14px rgba(233,201,121,0.7)" : "none",
              }}
              initial={false}
              animate={{ scale: taps >= n ? [1.45, 1] : 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {n}
            </motion.span>
          ))}
        </div>
      )}

      {/* hint — quiet, sentence case */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-[6%] text-center font-display text-sm text-[#f4edfb]/85"
        style={{ letterSpacing: "0.06em" }}
        animate={{ opacity: burst ? 0 : [0.55, 1, 0.55] }}
        transition={
          burst
            ? { duration: 0.3 }
            : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      >
        {copyText(91, "Tap the beat — 1, 2, 3")}
      </motion.p>
    </div>
  );
}

/* ── Beat 2 — The Austrian Drape ───────────────────────────────── */
export function Curtain({
  onDone,
  autoPlay,
}: {
  onDone: () => void;
  autoPlay?: boolean;
}) {
  const cfg =
    typeof window !== "undefined"
      ? (window as any).__easyWedding?.config
      : undefined;
  void cfg;

  const [risen, setRisen] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    },
    []
  );

  const fireDone = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  }, []);

  // autoPlay: drape rises at ~1100ms, onDone once at ~4200ms
  useEffect(() => {
    if (!autoPlay) return;
    later(() => setRisen(true), 1100);
    later(fireDone, 4200);
  }, [autoPlay, later, fireDone]);

  // manual: a tap starts the rise, onDone ~2400ms after
  const handleTap = () => {
    if (autoPlay || risen) return;
    setRisen(true);
    later(fireDone, 2400);
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "#241331" }}
      onClick={handleTap}
    >
      {/* revealed names layer — UNDER the drape */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {risen && (
          <PetalField
            count={8}
            palette="rose"
            className="pointer-events-none absolute inset-0 opacity-40"
          />
        )}
        {/* names land letter by letter as the drape clears them */}
        <div
          className="relative flex flex-col items-center"
          style={{
            textShadow:
              "0 0 18px rgba(233,201,121,0.45), 0 0 42px rgba(233,201,121,0.22)",
          }}
        >
          <KineticName name={ORDERED_COUPLE[0].name} active={risen} delay={0.55} />
          <motion.p
            className="my-1 font-display text-xl italic text-[#cab4d8] lg:text-2xl"
            initial={{ opacity: 0, scale: 1.6 }}
            animate={risen ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.85 }}
          >
            weds
          </motion.p>
          <KineticName name={ORDERED_COUPLE[1].name} active={risen} delay={0.95} />
          {/* a quiet echo of the light field under the names */}
          <div className="mt-7 flex h-8 items-end justify-center gap-[3px]" aria-hidden>
            {EQ_BARS.slice(0, 18).map((bar, i) => (
              <motion.span
                key={i}
                className="w-[5px] rounded-t-full"
                style={{
                  height: 8 + (bar.height % 22),
                  transformOrigin: "bottom center",
                  background:
                    "linear-gradient(180deg, #f7e3ac 0%, rgba(233,201,121,0.25) 100%)",
                }}
                initial={false}
                animate={
                  risen ? { scaleY: [0.35, 1, 0.5, 0.9, 0.35] } : { scaleY: 0.35 }
                }
                transition={{
                  duration: 1.4 + bar.phase,
                  repeat: Infinity,
                  delay: bar.phase,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* the Austrian drape — gathers upward in scallops */}
      <motion.div
        className="absolute inset-x-0 top-0 overflow-hidden"
        initial={false}
        animate={{ height: risen ? "16%" : "100%" }}
        transition={{ duration: 1.8, ease: [0.76, 0, 0.24, 1] }}
        aria-hidden
      >
        {/* full drape body with vertical fold shading + sequin glints */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: "100dvh",
            background:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.38) 0px, rgba(0,0,0,0) 26px, rgba(202,180,216,0.13) 46px, rgba(0,0,0,0) 66px, rgba(0,0,0,0.38) 92px), linear-gradient(180deg, #4b2a6e 0%, #3a2050 48%, #2c1745 100%)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
          {SEQUINS.map((s, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-[#f7e3ac]"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                boxShadow: "0 0 6px rgba(247,227,172,0.9)",
              }}
              animate={{ opacity: [0.15, 0.95, 0.15] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: s.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        {/* scalloped bottom edge — a row of overlapping drape circles */}
        <div className="absolute inset-x-0 bottom-[7px] flex justify-center overflow-hidden" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className="shrink-0 rounded-full"
              style={{
                width: 64,
                height: 64,
                marginLeft: i === 0 ? 0 : -14,
                background:
                  "radial-gradient(circle at 50% 30%, #4b2a6e 0%, #3a2050 65%, #2c1745 100%)",
                boxShadow: "inset 0 -8px 14px rgba(0,0,0,0.4)",
              }}
            />
          ))}
        </div>
        {/* gold fringe line riding the rising bottom edge */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: 7,
            background:
              "repeating-linear-gradient(90deg, #e9c979 0 5px, #9a7cac 5px 10px)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
          }}
        />
      </motion.div>

      {/* tap hint — manual mode only, before the rise; quiet, sentence case */}
      {!autoPlay && !risen && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] z-10 text-center font-display text-sm text-[#f4edfb]/90"
          style={{ letterSpacing: "0.06em" }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          Tap to raise the curtain
        </motion.p>
      )}
    </div>
  );
}
