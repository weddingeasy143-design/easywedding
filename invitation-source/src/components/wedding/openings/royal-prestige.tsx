"use client";

// royal-prestige — "Break the Royal Seal"
// Beat 0 (Reveal): press the great crimson wax seal on a double-gold-framed
// palace panel; it trembles, cracks into three wedges and falls in gold dust.
// Beat 2 (Curtain): heavy crimson velvet drapes with gold tassel tiebacks
// part sideways, and the couple's names rise in gold under a light sweep.

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COUPLE } from "@/content/wedding";
import { copyText } from "../../../../adapters/copy";

const DEEP = "#32121f";
const DEEP_2 = "#451d2b";
const CREAM = "#ffe0bf";
const GOLD = "#dbb474";
const LIGHT_GOLD = "#f5dca2";
const CRIMSON = "#7c1225";
const CRIMSON_2 = "#b3233a";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(raw?: string): string {
  if (!raw) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return raw;
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return raw;
  return `${Number(m[3])} ${month} ${m[1]}`;
}

function runtimeDate(): string {
  const cfg = (window as any).__easyWedding?.config;
  return formatDate(typeof cfg?.date === "string" ? cfg.date : undefined);
}

const SEAL_BG =
  "radial-gradient(circle at 38% 32%, #b3233a 0%, #7c1225 55%, #4d0a16 100%)";

/* ── original generic crest: crown points, diamond, star ────────── */
function Crest({ size = 62 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden>
      {/* crown points */}
      <path
        d="M22 30 L26 16 L34 26 L40 13 L46 26 L54 16 L58 30 Z"
        stroke={LIGHT_GOLD}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="rgba(245,220,162,0.14)"
      />
      <circle cx="26" cy="14" r="2" fill={LIGHT_GOLD} />
      <circle cx="40" cy="11" r="2.2" fill={LIGHT_GOLD} />
      <circle cx="54" cy="14" r="2" fill={LIGHT_GOLD} />
      <rect x="21" y="33" width="38" height="3" rx="1.5" fill={LIGHT_GOLD} opacity="0.9" />
      {/* diamond */}
      <path
        d="M40 42 L52 54 L40 66 L28 54 Z"
        stroke={LIGHT_GOLD}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="rgba(245,220,162,0.10)"
      />
      {/* star at the diamond's heart */}
      <path
        d="M40 48 L41.8 52.2 L46 54 L41.8 55.8 L40 60 L38.2 55.8 L34 54 L38.2 52.2 Z"
        fill={LIGHT_GOLD}
      />
    </svg>
  );
}

