"use client";

// emerald-darbar — "Dawn on the Ghats" (Sacred Courtyard · Varanasi)
// Beat 0 (Reveal): a coded dawn over layered ghat silhouettes and a
// shimmering river. A small unlit diya bobs on the water; the visitor taps
// it, the flame catches, and the whole scene pushes in as the couple's
// names resolve in editorial serif over the opalescent water.
// Beat 2 (Curtain): morning mist and light lift off the same ghats-and-
// river scene, revealing the names over the shimmer.
// 100% coded CSS/SVG — no external images.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { COUPLE } from "@/content/wedding";
import { copyText } from "../../../../adapters/copy";

/* ── palette ─────────────────────────────────────────────── */
const IVORY = "#fdf3e0";
const SAFFRON = "#eda964";

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

/* ── dawn scene pieces ───────────────────────────────────── */

const SKY =
  "linear-gradient(180deg, #111a36 0%, #2b2a52 30%, #6e3d5c 50%, #c86a5a 60%, #eda964 66%, #f4bd7a 68%, #31405f 68.4%, #1d2a48 82%, #141e36 100%)";

/** One depth layer of ghat silhouettes — stepped terraces, spires, domes. */
function GhatLayer({
  depth,
  lit,
  mist,
}: {
  depth: 0 | 1 | 2;
  lit?: boolean;
  mist?: boolean;
}) {
  const active = lit || mist;
  const scales = [1.04, 1.08, 1.13];
  const lifts = [-2, -5, -9];
  const fills = ["#3a4470", "#252e52", "#121b31"];
  const opacities = [0.75, 0.92, 1];
  const paths =
    depth === 0
      ? "M0 160 V104 H34 V84 L42 62 L50 84 V100 H78 Q92 78 106 100 H118 V70 L126 48 L134 70 V102 H168 V88 H196 V102 H214 Q228 80 242 102 H256 V76 L264 54 L272 76 V108 H300 V92 H330 V108 H390 V160 Z"
      : depth === 1
        ? "M0 170 V118 H26 V100 H44 V118 H62 V86 L72 58 L82 86 V112 H110 Q126 88 142 112 H156 V70 H164 L176 40 L188 70 H196 V114 H224 V96 H244 V114 H262 Q278 90 294 114 H310 V84 L320 60 L330 84 V120 H356 V104 H390 V170 Z M0 170 V148 H52 V158 H112 V148 H172 V160 H242 V150 H312 V160 H390 V170 Z"
        : "M0 170 V118 H36 V130 H72 V120 H108 V134 H140 L152 170 Z M390 170 V116 H354 V128 H318 V118 H282 V132 H250 L238 170 Z";
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0"
      style={{ bottom: "31%", height: depth === 2 ? "30%" : "34%", zIndex: 3 + depth }}
      initial={false}
      animate={
        active
          ? { scale: scales[depth], y: lifts[depth] }
          : { scale: 1, y: 0 }
      }
      transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      <svg
        viewBox={depth === 0 ? "0 0 390 160" : "0 0 390 170"}
        preserveAspectRatio="none"
        className="block h-full w-full"
      >
        <path d={paths} fill={fills[depth]} opacity={opacities[depth]} />
      </svg>
    </motion.div>
  );
}

