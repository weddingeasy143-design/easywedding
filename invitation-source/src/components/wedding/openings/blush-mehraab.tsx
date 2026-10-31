"use client";

// blush-mehraab — "Peel the Vellum" (Blush Lotus · Amritsar)
// Beat 0 (Reveal): a monogram invitation waits beneath a frosted vellum
// sheet inside a mihrab arch; the guest peels the vellum away from its
// lifted top-right corner with a diagonal drag (or a plain tap).
// Beat 2 (Curtain): a closed blush rose of coded petals blooms open ring
// by ring inside the arch, revealing the couple's names on its heart.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { COUPLE } from "@/content/wedding";
import { copyText } from "../../../../adapters/copy";

/* ── palette ─────────────────────────────────────────────── */
const PAPER = "#fff1f2";
const PANEL = "#f4e1e4";
const INK = "#863d58";
const MUTED = "#997181";
const ROSE_GOLD = "#bb866d";
const PETALS = ["#f2c4ce", "#e3bda5", "#d99cae"] as const;

const ARCH_RADIUS = "46% 46% 12px 12px";

/* ── shared helpers ──────────────────────────────────────── */
function getConfig(): Record<string, string | undefined> {
  if (typeof window === "undefined") return {};
  return ((window as unknown as { __easyWedding?: { config?: Record<string, string> } })
    .__easyWedding?.config ?? {}) as Record<string, string | undefined>;
}

