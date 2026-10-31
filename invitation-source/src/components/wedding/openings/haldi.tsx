// src/components/wedding/openings/haldi.tsx
// "Haldi Splash" — Lucknow · Haldi ceremony
//  Reveal  (beat 0): a saturated turmeric-gold field under a cascade of
//          coded marigold petals. ONE swipe (a tap works too) spreads a
//          glossy haldi smear across the frame, a coded sunburst opens
//          inside it, and the couple's names rise at editorial scale.
//  Curtain (beat 2): "Marigold Toran" — hanging flower strands swing apart
//          from their top anchors like walking through a toran, and the
//          names appear inside a warm sunburst glow.
// 100% coded visuals — gradients, divs and SVG only. No images, no photos.
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { COUPLE } from "@/content/wedding";
import PetalField from "../PetalField";

const EASE = [0.22, 1, 0.36, 1] as const;

const PAPER = "#fff5d9";
const PANEL = "#f6e4b5";
const TURMERIC = "#dfba62";
const DEEP_TURMERIC = "#ab741e";
const INK = "#793d16";
const ORANGE = "#f76707";
const MARIGOLD = "#fab005";
const FLOWER_COLORS = ["#f76707", "#fab005", "#e8590c", "#ffd43b"] as const;

interface SiteConfig {
  date?: string;
  venue?: string;
  city?: string;
  groomName?: string;
  brideName?: string;
  partner1?: string;
  partner2?: string;
}

function readConfig(): SiteConfig | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return (window as unknown as { __easyWedding?: { config?: SiteConfig } })
      .__easyWedding?.config;
  } catch {
    return undefined;
  }
}

function useConfig(): SiteConfig | undefined {
  const [cfg] = useState<SiteConfig | undefined>(() => readConfig());
  return cfg;
}

