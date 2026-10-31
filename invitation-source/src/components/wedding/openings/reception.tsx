"use client";

// reception — "Pull the Card" (Champagne Forever)
// Beat 0: drag the invitation card up out of its champagne envelope.
// Beat 2: crystal-bead waterfall dissolves left→right over champagne silk,
// revealing the couple's names on a deep bronze panel with a foil sweep.
// 100% coded CSS/SVG — no external images.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { COUPLE } from "@/content/wedding";
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

/* ── Beat 0 — Pull the Card ─────────────────────────────────── */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const [progress, setProgress] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const doneRef = useRef(false);
  const dragRef = useRef<{ y: number; x: number; t: number; active: boolean }>({
    y: 0,
    x: 0,
    t: 0,
    active: false,
  });
  const progressRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = getConfig();
  const dateLabel = formatDate(config.date ?? "2026-12-19");
  const initials = `${(COUPLE.groom || "G").charAt(0)} & ${(COUPLE.bride || "B").charAt(0)}`;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setFinishing(true);
    setProgress(1);
    progressRef.current = 1;
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
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { y: e.clientY, x: e.clientX, t: Date.now(), active: true };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || finishing) return;
    const dy = dragRef.current.y - e.clientY;
    const p = Math.max(0, Math.min(1, dy / 170));
    progressRef.current = p;
    setProgress(p);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (finishing) return;
    const dt = Date.now() - dragRef.current.t;
    const dist = Math.hypot(
      e.clientX - dragRef.current.x,
      e.clientY - dragRef.current.y
    );
    if (progressRef.current >= 0.65 || (dt < 300 && dist < 10)) {
      finish();
    } else {
      progressRef.current = 0;
      setProgress(0);
    }
  };

  const cardLift = finishing ? -64 : -progress * 52;
  const flapAngle = finishing ? -165 : -progress * 160;

  // gold-dust sparkle offsets (deterministic)
  const sparks = Array.from({ length: 6 }, (_, i) => ({
    x: (i - 2.5) * 22,
    y: -34 - ((i * 29) % 40),
    size: 3 + ((i * 7) % 3),
    delay: i * 0.05,
  }));

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #fff8ec 0%, #f7ecd7 55%, #f0e5d4 100%)",
        touchAction: "none",
        cursor: "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      aria-label="Pull the card to reveal the invitation"
    >
      {/* soft top light */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-44"
        style={{
          background:
            "linear-gradient(to bottom, rgba(218,196,151,0.35), transparent)",
        }}
        aria-hidden
      />

      {/* heading */}
      <div className="pointer-events-none absolute inset-x-0 top-[10%] px-8 text-center" aria-hidden>
        <p
          className="font-display text-xs uppercase"
          style={{ color: "#aa8956", letterSpacing: "0.42em" }}
        >
          {copyText(9001, "You are cordially invited")}
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="h-px w-12" style={{ background: "linear-gradient(to right, transparent, #aa8956)" }} />
          <span style={{ color: "#aa8956", fontSize: 10 }}>◆</span>
          <span className="h-px w-12" style={{ background: "linear-gradient(to left, transparent, #aa8956)" }} />
        </div>
        {config.city ? (
          <p
            className="mt-4 font-display text-[11px] uppercase"
            style={{ color: "#69513b", letterSpacing: "0.3em", opacity: 0.75 }}
          >
            {config.city}
          </p>
        ) : null}
      </div>

      {/* envelope + card */}
      <div
        className="absolute"
        style={{
          left: "11%",
          right: "11%",
          bottom: "18%",
          height: "42%",
          perspective: "600px",
        }}
      >
        {/* the card — tucked inside, peeking ~18% above the body */}
        <div
          className="absolute flex flex-col items-center justify-center px-4 text-center"
          style={{
            left: "5%",
            right: "5%",
            top: 0,
            height: "68%",
            background: "#fffdf6",
            border: "1px solid #dac497",
            boxShadow: "0 6px 24px rgba(105,81,59,0.18)",
            transform: `translateY(${cardLift}%)`,
            transition: finishing
              ? "transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease"
              : progress === 0
                ? "transform 0.35s ease"
                : "none",
            opacity: finishing ? 0.35 : 1,
            zIndex: 20,
          }}
          aria-hidden
        >
          <p
            className="font-display"
            style={{ color: "#69513b", fontSize: 34, letterSpacing: "0.08em" }}
          >
            {initials}
          </p>
          <span className="my-2 block h-px w-10" style={{ background: "#dac497" }} />
          {dateLabel ? (
            <p
              className="font-display text-[11px] uppercase"
              style={{ color: "#aa8956", letterSpacing: "0.28em" }}
            >
              {dateLabel}
            </p>
          ) : null}
        </div>

        {/* envelope body / front pocket */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            top: "18%",
            background:
              "linear-gradient(160deg, #f3e7cf 0%, #e9dcc0 48%, #dcc9a4 100%)",
            border: "1px solid #aa8956",
            boxShadow: "0 18px 40px rgba(105,81,59,0.28)",
            zIndex: 25,
          }}
          aria-hidden
        >
          {/* side fold seams */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(115deg, transparent 49.6%, rgba(170,137,86,0.4) 50%, transparent 50.4%), linear-gradient(-115deg, transparent 49.6%, rgba(170,137,86,0.4) 50%, transparent 50.4%)",
            }}
          />
          {/* pocket sheen */}
          <div
            className="absolute inset-x-0 top-0 h-10"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)",
            }}
          />
        </div>

        {/* flap — hinged at the envelope's top edge */}
        <div
          className="absolute inset-x-0"
          style={{
            top: "18%",
            height: "40%",
            zIndex: 30,
            transformOrigin: "top center",
            transform: `perspective(600px) rotateX(${flapAngle}deg)`,
            opacity: 1 - progress * 0.25,
            transition: finishing ? "transform 0.5s ease, opacity 0.5s ease" : "none",
            pointerEvents: "none",
          }}
          aria-hidden
        >
          <div
            className="h-full w-full"
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background:
                "linear-gradient(180deg, #e5d3ac 0%, #d9c28e 70%, #cbb27c 100%)",
              boxShadow: "0 4px 14px rgba(105,81,59,0.25)",
            }}
          />
        </div>

        {/* gold-dust sparkle as the card slips free */}
        {finishing &&
          sparks.map((s, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                left: "50%",
                top: "6%",
                width: s.size,
                height: s.size,
                background: "#aa8956",
                zIndex: 40,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: s.x, y: s.y, opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.55, delay: s.delay, ease: "easeOut" }}
              aria-hidden
            />
          ))}
      </div>

      {/* hint */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-[6%] text-center font-display text-xs uppercase"
        style={{ color: "#69513b", letterSpacing: "0.38em" }}
        animate={{ opacity: finishing ? 0 : [0.55, 1, 0.55] }}
        transition={
          finishing
            ? { duration: 0.3 }
            : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      >
        {copyText(9002, "Pull the card")}
      </motion.p>
    </div>
  );
}

