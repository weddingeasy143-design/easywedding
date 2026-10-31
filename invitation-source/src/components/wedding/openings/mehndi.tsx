// src/components/wedding/openings/mehndi.tsx
// Design: Mehndi — "Trace the Mehndi" (Peacock Promise; New Delhi)
// Beat 0 (Reveal): trace one paisley outline in henna over a dotted guide.
// Beat 2 (Curtain): a sheer henna veil lifts up and over, revealing the
// couple's names as henna-brown matures to gold.
// 100% coded CSS/SVG — no external images.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ORDERED_COUPLE } from "@/content/wedding";
import { copyText } from "../../../../adapters/copy";
import PetalField from "../PetalField";

/* Original paisley (teardrop with a hooked tip), drawn for this design.
   ViewBox 0 0 200 260, centre ~(100,140). */
const PAISLEY_PATH =
  "M100 16 C112 20 118 30 114 40 C110 50 98 52 92 44 C86 36 90 26 100 24 " +
  "C128 44 156 82 156 126 C156 176 130 220 100 236 C70 220 44 176 44 126 " +
  "C44 88 62 56 88 36";

/* Tiny dots ringing the paisley — deterministic ellipse placement. */
const RING_DOTS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  return {
    cx: 100 + Math.cos(a) * 88,
    cy: 132 + Math.sin(a) * 118,
  };
});

/* Large faint paisleys + mandalas printed on the veil — deterministic. */
const VEIL_PRINT = [
  { x: "8%", y: "10%", s: 120, r: -18, o: 0.1 },
  { x: "68%", y: "6%", s: 150, r: 14, o: 0.08 },
  { x: "38%", y: "34%", s: 190, r: -6, o: 0.07 },
  { x: "4%", y: "58%", s: 140, r: 20, o: 0.09 },
  { x: "72%", y: "62%", s: 120, r: -22, o: 0.1 },
  { x: "30%", y: "76%", s: 100, r: 10, o: 0.08 },
] as const;