/* ══ BEAT 0 — Reveal ══════════════════════════════════════════════ */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const [pressing, setPressing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const downAtRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const calledRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
    },
    []
  );

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPressing(false);
    setFinishing(true);
    timersRef.current.push(
      setTimeout(() => {
        if (calledRef.current) return;
        calledRef.current = true;
        onReveal();
      }, 520)
    );
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (finishing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    downAtRef.current = Date.now();
    setPressing(true);
    // a long hold cracks on its own — the guest is never trapped
    timersRef.current.push(setTimeout(() => finishRef.current(), 650));
  };

  const onPointerUp = () => {
    if (finishing) return;
    // ≥250ms hold and a plain tap take the same crack path: finish on release
    if (downAtRef.current !== null) finish();
    downAtRef.current = null;
  };

  const dust = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const angle = (i / 9) * Math.PI * 2 + (i % 3) * 0.18;
        const dist = 74 + ((i * 29) % 44);
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist + 26,
          size: 4 + ((i * 7) % 5),
          delay: i * 0.03,
        };
      }),
    []
  );

  const wedges = [
    {
      clip: "polygon(50% 50%, 14% 0%, 86% 0%)",
      x: 0,
      y: -64,
      rotate: -14,
    },
    {
      clip: "polygon(50% 50%, 86% 0%, 102% 84%, 58% 102%)",
      x: 58,
      y: 44,
      rotate: 22,
    },
    {
      clip: "polygon(50% 50%, 58% 102%, -2% 84%, 14% 0%)",
      x: -58,
      y: 48,
      rotate: -24,
    },
  ];

  return (
    <div
      className="relative h-full w-full touch-none select-none overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${DEEP} 0%, ${DEEP_2} 55%, ${DEEP} 100%)`,
        cursor: finishing ? "default" : "pointer",
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      aria-label="Press to break the royal seal and reveal the invitation"
    >
      {/* palace glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 50% at 50% 40%, rgba(179,35,58,0.34) 0%, transparent 65%), radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.55) 100%)",
        }}
        aria-hidden
      />

      {/* thin gold double border frame */}
      <div
        className="pointer-events-none absolute inset-4 lg:inset-6"
        style={{ border: `1.5px solid ${GOLD}` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-[22px] lg:inset-[30px]"
        style={{ border: `1px solid rgba(219,180,116,0.55)` }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
        <p
          className="font-display text-[11px] font-semibold uppercase"
          style={{ letterSpacing: "0.36em", color: GOLD }}
        >
          {copyText(3, "You're Invited")}
        </p>
        <p
          className="mt-3 font-display text-xl italic leading-relaxed lg:text-2xl"
          style={{ color: CREAM }}
        >
          By the grace of two families
        </p>

        {/* the wax seal */}
        <div className="relative mt-10 h-[132px] w-[132px] lg:h-[148px] lg:w-[148px]">
          {!finishing && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{
                background: SEAL_BG,
                boxShadow: `0 0 0 3px ${GOLD}, 0 0 0 6px rgba(219,180,116,0.35), 0 12px 32px rgba(0,0,0,0.6), 0 0 44px rgba(219,180,116,0.28)`,
              }}
              initial={false}
              animate={
                pressing
                  ? { x: [0, -2, 2, -2, 1, 0], y: [0, 1, -1, 1, 0, 0], scale: 0.97 }
                  : { x: 0, y: 0, scale: 1 }
              }
              transition={
                pressing
                  ? { duration: 0.32, repeat: Infinity, ease: "linear" }
                  : { duration: 0.2 }
              }
              aria-hidden
            >
              <div
                className="flex h-[78%] w-[78%] items-center justify-center rounded-full"
                style={{ border: `1.5px solid rgba(245,220,162,0.8)` }}
              >
                <Crest />
              </div>
            </motion.div>
          )}

          {/* cracked wedges */}
          {finishing &&
            wedges.map((wd, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 flex items-center justify-center rounded-full"
                style={{ background: SEAL_BG, clipPath: wd.clip }}
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{ x: wd.x, y: wd.y + 60, rotate: wd.rotate, opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.3, 0.7, 0.6, 1] }}
                aria-hidden
              >
                {i === 0 && <Crest size={52} />}
              </motion.div>
            ))}

          {/* crack lines flashing at the break */}
          {finishing && (
            <motion.svg
              className="absolute inset-0"
              viewBox="0 0 120 120"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              aria-hidden
            >
              <path d="M60 60 L60 8 M60 60 L106 84 M60 60 L14 84" stroke={LIGHT_GOLD} strokeWidth="2" />
            </motion.svg>
          )}

          {/* gold-dust burst */}
          <AnimatePresence>
            {finishing &&
              dust.map((d, i) => (
                <motion.span
                  key={i}
                  className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: d.size,
                    height: d.size,
                    background: `radial-gradient(circle, ${LIGHT_GOLD}, ${GOLD})`,
                    boxShadow: "0 0 8px rgba(245,220,162,0.9)",
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: d.x, y: d.y, opacity: 0, scale: 0.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, delay: d.delay, ease: "easeOut" }}
                  aria-hidden
                />
              ))}
          </AnimatePresence>
        </div>

        <p
          className="mt-10 font-display text-base"
          style={{ color: CREAM, opacity: 0.85 }}
        >
          {COUPLE.groom} &amp; {COUPLE.bride}
        </p>
      </div>

      {/* hint */}
      {!finishing && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[7%] text-center font-display text-xs font-semibold uppercase"
          style={{ letterSpacing: "0.32em", color: LIGHT_GOLD }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          Press to break the seal
        </motion.p>
      )}
    </div>
  );
}

/* ── gold tassel tieback at a drape's outer edge ────────────────── */
function Tassel({ side, open }: { side: "left" | "right"; open: boolean }) {
  const isLeft = side === "left";
  return (
    <motion.div
      className={`absolute top-[58%] ${isLeft ? "left-3" : "right-3"}`}
      style={{ transformOrigin: "50% 0%" }}
      initial={false}
      animate={open ? { rotate: [0, isLeft ? 6 : -6, isLeft ? -6 : 6, 0] } : { rotate: 0 }}
      transition={{ duration: 1.4, delay: 0.35, ease: "easeInOut" }}
      aria-hidden
    >
      <svg width="26" height="64" viewBox="0 0 26 64" fill="none">
        <path d="M13 0 C13 8 13 12 13 18" stroke={GOLD} strokeWidth="2.5" />
        <path
          d="M5 26 C5 19 8 16 13 16 C18 16 21 19 21 26 L19 32 L7 32 Z"
          fill={GOLD}
        />
        {[-8, -4, 0, 4, 8].map((dx) => (
          <line
            key={dx}
            x1={13 + dx}
            y1="32"
            x2={13 + dx * 1.25}
            y2={dx === 0 ? 58 : 54}
            stroke={LIGHT_GOLD}
            strokeWidth="1.8"
          />
        ))}
        <circle cx="13" cy="18" r="3" fill={LIGHT_GOLD} />
      </svg>
    </motion.div>
  );
}

const VELVET_BG =
  "repeating-linear-gradient(90deg, rgba(0,0,0,0.34) 0px, rgba(0,0,0,0) 20px, rgba(255,215,215,0.07) 38px, rgba(0,0,0,0) 56px, rgba(0,0,0,0.34) 76px)," +
  "linear-gradient(180deg, #8f1626 0%, #7c1225 42%, #5c0e1e 76%, #42091a 100%)";

