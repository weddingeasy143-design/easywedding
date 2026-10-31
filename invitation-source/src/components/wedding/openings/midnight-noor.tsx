"use client";

// midnight-noor — "Light the Noor" (Starlit Vows) — DARK WORLD
// Beat 0: press-and-hold to light a hanging lantern under a crescent moon.
// Beat 2: moonlit sheer drapes dissolve into star particles as a wedge of
// moonlight opens at the centre, revealing the names in a moonbeam sweep.
// 100% coded CSS/SVG (lantern + crescent drawn here) — no external images.

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

// deterministic star field — index math only, never Math.random in render
const STARS = Array.from({ length: 25 }, (_, i) => ({
  left: ((i * 37 + 11) % 94) + 3,
  top: ((i * 53 + 7) % 68) + 3,
  size: 1 + ((i * 7) % 2),
  twinkleDelay: (i % 7) * 0.35,
  base: 0.3 + (((i * 29) % 40) / 100),
}));

/** Original crescent drawn with an SVG mask (moon disc minus offset disc). */
function Crescent({
  size = 64,
  opacity = 0.6,
  glow = 0,
  idSuffix,
}: {
  size?: number;
  opacity?: number;
  glow?: number;
  idSuffix: string;
}) {
  const id = `noor-crescent-${idSuffix}`;
  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      aria-hidden
      style={{
        opacity,
        filter: `drop-shadow(0 0 ${6 + glow * 16}px rgba(224,232,255,${0.35 + glow * 0.45}))`,
      }}
    >
      <defs>
        <mask id={id}>
          <circle cx="30" cy="30" r="22" fill="#fff" />
          <circle cx="41" cy="23" r="19" fill="#000" />
        </mask>
      </defs>
      <circle cx="30" cy="30" r="22" fill="#aebfe4" mask={`url(#${id})`} />
    </svg>
  );
}

