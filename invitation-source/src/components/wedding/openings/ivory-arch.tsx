"use client";

// ivory-arch — "Untie the Jasmine Ribbon"
// Beat 0 (Reveal): drag sideways to untie a silk ribbon bow on an ivory
// arch; the jasmine bud behind it blooms as the ribbon falls away.
// Beat 2 (Curtain): a veil of jasmine petals unsticks and falls, revealing
// the couple's names inside a gold arch outline.

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COUPLE } from "@/content/wedding";
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

/* ── one petal of the closed / blooming jasmine bud ─────────────── */
function BudPetal({
  angle,
  blooming,
  tall,
}: {
  angle: number;
  blooming: boolean;
  tall: number;
}) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      aria-hidden
      style={{
        width: 22,
        height: tall,
        marginLeft: -11,
        marginTop: -tall,
        borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%",
        background:
          "radial-gradient(ellipse at 50% 78%, #ffffff 0%, #fdf6e3 58%, #eee0bd 100%)",
        border: `1px solid ${LIGHT_GOLD}`,
        boxShadow: "0 1px 5px rgba(112,60,43,0.18)",
        transformOrigin: "50% 100%",
      }}
      initial={false}
      animate={
        blooming
          ? { rotate: angle * 2.1, scale: 1.28, opacity: 0.96 }
          : { rotate: angle, scale: 1, opacity: 1 }
      }
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

