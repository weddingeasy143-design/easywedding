// src/components/wedding/openings/haldi.tsx
// "Golden Phere" — Lucknow · Haldi ceremony
//  Reveal  (beat 0): "Rub the Haldi" — a matte turmeric-paste layer hides a
//          coded marigold flower and the couple's initials; the guest rubs
//          the paste away and the flower blooms through.
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

const INITIALS = `${(COUPLE.groom?.charAt(0) ?? "").toUpperCase()} · ${(
  COUPLE.bride?.charAt(0) ?? ""
).toUpperCase()}`;

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

/* ════════════════════════ Reveal — Rub the Haldi ════════════════════════ */

const SPECKLES = Array.from({ length: 42 }, (_, i) => ({
  left: (i * 41 + 7) % 100,
  top: (i * 59 + 11) % 100,
  size: 2 + ((i * 23) % 4),
  opacity: 0.16 + ((i * 13) % 20) / 100,
}));

export function Reveal({ onReveal }: { onReveal: () => void }) {
  const cfg = useConfig();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [glow, setGlow] = useState<{ x: number; y: number } | null>(null);
  const doneRef = useRef(false);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const pressRef = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    t: number;
    dist: number;
    moved: number;
  } | null>(null);
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
    setProgress(1);
    setDone(true);
    timerRef.current = setTimeout(() => onRevealRef.current(), 500);
  };

  const localPoint = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (doneRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pressRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      t: Date.now(),
      dist: 0,
      moved: 0,
    };
    setGlow(localPoint(e));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pressRef.current;
    if (!p || doneRef.current) return;
    const step = Math.hypot(e.clientX - p.x, e.clientY - p.y);
    p.dist += step;
    p.x = e.clientX;
    p.y = e.clientY;
    p.moved = Math.max(
      p.moved,
      Math.hypot(e.clientX - p.startX, e.clientY - p.startY)
    );
    setGlow(localPoint(e));
    const next = Math.min(1, p.dist / 700);
    setProgress(next);
    if (next >= 0.65) finish();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pressRef.current;
    pressRef.current = null;
    setGlow(null);
    if (!p || doneRef.current) return;
    const quick = Date.now() - p.t < 300;
    const still = Math.hypot(e.clientX - p.startX, e.clientY - p.startY) < 10 && p.moved < 10;
    if (quick && still) finish();
  };

  const pasteOpacity = done ? 0 : 1 - progress * 0.95;
  const detailLine = [cfg?.date, cfg?.venue ?? cfg?.city]
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .join("  ·  ");

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 115% 90% at 50% 38%, ${PAPER} 0%, ${PANEL} 85%)`,
        touchAction: "none",
        cursor: "pointer",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pressRef.current = null;
        setGlow(null);
      }}
      role="button"
      aria-label="Rub the haldi away to reveal the invitation"
    >
      {/* the layer beneath — marigold + initials */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 0.35 + progress * 0.65, scale: 0.94 + progress * 0.06 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Marigold size={196} pulse={done} />
        </motion.div>
        <p
          className="font-display mt-6 text-[2rem] font-semibold tracking-[0.14em]"
          style={{ color: INK, opacity: 0.3 + progress * 0.7 }}
          aria-hidden
        >
          {INITIALS}
        </p>
        <span
          className="mt-2 block h-px w-16"
          style={{
            background: `linear-gradient(90deg, transparent, ${DEEP_TURMERIC}, transparent)`,
            opacity: 0.3 + progress * 0.7,
          }}
          aria-hidden
        />
        <p
          className="mt-3 text-[0.62rem] uppercase"
          style={{ color: DEEP_TURMERIC, letterSpacing: "0.34em", opacity: 0.3 + progress * 0.7 }}
          aria-hidden
        >
          The Haldi Ceremony
        </p>
        {detailLine && (
          <p
            className="mt-4 text-center font-display text-sm tracking-[0.18em]"
            style={{ color: INK, opacity: 0.3 + progress * 0.7 }}
            aria-hidden
          >
            {detailLine}
          </p>
        )}
      </div>

      {/* rubbed glow following the pointer */}
      {glow && !done && (
        <div
          className="pointer-events-none absolute h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${glow.x}%`,
            top: `${glow.y}%`,
            background:
              "radial-gradient(circle, rgba(255,236,170,0.85) 0%, rgba(250,176,5,0.35) 45%, transparent 70%)",
            filter: "blur(6px)",
            mixBlendMode: "screen",
          }}
          aria-hidden
        />
      )}

      {/* turmeric paste layer — dissolves as the guest rubs */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{ opacity: pasteOpacity, scale: done ? 1.03 : 1 }}
        transition={{ duration: done ? 0.5 : 0.12, ease: "easeOut" }}
        style={{
          background:
            "linear-gradient(160deg, #e9c767 0%, #dfba62 52%, #d3a94e 100%)",
        }}
        aria-hidden
      >
        {SPECKLES.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              background: i % 3 === 0 ? DEEP_TURMERIC : INK,
              opacity: s.opacity * (1 - progress),
            }}
          />
        ))}
        {/* soft trowel sheen */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 46% at 50% 30%, rgba(255,244,200,0.35) 0%, transparent 70%)",
          }}
        />
        <p
          className="absolute inset-x-0 top-[13%] text-center font-display text-sm uppercase"
          style={{ color: INK, letterSpacing: "0.34em", opacity: 0.75 }}
        >
          You&rsquo;re Invited
        </p>
      </motion.div>

      {/* gesture hint */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-[7%] z-10 text-center font-display text-xs uppercase"
        style={{ color: INK, letterSpacing: "0.34em" }}
        animate={{ opacity: done ? 0 : [0.55, 1, 0.55] }}
        transition={
          done
            ? { duration: 0.3 }
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      >
        ✦&nbsp; Rub the haldi away &nbsp;✦
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
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.92, y: 22 }}
          animate={parted ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 1.1, ease: EASE, delay: 0.5 }}
        >
          <div className="mb-4 flex justify-center" aria-hidden>
            <Marigold size={74} />
          </div>
          <p
            className="font-script leading-[1.12]"
            style={{ color: INK, fontSize: "clamp(3rem, 15vw, 4.6rem)" }}
          >
            {COUPLE.groom}
          </p>
          <p
            className="my-1 font-display text-lg italic lg:text-2xl"
            style={{ color: DEEP_TURMERIC }}
          >
            weds
          </p>
          <p
            className="font-script leading-[1.12]"
            style={{ color: INK, fontSize: "clamp(3rem, 15vw, 4.6rem)" }}
          >
            {COUPLE.bride}
          </p>
          <p
            className="mt-5 text-[0.62rem] uppercase"
            style={{ color: DEEP_TURMERIC, letterSpacing: "0.34em" }}
            aria-hidden
          >
            ✦&nbsp; The Haldi Ceremony &nbsp;✦
          </p>
        </motion.div>
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

      {/* closed-state caption over the strands */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 top-[16%] text-center font-display text-sm uppercase"
        style={{ color: INK, letterSpacing: "0.34em", textShadow: "0 1px 8px rgba(255,245,217,0.9)" }}
        initial={false}
        animate={{ opacity: parted ? 0 : 1 }}
        transition={{ duration: 0.45 }}
        aria-hidden
      >
        You&rsquo;re Invited
      </motion.p>

      {!autoPlay && !parted && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] text-center font-display text-xs uppercase"
          style={{ color: INK, letterSpacing: "0.34em", textShadow: "0 1px 8px rgba(255,245,217,0.9)" }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          ✦&nbsp; Tap to reveal &nbsp;✦
        </motion.p>
      )}
    </div>
  );
}