/* ── Beat 0 — Light the Noor ────────────────────────────────── */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const [glow, setGlow] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const glowRef = useRef(0);
  const doneRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressRef = useRef<{ t: number; moved: boolean }>({ t: 0, moved: false });

  const config = getConfig();
  const dateLabel = formatDate(config.date ?? "2026-12-19");

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopInterval();
    setFinishing(true);
    timerRef.current = setTimeout(() => onReveal(), 500);
  }, [onReveal, stopInterval]);

  const runInterval = useCallback(
    (mode: "hold" | "decay" | "auto") => {
      stopInterval();
      intervalRef.current = setInterval(() => {
        if (mode === "decay") {
          glowRef.current = Math.max(0, glowRef.current - 1 / 120);
          setGlow(glowRef.current);
          if (glowRef.current <= 0) stopInterval();
          return;
        }
        glowRef.current = Math.min(1, glowRef.current + 1 / 60);
        setGlow(glowRef.current);
        if (glowRef.current >= 1) finish();
      }, 20);
    },
    [finish, stopInterval]
  );

  useEffect(
    () => () => {
      stopInterval();
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [stopInterval]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (finishing || doneRef.current) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pressRef.current = { t: Date.now(), moved: false };
    runInterval("hold");
  };

  const onPointerUp = () => {
    if (finishing || doneRef.current) return;
    // Any release before the hold completes still lights the lantern:
    // the glow auto-builds to full and the normal finish path proceeds,
    // so a quick tap or short press never strands a near-black frame.
    if (glowRef.current < 1) {
      runInterval("auto");
    } else {
      stopInterval();
    }
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0b1830 0%, #101f3a 55%, #14243f 100%)",
        touchAction: "none",
        cursor: "pointer",
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      aria-label="Press and hold to light the lantern"
    >
      {/* faint stars, brightening with the glow */}
      {STARS.map((s, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            background: "#e0e8ff",
          }}
          animate={{ opacity: [s.base, Math.min(1, s.base + 0.45 + glow * 0.3), s.base + glow * 0.35] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: s.twinkleDelay, ease: "easeInOut" }}
          aria-hidden
        />
      ))}

      {/* crescent at top centre, brightening as the noor builds */}
      <div className="pointer-events-none absolute left-1/2 top-[7%] -translate-x-1/2" aria-hidden>
        <Crescent size={58} opacity={0.5 + glow * 0.5} glow={glow} idSuffix="reveal" />
      </div>

      {/* hanging lantern (fanous), drawn in SVG */}
      <div className="absolute left-1/2 top-[19%] -translate-x-1/2" style={{ width: 150 }}>
        {/* halo behind the lantern */}
        <div
          className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 250,
            height: 250,
            background:
              "radial-gradient(circle, rgba(224,232,255,0.85) 0%, rgba(174,191,228,0.35) 42%, transparent 70%)",
            opacity: glow * 0.75,
          }}
          aria-hidden
        />
        <svg viewBox="0 0 120 196" className="relative w-full" aria-hidden>
          <defs>
            <radialGradient id="noor-lantern-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fdf6d8" />
              <stop offset="45%" stopColor="#e0e8ff" />
              <stop offset="100%" stopColor="#e0e8ff" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* chain */}
          <line x1="60" y1="0" x2="60" y2="26" stroke="#d4dded" strokeWidth="1.6" opacity="0.75" />
          <circle cx="60" cy="31" r="4.5" fill="none" stroke="#d4dded" strokeWidth="1.6" opacity="0.8" />
          {/* dome */}
          <path
            d="M34 60 Q60 34 86 60 Z"
            fill="none"
            stroke="#d4dded"
            strokeWidth="2"
            opacity={0.45 + glow * 0.55}
          />
          <rect x="31" y="60" width="58" height="6" rx="2" fill="none" stroke="#d4dded" strokeWidth="1.6" opacity={0.45 + glow * 0.55} />
          {/* hexagonal body frame */}
          <polygon
            points="38,66 82,66 93,98 82,140 38,140 27,98"
            fill="rgba(11,24,48,0.55)"
            stroke="#d4dded"
            strokeWidth="2"
            opacity={0.55 + glow * 0.45}
          />
          {/* inner mullions */}
          <line x1="60" y1="66" x2="60" y2="140" stroke="#d4dded" strokeWidth="1" opacity={0.25 + glow * 0.35} />
          <line x1="30" y1="98" x2="90" y2="98" stroke="#d4dded" strokeWidth="1" opacity={0.25 + glow * 0.35} />
          {/* inner glow */}
          <ellipse cx="60" cy="103" rx="27" ry="32" fill="url(#noor-lantern-glow)" opacity={glow} />
          {/* candle + flame */}
          <rect x="56" y="118" width="8" height="16" rx="1.5" fill="#d4dded" opacity={0.25 + glow * 0.6} />
          <path
            d="M60 100 C64 108 64 113 60 117 C56 113 56 108 60 100 Z"
            fill="#f5d98b"
            opacity={glow}
            style={{ filter: `drop-shadow(0 0 ${4 + glow * 8}px rgba(245,217,139,0.9))` }}
          />
          {/* base + finial */}
          <rect x="38" y="140" width="44" height="5" rx="2" fill="none" stroke="#d4dded" strokeWidth="1.6" opacity={0.45 + glow * 0.55} />
          <line x1="60" y1="145" x2="60" y2="156" stroke="#d4dded" strokeWidth="1.6" opacity="0.7" />
          <circle cx="60" cy="161" r="3.5" fill="#aebfe4" opacity={0.5 + glow * 0.5} />
        </svg>
      </div>

      {/* date staging under the lantern */}
      {dateLabel ? (
        <p
          className="pointer-events-none absolute inset-x-0 top-[68%] text-center font-display text-xs"
          style={{ color: "#d4dded", letterSpacing: "0.05em", opacity: 0.55 + glow * 0.45 }}
          aria-hidden
        >
          {dateLabel}
          {config.city ? `  ·  ${config.city}` : ""}
        </p>
      ) : null}

      {/* light spill at full glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 75% at 50% 42%, rgba(224,232,255,0.9) 0%, rgba(174,191,228,0.45) 45%, transparent 75%)",
        }}
        initial={false}
        animate={{ opacity: finishing ? 0.5 : 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        aria-hidden
      />

      {/* hint */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-[7%] px-6 text-center font-display text-sm"
        style={{ color: "#e2eafa", letterSpacing: "0.05em" }}
        animate={{ opacity: finishing ? 0 : [0.6, 0.92, 0.6] }}
        transition={
          finishing
            ? { duration: 0.3 }
            : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      >
        {copyText(9101, "Press and hold to light the noor")}
      </motion.p>
    </div>
  );
}