/* ══ BEAT 0 — Reveal ══════════════════════════════════════════════ */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const [dragX, setDragX] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const finishedRef = useRef(false);
  const calledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progress = Math.min(Math.abs(dragX) / 180, 1);

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
    }, 520);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (finishing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = startRef.current;
    if (!s || finishing) return;
    const dx = e.clientX - s.x;
    setDragX(dx);
    if (Math.abs(dx) / 180 >= 0.65) finish();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = startRef.current;
    startRef.current = null;
    if (!s || finishing) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const isTap = Date.now() - s.t < 300 && Math.hypot(dx, dy) < 10;
    if (isTap || Math.abs(dx) / 180 >= 0.65) finish();
    else setDragX(0);
  };

  const loopScale = 1 - progress * 0.72;
  const driftPetals = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: ((i * 53) % 160) - 80,
        y: 110 + ((i * 37) % 70),
        rotate: (i * 67) % 180,
        size: 10 + ((i * 13) % 8),
        delay: i * 0.05,
      })),
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
      aria-label="Drag to untie the ribbon and reveal the invitation"
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

      {/* the ivory arch */}
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
          <p
            className="absolute inset-x-0 top-[16%] text-center font-display text-[11px] font-semibold uppercase"
            style={{ letterSpacing: "0.34em", color: GOLD }}
          >
            {copyText(3, "You're Invited")}
          </p>
          <p
            className="absolute inset-x-0 top-[21%] text-center font-script text-3xl"
            style={{ color: INK }}
          >
            {COUPLE.groom} &amp; {COUPLE.bride}
          </p>

          {/* jasmine bud — behind the bow, blooms on completion */}
          <div className="absolute left-1/2 top-[47%] h-2 w-2 -translate-x-1/2">
            {[-38, -19, 0, 19, 38].map((a) => (
              <BudPetal key={a} angle={a} blooming={finishing} tall={a === 0 ? 52 : 44} />
            ))}
            <div
              className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1 rounded-full"
              style={{ background: `radial-gradient(circle at 38% 32%, #ffeeb0, ${GOLD})` }}
            />
          </div>
        </div>
      </div>

      {/* silk ribbon + bow — slides down and fades on completion */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[47%] w-[min(92vw,420px)]"
        style={{ x: "-50%" }}
        initial={false}
        animate={
          finishing
            ? { y: 210, opacity: 0 }
            : { y: 0, opacity: 1, x: `calc(-50% + ${dragX * 0.14}px)` }
        }
        transition={{ duration: finishing ? 0.5 : 0.12, ease: "easeOut" }}
        aria-hidden
      >
        {/* band */}
        <div
          className="absolute inset-x-0 top-1/2 h-[34px] -translate-y-1/2"
          style={{
            background: `linear-gradient(180deg, #f2dfae 0%, ${LIGHT_GOLD} 48%, #cfa856 100%)`,
            boxShadow: "0 4px 14px rgba(112,60,43,0.28)",
          }}
        />
        {/* bow loops */}
        <div className="relative mx-auto h-[64px] w-[190px]">
          <div
            className="absolute left-0 top-1/2 h-[44px] w-[76px]"
            style={{
              transform: `translateY(-50%) rotate(-22deg) scaleX(${loopScale}) scaleY(${1 - progress * 0.3})`,
              transformOrigin: "100% 50%",
              borderRadius: "50% 12% 50% 12%",
              border: `1.5px solid ${GOLD}`,
              background:
                "linear-gradient(135deg, #fff6dc 0%, #eed9a0 60%, #d9ba6d 100%)",
              boxShadow: "0 3px 10px rgba(112,60,43,0.25)",
            }}
          />
          <div
            className="absolute right-0 top-1/2 h-[44px] w-[76px]"
            style={{
              transform: `translateY(-50%) rotate(22deg) scaleX(${loopScale}) scaleY(${1 - progress * 0.3})`,
              transformOrigin: "0% 50%",
              borderRadius: "12% 50% 12% 50%",
              border: `1.5px solid ${GOLD}`,
              background:
                "linear-gradient(225deg, #fff6dc 0%, #eed9a0 60%, #d9ba6d 100%)",
              boxShadow: "0 3px 10px rgba(112,60,43,0.25)",
            }}
          />
          {/* knot — slides with the drag */}
          <div
            className="absolute left-1/2 top-1/2 h-[34px] w-[34px] rounded-full"
            style={{
              transform: `translate(calc(-50% + ${dragX * 0.38}px), -50%)`,
              background: `radial-gradient(circle at 36% 30%, #ffedb5 0%, ${LIGHT_GOLD} 52%, ${GOLD} 100%)`,
              border: `1.5px solid ${GOLD}`,
              boxShadow: "0 3px 10px rgba(112,60,43,0.32)",
            }}
          />
        </div>
      </motion.div>

      {/* petals drift free as the bud blooms */}
      <AnimatePresence>
        {finishing &&
          driftPetals.map((p, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute left-1/2 top-[47%]"
              style={{
                width: p.size,
                height: p.size * 0.72,
                borderRadius: "62% 4% 62% 4%",
                background:
                  "radial-gradient(ellipse at 30% 30%, #ffffff 0%, #f6ead0 70%, #e8d5a8 100%)",
                boxShadow: "0 1px 4px rgba(112,60,43,0.2)",
              }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
              aria-hidden
            />
          ))}
      </AnimatePresence>

      {/* hint */}
      {!finishing && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[7%] text-center font-display text-xs font-semibold uppercase"
          style={{ letterSpacing: "0.32em", color: INK, opacity: 0.78 }}
          animate={{ opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          Drag to untie the ribbon
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
      {/* names layer — inside a gold arch outline */}
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
          <motion.div
            initial={false}
            animate={
              falling
                ? { opacity: 1, letterSpacing: "0em" }
                : { opacity: 0, letterSpacing: "0.06em" }
            }
            transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <p className="font-script text-6xl leading-[1.12] lg:text-7xl" style={{ color: INK }}>
              {COUPLE.groom}
            </p>
            <p className="my-1 font-display text-base italic" style={{ color: GOLD }}>
              weds
            </p>
            <p className="font-script text-6xl leading-[1.12] lg:text-7xl" style={{ color: INK }}>
              {COUPLE.bride}
            </p>
          </motion.div>

          {dateLabel && (
            <motion.p
              className="mt-6 font-display text-xs font-semibold uppercase"
              style={{ letterSpacing: "0.3em", color: GOLD }}
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
                className="mt-8 font-display text-xs font-semibold uppercase"
                style={{ letterSpacing: "0.32em", color: INK, opacity: 0.7 }}
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
