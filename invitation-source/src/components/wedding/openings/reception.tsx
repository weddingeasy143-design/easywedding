"use client";

// reception — "Liquid-Glass Toast" (Champagne Forever)
// Beat 0: a frosted liquid-glass card floats over a warm coded bokeh
// celebration scene; the visitor drags the glass up (tap as fallback) and
// it melts away, revealing the couple's names in editorial display type.
// Beat 2: falling light-droplet / shimmer strands dissolve away over a
// deep bronze panel, revealing the names at editorial scale.
// 100% coded CSS/SVG — no external images.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ORDERED_COUPLE } from "@/content/wedding";
import { copyText } from "../../../../adapters/copy";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(iso?: string): string {
  if (!iso) return "";
  const parts = iso.split("-").map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return "";
  const [y, m, d] = parts as [number, number, number];
  if (m < 1 || m > 12) return "";
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function getConfig(): Record<string, string | undefined> {
  if (typeof window === "undefined") return {};
  return ((window as any).__easyWedding?.config ?? {}) as Record<
    string,
    string | undefined
  >;
}

const GOLD = "#d9b96a";
const GOLD_LIGHT = "#f0d99a";
const IVORY = "#fdf6e3";

/* warm bokeh glows — deterministic placement */
const BOKEH = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 29 + 7) % 96}%`,
  top: `${(i * 37 + 5) % 88}%`,
  size: 26 + ((i * 41) % 74),
  opacity: 0.1 + ((i * 13) % 22) / 100,
  warm: i % 3 === 0 ? "#e8975a" : i % 3 === 1 ? "#f0d99a" : "#d9b96a",
  drift: 2.6 + (i % 5) * 0.5,
}));

/* ── Beat 0 — Liquid-Glass Toast ────────────────────────────── */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const [progress, setProgress] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const doneRef = useRef(false);
  const dragRef = useRef<{ y: number; x: number; t: number; active: boolean }>({
    y: 0,
    x: 0,
    t: 0,
    active: false,
  });
  const progressRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = getConfig();
  const dateLabel = formatDate(config.date ?? "2026-12-19");

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setFinishing(true);
    setProgress(1);
    progressRef.current = 1;
    timerRef.current = setTimeout(() => onReveal(), 650);
  }, [onReveal]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (finishing) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { y: e.clientY, x: e.clientX, t: Date.now(), active: true };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || finishing) return;
    const dy = dragRef.current.y - e.clientY;
    const p = Math.max(0, Math.min(1, dy / 180));
    progressRef.current = p;
    setProgress(p);
    if (p >= 0.62) finish();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (finishing) return;
    const dt = Date.now() - dragRef.current.t;
    const dist = Math.hypot(
      e.clientX - dragRef.current.x,
      e.clientY - dragRef.current.y
    );
    if (progressRef.current >= 0.45 || (dt < 300 && dist < 10)) {
      finish();
    } else {
      progressRef.current = 0;
      setProgress(0);
    }
  };

  const amt = finishing ? 1 : progress;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #1f1208 0%, #3a2210 42%, #59331a 72%, #2a180c 100%)",
        touchAction: "none",
        cursor: "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      aria-label="Drag the glass up to reveal the invitation"
    >
      {/* ── warm coded celebration backdrop: bokeh glows + blurred shapes ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {BOKEH.map((b, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: b.left,
              top: b.top,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle, ${b.warm} 0%, transparent 68%)`,
              opacity: b.opacity,
              filter: "blur(6px)",
            }}
            animate={{ y: [0, -12, 0], opacity: [b.opacity, b.opacity + 0.08, b.opacity] }}
            transition={{ duration: b.drift, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        {/* large blurred amber shapes for depth */}
        <div
          className="absolute -left-16 top-[16%] h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(232,151,90,0.32) 0%, transparent 70%)", filter: "blur(18px)" }}
        />
        <div
          className="absolute -right-14 bottom-[10%] h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(217,185,106,0.28) 0%, transparent 70%)", filter: "blur(20px)" }}
        />
      </div>

      {/* ── the names, standing behind the glass ── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[13%] px-6 text-center"
        style={{
          opacity: 0.18 + amt * 0.82,
          transform: `translateY(${(1 - amt) * 18}px) scale(${0.93 + amt * 0.07})`,
          transition: finishing ? "opacity 0.6s ease, transform 0.65s cubic-bezier(0.22,1,0.36,1)" : "none",
        }}
        aria-hidden={amt < 0.4}
      >
        <p
          className="font-display"
          style={{ color: IVORY, fontSize: "clamp(2.9rem, 12.5vw, 4.4rem)", lineHeight: 1.04, fontWeight: 500 }}
        >
          {ORDERED_COUPLE[0].name}
        </p>
        <div className="my-3 flex items-center justify-center gap-3">
          <span className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
          <span className="font-display italic" style={{ color: GOLD_LIGHT, fontSize: "1.15rem" }}>
            &amp;
          </span>
          <span className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
        </div>
        <p
          className="font-display"
          style={{ color: IVORY, fontSize: "clamp(2.9rem, 12.5vw, 4.4rem)", lineHeight: 1.04, fontWeight: 500 }}
        >
          {ORDERED_COUPLE[1].name}
        </p>
        {dateLabel ? (
          <p className="mt-5" style={{ color: GOLD_LIGHT, fontSize: 14, letterSpacing: "0.05em", opacity: 0.9 }}>
            {dateLabel}
            {config.city ? ` · ${config.city}` : ""}
          </p>
        ) : null}
      </div>

      {/* ── the frosted liquid-glass card ── */}
      <div
        className="absolute flex flex-col items-center justify-center px-6 text-center"
        style={{
          left: "10%",
          right: "10%",
          top: "34%",
          height: "44%",
          borderRadius: 28,
          background:
            "linear-gradient(155deg, rgba(255,248,230,0.22) 0%, rgba(255,240,210,0.1) 48%, rgba(230,190,120,0.14) 100%)",
          backdropFilter: `blur(${18 - amt * 9}px) saturate(1.35)`,
          WebkitBackdropFilter: `blur(${18 - amt * 9}px) saturate(1.35)`,
          border: "1px solid rgba(255,238,205,0.5)",
          boxShadow:
            "0 24px 54px rgba(10,4,0,0.45), inset 0 1px 0 rgba(255,250,235,0.55), inset 0 -1px 0 rgba(217,185,106,0.25)",
          transform: `translateY(${-amt * 72}%) scale(${1 + amt * 0.05})`,
          opacity: 1 - amt * 0.92,
          filter: `blur(${amt * 5}px)`,
          transition: finishing
            ? "transform 0.65s cubic-bezier(0.22,1,0.36,1), opacity 0.6s ease, filter 0.6s ease"
            : progress === 0
              ? "transform 0.35s ease, opacity 0.35s ease, filter 0.35s ease"
              : "none",
          pointerEvents: "none",
        }}
        aria-hidden
      >
        {/* diagonal sheen */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: 28 }}
        >
          <div
            className="absolute inset-y-0 w-1/2"
            style={{
              left: "-20%",
              background:
                "linear-gradient(100deg, transparent 0%, rgba(255,252,240,0.28) 50%, transparent 100%)",
              transform: "skewX(-14deg)",
            }}
          />
        </div>

        {/* two coded coupe glasses, raised in a toast */}
        <svg viewBox="0 0 96 54" className="relative mb-4 h-12 w-24" aria-hidden>
          <g stroke={GOLD_LIGHT} strokeWidth="1.6" fill="none" strokeLinecap="round">
            <path d="M14 6 h30 a15 11 0 0 1 -30 0 Z" fill="rgba(240,217,154,0.18)" />
            <path d="M29 17 v22 M18 43 h22" />
            <path d="M52 6 h30 a15 11 0 0 1 -30 0 Z" fill="rgba(240,217,154,0.18)" />
            <path d="M67 17 v22 M56 43 h22" />
          </g>
          <circle cx="48" cy="4" r="1.8" fill={GOLD_LIGHT} />
          <circle cx="42" cy="9" r="1.2" fill={GOLD_LIGHT} opacity="0.8" />
          <circle cx="55" cy="10" r="1.3" fill={GOLD_LIGHT} opacity="0.7" />
        </svg>

        <p className="relative font-display italic" style={{ color: IVORY, fontSize: 19, opacity: 0.95 }}>
          {copyText(9001, "A toast to forever")}
        </p>
        {/* the one champagne-gold accent rule */}
        <span
          className="relative my-4 block h-px w-24"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
        />
        {dateLabel ? (
          <p className="relative" style={{ color: "rgba(253,246,227,0.82)", fontSize: 13.5, letterSpacing: "0.05em" }}>
            {dateLabel}
            {config.city ? ` · ${config.city}` : ""}
          </p>
        ) : null}
      </div>

      {/* hint — quiet modern treatment */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-[6%] text-center"
        style={{ color: "rgba(253,246,227,0.85)", fontSize: 13.5, letterSpacing: "0.05em" }}
        animate={{ opacity: finishing ? 0 : [0.55, 1, 0.55], y: finishing ? 0 : [0, -5, 0] }}
        transition={
          finishing
            ? { duration: 0.3 }
            : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      >
        {copyText(9002, "Drag the glass up — or tap to toast")}
      </motion.p>
    </div>
  );
}