/** "2027-03-13" → "13 March 2027" (falls back to the raw value). */
function formatDate(iso?: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const month = months[Number(m[2]) - 1] ?? "";
  return `${Number(m[3])} ${month} ${m[1]}`;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ══════════════════════════════════════════════════════════
   BEAT 0 — Reveal: Peel the Vellum
   ══════════════════════════════════════════════════════════ */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const [progress, setProgress] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const drag = useRef<{ x: number; y: number; t: number; active: boolean }>({
    x: 0,
    y: 0,
    t: 0,
    active: false,
  });
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    setFinishing(true);
    setProgress(1);
    timerRef.current = setTimeout(() => onReveal(), 500);
  }, [onReveal]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (finishing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, t: Date.now(), active: true };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || finishing) return;
    const dist = Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y);
    const p = clamp01(dist / 420);
    setProgress(p);
    if (p >= 0.65) finish();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (finishing) return;
    const dist = Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y);
    const dt = Date.now() - drag.current.t;
    if ((dt < 300 && dist < 10) || clamp01(dist / 420) >= 0.65) finish();
  };

  const initials = `${(COUPLE.groom?.[0] ?? "").toUpperCase()}${(COUPLE.bride?.[0] ?? "").toUpperCase()}`;
  const p = finishing ? 1 : progress;
  // peel front position along the diagonal (bottom-left ← top-right)
  const front = p * 92;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: `linear-gradient(170deg, ${PAPER} 0%, ${PANEL} 58%, #eed3d9 100%)`,
        touchAction: "none",
        cursor: "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      aria-label="Peel the vellum to reveal the invitation"
    >
      {/* faint petal wash in the paper */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 42% at 50% 0%, rgba(242,196,206,0.5) 0%, transparent 70%), radial-gradient(ellipse 60% 36% at 50% 108%, rgba(227,189,165,0.4) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* ── mihrab arch stage ── */}
      <div
        className="absolute left-1/2 top-[7%] h-[76%] w-[84%] max-w-[430px] -translate-x-1/2"
        style={{
          borderRadius: ARCH_RADIUS,
          border: `1.5px solid ${ROSE_GOLD}`,
          boxShadow: `inset 0 0 0 5px ${PAPER}, inset 0 0 0 6.5px rgba(187,134,109,0.4), 0 24px 50px rgba(134,61,88,0.14)`,
          background: "linear-gradient(180deg, #fff7f5 0%, #fdf0ee 100%)",
        }}
      >
        {/* the invitation underneath — monogram + rose motif */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={false}
            animate={finishing ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative flex h-36 w-36 items-center justify-center rounded-full"
            style={{
              border: `1.5px solid ${ROSE_GOLD}`,
              boxShadow: `inset 0 0 0 4px #fff7f5, inset 0 0 0 5.5px rgba(187,134,109,0.55)`,
              background:
                "radial-gradient(circle at 50% 38%, #ffffff 0%, #fbe9ec 78%)",
            }}
          >
            <span
              className="font-display text-5xl tracking-[0.08em]"
              style={{ color: INK }}
            >
              {initials}
            </span>
          </motion.div>

          {/* small coded rose — five petal circles around a heart */}
          <svg width="46" height="46" viewBox="0 0 46 46" className="mt-5" aria-hidden>
            {[0, 72, 144, 216, 288].map((a, i) => (
              <circle
                key={a}
                cx={23 + 8.5 * Math.cos(((a - 90) * Math.PI) / 180)}
                cy={23 + 8.5 * Math.sin(((a - 90) * Math.PI) / 180)}
                r="7"
                fill={PETALS[i % PETALS.length]}
                opacity="0.85"
              />
            ))}
            <circle cx="23" cy="23" r="4.6" fill={INK} opacity="0.85" />
          </svg>

          <p
            className="mt-4 font-display text-[11px] uppercase tracking-[0.42em]"
            style={{ color: MUTED }}
          >
            {copyText(92, "The Invitation")}
          </p>
          <p
            className="mt-2 font-display text-sm italic"
            style={{ color: INK }}
          >
            {formatDate(getConfig().date ?? "2027-03-13")}
          </p>
        </div>

        {/* ── the vellum sheet (peels from the lifted top-right corner) ── */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={
            finishing
              ? { opacity: 0, x: 90, y: -70, rotate: 9 }
              : { opacity: 1, x: 0, y: 0, rotate: 0 }
          }
          transition={{ duration: finishing ? 0.5 : 0.2, ease: "easeOut" }}
          style={{ pointerEvents: "none" }}
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{
              borderRadius: ARCH_RADIUS,
              background: "rgba(255,250,248,0.72)",
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
              clipPath: `inset(0 0 ${p * 100}% ${p * 100}%)`,
              transform: `skewX(${-p * 3.5}deg)`,
              transformOrigin: "top right",
            }}
          />
          {/* curl edge — soft gradient band riding the peel front */}
          {p > 0.02 && p < 1 && (
            <div
              className="absolute h-[150%] w-9"
              style={{
                left: `calc(${front}% - 18px)`,
                bottom: `calc(${front}% - 25%)`,
                transform: "rotate(-45deg)",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.85) 38%, rgba(217,156,174,0.4) 62%, rgba(134,61,88,0.22) 100%)",
                filter: "blur(1px)",
                boxShadow: "-14px 0 24px rgba(134,61,88,0.18)",
              }}
            />
          )}
          {/* lifted corner — folded triangle, slightly darker, soft shadow */}
          <div
            className="absolute right-0 top-0 h-14 w-14"
            style={{
              borderRadius: "0 12px 0 0",
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
              background: "linear-gradient(135deg, #f3d9d3 0%, #e8c2bd 100%)",
              boxShadow: "-3px 3px 8px rgba(134,61,88,0.25)",
              opacity: 1 - p,
            }}
          />
        </motion.div>
      </div>

      {/* hint */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-[6%] text-center font-display text-[11px] uppercase tracking-[0.38em]"
        style={{ color: MUTED }}
        animate={{ opacity: finishing ? 0 : [0.55, 1, 0.55] }}
        transition={
          finishing
            ? { duration: 0.25 }
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      >
        {copyText(90, "Peel the vellum")}
      </motion.p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BEAT 2 — Curtain: the blush rose blooms open
   ══════════════════════════════════════════════════════════ */

const RINGS = [
  { count: 10, len: 118, wid: 46, r: 74, openDeg: 38, delay: 0, color: PETALS[0] },
  { count: 8, len: 94, wid: 40, r: 50, openDeg: 32, delay: 0.12, color: PETALS[2] },
  { count: 6, len: 68, wid: 34, r: 28, openDeg: 28, delay: 0.24, color: PETALS[1] },
] as const;

function BlushRose({ open }: { open: boolean }) {
  return (
    <motion.div
      className="relative h-[330px] w-[330px]"
      initial={false}
      animate={{ scale: open ? 1.05 : 0.92 }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      {RINGS.map((ring) =>
        Array.from({ length: ring.count }, (_, i) => {
          const base = (i * 360) / ring.count + (ring.count === 8 ? 22 : 0);
          return (
            <motion.div
              key={`${ring.count}-${i}`}
              className="absolute inset-0"
              initial={false}
              animate={{ rotate: open ? base + ring.openDeg : base }}
              transition={{
                duration: 1.35,
                delay: ring.delay + i * 0.02,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.div
                className="absolute"
                style={{
                  width: ring.wid,
                  height: ring.len,
                  left: "50%",
                  top: "50%",
                  marginLeft: -ring.wid / 2,
                  marginTop: -(ring.r + ring.len),
                  borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%",
                  background: `linear-gradient(180deg, ${ring.color} 0%, #eeb9c6 55%, #dfa3b5 100%)`,
                  boxShadow:
                    "inset 0 -10px 16px rgba(134,61,88,0.16), inset 0 6px 10px rgba(255,255,255,0.55), 0 2px 6px rgba(134,61,88,0.12)",
                }}
                initial={false}
                animate={{ scale: open ? 1.12 : 1 }}
                transition={{
                  duration: 1.35,
                  delay: ring.delay + i * 0.02,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </motion.div>
          );
        })
      )}
      {/* the flower's heart — a soft radial blush disc */}
      <div
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, #fff8f4 0%, #fbe3e6 55%, rgba(242,196,206,0.55) 100%)",
          boxShadow: "0 0 34px rgba(242,196,206,0.7)",
        }}
      />
    </motion.div>
  );
}

export function Curtain({
  onDone,
  autoPlay,
}: {
  onDone: () => void;
  autoPlay?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finishOnce = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  }, []);

  // auto-play: bloom begins ~1100ms in; names settle; done ~4200ms total
  useEffect(() => {
    if (!autoPlay) return;
    const t1 = setTimeout(() => setOpen(true), 1100);
    const t2 = setTimeout(finishOnce, 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [autoPlay, finishOnce]);

  // manual: tap starts the bloom; done ~2400ms after the tap
  useEffect(() => {
    if (autoPlay || !open) return;
    const t = setTimeout(finishOnce, 2400);
    return () => clearTimeout(t);
  }, [autoPlay, open, finishOnce]);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: `linear-gradient(170deg, ${PAPER} 0%, ${PANEL} 60%, #eed3d9 100%)`,
        cursor: autoPlay ? undefined : "pointer",
      }}
      onClick={autoPlay ? undefined : () => setOpen(true)}
      role="button"
      aria-label="The blush rose reveals the couple's names"
    >
      {/* mihrab arch outline framing the bloom */}
      <div
        className="pointer-events-none absolute left-1/2 top-[6%] h-[80%] w-[86%] max-w-[440px] -translate-x-1/2"
        style={{
          borderRadius: ARCH_RADIUS,
          border: `1.5px solid ${ROSE_GOLD}`,
          boxShadow: `inset 0 0 0 5px ${PAPER}, inset 0 0 0 6.5px rgba(187,134,109,0.35)`,
        }}
        aria-hidden
      />

      {/* the rose, centred in the arch */}
      <div className="absolute inset-0 flex items-center justify-center">
        <BlushRose open={open} />
      </div>

      {/* names staged on the flower's heart */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <motion.div
          className="text-center"
          initial={false}
          animate={
            open
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.9, y: 10 }
          }
          transition={{ duration: 0.9, delay: open ? 0.55 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="font-script text-6xl leading-[1.12] sm:text-7xl"
            style={{ color: INK, textShadow: "0 1px 0 rgba(255,255,255,0.65)" }}
          >
            {COUPLE.groom}
          </p>
          <p
            className="my-1 font-display text-base italic tracking-wide"
            style={{ color: ROSE_GOLD }}
          >
            weds
          </p>
          <p
            className="font-script text-6xl leading-[1.12] sm:text-7xl"
            style={{ color: INK, textShadow: "0 1px 0 rgba(255,255,255,0.65)" }}
          >
            {COUPLE.bride}
          </p>
        </motion.div>
      </div>

      {/* tap hint — manual mode only, until the bloom starts */}
      {!autoPlay && !open && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[6%] text-center font-display text-[11px] uppercase tracking-[0.38em]"
          style={{ color: MUTED }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          {copyText(91, "Tap to bloom")}
        </motion.p>
      )}
    </div>
  );
}
