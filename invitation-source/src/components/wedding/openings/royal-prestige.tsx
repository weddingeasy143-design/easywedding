"use client";

// royal-prestige — "The Heritage Monogram"
// Beat 0 (Reveal): the couple's intertwined initials draw themselves in
// gold line-work on a deep crimson ground, ringed by a fine gold circle
// and laurel. A tap completes the monogram in a soft glow.
// Beat 2 (Curtain): heavy crimson velvet drapes with gold tassel tiebacks
// part sideways, and the couple's names rise in gold under a light sweep.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ORDERED_COUPLE } from "@/content/wedding";
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

function firstInitial(name?: string): string {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "";
}

/* ══ BEAT 0 — Reveal ══════════════════════════════════════════════ */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const [ready, setReady] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const finishedRef = useRef(false);
  const calledRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const leadInitial = firstInitial(ORDERED_COUPLE[0].name);
  const secondInitial = firstInitial(ORDERED_COUPLE[1].name);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1850);
    return () => clearTimeout(t);
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
    },
    []
  );

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinishing(true);
    timersRef.current.push(
      setTimeout(() => {
        if (calledRef.current) return;
        calledRef.current = true;
        onReveal();
      }, 700)
    );
  };

  return (
    <div
      className="relative h-full w-full touch-none select-none overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${DEEP} 0%, ${DEEP_2} 55%, ${DEEP} 100%)`,
        cursor: finishing ? "default" : "pointer",
      }}
      onClick={() => finish()}
      role="button"
      aria-label="Tap to complete the monogram and reveal the invitation"
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
          className="font-display text-sm"
          style={{ letterSpacing: "0.05em", color: GOLD }}
        >
          {copyText(3, "You're Invited")}
        </p>
        <p
          className="mt-3 font-display text-xl italic leading-relaxed lg:text-2xl"
          style={{ color: CREAM }}
        >
          By the grace of two families
        </p>

        {/* heritage monogram — gold line-work drawing itself */}
        <motion.div
          className="relative mt-10 h-[248px] w-[248px] lg:h-[268px] lg:w-[268px]"
          initial={false}
          animate={
            finishing
              ? { scale: 1.045, filter: "drop-shadow(0 0 30px rgba(245,220,162,0.55))" }
              : { scale: 1, filter: "drop-shadow(0 0 0px rgba(245,220,162,0))" }
          }
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 300 300"
            fill="none"
          >
            {/* fine outer ring */}
            <motion.circle
              cx="150"
              cy="150"
              r="118"
              stroke={GOLD}
              strokeWidth="1.6"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* inner hairline ring */}
            <motion.circle
              cx="150"
              cy="150"
              r="106"
              stroke="rgba(219,180,116,0.55)"
              strokeWidth="0.9"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* laurel branches, left and right */}
            <motion.path
              d="M 66 214 C 46 172 48 118 80 80"
              stroke={LIGHT_GOLD}
              strokeWidth="1.8"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.05, delay: 1.0, ease: "easeOut" }}
            />
            <motion.path
              d="M 234 214 C 254 172 252 118 220 80"
              stroke={LIGHT_GOLD}
              strokeWidth="1.8"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.05, delay: 1.0, ease: "easeOut" }}
            />
            {/* laurel leaves */}
            <motion.path
              d="M 60 196 L 44 190 M 54 164 L 38 156 M 60 130 L 46 116 M 70 102 L 60 84"
              stroke={LIGHT_GOLD}
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: 0.9, delay: 1.35, ease: "easeOut" }}
            />
            <motion.path
              d="M 240 196 L 256 190 M 246 164 L 262 156 M 240 130 L 254 116 M 230 102 L 240 84"
              stroke={LIGHT_GOLD}
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: 0.9, delay: 1.35, ease: "easeOut" }}
            />
            {/* diamond crowning the ring */}
            <motion.path
              d="M150 20 L163 36 L150 52 L137 36 Z"
              stroke={LIGHT_GOLD}
              strokeWidth="1.6"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
            />
            {/* small star at the foot of the ring */}
            <motion.path
              d="M150 244 L153 254 L163 257 L153 260 L150 270 L147 260 L137 257 L147 254 Z"
              stroke={LIGHT_GOLD}
              strokeWidth="1.3"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.6, ease: "easeOut" }}
            />
          </svg>

          {/* intertwined initials — editorial serif, staggered kinetic entry */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="font-display"
              style={{
                color: LIGHT_GOLD,
                fontSize: "clamp(76px, 24vw, 96px)",
                lineHeight: 1,
                marginRight: -16,
                textShadow: "0 3px 18px rgba(0,0,0,0.5)",
              }}
              initial={{ opacity: 0, y: 26, scale: 0.86 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              {leadInitial}
            </motion.span>
            <motion.span
              className="font-display italic"
              style={{
                color: GOLD,
                fontSize: "clamp(26px, 8vw, 34px)",
                lineHeight: 1,
                marginTop: 34,
              }}
              initial={{ opacity: 0, y: 18, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              &amp;
            </motion.span>
            <motion.span
              className="font-display"
              style={{
                color: LIGHT_GOLD,
                fontSize: "clamp(76px, 24vw, 96px)",
                lineHeight: 1,
                marginLeft: -16,
                marginTop: 22,
                textShadow: "0 3px 18px rgba(0,0,0,0.5)",
              }}
              initial={{ opacity: 0, y: 26, scale: 0.86 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {secondInitial}
            </motion.span>
          </div>
        </motion.div>

        {/* couple names — editorial scale, staggered */}
        <div className="mt-9 flex flex-col items-center">
          <motion.p
            className="font-display leading-tight"
            style={{ color: CREAM, fontSize: "clamp(24px, 7.5vw, 32px)" }}
            initial={{ opacity: 0, y: 22, scale: 0.94 }}
            animate={
              ready
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 22, scale: 0.94 }
            }
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {ORDERED_COUPLE[0].name} &amp; {ORDERED_COUPLE[1].name}
          </motion.p>
        </div>
      </div>

      {/* hint — quiet modern treatment, once the drawing completes */}
      <AnimatePresence>
        {ready && !finishing && (
          <motion.p
            className="pointer-events-none absolute inset-x-0 bottom-[7%] text-center font-display text-sm"
            style={{ letterSpacing: "0.05em", color: LIGHT_GOLD }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0.55, 1, 0.55], y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 0.5, ease: "easeOut" },
            }}
            aria-hidden
          >
            Tap to begin
          </motion.p>
        )}
      </AnimatePresence>
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
      {/* names layer — editorial scale on a maroon panel */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 44%, rgba(179,35,58,0.30) 0%, transparent 66%)",
          }}
          aria-hidden
        />
        <div className="relative overflow-hidden px-4 py-2">
          <motion.p
            className="font-display leading-[1.06]"
            style={{
              color: LIGHT_GOLD,
              fontSize: "clamp(48px, 14.5vw, 64px)",
              textShadow: "0 3px 18px rgba(0,0,0,0.55)",
            }}
            initial={false}
            animate={open ? { y: 0, opacity: 1, scale: 1 } : { y: 34, opacity: 0, scale: 0.93 }}
            transition={{ duration: 1.0, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {ORDERED_COUPLE[0].name}
          </motion.p>
          <motion.p
            className="my-1 font-display italic"
            style={{ color: GOLD, fontSize: "clamp(19px, 5.5vw, 24px)" }}
            initial={false}
            animate={open ? { y: 0, opacity: 1, scale: 1 } : { y: 24, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            weds
          </motion.p>
          <motion.p
            className="font-display leading-[1.06]"
            style={{
              color: LIGHT_GOLD,
              fontSize: "clamp(48px, 14.5vw, 64px)",
              textShadow: "0 3px 18px rgba(0,0,0,0.55)",
            }}
            initial={false}
            animate={open ? { y: 0, opacity: 1, scale: 1 } : { y: 34, opacity: 0, scale: 0.93 }}
            transition={{ duration: 1.0, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            {ORDERED_COUPLE[1].name}
          </motion.p>

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
        </div>

        {dateLabel && (
          <motion.p
            className="mt-5 font-display text-sm"
            style={{ letterSpacing: "0.06em", color: GOLD }}
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
                className="absolute inset-x-0 bottom-[9%] font-display text-sm"
                style={{ letterSpacing: "0.05em", color: CREAM, opacity: 0.85 }}
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