/* Kinetic editorial name — letters scale/stagger in one by one. */
function KineticName({
  name,
  active,
  delay = 0,
  color = INK,
  fontSize = "clamp(3rem, 15vw, 4.7rem)",
}: {
  name: string;
  active: boolean;
  delay?: number;
  color?: string;
  fontSize?: string;
}) {
  return (
    <span
      className="inline-flex flex-wrap items-baseline justify-center font-display font-semibold leading-[1.05]"
      style={{ color, fontSize }}
      role="text"
      aria-label={name}
    >
      {name.split("").map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          style={{ display: "inline-block" }}
          initial={{ opacity: 0, scale: 1.7, y: 34, rotate: 6 }}
          animate={active ? { opacity: 1, scale: 1, y: 0, rotate: 0 } : {}}
          transition={{
            type: "spring",
            stiffness: 320,
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

/* Coded sunburst — radial rays via a repeating conic gradient, turning
   very slowly; scale/opacity are driven by the caller. */
function SunburstRays({
  size = "118vmin",
  opacity = 0.55,
}: {
  size?: string;
  opacity?: number;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
      style={{
        width: size,
        height: size,
        x: "-50%",
        y: "-50%",
        opacity,
        background:
          "repeating-conic-gradient(from 0deg, rgba(255,243,191,0.6) 0deg 5deg, rgba(255,243,191,0) 5deg 14deg)",
        WebkitMaskImage:
          "radial-gradient(circle, black 0%, black 34%, transparent 68%)",
        maskImage:
          "radial-gradient(circle, black 0%, black 34%, transparent 68%)",
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      aria-hidden
    />
  );
}

/* ── one coded marigold — concentric rings of petal circles ── */
function Marigold({ size = 190, pulse = false }: { size?: number; pulse?: boolean }) {
  const rings = [
    { radius: 0.4, count: 16, petal: 0.21 },
    { radius: 0.29, count: 12, petal: 0.19 },
    { radius: 0.18, count: 8, petal: 0.17 },
  ] as const;
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      initial={false}
      animate={pulse ? { scale: [1, 1.09, 1] } : { scale: 1 }}
      transition={pulse ? { duration: 0.55, ease: "easeInOut" } : { duration: 0.2 }}
      aria-hidden
    >
      {rings.map((ring, ri) =>
        Array.from({ length: ring.count }, (_, i) => {
          const angle = (i / ring.count) * Math.PI * 2 + ri * 0.32;
          const r = size * ring.radius;
          const d = size * ring.petal;
          return (
            <span
              key={`${ri}-${i}`}
              className="absolute rounded-full"
              style={{
                left: size / 2 + Math.cos(angle) * r - d / 2,
                top: size / 2 + Math.sin(angle) * r - d / 2,
                width: d,
                height: d,
                background: `radial-gradient(circle at 34% 30%, #fff3bf 0%, ${
                  FLOWER_COLORS[(i + ri) % FLOWER_COLORS.length]
                } 58%, ${DEEP_TURMERIC} 130%)`,
                boxShadow: "0 1px 4px rgba(121,61,22,0.28)",
              }}
            />
          );
        })
      )}
      {/* centre disc */}
      <span
        className="absolute rounded-full"
        style={{
          left: size / 2 - size * 0.11,
          top: size / 2 - size * 0.11,
          width: size * 0.22,
          height: size * 0.22,
          background: `radial-gradient(circle at 36% 32%, ${MARIGOLD} 0%, ${ORANGE} 62%, ${DEEP_TURMERIC} 115%)`,
          boxShadow: "inset 0 0 10px rgba(121,61,22,0.45)",
        }}
      >
        {Array.from({ length: 7 }, (_, i) => {
          const angle = (i / 7) * Math.PI * 2;
          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: size * 0.11 + Math.cos(angle) * size * 0.055 - 1.5,
                top: size * 0.11 + Math.sin(angle) * size * 0.055 - 1.5,
                width: 3,
                height: 3,
                background: INK,
                opacity: 0.55,
              }}
            />
          );
        })}
      </span>
    </motion.div>
  );
}

/* ════════════════════════ Reveal — Haldi Splash ════════════════════════ */

const SPECKLES = Array.from({ length: 42 }, (_, i) => ({
  left: (i * 41 + 7) % 100,
  top: (i * 59 + 11) % 100,
  size: 2 + ((i * 23) % 4),
  opacity: 0.1 + ((i * 13) % 14) / 100,
}));

/* glossy droplets that pop around the smear once it lands */
const DROPLETS = Array.from({ length: 9 }, (_, i) => ({
  left: 10 + ((i * 37 + 9) % 80),
  top: 26 + ((i * 53 + 5) % 46),
  size: 5 + ((i * 17) % 9),
  delay: 0.35 + ((i * 7) % 10) / 22,
}));

const SWIPE_THRESHOLD = 64; // px of travel, any direction

export function Reveal({ onReveal }: { onReveal: () => void }) {
  const cfg = useConfig();
  const [splashed, setSplashed] = useState(false);
  const [smearAngle, setSmearAngle] = useState(-13);
  const doneRef = useRef(false);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const pressRef = useRef<{ startX: number; startY: number; t: number } | null>(
    null
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setSplashed(true);
    // hold while the sunburst opens and the names rise letter by letter
    timerRef.current = setTimeout(() => onRevealRef.current(), 1750);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (doneRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pressRef.current = { startX: e.clientX, startY: e.clientY, t: Date.now() };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pressRef.current;
    if (!p || doneRef.current) return;
    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    if (Math.hypot(dx, dy) >= SWIPE_THRESHOLD) {
      // the smear follows the swipe's own direction (clamped for composition)
      const angle = Math.max(
        -28,
        Math.min(28, (Math.atan2(dy, dx) * 180) / Math.PI)
      );
      setSmearAngle(angle);
      pressRef.current = null;
      finish();
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pressRef.current;
    pressRef.current = null;
    if (!p || doneRef.current) return;
    // tap fallback — a quick, still press also spreads the haldi
    const quick = Date.now() - p.t < 350;
    const still =
      Math.hypot(e.clientX - p.startX, e.clientY - p.startY) < 12;
    if (quick && still) finish();
  };

  const detailLine = [cfg?.date, cfg?.venue ?? cfg?.city]
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .join("  ·  ");

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 125% 95% at 50% 32%, #ffd43b 0%, #fab005 46%, #f08c00 76%, #e8590c 100%)",
        touchAction: "none",
        cursor: "pointer",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pressRef.current = null;
      }}
      role="button"
      aria-label="Swipe to spread the haldi and reveal the invitation"
    >
      {/* turmeric grain over the saturated field */}
      {SPECKLES.map((s, i) => (
        <span
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            background: i % 3 === 0 ? DEEP_TURMERIC : INK,
            opacity: s.opacity,
          }}
          aria-hidden
        />
      ))}
      {/* warm sheen pooling at the top of the field */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 46% at 50% 22%, rgba(255,244,200,0.5) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* marigold-petal cascade — coded petals drifting down the field */}
      <PetalField
        count={24}
        palette="marigold"
        className="pointer-events-none absolute inset-0"
      />

      {/* quiet header — sentence case */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 top-[10%] text-center font-display text-xl"
        style={{ color: INK, letterSpacing: "0.04em" }}
        initial={false}
        animate={{ opacity: splashed ? 0 : 0.85 }}
        transition={{ duration: 0.4 }}
        aria-hidden
      >
        You&rsquo;re invited
      </motion.p>

      {/* before the swipe — one marigold heart, gently breathing, plus a
          faint glossy trail that teases the spreading gesture */}
      {!splashed && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 2, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Marigold size={168} />
            </motion.div>
          </div>
          <motion.div
            className="pointer-events-none absolute left-[-15%] top-[46%] h-[13%] w-[80%] rounded-[50%]"
            style={{
              rotate: -13,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,243,191,0.75) 30%, rgba(255,227,102,0.9) 55%, transparent 100%)",
              filter: "blur(3px)",
              mixBlendMode: "screen",
            }}
            animate={{ x: ["0%", "52%", "0%"], opacity: [0.25, 0.7, 0.25] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        </>
      )}

      {/* the smear — a broad glossy band of haldi swept across the frame,
          angled to the visitor's own swipe */}
      {splashed && (
        <motion.div
          className="pointer-events-none absolute left-[-22%] top-[30%] h-[42%] w-[144%]"
          style={{
            rotate: smearAngle,
            borderRadius: "50%",
            background:
              "linear-gradient(100deg, rgba(240,140,0,0) 0%, #ffd43b 16%, #ffe873 38%, #fff3bf 52%, #ffe066 68%, #fab005 86%, rgba(240,140,0,0) 100%)",
            boxShadow:
              "0 18px 44px rgba(171,116,30,0.35), inset 0 -14px 28px rgba(232,89,12,0.28), inset 0 12px 24px rgba(255,255,255,0.55)",
            filter: "blur(1px)",
          }}
          initial={{ x: "-62%", opacity: 0, scaleY: 0.55 }}
          animate={{ x: "0%", opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden
        />
      )}

      {/* glossy droplets popping around the settled smear */}
      {splashed &&
        DROPLETS.map((d, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: d.size,
              height: d.size,
              background:
                "radial-gradient(circle at 34% 30%, #fff3bf 0%, #ffd43b 60%, #f08c00 120%)",
              boxShadow: "0 2px 6px rgba(121,61,22,0.35)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 15,
              delay: d.delay,
            }}
            aria-hidden
          />
        ))}

      {/* the sunburst opens inside the smear, names rising within it */}
      {splashed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2"
            initial={{ scale: 0.3, opacity: 0, x: "-50%", y: "-50%" }}
            animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
            transition={{ duration: 1.15, ease: EASE, delay: 0.18 }}
            aria-hidden
          >
            <div
              className="h-[96vmin] w-[96vmin] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,243,191,0.85) 0%, rgba(250,176,5,0.4) 46%, transparent 70%)",
              }}
            />
          </motion.div>
          <SunburstRays />
          <div className="relative flex flex-col items-center">
            <motion.div
              className="mb-3 flex justify-center"
              initial={{ scale: 0, rotate: -30, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 16,
                delay: 0.3,
              }}
              aria-hidden
            >
              <Marigold size={64} />
            </motion.div>
            <KineticName name={COUPLE.groom} active={splashed} delay={0.38} />
            <motion.p
              className="my-1 font-display text-xl italic"
              style={{ color: DEEP_TURMERIC }}
              initial={{ opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 18,
                delay: 0.62,
              }}
            >
              weds
            </motion.p>
            <KineticName name={COUPLE.bride} active={splashed} delay={0.72} />
            <motion.p
              className="mt-5 font-display text-base"
              style={{ color: INK, letterSpacing: "0.05em" }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 0.9, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 1.05 }}
              aria-hidden
            >
              The haldi ceremony
            </motion.p>
            {detailLine && (
              <motion.p
                className="mt-2 text-center font-display text-sm"
                style={{ color: INK, letterSpacing: "0.06em" }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 0.85, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 1.18 }}
                aria-hidden
              >
                {detailLine}
              </motion.p>
            )}
          </div>
        </div>
      )}

      {/* gesture hint — quiet, sentence case */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-[7%] z-10 text-center font-display text-sm"
        style={{ color: INK, letterSpacing: "0.06em" }}
        animate={{ opacity: splashed ? 0 : [0.55, 1, 0.55] }}
        transition={
          splashed
            ? { duration: 0.3 }
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      >
        Swipe to spread the haldi
      </motion.p>
    </div>
  );
}

