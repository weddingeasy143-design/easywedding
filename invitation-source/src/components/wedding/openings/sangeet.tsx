// src/components/wedding/openings/sangeet.tsx
// Design: Sangeet — "Keep the Beat" (Wisteria Vows; Kochi; sangeet night)
// Beat 0 (Reveal): tap the beat three times — each tap lights a spotlight,
// the third fires a sparkle burst over the dhol medallion.
// Beat 2 (Curtain): an Austrian stage drape gathers upward in scallops,
// revealing the couple's names in chasing marquee lights.
// 100% coded CSS/SVG — no external images.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { COUPLE } from "@/content/wedding";
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

/* Marquee bulbs — 18 around a rounded frame, deterministic perimeter walk:
   6 across the top, 3 down the right, 6 across the bottom, 3 up the left. */
const BULBS = (() => {
  const pts: { left: string; top: string }[] = [];
  for (let i = 0; i < 6; i++) pts.push({ left: `${6 + i * 17.6}%`, top: "0%" });
  for (let i = 0; i < 3; i++) pts.push({ left: "100%", top: `${25 + i * 25}%` });
  for (let i = 0; i < 6; i++) pts.push({ left: `${94 - i * 17.6}%`, top: "100%" });
  for (let i = 0; i < 3; i++) pts.push({ left: "0%", top: `${75 - i * 25}%` });
  return pts;
})();

/* A soft spotlight cone — a clipped gradient trapezoid from a top corner. */
function Spotlight({
  side,
  on,
}: {
  side: "left" | "right" | "centre";
  on: boolean;
}) {
  const geo =
    side === "left"
      ? { left: "-6%", clipPath: "polygon(38% 0, 62% 0, 100% 100%, 0% 100%)" }
      : side === "right"
        ? { right: "-6%", clipPath: "polygon(38% 0, 62% 0, 100% 100%, 0% 100%)" }
        : {
            left: "50%",
            transform: "translateX(-50%)",
            clipPath: "polygon(42% 0, 58% 0, 92% 100%, 8% 100%)",
          };
  return (
    <motion.div
      className="pointer-events-none absolute top-0 h-[86%] w-[46%]"
      style={{
        ...geo,
        background:
          "linear-gradient(180deg, rgba(244,237,251,0.85) 0%, rgba(202,180,216,0.35) 55%, rgba(202,180,216,0) 100%)",
        mixBlendMode: "screen",
      }}
      initial={false}
      animate={{ opacity: on ? 0.5 : 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      aria-hidden
    />
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
    timerRef.current = setTimeout(() => {
      if (calledRef.current) return;
      calledRef.current = true;
      onReveal();
    }, 500);
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
      {/* faint side curtain edges */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[13%]"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.35) 0 10px, rgba(154,124,172,0.14) 10px 20px), linear-gradient(90deg, #1c0e2a, #2c1745)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[13%]"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(154,124,172,0.14) 0 10px, rgba(0,0,0,0.35) 10px 20px), linear-gradient(270deg, #1c0e2a, #2c1745)",
        }}
        aria-hidden
      />

      {/* spotlights — left, right, centre, lit one per tap */}
      <Spotlight side="left" on={taps >= 1} />
      <Spotlight side="right" on={taps >= 2} />
      <Spotlight side="centre" on={taps >= 3} />

      {/* floor line + stage glow */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[16%] h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(202,180,216,0.55) 25%, rgba(244,237,251,0.8) 50%, rgba(202,180,216,0.55) 75%, transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[16%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(202,180,216,0.10), rgba(0,0,0,0.35))",
        }}
        aria-hidden
      />

      {/* dhol medallion + three pulsing beat rings */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-14">
        <div className="relative flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute rounded-full border"
              style={{
                width: 168,
                height: 168,
                borderColor: burst ? "#e9d9ff" : "#9a7cac",
                boxShadow: burst
                  ? "0 0 26px rgba(202,180,216,0.75)"
                  : "none",
              }}
              animate={{ scale: [1, 1.45], opacity: [0.55, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.45,
                ease: "easeOut",
              }}
              aria-hidden
            />
          ))}
          {/* the dhol — coded rings and centre */}
          <motion.svg
            viewBox="0 0 160 160"
            className="relative h-40 w-40"
            animate={burst ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
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

        {/* 1 · 2 · 3 beat markers */}
        <div className="mt-9 flex items-center gap-5" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span key={n} className="flex flex-col items-center gap-1.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full border font-display text-sm"
                style={{
                  borderColor: taps >= n ? "#e9d9ff" : "#9a7cac",
                  background: taps >= n ? "#69438a" : "transparent",
                  color: "#f4edfb",
                  boxShadow: taps >= n ? "0 0 14px rgba(202,180,216,0.8)" : "none",
                  transition: "all 0.35s ease",
                }}
              >
                {n}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* hint */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-[7%] text-center font-display text-xs uppercase tracking-[0.35em] text-[#f4edfb]/85"
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
        {/* marquee frame of chasing bulbs around the name panel */}
        <div className="relative px-10 py-9">
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px]"
            style={{
              background: "rgba(36,19,49,0.72)",
              boxShadow: "inset 0 0 0 1px rgba(154,124,172,0.5), 0 0 44px rgba(105,67,138,0.35)",
            }}
            aria-hidden
          />
          {BULBS.map((b, i) => (
            <motion.span
              key={i}
              className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: b.left,
                top: b.top,
                background: "#e9c979",
                boxShadow: "0 0 8px rgba(233,201,121,0.9)",
              }}
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: i * 0.08,
                ease: "easeInOut",
              }}
              aria-hidden
            />
          ))}
          {/* names slam in with a steady gold glow */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 1.18 }}
            animate={risen ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 240, damping: 19, delay: 0.5 }}
            style={{
              textShadow:
                "0 0 18px rgba(233,201,121,0.55), 0 0 42px rgba(233,201,121,0.3)",
            }}
          >
            <p className="font-script text-7xl leading-[1.12] text-[#f4edfb] lg:text-9xl">
              {COUPLE.groom}
            </p>
            <p className="my-1 font-display text-lg italic text-[#cab4d8] lg:text-2xl">
              weds
            </p>
            <p className="font-script text-7xl leading-[1.12] text-[#f4edfb] lg:text-9xl">
              {COUPLE.bride}
            </p>
          </motion.div>
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
        {/* full drape body with vertical fold shading */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: "100dvh",
            background:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.38) 0px, rgba(0,0,0,0) 26px, rgba(202,180,216,0.13) 46px, rgba(0,0,0,0) 66px, rgba(0,0,0,0.38) 92px), linear-gradient(180deg, #4b2a6e 0%, #3a2050 48%, #2c1745 100%)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
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

      {/* tap hint — manual mode only, before the rise */}
      {!autoPlay && !risen && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] z-10 text-center font-display text-xs uppercase tracking-[0.35em] text-[#f4edfb]/90"
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