/** Animated opalescent shimmer bands drifting on the river surface. */
function RiverShimmer({ bright }: { bright?: boolean }) {
  const bands = [
    { top: "71%", width: "62%", left: "8%", dur: 5.2, h: 4 },
    { top: "76%", width: "78%", left: "14%", dur: 6.4, h: 5 },
    { top: "82%", width: "55%", left: "30%", dur: 4.6, h: 4 },
    { top: "88%", width: "84%", left: "4%", dur: 7.1, h: 6 },
    { top: "94%", width: "66%", left: "20%", dur: 5.8, h: 4 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 6 }} aria-hidden>
      {bands.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            top: b.top,
            left: b.left,
            width: b.width,
            height: b.h,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(244,189,122,0.5) 28%, rgba(168,224,210,0.38) 52%, rgba(240,170,190,0.42) 74%, transparent 100%)",
            filter: "blur(1.5px)",
            opacity: bright ? 0.95 : 0.55,
          }}
          animate={{ x: [0, i % 2 === 0 ? 14 : -14, 0], opacity: bright ? [0.95, 0.65, 0.95] : [0.55, 0.38, 0.55] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/** Low sun glow sitting on the horizon. */
function SunGlow({ lit }: { lit?: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2"
      style={{
        top: "46%",
        width: 190,
        height: 190,
        marginLeft: -95,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(255,214,150,0.95) 0%, rgba(237,169,100,0.55) 34%, rgba(200,106,90,0.22) 58%, transparent 72%)",
        filter: "blur(4px)",
        zIndex: 2,
      }}
      initial={false}
      animate={lit ? { opacity: 1, scale: 1.18 } : { opacity: 0.65, scale: 1 }}
      transition={{ duration: 2.2, ease: "easeOut" }}
      aria-hidden
    />
  );
}

/** The floating diya — coded bowl, rim and wick; flame appears when lit. */
function Diya({ lit }: { lit: boolean }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center" aria-hidden>
      {/* warm glow that spreads once the flame catches */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 150,
          height: 150,
          marginLeft: -75,
          marginTop: -75,
          background:
            "radial-gradient(circle, rgba(255,196,92,0.6) 0%, rgba(255,170,60,0.22) 48%, transparent 70%)",
          filter: "blur(5px)",
        }}
        initial={false}
        animate={lit ? { opacity: 1, scale: 1.25 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <div className="relative" style={{ width: 58, height: 30 }}>
        {/* flame — flickering teardrop, fades/scales in on lighting */}
        {lit && (
          <motion.div
            className="absolute left-1/2"
            style={{
              bottom: 24,
              width: 13,
              height: 22,
              marginLeft: -6.5,
              borderRadius: "50% 50% 50% 50% / 66% 66% 34% 34%",
              background:
                "radial-gradient(ellipse at 50% 80%, #fff3c4 0%, #ffb84d 48%, #e07b24 100%)",
              boxShadow: "0 0 18px rgba(255,170,60,0.9)",
              transformOrigin: "50% 100%",
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: [1, 1.16, 0.94, 1.09, 1] }}
            transition={{
              opacity: { duration: 0.35 },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        )}
        {/* wick */}
        <span
          className="absolute left-1/2"
          style={{ bottom: 20, width: 2.5, height: 7, marginLeft: -1.25, background: lit ? "#5a3410" : "#2c2118", borderRadius: 2 }}
        />
        {/* rim */}
        <div
          className="absolute left-0 right-0 rounded-full"
          style={{ bottom: 12, height: 10, background: "linear-gradient(180deg, #b06a32, #7c4520)" }}
        />
        {/* bowl */}
        <div
          className="absolute left-0 right-0"
          style={{
            bottom: 0,
            height: 16,
            borderRadius: "6px 6px 50% 50% / 4px 4px 100% 100%",
            background: "linear-gradient(180deg, #8a4b26 0%, #5f3c1c 100%)",
            boxShadow: "0 6px 14px rgba(5,8,18,0.55)",
          }}
        />
        {/* water reflection under the bowl */}
        <div
          className="absolute left-1/2"
          style={{
            bottom: -12,
            width: 64,
            height: 6,
            marginLeft: -32,
            borderRadius: "50%",
            background: lit
              ? "radial-gradient(ellipse, rgba(255,180,80,0.55) 0%, transparent 70%)"
              : "radial-gradient(ellipse, rgba(160,190,220,0.3) 0%, transparent 70%)",
            filter: "blur(2px)",
          }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BEAT 0 — Reveal: Dawn on the Ghats
   ══════════════════════════════════════════════════════════ */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const [lit, setLit] = useState(false);
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const light = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    setLit(true);
    timerRef.current = setTimeout(() => onReveal(), 2700);
  }, [onReveal]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const cfg = getConfig();
  const dateLine = formatDate(cfg.date ?? "2027-03-13");
  const city = (cfg.city ?? "Varanasi").trim();

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "#111a36" }}
      role="presentation"
    >
      {/* ── the dawn scene, pushing in slowly once the diya is lit ── */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={lit ? { scale: 1.08 } : { scale: 1 }}
        transition={{ duration: 2.6, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      >
        {/* sky + river gradient */}
        <div className="absolute inset-0" style={{ background: SKY }} />
        <SunGlow lit={lit} />
        {/* three parallax depth layers of ghats */}
        <GhatLayer depth={0} lit={lit} />
        <GhatLayer depth={1} lit={lit} />
        <GhatLayer depth={2} lit={lit} />
        <RiverShimmer bright={lit} />
      </motion.div>

      {/* ── the couple's names, resolving over the water shimmer ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[7%] px-6 text-center" style={{ zIndex: 10 }}>
        <motion.div
          initial={false}
          animate={lit ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.93, y: 20 }}
          transition={{ duration: 1.2, delay: lit ? 0.75 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="font-display"
            style={{
              color: IVORY,
              fontSize: "clamp(2.7rem, 11.5vw, 4.1rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              textShadow: "0 2px 22px rgba(10,10,30,0.65), 0 0 34px rgba(237,169,100,0.35)",
            }}
          >
            {COUPLE.groom}
          </p>
          <div className="my-2.5 flex items-center justify-center gap-3">
            <span className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${SAFFRON})` }} />
            <span className="font-display italic" style={{ color: SAFFRON, fontSize: "1.1rem" }}>
              &amp;
            </span>
            <span className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${SAFFRON})` }} />
          </div>
          <p
            className="font-display"
            style={{
              color: IVORY,
              fontSize: "clamp(2.7rem, 11.5vw, 4.1rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              textShadow: "0 2px 22px rgba(10,10,30,0.65), 0 0 34px rgba(237,169,100,0.35)",
            }}
          >
            {COUPLE.bride}
          </p>
          {(dateLine || city) && (
            <p className="mt-4" style={{ color: "rgba(253,243,224,0.88)", fontSize: 13.5, letterSpacing: "0.05em" }}>
              {[dateLine, city].filter(Boolean).join(" · ")}
            </p>
          )}
        </motion.div>
      </div>

      {/* ── the floating diya — tap it to light the dawn ── */}
      <motion.button
        type="button"
        className="absolute"
        style={{
          left: "50%",
          bottom: "30%",
          width: 104,
          height: 104,
          marginLeft: -52,
          zIndex: 20,
          background: "transparent",
          border: "none",
          cursor: lit ? "default" : "pointer",
        }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        onClick={light}
        aria-label="Tap the diya to light it"
      >
        <Diya lit={lit} />
      </motion.button>

      {/* hint — quiet modern treatment */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 top-[7%] text-center"
        style={{ color: "rgba(253,243,224,0.9)", fontSize: 13.5, letterSpacing: "0.05em", zIndex: 15 }}
        animate={{ opacity: lit ? 0 : [0.55, 1, 0.55] }}
        transition={lit ? { duration: 0.3 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        {copyText(94, "Tap the diya to light the dawn")}
      </motion.p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BEAT 2 — Curtain: morning mist lifting off the ghats
   ══════════════════════════════════════════════════════════ */
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

  // auto-play: the mist starts lifting ~1100ms in; done ~4200ms total
  useEffect(() => {
    if (!autoPlay) return;
    const t1 = setTimeout(() => setOpen(true), 1100);
    const t2 = setTimeout(finishOnce, 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [autoPlay, finishOnce]);

  // manual: tap lifts the mist; done ~2400ms after the tap
  useEffect(() => {
    if (autoPlay || !open) return;
    const t = setTimeout(finishOnce, 2400);
    return () => clearTimeout(t);
  }, [autoPlay, open, finishOnce]);

  const cfg = getConfig();
  const dateLine = formatDate(cfg.date ?? "2027-03-13");

  // mist banks — soft blurred veils at staggered heights and delays
  const mistBanks = [
    { top: "34%", height: 120, delay: 0, travel: -90, tint: "rgba(253,243,224,0.5)" },
    { top: "48%", height: 140, delay: 0.18, travel: -120, tint: "rgba(240,200,180,0.42)" },
    { top: "62%", height: 150, delay: 0.36, travel: -150, tint: "rgba(253,243,224,0.46)" },
    { top: "76%", height: 130, delay: 0.54, travel: -110, tint: "rgba(220,225,240,0.4)" },
  ];

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "#111a36", cursor: autoPlay ? undefined : "pointer" }}
      onClick={autoPlay ? undefined : () => setOpen(true)}
      role="button"
      aria-label="The morning mist reveals the couple's names"
    >
      {/* ── the dawn scene underneath the mist ── */}
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0" style={{ background: SKY }} />
        <SunGlow lit={open} />
        <GhatLayer depth={0} mist={open} />
        <GhatLayer depth={1} mist={open} />
        <GhatLayer depth={2} mist={open} />
        <RiverShimmer bright={open} />
      </div>

      {/* dawn light washing in as the mist lifts */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 62%, rgba(255,205,140,0.4) 0%, transparent 70%)",
          zIndex: 7,
        }}
        initial={false}
        animate={open ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.8, delay: 0.4, ease: "easeOut" }}
        aria-hidden
      />

      {/* ── the couple's names over the water shimmer ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[7%] px-6 text-center" style={{ zIndex: 10 }}>
        <motion.div
          initial={false}
          animate={open ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.93, y: 20 }}
          transition={{ duration: 1.2, delay: open ? 0.7 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="font-display"
            style={{
              color: IVORY,
              fontSize: "clamp(2.7rem, 11.5vw, 4.1rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              textShadow: "0 2px 22px rgba(10,10,30,0.65), 0 0 34px rgba(237,169,100,0.35)",
            }}
          >
            {COUPLE.groom}
          </p>
          <div className="my-2.5 flex items-center justify-center gap-3">
            <span className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${SAFFRON})` }} />
            <span className="font-display italic" style={{ color: SAFFRON, fontSize: "1.1rem" }}>
              &amp;
            </span>
            <span className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${SAFFRON})` }} />
          </div>
          <p
            className="font-display"
            style={{
              color: IVORY,
              fontSize: "clamp(2.7rem, 11.5vw, 4.1rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              textShadow: "0 2px 22px rgba(10,10,30,0.65), 0 0 34px rgba(237,169,100,0.35)",
            }}
          >
            {COUPLE.bride}
          </p>
          {(dateLine || cfg.venue) && (
            <p className="mt-4" style={{ color: "rgba(253,243,224,0.88)", fontSize: 13.5, letterSpacing: "0.05em" }}>
              {[dateLine, cfg.venue].filter(Boolean).join(" · ")}
            </p>
          )}
        </motion.div>
      </div>

      {/* ── the mist banks, lifting and dissolving ── */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 12 }} aria-hidden>
        {mistBanks.map((m, i) => (
          <motion.div
            key={i}
            className="absolute inset-x-0"
            style={{
              top: m.top,
              height: m.height,
              background: `linear-gradient(180deg, transparent 0%, ${m.tint} 38%, ${m.tint} 62%, transparent 100%)`,
              filter: "blur(14px)",
            }}
            initial={false}
            animate={open ? { y: m.travel, opacity: 0 } : { y: 0, opacity: 1 }}
            transition={{ duration: 1.7, delay: open ? m.delay : 0, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
        {/* overall pre-dawn veil that thins as the light comes */}
        <motion.div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(17,26,54,0.35) 0%, rgba(90,80,110,0.3) 55%, rgba(200,150,120,0.18) 100%)" }}
          initial={false}
          animate={open ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.2, ease: "easeInOut" }}
        />
      </div>

      {/* a lit diya resting on the water once the mist has lifted */}
      <motion.div
        className="pointer-events-none absolute"
        style={{ left: "14%", bottom: "26%", width: 72, height: 72, zIndex: 11 }}
        initial={false}
        animate={open ? { opacity: 1, y: [0, -4, 0] } : { opacity: 0 }}
        transition={{
          opacity: { duration: 0.9, delay: 1.1 },
          y: { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1.1 },
        }}
        aria-hidden
      >
        <Diya lit={open} />
      </motion.div>

      {/* tap hint — manual mode only, until the mist lifts */}
      {!autoPlay && !open && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[8%] text-center"
          style={{ color: "rgba(253,243,224,0.92)", fontSize: 13.5, letterSpacing: "0.05em", zIndex: 14 }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          {copyText(95, "Tap to lift the mist")}
        </motion.p>
      )}
    </div>
  );
}
