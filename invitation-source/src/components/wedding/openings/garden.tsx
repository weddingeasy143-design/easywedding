// src/components/wedding/openings/garden.tsx
// "Botanical Forever" — Ahmedabad
//  Reveal  (beat 0): "Wipe the Morning Dew" — a frosted dew sheet veils a
//          monogram on a great green leaf; the guest wipes it clear.
//  Curtain (beat 2): "Living Leaves" — leaf & vine clusters curl and grow
//          outward like unfurling ferns while the names sprout around a
//          vine line that draws itself across the middle.
// 100% coded visuals — gradients, divs and SVG only. No images, no photos.
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { COUPLE } from "@/content/wedding";
import PetalField from "../PetalField";

const EASE = [0.22, 1, 0.36, 1] as const;

const PAPER = "#f1f6ec";
const PANEL = "#e5eddc";
const DEEP = "#285840";
const INK = "#40553d";
const GOLD = "#93834b";
const LIGHT = "#c5be82";
const GREENS = ["#285840", "#315b42", "#6e7d62"] as const;

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

/* ── one coded leaf — a rotated teardrop with a centre vein ── */
function Leaf({
  size,
  rotate,
  color,
  className = "",
  style,
}: {
  size: number;
  rotate: number;
  color: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`absolute ${className}`}
      style={{
        width: size,
        height: size * 1.28,
        borderRadius: "0 60% 0 60%",
        transform: `rotate(${rotate}deg)`,
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 55%, ${color}b3 100%)`,
        boxShadow: "inset 0 0 18px rgba(255,255,255,0.14), 0 6px 18px rgba(40,88,64,0.18)",
        ...style,
      }}
      aria-hidden
    >
      {/* centre vein */}
      <div
        className="absolute left-1/2 top-[6%] h-[88%] w-px -translate-x-1/2"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(241,246,236,0.55) 25%, rgba(241,246,236,0.55) 75%, transparent)",
          transform: "translateX(-50%) rotate(38deg)",
          transformOrigin: "top center",
        }}
      />
    </div>
  );
}

/* ════════════════════════ Reveal — Wipe the Morning Dew ════════════════════════ */

const DROPLETS = Array.from({ length: 26 }, (_, i) => ({
  left: 8 + ((i * 37) % 84),
  top: 6 + ((i * 53) % 86),
  size: 4 + ((i * 29) % 9),
  delay: (i % 5) * 0.04,
}));

export function Reveal({ onReveal }: { onReveal: () => void }) {
  const cfg = useConfig();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
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
    const next = Math.min(1, p.dist / 650);
    setProgress(next);
    if (next >= 0.65) finish();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pressRef.current;
    pressRef.current = null;
    if (!p || doneRef.current) return;
    const quick = Date.now() - p.t < 300;
    const still = Math.hypot(e.clientX - p.startX, e.clientY - p.startY) < 10 && p.moved < 10;
    if (quick && still) finish();
  };

  const dewOpacity = done ? 0 : 1 - progress * 0.85;
  const monoBlur = done ? 0 : (1 - progress) * 4;
  const monoOpacity = done ? 1 : 0.5 + progress * 0.5;
  const detailLine = [cfg?.date, cfg?.venue ?? cfg?.city]
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .join("  ·  ");

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 120% 90% at 50% 0%, ${PAPER} 0%, ${PANEL} 78%)`,
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
      aria-label="Wipe the morning dew to reveal the invitation"
    >
      {/* faint botanical dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(${LIGHT} 1px, transparent 1.4px)`,
          backgroundSize: "26px 26px",
        }}
        aria-hidden
      />
      {/* soft corner foliage */}
      <Leaf size={86} rotate={-118} color={GREENS[2]} className="-left-8 -top-10 opacity-50" />
      <Leaf size={64} rotate={142} color={GREENS[1]} className="-right-7 -top-8 opacity-45" />
      <Leaf size={72} rotate={38} color={GREENS[2]} className="-bottom-10 -left-7 opacity-40" />
      <Leaf size={58} rotate={-52} color={GREENS[1]} className="-bottom-8 -right-8 opacity-40" />

      {/* centre stage — the great leaf, monogram and dew */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div className="relative flex h-[340px] w-[280px] items-center justify-center sm:h-[380px] sm:w-[320px]">
          {/* the leaf */}
          <div
            className="absolute"
            style={{
              width: 218,
              height: 282,
              borderRadius: "0 60% 0 60%",
              transform: "rotate(-20deg)",
              background:
                "linear-gradient(140deg, #3a6f52 0%, #285840 52%, #1d4230 100%)",
              boxShadow:
                "inset 0 0 34px rgba(197,190,130,0.22), 0 24px 48px rgba(40,88,64,0.30)",
            }}
            aria-hidden
          >
            <div
              className="absolute left-1/2 top-[5%] h-[90%] w-[2px]"
              style={{
                background:
                  "linear-gradient(180deg, transparent, rgba(241,246,236,0.6) 22%, rgba(241,246,236,0.6) 78%, transparent)",
                transform: "translateX(-50%) rotate(33deg)",
                transformOrigin: "top center",
              }}
            />
            {[22, 42, 62].map((t, i) => (
              <div
                key={t}
                className="absolute h-px w-[34%]"
                style={{
                  top: `${t}%`,
                  left: i % 2 === 0 ? "50%" : "16%",
                  background: "rgba(241,246,236,0.35)",
                  transform: `rotate(${i % 2 === 0 ? -32 : 148}deg)`,
                }}
              />
            ))}
          </div>

          {/* monogram under the dew — sharpens as the wipe progresses */}
          <div
            className="relative flex h-40 w-40 flex-col items-center justify-center rounded-full"
            style={{
              border: `1.5px solid ${GOLD}`,
              boxShadow: `0 0 0 6px rgba(147,131,75,0.16), inset 0 0 0 1px rgba(241,246,236,0.35)`,
              background: "rgba(241,246,236,0.88)",
              filter: `blur(${monoBlur}px)`,
              opacity: monoOpacity,
              transition: "filter 120ms linear, opacity 120ms linear",
            }}
            aria-hidden
          >
            <span
              className="font-display text-[2rem] font-semibold tracking-[0.14em]"
              style={{ color: DEEP }}
            >
              {INITIALS}
            </span>
            <span
              className="mt-1 block h-px w-14"
              style={{
                background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
              }}
            />
            <span
              className="mt-2 text-[0.7rem]"
              style={{ color: GOLD, letterSpacing: "0.05em", opacity: 0.85 }}
            >
              Botanical Forever
            </span>
          </div>

          {/* dew layer — frosted sheet + droplets, wiped away by the gesture */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            initial={false}
            animate={{ opacity: dewOpacity }}
            transition={{ duration: done ? 0.45 : 0.12, ease: "easeOut" }}
            style={{
              background:
                "linear-gradient(155deg, rgba(246,250,242,0.82) 0%, rgba(229,237,220,0.66) 55%, rgba(197,190,130,0.38) 100%)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              borderRadius: "46% 54% 52% 48% / 44% 46% 54% 56%",
            }}
            aria-hidden
          >
            {DROPLETS.map((d, i) => {
              const gone = done || progress >= (i + 1) / DROPLETS.length;
              return (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${d.left}%`,
                    top: `${d.top}%`,
                    width: d.size,
                    height: d.size,
                    background:
                      "radial-gradient(circle at 32% 30%, rgba(255,255,255,0.95) 0%, rgba(214,228,205,0.75) 55%, rgba(165,180,150,0.5) 100%)",
                    boxShadow: "0 1px 3px rgba(64,85,61,0.25)",
                    opacity: gone ? 0 : 0.9,
                    transform: gone ? "scale(0.4)" : "scale(1)",
                    transition: `opacity 300ms ease ${d.delay}s, transform 300ms ease ${d.delay}s`,
                  }}
                />
              );
            })}
          </motion.div>

          {/* completion shimmer sweeping the leaf */}
          {done && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, transparent 32%, rgba(255,252,230,0.75) 50%, transparent 68%)",
                borderRadius: "46% 54% 52% 48% / 44% 46% 54% 56%",
              }}
              initial={{ x: "-110%", opacity: 0 }}
              animate={{ x: "110%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.5, times: [0, 0.25, 0.75, 1], ease: "easeInOut" }}
              aria-hidden
            />
          )}
        </div>

        {detailLine && (
          <p
            className="mt-7 text-center font-display text-sm tracking-[0.06em]"
            style={{ color: INK }}
            aria-hidden
          >
            {detailLine}
          </p>
        )}
      </div>

      {/* gesture hint */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-[7%] text-center font-display text-sm"
        style={{ color: DEEP, letterSpacing: "0.05em" }}
        animate={{ opacity: done ? 0 : [0.6, 0.92, 0.6] }}
        transition={
          done
            ? { duration: 0.3 }
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      >
        ✦&nbsp; Wipe the morning dew &nbsp;✦
      </motion.p>
    </div>
  );
}

/* ════════════════════════ Curtain — Living Leaves ════════════════════════ */

interface LeafSpec {
  side: "left" | "right";
  left: number;
  top: number;
  size: number;
  rotate: number;
  color: string;
  curl: number;
  push: number;
  delay: number;
}

const CLUSTER: LeafSpec[] = Array.from({ length: 44 }, (_, i) => {
  const side: "left" | "right" = i % 2 === 0 ? "left" : "right";
  const k = Math.floor(i / 2);
  const inward = ((k * 29) % 44) + 2; // 2–46% in from the nearest edge
  return {
    side,
    left: side === "left" ? inward : 100 - inward,
    top: (k * 41 + (side === "right" ? 17 : 0)) % 100,
    size: 44 + ((k * 31) % 66),
    rotate: ((k * 47) % 90) - 45 + (side === "left" ? -18 : 18),
    color: GREENS[k % GREENS.length]!,
    curl: (side === "left" ? -1 : 1) * (40 + ((k * 13) % 31)),
    push: (side === "left" ? -1 : 1) * (90 + ((k * 17) % 70)),
    delay: (k % 9) * 0.05,
  };
});

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
        background: `radial-gradient(ellipse 110% 85% at 50% 42%, ${PAPER} 0%, ${PANEL} 82%)`,
        cursor: autoPlay ? undefined : "pointer",
      }}
      onClick={handleTap}
      role="button"
      aria-label="Reveal the couple's names"
    >
      {/* revealed names layer — under the leaves */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.p
          className="font-display font-semibold leading-[1.08]"
          style={{ color: DEEP, fontSize: "clamp(3.4rem, 16vw, 5.4rem)" }}
          initial={{ opacity: 0, y: 26, scale: 0.94 }}
          animate={parted ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.95, ease: EASE, delay: 0.55 }}
        >
          {COUPLE.groom}
        </motion.p>

        {/* the vine — grows across the middle as the leaves unfurl */}
        <div className="relative my-3 flex w-full items-center justify-center" aria-hidden>
          <motion.div
            className="relative h-[3px] rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${DEEP} 18%, ${GOLD} 50%, ${DEEP} 82%, transparent)`,
            }}
            initial={{ width: "0%" }}
            animate={parted ? { width: "64%" } : {}}
            transition={{ duration: 1.1, ease: EASE, delay: 0.25 }}
          >
            <span
              className="absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2"
              style={{
                borderRadius: "0 60% 0 60%",
                background: DEEP,
                transform: "translateY(-50%) rotate(-30deg)",
              }}
            />
            <span
              className="absolute -right-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2"
              style={{
                borderRadius: "0 60% 0 60%",
                background: DEEP,
                transform: "translateY(-50%) rotate(150deg)",
              }}
            />
          </motion.div>
          <motion.span
            className="absolute font-display text-base italic"
            style={{ color: GOLD, background: PAPER, padding: "0 0.6rem" }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={parted ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, ease: EASE, delay: 0.95 }}
          >
            weds
          </motion.span>
        </div>

        <motion.p
          className="font-display font-semibold leading-[1.08]"
          style={{ color: DEEP, fontSize: "clamp(3.4rem, 16vw, 5.4rem)" }}
          initial={{ opacity: 0, y: -26, scale: 0.94 }}
          animate={parted ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.95, ease: EASE, delay: 0.72 }}
        >
          {COUPLE.bride}
        </motion.p>

        <motion.div
          className="mt-5 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={parted ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1.3 }}
          aria-hidden
        >
          <span
            className="block h-3 w-3"
            style={{ borderRadius: "0 60% 0 60%", background: GOLD, transform: "rotate(-24deg)" }}
          />
          <span
            className="text-[0.7rem]"
            style={{ color: GOLD, letterSpacing: "0.05em", opacity: 0.85 }}
          >
            Botanical Forever
          </span>
          <span
            className="block h-3 w-3"
            style={{ borderRadius: "0 60% 0 60%", background: GOLD, transform: "rotate(156deg)" }}
          />
        </motion.div>
      </div>

      {parted && (
        <PetalField
          count={16}
          className="pointer-events-none absolute inset-0 opacity-70"
        />
      )}

      {/* living leaf clusters — curl & grow outward, no centre split */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {CLUSTER.map((leaf, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${leaf.left}%`,
              top: `${leaf.top}%`,
              width: leaf.size,
              height: leaf.size * 1.28,
              marginLeft: -leaf.size / 2,
              marginTop: -(leaf.size * 1.28) / 2,
            }}
            initial={false}
            animate={
              parted
                ? { x: leaf.push, rotate: leaf.rotate + leaf.curl, opacity: 0.92 }
                : { x: 0, rotate: leaf.rotate, opacity: 1 }
            }
            transition={{ duration: 1.5, ease: EASE, delay: leaf.delay }}
          >
            <div
              className="h-full w-full"
              style={{
                borderRadius: "0 60% 0 60%",
                transform: `rotate(${leaf.rotate}deg)`,
                background: `linear-gradient(135deg, ${leaf.color} 0%, ${leaf.color}dd 55%, ${leaf.color}b3 100%)`,
                boxShadow:
                  "inset 0 0 16px rgba(255,255,255,0.14), 0 6px 16px rgba(40,88,64,0.22)",
              }}
            >
              <div
                className="mx-auto h-full w-px"
                style={{
                  background:
                    "linear-gradient(180deg, transparent, rgba(241,246,236,0.5) 25%, rgba(241,246,236,0.5) 75%, transparent)",
                  transform: "rotate(34deg)",
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* closed-state caption on the foliage */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-[10%] text-center"
        initial={false}
        animate={{ opacity: parted ? 0 : 1 }}
        transition={{ duration: 0.45 }}
        aria-hidden
      >
        <p
          className="font-display text-base"
          style={{ color: PAPER, letterSpacing: "0.05em", opacity: 0.94, textShadow: "0 2px 10px rgba(29,66,48,0.65)" }}
        >
          You&rsquo;re invited
        </p>
      </motion.div>

      {!autoPlay && !parted && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] text-center font-display text-sm"
          style={{ color: PAPER, letterSpacing: "0.05em", textShadow: "0 2px 10px rgba(29,66,48,0.7)" }}
          animate={{ opacity: [0.65, 0.95, 0.65] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          ✦&nbsp; Tap to reveal &nbsp;✦
        </motion.p>
      )}
    </div>
  );
}