/* ════════════════════════ Curtain — Marigold Toran ════════════════════════ */

const STRAND_COUNT = 14;
const STRAND_DOTS = 7;

function strandSwing(i: number): { rotate: number; delay: number } {
  const centre = (STRAND_COUNT - 1) / 2;
  const d = Math.abs(i - centre) / centre; // 0 at centre → 1 at edges
  const sign = i < centre ? -1 : 1;
  return { rotate: sign * (4 + d * 22), delay: d * 0.35 };
}

export function Curtain({
  onDone,
  autoPlay,
}: {
  onDone: () => void;
  autoPlay?: boolean;
}) {
  const [parted, setParted] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const fireDone = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  useEffect(() => {
    if (!autoPlay) return;
    later(() => setParted(true), 1100);
    later(fireDone, 4200);
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
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
    if (autoPlay) return;
    if (!parted) {
      setParted(true);
      later(fireDone, 2400);
    } else {
      fireDone();
    }
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 110% 85% at 50% 42%, ${PAPER} 0%, ${PANEL} 85%)`,
        cursor: autoPlay ? undefined : "pointer",
      }}
      onClick={handleTap}
      role="button"
      aria-label="Reveal the couple's names"
    >
      {/* revealed names layer — under the toran, inside a sunburst */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[92vmin] w-[92vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(250,176,5,0.55) 0%, rgba(247,103,7,0.22) 46%, transparent 70%)",
          }}
          initial={false}
          animate={
            parted
              ? { scale: 1.3, opacity: 0.9, x: "-50%", y: "-50%" }
              : { scale: 0.4, opacity: 0, x: "-50%", y: "-50%" }
          }
          transition={{ duration: 1.5, ease: EASE, delay: 0.2 }}
          aria-hidden
        />
        {parted && <SunburstRays size="104vmin" opacity={0.4} />}
        <div className="relative flex flex-col items-center">
          <motion.div
            className="mb-4 flex justify-center"
            initial={{ scale: 0, rotate: -24, opacity: 0 }}
            animate={parted ? { scale: 1, rotate: 0, opacity: 1 } : {}}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 16,
              delay: 0.45,
            }}
            aria-hidden
          >
            <Marigold size={74} />
          </motion.div>
          <KineticName name={COUPLE.groom} active={parted} delay={0.5} />
          <motion.p
            className="my-1 font-display text-xl italic lg:text-2xl"
            style={{ color: DEEP_TURMERIC }}
            initial={{ opacity: 0, scale: 1.6 }}
            animate={parted ? { opacity: 1, scale: 1 } : {}}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 18,
              delay: 0.78,
            }}
          >
            weds
          </motion.p>
          <KineticName name={COUPLE.bride} active={parted} delay={0.88} />
          <motion.p
            className="mt-5 font-display text-base"
            style={{ color: DEEP_TURMERIC, letterSpacing: "0.05em" }}
            initial={{ opacity: 0, y: 14 }}
            animate={parted ? { opacity: 0.9, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE, delay: 1.2 }}
            aria-hidden
          >
            The haldi ceremony
          </motion.p>
        </div>
      </div>

      {parted && (
        <PetalField
          count={22}
          palette="marigold"
          className="pointer-events-none absolute inset-0"
        />
      )}

      {/* toran strands — swing apart from their top anchors */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {Array.from({ length: STRAND_COUNT }, (_, i) => {
          const swing = strandSwing(i);
          return (
            <motion.div
              key={i}
              className="absolute top-0 h-full"
              style={{
                left: `${((i + 0.5) / STRAND_COUNT) * 100}%`,
                width: 22,
                marginLeft: -11,
                transformOrigin: "top center",
              }}
              initial={false}
              animate={{ rotate: parted ? swing.rotate : 0 }}
              transition={{
                duration: 1.7,
                ease: [0.34, 1.25, 0.64, 1],
                delay: swing.delay,
              }}
            >
              {/* the string */}
              <div
                className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
                style={{
                  background: `linear-gradient(180deg, ${DEEP_TURMERIC} 0%, rgba(171,116,30,0.4) 100%)`,
                }}
              />
              {/* alternating flower beads */}
              {Array.from({ length: STRAND_DOTS }, (_, j) => {
                const big = j % 2 === 0;
                const d = big ? 15 : 10;
                return (
                  <span
                    key={j}
                    className="absolute rounded-full"
                    style={{
                      left: 11 - d / 2,
                      top: `${9 + j * 13.5}%`,
                      width: d,
                      height: d,
                      background: `radial-gradient(circle at 34% 30%, #fff3bf 0%, ${
                        FLOWER_COLORS[(i + j) % FLOWER_COLORS.length]
                      } 58%, ${DEEP_TURMERIC} 135%)`,
                      boxShadow: "0 1px 4px rgba(121,61,22,0.3)",
                    }}
                  />
                );
              })}
            </motion.div>
          );
        })}

        {/* top band — the marigold row the strands hang from */}
        <div
          className="absolute inset-x-0 top-0 flex h-11 items-center justify-between px-1"
          style={{
            background: `linear-gradient(180deg, ${PANEL} 0%, rgba(246,228,181,0.85) 78%, transparent 100%)`,
            borderBottom: `2px solid ${TURMERIC}`,
          }}
        >
          {Array.from({ length: 18 }, (_, i) => {
            const d = i % 2 === 0 ? 17 : 12;
            return (
              <span
                key={i}
                className="rounded-full"
                style={{
                  width: d,
                  height: d,
                  background: `radial-gradient(circle at 34% 30%, #fff3bf 0%, ${
                    FLOWER_COLORS[i % FLOWER_COLORS.length]
                  } 58%, ${DEEP_TURMERIC} 135%)`,
                  boxShadow: "0 1px 4px rgba(121,61,22,0.3)",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* closed-state caption over the strands — quiet, sentence case */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 top-[16%] text-center font-display text-xl"
        style={{ color: INK, letterSpacing: "0.04em", textShadow: "0 1px 8px rgba(255,245,217,0.9)" }}
        initial={false}
        animate={{ opacity: parted ? 0 : 1 }}
        transition={{ duration: 0.45 }}
        aria-hidden
      >
        You&rsquo;re invited
      </motion.p>

      {!autoPlay && !parted && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] text-center font-display text-sm"
          style={{ color: INK, letterSpacing: "0.06em", textShadow: "0 1px 8px rgba(255,245,217,0.9)" }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          Tap to reveal
        </motion.p>
      )}
    </div>
  );
}