function PaisleyGlyph({
  size,
  rotate,
  opacity,
}: {
  size: number;
  rotate: number;
  opacity: number;
}) {
  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 200 260"
      fill="none"
      style={{ transform: `rotate(${rotate}deg)`, opacity }}
      aria-hidden
    >
      <path d={PAISLEY_PATH} stroke="#e6dba5" strokeWidth="2.5" />
      <path
        d={PAISLEY_PATH}
        stroke="#e6dba5"
        strokeWidth="1"
        strokeDasharray="0.5 7"
        strokeLinecap="round"
        transform="translate(100 130) scale(0.78) translate(-100 -130)"
      />
      <circle cx="100" cy="140" r="10" stroke="#e6dba5" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Beat 0 — Trace the Mehndi ─────────────────────────────────── */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const cfg =
    typeof window !== "undefined"
      ? (window as any).__easyWedding?.config
      : undefined;
  void cfg;

  const [progress, setProgress] = useState(0);
  const [dot, setDot] = useState<{ x: number; y: number } | null>(null);
  const [completing, setCompleting] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const pressedRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const startRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const distRef = useRef(0);
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
    setCompleting(true);
    setProgress((p) => Math.max(p, 1));
    timerRef.current = setTimeout(() => {
      if (calledRef.current) return;
      calledRef.current = true;
      onReveal();
    }, 500);
  }, [onReveal]);

  const localPoint = (e: React.PointerEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    return {
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (finishingRef.current) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    rootRef.current?.setPointerCapture?.(e.pointerId);
    pressedRef.current = true;
    const p = localPoint(e);
    lastRef.current = p;
    startRef.current = { t: Date.now(), x: p.x, y: p.y };
    setDot(p);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pressedRef.current || finishingRef.current) return;
    const p = localPoint(e);
    setDot(p);
    const last = lastRef.current;
    if (last) {
      distRef.current += Math.hypot(p.x - last.x, p.y - last.y);
      const next = Math.min(1, distRef.current / 750);
      setProgress(next);
      if (next >= 0.65) finish();
    }
    lastRef.current = p;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    const start = startRef.current;
    setDot(null);
    if (finishingRef.current || !start) return;
    const p = localPoint(e);
    const dt = Date.now() - start.t;
    const moved = Math.hypot(p.x - start.x, p.y - start.y);
    // plain tap fallback — a quick, still touch completes the trace
    if (dt < 300 && moved < 10) finish();
  };

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        background: "linear-gradient(165deg, #082d30 0%, #0d3535 55%, #123d3d 100%)",
        touchAction: "none",
        cursor: "pointer",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      aria-label="Trace the mehndi to reveal the invitation"
    >
      {/* henna-border frame — thin double border, corner paisley dots */}
      <div
        className="pointer-events-none absolute inset-3 rounded-[22px] border border-[#c2b376]/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-[18px] rounded-[18px] border border-[#c2b376]/25"
        aria-hidden
      />
      {[
        "left-[10px] top-[10px]",
        "right-[10px] top-[10px]",
        "bottom-[10px] left-[10px]",
        "bottom-[10px] right-[10px]",
      ].map((pos) => (
        <span
          key={pos}
          className={`pointer-events-none absolute ${pos} flex gap-1`}
          aria-hidden
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#c2b376]/80" />
          <span className="h-1 w-1 rounded-full bg-[#c2b376]/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#c2b376]/80" />
        </span>
      ))}

      {/* soft teal glow behind the paisley */}
      <div
        className="pointer-events-none absolute left-1/2 top-[46%] h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(57,160,160,0.22) 0%, rgba(42,127,127,0.10) 45%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* the paisley — dotted guide, solid henna line, peacock-feather eye */}
      <div className="absolute inset-0 flex items-center justify-center pb-16">
        <svg
          viewBox="0 0 200 260"
          className="h-[54%] max-h-[430px] w-auto"
          fill="none"
          aria-hidden
        >
          {/* dotted guide */}
          <path
            d={PAISLEY_PATH}
            stroke="#c2b376"
            strokeOpacity="0.35"
            strokeWidth="2.5"
            strokeDasharray="0.5 6"
            strokeLinecap="round"
          />
          {/* solid henna line drawing over the guide */}
          <path
            d={PAISLEY_PATH}
            stroke="#d8c98a"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 * (1 - progress)}
            style={{ filter: "drop-shadow(0 0 5px rgba(216,201,138,0.45))" }}
          />
          {/* ring of tiny dots — lights up at completion */}
          {RING_DOTS.map((d, i) => (
            <circle
              key={i}
              cx={d.cx}
              cy={d.cy}
              r="2.2"
              fill="#e6dba5"
              opacity={completing ? 0.95 : 0.14}
              style={{ transition: `opacity 0.4s ease ${i * 0.03}s` }}
            />
          ))}
          {/* peacock-feather eye at the paisley's inner top */}
          <motion.g
            animate={
              completing
                ? { scale: [1, 1.22, 1], opacity: [1, 1, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ transformOrigin: "100px 74px" }}
          >
            <ellipse cx="100" cy="74" rx="17" ry="25" fill="#c2b376" opacity={completing ? 1 : 0.75} />
            <ellipse cx="100" cy="74" rx="12.5" ry="19" fill="#2a7f7f" />
            <ellipse cx="100" cy="74" rx="8.5" ry="13.5" fill="#2e9e6b" />
            <ellipse cx="100" cy="76" rx="4.5" ry="7.5" fill="#e6dba5" />
            <ellipse cx="100" cy="76" rx="2" ry="3.4" fill="#082d30" />
          </motion.g>
        </svg>
      </div>

      {/* henna dot following the pointer */}
      {dot && !completing && (
        <span
          className="pointer-events-none absolute z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: dot.x,
            top: dot.y,
            background: "radial-gradient(circle at 35% 35%, #e6dba5, #a9763f)",
            boxShadow: "0 0 10px rgba(216,201,138,0.8)",
          }}
          aria-hidden
        />
      )}

      {/* completion pulse ring */}
      {completing && (
        <motion.span
          className="pointer-events-none absolute left-1/2 top-[46%] z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e6dba5]"
          initial={{ width: 60, height: 60, opacity: 0.9 }}
          animate={{ width: 340, height: 340, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          aria-hidden
        />
      )}

      {/* hint */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-[7%] text-center font-display text-sm text-[#e5efda]/85"
        style={{ letterSpacing: "0.05em" }}
        animate={{ opacity: completing ? 0 : [0.6, 0.92, 0.6] }}
        transition={
          completing
            ? { duration: 0.3 }
            : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      >
        {copyText(90, "Trace the mehndi")}
      </motion.p>
    </div>
  );
}

/* ── Beat 2 — The Henna Veil ───────────────────────────────────── */
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

  const [lifted, setLifted] = useState(false);
  const [matured, setMatured] = useState(false);
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

  // autoPlay: veil lifts at ~1100ms, names mature, onDone once at ~4200ms
  useEffect(() => {
    if (!autoPlay) return;
    later(() => {
      setLifted(true);
      later(() => setMatured(true), 350);
    }, 1100);
    later(fireDone, 4200);
  }, [autoPlay, later, fireDone]);

  // manual: a tap starts the lift, onDone ~2400ms after
  const handleTap = () => {
    if (autoPlay || lifted) return;
    setLifted(true);
    later(() => setMatured(true), 350);
    later(fireDone, 2400);
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "#0d3436" }}
      onClick={handleTap}
    >
      {/* revealed names layer — UNDER the veil */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(57,160,160,0.20) 0%, transparent 65%)",
          }}
          aria-hidden
        />
        {lifted && (
          <PetalField
            count={10}
            palette="marigold"
            className="pointer-events-none absolute inset-0 opacity-50"
          />
        )}
        <div className="relative">
          {/* henna-brown maturing to gold — colour transition over 1.2s */}
          <div
            style={{
              color: matured ? "#e6dba5" : "#c98d4e",
              transition: "color 1.2s ease",
            }}
          >
            <motion.p
              className="font-display font-semibold text-7xl leading-[1.08] lg:text-9xl"
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={lifted ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
            >
              {ORDERED_COUPLE[0].name}
            </motion.p>
            <motion.p
              className="my-1 font-display text-lg italic opacity-80 lg:text-2xl"
              initial={{ opacity: 0, y: 10, scale: 0.88 }}
              animate={lifted ? { opacity: 0.8, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.72 }}
            >
              weds
            </motion.p>
            <motion.p
              className="font-display font-semibold text-7xl leading-[1.08] lg:text-9xl"
              initial={{ opacity: 0, y: -18, scale: 0.94 }}
              animate={lifted ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.88 }}
            >
              {ORDERED_COUPLE[1].name}
            </motion.p>
          </div>
          {/* gold underline flourish growing under the names */}
          <motion.div
            className="mx-auto mt-5 h-[2px] rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #c2b376 20%, #e6dba5 50%, #c2b376 80%, transparent)",
            }}
            initial={{ width: "0%" }}
            animate={lifted ? { width: "62%" } : {}}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
            aria-hidden
          />
        </div>
      </div>

      {/* the sheer henna veil (odhni) — lifts up and over */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ y: lifted ? "-103%" : "0%" }}
        transition={{ duration: 1.7, ease: [0.7, 0, 0.24, 1] }}
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(170deg, rgba(18,80,66,0.88) 0%, rgba(13,62,54,0.92) 55%, rgba(9,46,42,0.95) 100%)",
          }}
        />
        {/* printed paisleys + dotted mandala circles */}
        {VEIL_PRINT.map((p, i) => (
          <span key={i} className="absolute" style={{ left: p.x, top: p.y }}>
            <PaisleyGlyph size={p.s} rotate={p.r} opacity={p.o} />
          </span>
        ))}
        {[
          { left: "16%", top: "26%", size: 150 },
          { left: "58%", top: "44%", size: 190 },
          { left: "24%", top: "64%", size: 120 },
        ].map((m, i) => (
          <svg
            key={i}
            width={m.size}
            height={m.size}
            viewBox="0 0 100 100"
            className="absolute"
            style={{ left: m.left, top: m.top, opacity: 0.12 }}
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke="#e6dba5" strokeWidth="1" strokeDasharray="0.5 5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="#e6dba5" strokeWidth="1" strokeDasharray="0.5 5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="17" fill="none" stroke="#e6dba5" strokeWidth="1" />
          </svg>
        ))}
        {/* rolled fold band riding the veil's bottom edge */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: 46,
            background:
              "linear-gradient(180deg, rgba(230,219,165,0.9) 0px, rgba(230,219,165,0.9) 2px, #0a3a30 4px, #06231d 60%, #04150f 100%)",
            boxShadow: "0 -6px 18px rgba(0,0,0,0.35), 0 8px 22px rgba(0,0,0,0.4)",
          }}
        />
      </motion.div>

      {/* tap hint — manual mode only, before the lift */}
      {!autoPlay && !lifted && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] z-10 text-center font-display text-sm text-[#e5efda]/90"
          style={{ letterSpacing: "0.05em" }}
          animate={{ opacity: [0.65, 0.95, 0.65] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          Tap to lift the veil
        </motion.p>
      )}
    </div>
  );
}