/* ══ BEAT 2 — Curtain ═════════════════════════════════════════════ */
export function Curtain({
  onDone,
  autoPlay,
}: {
  onDone: () => void;
  autoPlay?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const startedRef = useRef(false);
  const calledRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const dateLabel = runtimeDate();

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const begin = (doneDelay = 2400) => {
    if (startedRef.current) return;
    startedRef.current = true;
    setOpen(true);
    later(() => {
      if (calledRef.current) return;
      calledRef.current = true;
      onDoneRef.current();
    }, doneDelay);
  };
  const beginRef = useRef(begin);
  beginRef.current = begin;

  useEffect(() => {
    if (!autoPlay) return;
    // part at ~1100ms; onDone at ~4200ms total (1100 + 3100 dwell)
    const t = setTimeout(() => beginRef.current(3100), 1100);
    return () => clearTimeout(t);
  }, [autoPlay]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
    },
    []
  );

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${DEEP} 0%, ${DEEP_2} 100%)` }}
      onClick={autoPlay ? undefined : () => begin()}
      role={autoPlay ? undefined : "button"}
      aria-label={autoPlay ? undefined : "Tap to part the drapes"}
    >
      {/* names layer — rises from below on a maroon panel */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 44%, rgba(179,35,58,0.30) 0%, transparent 66%)",
          }}
          aria-hidden
        />
        <motion.div
          className="relative overflow-hidden px-4 py-2"
          initial={false}
          animate={open ? { y: 0, opacity: 1 } : { y: 70, opacity: 0 }}
          transition={{ duration: 1.1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="font-script text-7xl leading-[1.12] lg:text-8xl"
            style={{ color: LIGHT_GOLD, textShadow: "0 3px 18px rgba(0,0,0,0.55)" }}
          >
            {COUPLE.groom}
          </p>
          <p className="my-1 font-display text-lg italic" style={{ color: GOLD }}>
            weds
          </p>
          <p
            className="font-script text-7xl leading-[1.12] lg:text-8xl"
            style={{ color: LIGHT_GOLD, textShadow: "0 3px 18px rgba(0,0,0,0.55)" }}
          >
            {COUPLE.bride}
          </p>

          {/* one-shot light sweep across the names */}
          {open && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(105deg, transparent 30%, rgba(255,224,191,0.55) 50%, transparent 70%)`,
                mixBlendMode: "overlay",
              }}
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: "100%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.6, times: [0, 0.2, 0.8, 1], delay: 1.15, ease: "easeInOut" }}
              aria-hidden
            />
          )}
        </motion.div>

        {dateLabel && (
          <motion.p
            className="mt-5 font-display text-xs font-semibold uppercase"
            style={{ letterSpacing: "0.3em", color: GOLD }}
            initial={false}
            animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.7, delay: 1.2, ease: "easeOut" }}
          >
            {dateLabel}
          </motion.p>
        )}
      </div>

      {/* velvet drapes */}
      {(["left", "right"] as const).map((side) => {
        const isLeft = side === "left";
        return (
          <motion.div
            key={side}
            className={`absolute inset-y-0 ${isLeft ? "left-0" : "right-0"} w-[50.5%]`}
            initial={false}
            animate={{ x: open ? (isLeft ? "-104%" : "104%") : "0%" }}
            transition={{
              duration: 1.6,
              ease: [0.76, 0, 0.24, 1],
              delay: isLeft ? 0 : 0.09,
            }}
            aria-hidden
          >
            <div className="relative h-full w-full" style={{ background: VELVET_BG }}>
              {/* gold bottom trim */}
              <div
                className="absolute inset-x-0 bottom-0 h-[7px]"
                style={{
                  background: `linear-gradient(180deg, ${LIGHT_GOLD}, ${GOLD})`,
                  boxShadow: "0 -2px 10px rgba(219,180,116,0.45)",
                }}
              />
              <div className="absolute inset-x-0 bottom-[10px] h-px" style={{ background: "rgba(219,180,116,0.6)" }} />
              {/* centre seam shading */}
              <div
                className={`absolute inset-y-0 ${isLeft ? "right-0" : "left-0"} w-[2px]`}
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.55))",
                }}
              />
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent" />
              <Tassel side={side} open={open} />
            </div>
          </motion.div>
        );
      })}

      {/* title on the closed drapes */}
      <AnimatePresence>
        {!open && (
          <motion.div
            className="pointer-events-none absolute inset-0 px-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.45 } }}
            aria-hidden
          >
            <p
              className="absolute inset-x-0 top-[10%] font-display text-4xl font-semibold leading-tight lg:text-5xl"
              style={{ color: LIGHT_GOLD, textShadow: "0 2px 12px rgba(0,0,0,0.65)" }}
            >
              {copyText(3, "You're Invited")}
            </p>
            <div className="absolute inset-x-0 top-[21%] flex items-center justify-center gap-3">
              <span className="h-px w-14" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
              <span style={{ color: GOLD }}>✦</span>
              <span className="h-px w-14" style={{ background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
            </div>
            {!autoPlay && (
              <p
                className="absolute inset-x-0 bottom-[9%] font-display text-xs font-semibold uppercase"
                style={{ letterSpacing: "0.32em", color: CREAM, opacity: 0.85 }}
              >
                Tap to reveal
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