/* ── Beat 2 — Light-Droplet Shimmer Curtain ─────────────────── */
export function Curtain({
  onDone,
  autoPlay,
}: {
  onDone: () => void;
  autoPlay?: boolean;
}) {
  const [parting, setParting] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const config = getConfig();
  const dateLabel = formatDate(config.date ?? "2026-12-19");

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  const fireDone = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    later(() => setParting(true), 1100);
    later(fireDone, 4200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    },
    []
  );

  const handleTap = () => {
    if (autoPlay || parting) return;
    setParting(true);
    later(fireDone, 2400);
  };

  // light-droplet strands — thin shimmer threads with falling droplets
  const strands = Array.from({ length: 22 }, (_, i) => ({
    delay: i * 0.07,
    threadOpacity: 0.14 + ((i * 11) % 20) / 100,
    droplets: Array.from({ length: 4 + ((i * 3) % 3) }, (_, j) => ({
      top: `${8 + j * 24 + ((i * 7) % 9)}%`,
      size: 3 + ((i + j * 2) % 4),
      gold: (i + j) % 2 === 0,
      opacity: 0.5 + (((i * 7 + j * 13) % 45) / 100),
    })),
  }));

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #241407 0%, #3a2210 55%, #241407 100%)",
        cursor: autoPlay ? undefined : "pointer",
      }}
      onClick={handleTap}
      role="button"
      aria-label="Reveal the couple's names"
    >
      {/* warm glow behind the names */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[92vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(240,217,154,0.3) 0%, rgba(217,185,106,0.1) 48%, transparent 70%)",
          filter: "blur(8px)",
        }}
        initial={false}
        animate={parting ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
        aria-hidden
      />

      {/* names — UNDER the strands, editorial scale, kinetic entrance */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={false}
          animate={
            parting
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.92, y: 22 }
          }
          transition={{ duration: 1.15, delay: parting ? 0.55 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="font-display"
            style={{ color: IVORY, fontSize: "clamp(2.9rem, 12.5vw, 4.4rem)", lineHeight: 1.04, fontWeight: 500 }}
          >
            {ORDERED_COUPLE[0].name}
          </p>
          <div className="my-3 flex items-center justify-center gap-3">
            <span className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <span className="font-display italic" style={{ color: GOLD_LIGHT, fontSize: "1.15rem" }}>
              &amp;
            </span>
            <span className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>
          <p
            className="font-display"
            style={{ color: IVORY, fontSize: "clamp(2.9rem, 12.5vw, 4.4rem)", lineHeight: 1.04, fontWeight: 500 }}
          >
            {ORDERED_COUPLE[1].name}
          </p>
          {(dateLabel || config.venue) && (
            <p className="mt-6" style={{ color: GOLD_LIGHT, fontSize: 14, letterSpacing: "0.05em", opacity: 0.85 }}>
              {[dateLabel, config.venue].filter(Boolean).join("  ·  ")}
            </p>
          )}
        </motion.div>
      </div>

      {/* warm veil beneath the droplets */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(84,52,22,0.92) 0%, rgba(58,34,16,0.94) 55%, rgba(36,20,7,0.96) 100%)",
        }}
        initial={false}
        animate={parting ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 1.3, delay: parting ? 0.45 : 0, ease: "easeInOut" }}
        aria-hidden
      />

      {/* falling light-droplet / shimmer strands, dissolving away */}
      <div className="pointer-events-none absolute inset-0 flex justify-between px-3" aria-hidden>
        {strands.map((strand, i) => (
          <motion.div
            key={i}
            className="relative h-full"
            style={{ width: 8 }}
            initial={false}
            animate={parting ? { y: "46%", opacity: 0 } : { y: "0%", opacity: 1 }}
            transition={{ duration: 1.25, delay: parting ? strand.delay : 0, ease: "easeIn" }}
          >
            <span
              className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
              style={{
                background: `linear-gradient(180deg, transparent, rgba(240,217,154,${strand.threadOpacity + 0.25}), transparent)`,
              }}
            />
            {strand.droplets.map((d, j) => (
              <motion.span
                key={j}
                className="absolute left-1/2 rounded-full"
                style={{
                  top: d.top,
                  width: d.size,
                  height: d.size * 1.5,
                  marginLeft: -d.size / 2,
                  borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%",
                  background: d.gold
                    ? "radial-gradient(ellipse at 50% 30%, #fdf6e3 0%, #d9b96a 70%)"
                    : "radial-gradient(ellipse at 50% 30%, #ffffff 0%, #e8ddc4 70%)",
                  opacity: d.opacity,
                  boxShadow: "0 0 6px rgba(240,217,154,0.65)",
                }}
                animate={parting ? {} : { y: [0, 7, 0] }}
                transition={{ duration: 2 + (j % 3) * 0.4, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </motion.div>
        ))}
      </div>

      {/* tap hint — manual mode only, while closed */}
      {!autoPlay && !parting && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] text-center"
          style={{ color: "rgba(253,246,227,0.88)", fontSize: 13.5, letterSpacing: "0.05em" }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          {copyText(9003, "Tap to unveil")}
        </motion.p>
      )}
    </div>
  );
}