/* ── Beat 2 — Crystal-Bead Waterfall Curtain ────────────────── */
export function Curtain({
  onDone,
  autoPlay,
}: {
  onDone: () => void;
  autoPlay?: boolean;
}) {
  const [parting, setParting] = useState(false);
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

  useEffect(() => {
    if (!autoPlay) return;
    later(() => setParting(true), 1100);
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
    setParting(true);
    later(fireDone, 2400);
  };

  // 18 bead strands; dots per strand and sizes are deterministic
  const strands = Array.from({ length: 18 }, (_, i) => ({
    dots: Array.from({ length: 20 + ((i * 3) % 6) }, (_, j) => ({
      size: 2 + ((i + j) % 3),
      gold: (i + j) % 2 === 0,
      opacity: 0.55 + (((i * 7 + j * 13) % 40) / 100),
    })),
    delay: i * 0.09,
  }));

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "#3a2a1c", cursor: autoPlay ? undefined : "pointer" }}
      onClick={handleTap}
      role="button"
      aria-label="Reveal the couple's names"
    >
      {/* names — UNDER the material layer, on the deep bronze panel */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          className="relative"
          initial={false}
          animate={parting ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 1, delay: parting ? 0.55 : 0, ease: "easeOut" }}
        >
          <p
            className="font-display"
            style={{
              color: "#dac497",
              fontSize: "clamp(2rem, 9vw, 3.4rem)",
              letterSpacing: "0.14em",
              fontWeight: 400,
              lineHeight: 1.15,
            }}
          >
            {COUPLE.groom}
          </p>
          <p
            className="font-display italic"
            style={{ color: "#dac497", opacity: 0.8, fontSize: "1.05rem", margin: "0.35rem 0" }}
          >
            weds
          </p>
          <p
            className="font-display"
            style={{
              color: "#dac497",
              fontSize: "clamp(2rem, 9vw, 3.4rem)",
              letterSpacing: "0.14em",
              fontWeight: 400,
              lineHeight: 1.15,
            }}
          >
            {COUPLE.bride}
          </p>
          {(dateLabel || config.venue) && (
            <p
              className="mt-5 font-display text-[11px] uppercase"
              style={{ color: "#dac497", letterSpacing: "0.3em", opacity: 0.7 }}
            >
              {[dateLabel, config.venue].filter(Boolean).join("  ·  ")}
            </p>
          )}

          {/* tiny star glint pulsing at the end near the names */}
          {parting && (
            <motion.svg
              viewBox="0 0 24 24"
              className="absolute"
              style={{ right: -26, top: -14, width: 18, height: 18 }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0.35, 1], scale: [0.4, 1.15, 0.85, 1] }}
              transition={{ duration: 1.4, delay: 1.5, ease: "easeInOut" }}
              aria-hidden
            >
              <path
                d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z"
                fill="#dac497"
              />
            </motion.svg>
          )}
        </motion.div>

        {/* diagonal foil sweep across the panel, once */}
        {parting && (
          <motion.div
            className="pointer-events-none absolute"
            style={{
              top: "-25%",
              bottom: "-25%",
              width: "38%",
              rotate: "18deg",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,246,220,0.55) 45%, rgba(218,196,151,0.75) 55%, transparent 100%)",
              filter: "blur(6px)",
            }}
            initial={{ left: "-45%", opacity: 0 }}
            animate={{ left: "115%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, delay: 0.5, times: [0, 0.15, 0.85, 1], ease: "easeInOut" }}
            aria-hidden
          />
        )}
      </div>

      {/* champagne silk beneath the beads */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #f3e7cf 0%, #e9dcc0 50%, #dcc9a4 100%)",
        }}
        initial={false}
        animate={parting ? { opacity: 0, scale: 1 } : { opacity: 1, scale: 1.02 }}
        transition={{ duration: 1.4, delay: parting ? 0.7 : 0, ease: "easeInOut" }}
        aria-hidden
      />

      {/* crystal-bead waterfall — strands cascade down, left→right */}
      <div
        className="pointer-events-none absolute inset-0 flex justify-between px-3"
        aria-hidden
      >
        {strands.map((strand, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center"
            style={{ gap: 7, paddingTop: 6 }}
            initial={false}
            animate={parting ? { y: "112%", opacity: 0 } : { y: "0%", opacity: 1 }}
            transition={{
              duration: 1.1,
              delay: parting ? strand.delay : 0,
              ease: "easeIn",
            }}
          >
            {strand.dots.map((d, j) => (
              <span
                key={j}
                className="rounded-full shrink-0"
                style={{
                  width: d.size,
                  height: d.size,
                  background: d.gold ? "#dac497" : "#e8e2d2",
                  opacity: d.opacity,
                  boxShadow: "0 0 3px rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </motion.div>
        ))}
      </div>

      {/* tap hint — manual mode only, while closed */}
      {!autoPlay && !parting && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] text-center font-display text-xs uppercase"
          style={{ color: "#69513b", letterSpacing: "0.38em" }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          {copyText(9003, "Tap to unveil")}
        </motion.p>
      )}
    </div>
  );
}
