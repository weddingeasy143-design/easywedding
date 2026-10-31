"use client";

// emerald-darbar — "Unroll the Farman" (Sacred Courtyard · Varanasi)
// Beat 0 (Reveal): a rolled royal farman hangs in an emerald courtyard;
// the guest pulls down and the parchment unrolls from the roll, revealing
// the proclamation — the wedding date and city — sealed in gold.
// Beat 2 (Curtain): emerald brocade panels hang from a gold rod, then
// drop-fall and crumple at the floor, revealing the couple's names
// embossed on a sandstone wall, lit by a rising diya glow.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { COUPLE } from "@/content/wedding";
import { copyText } from "../../../../adapters/copy";

/* ── palette ─────────────────────────────────────────────── */
const PAPER = "#f7eee0";
const EMERALD_INK = "#355448";
const DEEP_GREEN = "#3f5d4a";
const COURT_DEEP = "#2c4638";
const GOLD = "#ab7847";
const LIGHT_GOLD = "#d7b383";
const EMBOSS = "#6b543a";

const DAMASK =
  "radial-gradient(circle at 8px 8px, rgba(215,179,131,0.13) 1.6px, transparent 2.2px)";
const BROCADE_BG = `${DAMASK}, linear-gradient(160deg, #2f4a3c 0%, ${DEEP_GREEN} 55%, #33503f 100%)`;

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