/* ── Beat 2 — Moonlit Sheer Curtain ─────────────────────────── */
export function Curtain({
  onDone,
  autoPlay,
}: {
  onDone: () => void;
  autoPlay?: boolean;
}) {
  const [parting, setParting] = useState(false);
  const [bright, setBright] = useState(false);
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

  const begin = useCallback(() => {
    setParting(true);
    later(() => setBright(true), 950);
  }, [later]);

  useEffect(() => {
    if (!autoPlay) return;
    later(begin, 1100);
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
    begin();
    later(fireDone, 2400);
  };

  // ~26 star particles pre-placed on the panels; they drift away from centre
  const particles = Array.from({ length: 26 }, (_, i) => {
    const left = ((i * 31 + 9) % 92) + 4;
    const top = ((i * 43 + 6) % 88) + 5;
    const fromCentre = left - 50;
    return {
      left,
      top,
      size: 1.5 + ((i * 7) % 3),
      driftX: fromCentre * 1.6 + (fromCentre >= 0 ? 18 : -18),
      driftY: -14 + ((i * 17) % 30),
      delay: ((i * 13) % 50) / 100,
    };
  });

  const nameStyle: React.CSSProperties = {
    color: bright ? "#e2eafa" : "#8fa3c8",
    textShadow: bright ? "0 0 18px rgba(224,232,255,0.45)" : "none",
    transition: "color 0.9s ease, text-shadow 0.9s ease",
    lineHeight: 1.12,
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0b1830 0%, #14243f 100%)",
        cursor: autoPlay ? undefined : "pointer",
      }}
      onClick={handleTap}
      role="button"
      aria-label="Reveal the couple's names"
    >
      {/* names — UNDER the sheer drapes */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div className="relative overflow-hidden px-4 py-2">
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.94 }}
            animate={parting ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          >
            <p className="font-display font-semibold" style={{ ...nameStyle, fontSize: "clamp(3rem, 12.5vw, 5rem)" }}>
              {ORDERED_COUPLE[0].name}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.88 }}
            animate={parting ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.68 }}
          >
            <p
              className="font-display italic"
              style={{ ...nameStyle, fontSize: "1.05rem", margin: "0.2rem 0" }}
            >
              weds
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.94 }}
            animate={parting ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.84 }}
          >
            <p className="font-display font-semibold" style={{ ...nameStyle, fontSize: "clamp(3rem, 12.5vw, 5rem)" }}>
              {ORDERED_COUPLE[1].name}
            </p>
          </motion.div>

          {/* moonbeam sweep — leaves the names bright behind it */}
          {parting && (
            <motion.div
              className="pointer-events-none absolute inset-y-0"
              style={{
                width: "55%",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(224,232,255,0.55) 50%, transparent 100%)",
                mixBlendMode: "screen",
                filter: "blur(4px)",
              }}
              initial={{ left: "-20%", opacity: 0 }}
              animate={{ left: "120%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.5, delay: 0.35, times: [0, 0.15, 0.85, 1], ease: "easeInOut" }}
              aria-hidden
            />
          )}
        </div>
        {(dateLabel || config.venue) && (
          <motion.p
            className="mt-5 font-display text-xs"
            style={{ color: "#d4dded", letterSpacing: "0.05em" }}
            initial={false}
            animate={{ opacity: bright ? 0.75 : 0 }}
            transition={{ duration: 0.9 }}
            aria-hidden
          >
            {[dateLabel, config.venue].filter(Boolean).join("  ·  ")}
          </motion.p>
        )}
      </div>

      {/* wedge of moonlight opening at the centre */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(224,232,255,0.5) 28%, rgba(240,245,255,0.75) 50%, rgba(224,232,255,0.5) 72%, transparent 100%)",
          filter: "blur(10px)",
        }}
        initial={false}
        animate={{ width: parting ? "34%" : "0%", opacity: parting ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        aria-hidden
      />

      {/* moonlit sheer drapes — they dissolve, they do NOT slide */}
      {(["left", "right"] as const).map((side) => (
        <motion.div
          key={side}
          className={`pointer-events-none absolute inset-y-0 ${side === "left" ? "left-0" : "right-0"} w-[50.5%]`}
          style={{
            background:
              "linear-gradient(180deg, rgba(20,36,63,0.92) 0%, rgba(16,30,54,0.94) 100%), repeating-linear-gradient(90deg, rgba(224,232,255,0.05) 0px, transparent 14px, rgba(224,232,255,0.02) 28px)",
            backgroundBlendMode: "normal",
            boxShadow:
              side === "left"
                ? "inset -18px 0 32px rgba(224,232,255,0.06)"
                : "inset 18px 0 32px rgba(224,232,255,0.06)",
          }}
          initial={false}
          animate={{ opacity: parting ? 0 : 1 }}
          transition={{ duration: 1.6, delay: parting ? 0.25 : 0, ease: "easeInOut" }}
          aria-hidden
        />
      ))}

      {/* crescent motif glowing at top centre, over the drapes */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[8%] -translate-x-1/2"
        initial={false}
        animate={{ opacity: parting ? 0 : 0.85 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        aria-hidden
      >
        <Crescent size={46} opacity={1} glow={0.5} idSuffix="curtain" />
      </motion.div>

      {/* panel star dots dissolving into particles, drifting outward */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: "#e0e8ff",
            }}
            initial={false}
            animate={
              parting
                ? { x: p.driftX, y: p.driftY, opacity: 0 }
                : { x: 0, y: 0, opacity: 0.65 }
            }
            transition={{ duration: 1.4, delay: parting ? p.delay : 0, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* tap hint — manual mode only, while closed */}
      {!autoPlay && !parting && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] text-center font-display text-sm"
          style={{ color: "#e2eafa", letterSpacing: "0.05em" }}
          animate={{ opacity: [0.65, 0.95, 0.65] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          {copyText(9102, "Tap to unveil")}
        </motion.p>
      )}
    </div>
  );
}
