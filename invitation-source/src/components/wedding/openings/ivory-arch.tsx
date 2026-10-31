"use client";

// ivory-arch — "The Falling Jasmine Garlands"
// Beat 0 (Reveal): a veil of jasmine garland strands hangs over a soft
// ivory arch. One upward swipe parts the strands to the edges and the
// couple's names arrive at editorial scale inside the arch.
// Beat 2 (Curtain): a veil of jasmine petals unsticks and falls, revealing
// the couple's names inside a gold arch outline.

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ORDERED_COUPLE } from "@/content/wedding";
import { copyText } from "../../../../adapters/copy";

const PAPER = "#fff9ee";
const PANEL = "#f4e9d5";
const INK = "#703c2b";
const GOLD = "#b88b36";
const LIGHT_GOLD = "#e2c779";

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

/* ══ BEAT 0 — Reveal ══════════════════════════════════════════════ */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const [dragY, setDragY] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const finishedRef = useRef(false);
  const calledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progress = Math.min(Math.abs(Math.min(dragY, 0)) / 150, 1);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinishing(true);
    timerRef.current = setTimeout(() => {
      if (calledRef.current) return;
      calledRef.current = true;
      onReveal();
    }, 1080);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (finishing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = startRef.current;
    if (!s || finishing) return;
    const dy = e.clientY - s.y;
    setDragY(Math.min(0, dy));
    if (Math.abs(Math.min(0, dy)) / 150 >= 0.62) finish();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = startRef.current;
    startRef.current = null;
    if (!s || finishing) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const isTap = Date.now() - s.t < 300 && Math.hypot(dx, dy) < 10;
    if (isTap || Math.abs(Math.min(0, dy)) / 150 >= 0.62) finish();
    else setDragY(0);
  };

  // Garland strands: rows of jasmine buds strung on fine threads.
  // Strands nearest the centre travel furthest when the veil parts.
  const strands = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const dir = i - 4;
        const side = i <= 4 ? -1 : 1;
        const closeness = 5 - Math.abs(dir);
        return {
          id: i,
          left: 10 + i * 10,
          buds: 11 + ((i * 3) % 4),
          height: 64 + ((i * 7) % 14),
          side,
          partX: side * closeness * 38,
          swayDelay: i * 0.22,
          swayDur: 2.6 + (i % 3) * 0.45,
        };
      }),
    []
  );

  return (
    <div
      className="relative h-full w-full touch-none select-none overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${PAPER} 0%, ${PANEL} 58%, #ecdcc0 100%)`,
        cursor: finishing ? "default" : "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      aria-label="Swipe up to part the jasmine garlands and reveal the invitation"
    >
      {/* soft garden light */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(226,199,121,0.32) 0%, transparent 65%), radial-gradient(ellipse at center, transparent 58%, rgba(112,60,43,0.14) 100%)",
        }}
        aria-hidden
      />

      {/* the ivory arch — names wait behind the garlands */}
      <div
        className="absolute left-1/2 top-[9%] flex w-[min(80vw,340px)] -translate-x-1/2 flex-col items-center"
        style={{ height: "74%" }}
        aria-hidden
      >
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            borderRadius: "999px 999px 22px 22px",
            border: `1.5px solid ${GOLD}`,
            background:
              "linear-gradient(180deg, #fffdf6 0%, #fff9ee 55%, #f7ecd4 100%)",
            boxShadow:
              "0 18px 44px rgba(112,60,43,0.20), inset 0 0 0 7px #fff9ee, inset 0 0 0 8.5px rgba(184,139,54,0.45)",
          }}
        >
          {/* inner arch line */}
          <div
            className="absolute inset-[16px]"
            style={{
              borderRadius: "999px 999px 14px 14px",
              border: `1px solid rgba(184,139,54,0.4)`,
            }}
          />

          {/* couple names — editorial scale, kinetic staggered entrance */}
          <div className="absolute inset-x-0 top-[24%] flex flex-col items-center px-5 text-center">
            <motion.p
              className="font-display leading-[1.04]"
              style={{ color: INK, fontSize: "clamp(40px, 12vw, 54px)" }}
              initial={false}
              animate={
                finishing
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 30, scale: 0.92 }
              }
              transition={{ duration: 0.85, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {ORDERED_COUPLE[0].name}
            </motion.p>
            <motion.p
              className="font-display italic"
              style={{ color: GOLD, fontSize: "clamp(20px, 6vw, 26px)" }}
              initial={false}
              animate={
                finishing
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 22, scale: 0.9 }
              }
              transition={{ duration: 0.75, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              &amp;
            </motion.p>
            <motion.p
              className="font-display leading-[1.04]"
              style={{ color: INK, fontSize: "clamp(40px, 12vw, 54px)" }}
              initial={false}
              animate={
                finishing
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 30, scale: 0.92 }
              }
              transition={{ duration: 0.85, delay: 0.46, ease: [0.22, 1, 0.36, 1] }}
            >
              {ORDERED_COUPLE[1].name}
            </motion.p>
          </div>
        </div>
      </div>

      {/* quiet invitation line above the veil */}
      <p
        className="pointer-events-none absolute inset-x-0 top-[5.5%] text-center font-display text-sm"
        style={{ letterSpacing: "0.05em", color: GOLD }}
        aria-hidden
      >
        {copyText(3, "You're Invited")}
      </p>

      {/* falling jasmine garlands — the veil itself */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {strands.map((s) => (
          <motion.div
            key={s.id}
            className="absolute top-[-2%]"
            style={{
              left: `${s.left}%`,
              height: `${s.height}%`,
              width: 26,
              marginLeft: -13,
              transformOrigin: "50% 0%",
            }}
            initial={false}
            animate={
              finishing
                ? { x: s.partX, rotate: s.side * 7, opacity: 0.94 }
                : { x: s.partX * progress * 0.55, rotate: s.side * progress * 2.5, opacity: 1 }
            }
            transition={{
              duration: finishing ? 0.95 : 0.15,
              ease: finishing ? [0.22, 1, 0.36, 1] : "easeOut",
            }}
          >
            <motion.div
              className="relative h-full w-full"
              style={{ transformOrigin: "50% 0%" }}
              animate={{ rotate: [-1.6, 1.6, -1.6] }}
              transition={{ duration: s.swayDur, delay: s.swayDelay, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* thread */}
              <span
                className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(184,139,54,0.15), rgba(184,139,54,0.55) 18%, rgba(184,139,54,0.55) 88%, rgba(184,139,54,0.2))",
                }}
              />
              {/* jasmine buds strung along the thread */}
              {Array.from({ length: s.buds }, (_, j) => {
                const size = 9 + ((j * 5 + s.id) % 5);
                const offset = j % 2 === 0 ? -5 : 5;
                return (
                  <span
                    key={j}
                    className="absolute left-1/2 rounded-full"
                    style={{
                      top: `${((j + 0.6) / s.buds) * 100}%`,
                      width: size,
                      height: size * 0.86,
                      marginLeft: offset - size / 2,
                      background:
                        "radial-gradient(circle at 36% 30%, #ffffff 0%, #fdf6e3 58%, #eee0bd 100%)",
                      border: `1px solid rgba(184,139,54,0.55)`,
                      boxShadow: "0 1px 4px rgba(112,60,43,0.18)",
                    }}
                  />
                );
              })}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* hint — quiet modern treatment */}
      {!finishing && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[7%] text-center font-display text-sm"
          style={{ letterSpacing: "0.05em", color: INK }}
          animate={{ opacity: [0.5, 0.9, 0.5], y: [0, -5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          Swipe up to part the garlands
        </motion.p>
      )}
    </div>
  );
}

/* ══ BEAT 2 — Curtain ═════════════════════════════════════════════ */
export function Curtain({
  onDone,
  autoPlay,
}: {
  onDone: () => void;
  autoPlay?: boolean;
}) {
  const [falling, setFalling] = useState(false);
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
    setFalling(true);
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
    const t1 = setTimeout(() => beginRef.current(3100), 1100);
    return () => clearTimeout(t1);
  }, [autoPlay]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
    },
    []
  );

  const petals = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const w = 20 + ((i * 17) % 30);
        return {
          left: (i * 29 + 7) % 96,
          top: (i * 41 + 5) % 94,
          w,
          h: w * 0.62,
          rotate: ((i * 47) % 160) - 80,
          opacity: 0.78 + ((i * 13) % 22) / 100,
          fall: 470 + ((i * 31) % 150),
          spin: ((i * 59) % 160) - 80,
          delay: (i % 12) * 0.07,
        };
      }),
    []
  );

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${PAPER} 0%, ${PANEL} 100%)` }}
      onClick={autoPlay ? undefined : () => begin()}
      role={autoPlay ? undefined : "button"}
      aria-label={autoPlay ? undefined : "Tap to reveal the names"}
    >
      {/* names layer — inside a gold arch outline, editorial scale */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div
          className="flex w-[min(84vw,360px)] flex-col items-center px-6 pb-10 pt-20 text-center"
          style={{
            borderRadius: "999px 999px 20px 20px",
            border: `1.5px solid ${GOLD}`,
            boxShadow: `inset 0 0 0 6px ${PAPER}, inset 0 0 0 7px rgba(184,139,54,0.45)`,
            background: "linear-gradient(180deg, #fffdf6 0%, #fdf3de 100%)",
            minHeight: "62%",
          }}
        >
          <div className="flex flex-col items-center">
            <motion.p
              className="font-display leading-[1.06]"
              style={{ color: INK, fontSize: "clamp(44px, 13vw, 60px)" }}
              initial={false}
              animate={
                falling
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 30, scale: 0.93 }
              }
              transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {ORDERED_COUPLE[0].name}
            </motion.p>
            <motion.p
              className="my-1 font-display italic"
              style={{ color: GOLD, fontSize: "clamp(19px, 5.5vw, 24px)" }}
              initial={false}
              animate={
                falling
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 20, scale: 0.9 }
              }
              transition={{ duration: 0.75, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              weds
            </motion.p>
            <motion.p
              className="font-display leading-[1.06]"
              style={{ color: INK, fontSize: "clamp(44px, 13vw, 60px)" }}
              initial={false}
              animate={
                falling
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 30, scale: 0.93 }
              }
              transition={{ duration: 0.9, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              {ORDERED_COUPLE[1].name}
            </motion.p>
          </div>

          {dateLabel && (
            <motion.p
              className="mt-6 font-display text-sm"
              style={{ letterSpacing: "0.06em", color: GOLD }}
              initial={false}
              animate={falling ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.6, delay: 1.15, ease: "easeOut" }}
            >
              {dateLabel}
            </motion.p>
          )}
        </div>
      </div>

      {/* jasmine petal veil — the material layer */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(180deg, rgba(255,249,238,0.96), rgba(244,233,213,0.94))` }}
        initial={false}
        animate={{ opacity: falling ? 0 : 1 }}
        transition={{ duration: 1.7, delay: 0.25, ease: "easeOut" }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {petals.map((p, i) => (
          <motion.span
            key={i}
            className="absolute"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.w,
              height: p.h,
              borderRadius: "62% 6% 62% 6%",
              background:
                "radial-gradient(ellipse at 32% 30%, #ffffff 0%, #fdf3da 62%, #ecd9ac 100%)",
              border: "1px solid rgba(184,139,54,0.35)",
              boxShadow: "0 1px 5px rgba(112,60,43,0.16)",
            }}
            initial={{ y: 0, rotate: p.rotate, opacity: p.opacity }}
            animate={
              falling
                ? { y: p.fall, rotate: p.rotate + p.spin, opacity: 0 }
                : { y: 0, rotate: p.rotate, opacity: p.opacity }
            }
            transition={{ duration: 1.6, delay: p.delay, ease: [0.3, 0.6, 0.6, 1] }}
          />
        ))}
      </div>

      {/* title on the closed veil */}
      <AnimatePresence>
        {!falling && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            aria-hidden
          >
            <p
              className="font-display text-4xl font-semibold leading-tight lg:text-5xl"
              style={{ color: INK }}
            >
              {copyText(3, "You're Invited")}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-14" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
              <span style={{ color: GOLD }}>✦</span>
              <span className="h-px w-14" style={{ background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
            </div>
            {!autoPlay && (
              <p
                className="mt-8 font-display text-sm"
                style={{ letterSpacing: "0.05em", color: INK, opacity: 0.75 }}
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