/* ── the rolled farman: cylinder + end caps + cord & tassel ── */
function FarmanRoll({ swing }: { swing: number }) {
  return (
    <div className="relative" style={{ width: "100%", height: 34 }} aria-hidden>
      {/* cylinder body */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: 17,
          background:
            "linear-gradient(180deg, #8a5a30 0%, #c99a5b 26%, #e8c98f 48%, #b3814a 72%, #7c4f27 100%)",
          boxShadow:
            "0 6px 16px rgba(20,32,24,0.45), inset 0 -3px 6px rgba(60,35,10,0.4), inset 0 3px 5px rgba(255,240,200,0.5)",
        }}
      />
      {/* end caps */}
      <div
        className="absolute left-[3px] top-1/2 h-[26px] w-[10px] -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(ellipse at 40% 40%, #efd9a8, #9a6c38 75%)" }}
      />
      <div
        className="absolute right-[3px] top-1/2 h-[26px] w-[10px] -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(ellipse at 40% 40%, #efd9a8, #9a6c38 75%)" }}
      />
      {/* gold cord + tassel hanging from the right end */}
      <div
        className="absolute right-[16px] top-[30px]"
        style={{ transform: `rotate(${swing}deg)`, transformOrigin: "top center" }}
      >
        <div
          className="mx-auto w-[2px]"
          style={{
            height: 26,
            background: `linear-gradient(180deg, ${GOLD}, ${LIGHT_GOLD})`,
          }}
        />
        {/* tassel head + skirt + fringe */}
        <div
          className="mx-auto"
          style={{
            width: 14,
            height: 20,
            clipPath: "polygon(28% 0, 72% 0, 100% 100%, 0 100%)",
            background: `linear-gradient(180deg, ${LIGHT_GOLD} 0%, ${GOLD} 70%, #8a5f33 100%)`,
          }}
        />
        <div className="mx-auto flex w-[13px] justify-between" style={{ marginTop: 1 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="block w-px"
              style={{ height: 7, background: GOLD, opacity: 0.9 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BEAT 0 — Reveal: Unroll the Farman
   ══════════════════════════════════════════════════════════ */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const [progress, setProgress] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const drag = useRef<{ y: number; t: number; active: boolean }>({
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
    drag.current = { y: e.clientY, t: Date.now(), active: true };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || finishing) return;
    const p = clamp01((e.clientY - drag.current.y) / 240);
    setProgress(p);
    if (p >= 0.65) finish();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (finishing) return;
    const dy = e.clientY - drag.current.y;
    const dt = Date.now() - drag.current.t;
    if ((dt < 300 && Math.abs(dy) < 10) || clamp01(dy / 240) >= 0.65) finish();
  };

  const cfg = getConfig();
  const dateLine = formatDate(cfg.date ?? "2027-03-13");
  const city = (cfg.city ?? "Varanasi").trim();
  const p = finishing ? 1 : progress;
  const proclamationOpacity = clamp01((p - 0.22) / 0.45);
  // tassel swings gently as the roll travels down
  const swing = Math.sin(p * Math.PI * 2) * 7;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: `linear-gradient(175deg, ${COURT_DEEP} 0%, ${DEEP_GREEN} 62%, #466550 100%)`,
        touchAction: "none",
        cursor: "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      aria-label="Pull down to unroll the farman"
    >
      {/* damask courtyard texture + lamp glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: DAMASK, backgroundSize: "26px 26px", opacity: 0.5 }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 40% at 50% 6%, rgba(215,179,131,0.2) 0%, transparent 70%), radial-gradient(ellipse at center, transparent 52%, rgba(10,20,14,0.5) 100%)",
        }}
        aria-hidden
      />

      {/* gold arch outline */}
      <div
        className="pointer-events-none absolute left-1/2 top-[5%] h-[84%] w-[88%] max-w-[450px] -translate-x-1/2"
        style={{
          borderRadius: "46% 46% 12px 12px",
          border: `1.5px solid ${LIGHT_GOLD}`,
          boxShadow:
            "inset 0 0 0 5px rgba(44,70,56,0.9), inset 0 0 0 6.5px rgba(215,179,131,0.4)",
        }}
        aria-hidden
      />

      {/* ── unrolling parchment + roll ── */}
      <div className="absolute left-1/2 top-[13%] w-[68%] max-w-[340px] -translate-x-1/2">
        <div
          className="relative w-full overflow-hidden"
          style={{
            height: `${p * 58}vh`,
            maxHeight: "58%",
            background: `linear-gradient(180deg, #fbf4e3 0%, ${PAPER} 55%, #efe0c2 100%)`,
            border: `1px solid ${GOLD}`,
            borderTop: "none",
            boxShadow: "0 18px 34px rgba(15,26,19,0.4)",
          }}
        >
          {/* proclamation — fades in as the parchment opens */}
          <div
            className="absolute inset-0 flex flex-col items-center px-5 pt-7 text-center"
            style={{ opacity: proclamationOpacity }}
          >
            {/* gold seal */}
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{
                background: `radial-gradient(circle at 38% 32%, ${LIGHT_GOLD} 0%, ${GOLD} 62%, #7c5527 100%)`,
                boxShadow: "0 2px 8px rgba(90,60,20,0.45), inset 0 0 0 2px rgba(247,238,224,0.55)",
              }}
              aria-hidden
            >
              <span style={{ color: "#fbf2dc", fontSize: 15, lineHeight: 1 }}>✦</span>
            </div>
            <p
              className="mt-5 font-display text-lg uppercase leading-snug tracking-[0.3em] sm:text-xl"
              style={{ color: EMERALD_INK }}
            >
              {dateLine}
            </p>
            {city && (
              <p
                className="mt-2 font-display text-xs uppercase tracking-[0.44em]"
                style={{ color: GOLD }}
              >
                · {city} ·
              </p>
            )}
            <div
              className="mt-5 h-px w-24"
              style={{
                background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
              }}
              aria-hidden
            />
            <p
              className="mt-5 font-display text-[11px] uppercase tracking-[0.34em]"
              style={{ color: EMERALD_INK, opacity: 0.75 }}
            >
              {copyText(93, "By Royal Command")}
            </p>
          </div>

          {/* completion glow pulse washing the parchment */}
          {finishing && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 30%, rgba(232,201,143,0.75) 0%, transparent 70%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.35] }}
              transition={{ duration: 0.5, times: [0, 0.4, 1], ease: "easeOut" }}
              aria-hidden
            />
          )}
        </div>

        {/* the roll rides the parchment's leading (bottom) edge */}
        <div style={{ marginTop: -17 }}>
          <FarmanRoll swing={swing} />
        </div>
      </div>

      {/* hint */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-[6%] text-center font-display text-[11px] uppercase tracking-[0.38em]"
        style={{ color: LIGHT_GOLD }}
        animate={{ opacity: finishing ? 0 : [0.55, 1, 0.55] }}
        transition={
          finishing
            ? { duration: 0.25 }
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      >
        {copyText(94, "Pull the tassel to unroll")}
      </motion.p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BEAT 2 — Curtain: brocade drop-fall over a sandstone wall
   ══════════════════════════════════════════════════════════ */

function BrocadePanel({ side, open }: { side: "left" | "right"; open: boolean }) {
  const isLeft = side === "left";
  return (
    <motion.div
      className={`pointer-events-none absolute inset-y-0 ${isLeft ? "left-0" : "right-0"} w-[50.5%]`}
      initial={false}
      animate={{ y: open ? "108%" : "0%" }}
      transition={{ duration: 1.1, ease: [0.55, 0, 1, 0.6] }}
      aria-hidden
    >
      <div
        className="relative h-full w-full"
        style={{ backgroundImage: BROCADE_BG, backgroundSize: "26px 26px, cover" }}
      >
        {/* zari border — 6px gold stripe + thin line at the inner edge */}
        <div
          className={`absolute inset-y-0 ${isLeft ? "right-0" : "left-0"} w-[6px]`}
          style={{
            background: `linear-gradient(180deg, ${LIGHT_GOLD} 0%, ${GOLD} 55%, #8a5f33 100%)`,
            boxShadow: isLeft
              ? "-2px 0 0 rgba(247,238,224,0.5), -6px 0 12px rgba(0,0,0,0.35)"
              : "2px 0 0 rgba(247,238,224,0.5), 6px 0 12px rgba(0,0,0,0.35)",
          }}
        />
        {/* zari stripe along the bottom hem */}
        <div
          className="absolute inset-x-0 bottom-0 h-[6px]"
          style={{
            background: `linear-gradient(90deg, ${GOLD}, ${LIGHT_GOLD}, ${GOLD})`,
          }}
        />
        <div className="absolute inset-x-0 bottom-[9px] h-px bg-[#d7b383]/50" />
        {/* hanging folds shading */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0px, transparent 26px, rgba(255,240,200,0.05) 44px, transparent 62px, rgba(0,0,0,0.22) 84px)",
          }}
        />
      </div>
    </motion.div>
  );
}

/** Wavy crumpled strip the fallen panels bunch into at the floor. */
function CrumpleStrip({ open }: { open: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 bottom-0"
      initial={false}
      animate={open ? { opacity: 1, scaleY: 1 } : { opacity: 0, scaleY: 0.3 }}
      transition={{ duration: 0.55, delay: open ? 1.0 : 0, ease: "easeOut" }}
      style={{ transformOrigin: "bottom" }}
      aria-hidden
    >
      <svg
        viewBox="0 0 400 26"
        preserveAspectRatio="none"
        className="block h-[26px] w-full"
      >
        <path
          d="M0 26 L0 16 Q25 6 50 14 Q75 22 100 12 Q125 4 150 13 Q175 21 200 11 Q225 3 250 12 Q275 20 300 12 Q325 5 350 14 Q375 21 400 13 L400 26 Z"
          fill="#33503f"
        />
        <path
          d="M0 16 Q25 6 50 14 Q75 22 100 12 Q125 4 150 13 Q175 21 200 11 Q225 3 250 12 Q275 20 300 12 Q325 5 350 14 Q375 21 400 13"
          fill="none"
          stroke="#d7b383"
          strokeWidth="1.6"
          opacity="0.75"
        />
      </svg>
    </motion.div>
  );
}

/** Six soft dust dots puffing up as the panels land. */
function DustPuff({ open }: { open: boolean }) {
  if (!open) return null;
  const dots = [
    { left: "18%", size: 7, x: -16, delay: 0 },
    { left: "32%", size: 5, x: 10, delay: 0.06 },
    { left: "47%", size: 8, x: -6, delay: 0.03 },
    { left: "60%", size: 5, x: 14, delay: 0.09 },
    { left: "72%", size: 7, x: -12, delay: 0.05 },
    { left: "84%", size: 5, x: 8, delay: 0.12 },
  ];
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5" aria-hidden>
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: d.left,
            width: d.size,
            height: d.size,
            background: "rgba(232,220,196,0.85)",
            filter: "blur(1px)",
          }}
          initial={{ opacity: 0, y: 0, x: 0 }}
          animate={{ opacity: [0, 0.85, 0], y: -44, x: d.x }}
          transition={{ duration: 1.1, delay: 1.02 + d.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/** A small diya flame — teardrop dot with a gentle flicker. */
function DiyaFlame({ className }: { className: string }) {
  return (
    <div className={`pointer-events-none absolute bottom-4 ${className}`} aria-hidden>
      {/* diya bowl */}
      <div
        className="mx-auto h-[7px] w-9 rounded-b-full"
        style={{ background: "linear-gradient(180deg, #8a5a30, #5f3c1c)" }}
      />
      <motion.div
        className="absolute -top-[13px] left-1/2 h-[15px] w-[9px] -translate-x-1/2"
        style={{
          borderRadius: "50% 50% 50% 50% / 68% 68% 32% 32%",
          background:
            "radial-gradient(ellipse at 50% 78%, #fff3c4 0%, #ffb84d 45%, #e07b24 100%)",
          boxShadow: "0 0 14px rgba(255,170,60,0.85)",
          transformOrigin: "50% 100%",
        }}
        animate={{ scale: [1, 1.14, 0.94, 1.08, 1], opacity: [0.92, 1, 0.88, 1, 0.92] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
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

  // auto-play: panels drop ~1100ms in; done ~4200ms total
  useEffect(() => {
    if (!autoPlay) return;
    const t1 = setTimeout(() => setOpen(true), 1100);
    const t2 = setTimeout(finishOnce, 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [autoPlay, finishOnce]);

  // manual: tap drops the panels; done ~2400ms after the tap
  useEffect(() => {
    if (autoPlay || !open) return;
    const t = setTimeout(finishOnce, 2400);
    return () => clearTimeout(t);
  }, [autoPlay, open, finishOnce]);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #e8dcc4 0%, #d9c9a8 100%)",
        cursor: autoPlay ? undefined : "pointer",
      }}
      onClick={autoPlay ? undefined : () => setOpen(true)}
      role="button"
      aria-label="The brocade panels reveal the couple's names"
    >
      {/* ── sandstone wall behind the panels ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #ecdfc6 0%, #e3d2ac 52%, #d5bf95 100%)",
        }}
        aria-hidden
      />
      {/* ghats steps — subtle horizontal step lines near the floor */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0" aria-hidden>
        {[64, 46, 30, 16].map((b, i) => (
          <div
            key={b}
            className="absolute inset-x-0"
            style={{
              bottom: b,
              height: 3,
              background: "rgba(107,84,58,0.16)",
              boxShadow: `0 ${(i + 1) * 5}px 0 rgba(255,246,220,0.12)`,
            }}
          />
        ))}
      </div>

      {/* rising diya glow — warm light climbing the wall */}
      <motion.div
        className="pointer-events-none absolute left-1/2 h-[62vmin] w-[86vmin] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(255,196,92,0.55) 0%, rgba(255,170,60,0.22) 45%, transparent 70%)",
          filter: "blur(6px)",
        }}
        initial={false}
        animate={
          open
            ? { top: "16%", opacity: 0.95 }
            : { top: "58%", opacity: 0 }
        }
        transition={{ duration: 1.9, delay: open ? 0.55 : 0, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />

      {/* embossed names on the wall */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={false}
          animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 1.1, delay: open ? 0.75 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="font-script text-6xl leading-[1.12] sm:text-7xl"
            style={{
              color: EMBOSS,
              textShadow:
                "0 1px 0 rgba(255,246,220,0.7), 0 -1px 1px rgba(80,60,30,0.35)",
            }}
          >
            {COUPLE.groom}
          </p>
          <p
            className="my-1 font-display text-base italic tracking-wide"
            style={{
              color: EMBOSS,
              opacity: 0.85,
              textShadow:
                "0 1px 0 rgba(255,246,220,0.7), 0 -1px 1px rgba(80,60,30,0.35)",
            }}
          >
            weds
          </p>
          <p
            className="font-script text-6xl leading-[1.12] sm:text-7xl"
            style={{
              color: EMBOSS,
              textShadow:
                "0 1px 0 rgba(255,246,220,0.7), 0 -1px 1px rgba(80,60,30,0.35)",
            }}
          >
            {COUPLE.bride}
          </p>
        </motion.div>
      </div>

      {/* diya flames at the bottom corners, burning throughout */}
      <DiyaFlame className="left-5" />
      <DiyaFlame className="right-5" />

      {/* ── the brocade panels + gold rod ── */}
      <BrocadePanel side="left" open={open} />
      <BrocadePanel side="right" open={open} />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[9px]"
        style={{
          background: `linear-gradient(180deg, ${LIGHT_GOLD} 0%, ${GOLD} 60%, #7c5527 100%)`,
          boxShadow: "0 3px 10px rgba(20,30,22,0.4)",
        }}
        aria-hidden
      >
        <span
          className="absolute -left-1 top-1/2 h-[15px] w-[15px] -translate-y-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle at 38% 32%, ${LIGHT_GOLD}, ${GOLD} 70%)`,
          }}
        />
        <span
          className="absolute -right-1 top-1/2 h-[15px] w-[15px] -translate-y-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle at 38% 32%, ${LIGHT_GOLD}, ${GOLD} 70%)`,
          }}
        />
      </div>

      {/* landing dressing — crumple + dust */}
      <CrumpleStrip open={open} />
      <DustPuff open={open} />

      {/* tap hint — manual mode only, until the panels drop */}
      {!autoPlay && !open && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] z-10 text-center font-display text-[11px] uppercase tracking-[0.38em]"
          style={{ color: LIGHT_GOLD, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          {copyText(95, "Tap to reveal")}
        </motion.p>
      )}
    </div>
  );
}
