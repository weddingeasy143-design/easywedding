// src/components/wedding/ScratchReveal.tsx
// MAGICAL scratch-to-reveal card for the wedding date.
// Enchanted gold foil: deep shimmering gradient, animated moving shine
// streaks, twinkling stars. Scratch with finger/mouse — a trail of golden
// sparkles follows. Beneath: the date in an ornamental gold-cornered frame.
// At >45% scratched: light-ray burst, rising sparkles, glowing date reveal.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WEDDING_DATE_LABEL } from "@/content/wedding";
import { SparkleIcon } from "./icons";

const REVEAL_THRESHOLD = 0.45;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  hue: number;
  kind: "star" | "glow";
}

/** ornamental gold corner flourish for the revealed frame */
function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map = {
    tl: "left-1.5 top-1.5 border-l-2 border-t-2 rounded-tl-md",
    tr: "right-1.5 top-1.5 border-r-2 border-t-2 rounded-tr-md",
    bl: "left-1.5 bottom-1.5 border-l-2 border-b-2 rounded-bl-md",
    br: "right-1.5 bottom-1.5 border-r-2 border-b-2 rounded-br-md",
  } as const;
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-5 w-5 border-[#c9992f] ${map[pos]}`}
    />
  );
}

export default function ScratchReveal() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparkleCanvasRef = useRef<HTMLCanvasElement>(null);
  const [complete, setComplete] = useState(false);
  const [started, setStarted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const scratchingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const burstDoneRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const dprOf = () => Math.min(window.devicePixelRatio || 1, 2);

  /** paint the enchanted gold foil */
  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = dprOf();
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const spark = sparkleCanvasRef.current;
    if (spark) {
      spark.width = w * dpr;
      spark.height = h * dpr;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // deep enchanted-gold gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#8a5a0a");
    grad.addColorStop(0.22, "#d4a017");
    grad.addColorStop(0.42, "#f7e08b");
    grad.addColorStop(0.6, "#c9992f");
    grad.addColorStop(0.82, "#f2d06e");
    grad.addColorStop(1, "#7c4e08");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // diagonal shimmer bands baked in
    ctx.save();
    ctx.globalAlpha = 0.3;
    for (let i = -h; i < w + h; i += 40) {
      const sg = ctx.createLinearGradient(i, 0, i + 20, h);
      sg.addColorStop(0, "rgba(255,255,255,0)");
      sg.addColorStop(0.5, "rgba(255,250,225,0.9)");
      sg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 20, 0);
      ctx.lineTo(i + 20 - h * 0.35, h);
      ctx.lineTo(i - h * 0.35, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // twinkling stars embedded in the foil
    ctx.save();
    for (let i = 0; i < 16; i++) {
      const x = 8 + Math.random() * (w - 16);
      const y = 8 + Math.random() * (h - 16);
      const r = 2 + Math.random() * 3.4;
      const a = 0.35 + Math.random() * 0.5;
      ctx.globalAlpha = a;
      ctx.fillStyle = "#fff8e0";
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const ang = (k * Math.PI) / 4 - Math.PI / 2;
        const rad = k % 2 === 0 ? r : r * 0.34;
        const px = x + Math.cos(ang) * rad;
        const py = y + Math.sin(ang) * rad;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // fine speckle texture
    ctx.save();
    for (let i = 0; i < 650; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle =
        Math.random() > 0.5
          ? "rgba(255,240,190,0.35)"
          : "rgba(110,64,8,0.28)";
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.restore();

    // soft vignette for depth
    const vg = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.32,
      w / 2, h / 2, Math.max(w, h) * 0.72
    );
    vg.addColorStop(0, "rgba(60,30,4,0)");
    vg.addColorStop(1, "rgba(60,30,4,0.42)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }, []);

  useEffect(() => {
    paintFoil();
    const t = setTimeout(paintFoil, 60);
    const onResize = () => {
      if (!complete) paintFoil();
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [paintFoil, complete]);

  const spawn = useCallback(
    (x: number, y: number, n: number, upward = false) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 0.7 + Math.random() * 2.4;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: upward ? -(1 + Math.random() * 2.6) : Math.sin(a) * sp - 0.7,
          life: 1,
          decay: 0.016 + Math.random() * 0.014,
          size: 1.6 + Math.random() * 3.2,
          hue: 40 + Math.random() * 12,
          kind: "star",
        });
      }
    },
    []
  );

  const spawnGlow = useCallback((x: number, y: number) => {
    particlesRef.current.push({
      x,
      y,
      vx: 0,
      vy: -0.3,
      life: 0.9,
      decay: 0.05,
      size: 9 + Math.random() * 7,
      hue: 45,
      kind: "glow",
    });
  }, []);

  const drawParticles = useCallback(() => {
    const canvas = sparkleCanvasRef.current;
    if (!canvas) return;
    const dpr = dprOf();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const arr = particlesRef.current;
    for (let i = arr.length - 1; i >= 0; i--) {
      const s = arr[i];
      s.x += s.vx;
      s.y += s.vy;
      if (s.kind === "star") s.vy += 0.045;
      s.life -= s.decay;
      if (s.life <= 0) {
        arr.splice(i, 1);
        continue;
      }
      ctx.save();
      if (s.kind === "glow") {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
        g.addColorStop(0, `hsla(${s.hue}, 100%, 72%, ${0.55 * s.life})`);
        g.addColorStop(1, `hsla(${s.hue}, 100%, 60%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = `hsl(${s.hue}, 96%, 68%)`;
        ctx.shadowColor = `hsl(${s.hue}, 96%, 60%)`;
        ctx.shadowBlur = 10;
        const r = s.size * Math.min(1, s.life * 1.6);
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const ang = (k * Math.PI) / 4;
          const rad = k % 2 === 0 ? r : r * 0.36;
          const px = s.x + Math.cos(ang) * rad;
          const py = s.y + Math.sin(ang) * rad;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    rafRef.current = requestAnimationFrame(drawParticles);
  }, []);

  // celebration burst once the card completes
  useEffect(() => {
    if (!complete || burstDoneRef.current) return;
    burstDoneRef.current = true;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    for (let k = 0; k < 6; k++) {
      setTimeout(() => {
        spawn(w * (0.2 + Math.random() * 0.6), h * (0.3 + Math.random() * 0.4), 14, true);
      }, k * 130);
    }
  }, [complete, spawn]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawParticles);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawParticles]);

  const checkThreshold = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const dpr = dprOf();
    const w = Math.max(1, Math.floor(canvas.width / dpr / 8));
    const h = Math.max(1, Math.floor(canvas.height / dpr / 8));
    try {
      const tmp = document.createElement("canvas");
      tmp.width = w;
      tmp.height = h;
      const tctx = tmp.getContext("2d", { willReadFrequently: true });
      if (!tctx) return;
      tctx.drawImage(canvas, 0, 0, w, h);
      const data = tctx.getImageData(0, 0, w, h).data;
      let clear = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 40) clear++;
      }
      if (clear / (w * h) > REVEAL_THRESHOLD) setComplete(true);
    } catch {
      /* ignore */
    }
  }, []);

  const scratchAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap || complete) return;
      const rect = wrap.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const dpr = dprOf();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const last = lastPosRef.current;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 38;
      ctx.beginPath();
      if (last) {
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + 0.1, y + 0.1);
      }
      ctx.stroke();
      ctx.restore();

      lastPosRef.current = { x, y };
      spawn(x, y, 3);
      spawnGlow(x, y);
      if (!started) setStarted(true);
      checkThreshold();
    },
    [complete, started, spawn, spawnGlow, checkThreshold]
  );

  // reduced motion: reveal immediately
  if (reducedMotion) {
    return (
      <div className="mx-auto w-full max-w-xs text-center" aria-label="Wedding date">
        <p className="font-display text-lg font-semibold tracking-[0.14em] text-maroon">
          {WEDDING_DATE_LABEL.toUpperCase()}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xs" aria-label="Scratch to reveal the wedding date">
      <div
        ref={wrapRef}
        className="relative h-24 cursor-pointer touch-none select-none overflow-hidden rounded-xl shadow-[0_14px_36px_-10px_rgba(150,100,15,0.6)] ring-1 ring-[#d9a93f]/70"
        onPointerDown={(e) => {
          if (complete) return;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          scratchingRef.current = true;
          lastPosRef.current = null;
          scratchAt(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!scratchingRef.current || complete) return;
          scratchAt(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          scratchingRef.current = false;
          lastPosRef.current = null;
        }}
        onPointerCancel={() => {
          scratchingRef.current = false;
          lastPosRef.current = null;
        }}
        role="button"
        aria-label="Scratch the enchanted gold panel to reveal the wedding date"
      >
        {/* the revealed date underneath */}
        <div className="absolute inset-0 flex items-center justify-center bg-[#fffaf0]">
          {/* ornamental gold corners */}
          <Corner pos="tl" />
          <Corner pos="tr" />
          <Corner pos="bl" />
          <Corner pos="br" />

          {/* light-ray burst on completion */}
          <AnimatePresence>
            {complete && (
              <motion.div
                className="pointer-events-none absolute inset-[-40%]"
                initial={{ opacity: 1, scale: 0.6 }}
                animate={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 2.2, ease: "easeOut" }}
                aria-hidden
              >
                <div
                  className="rays-spin absolute inset-0"
                  style={{
                    background:
                      "repeating-conic-gradient(from 0deg, rgba(255,214,130,0.55) 0deg 7deg, transparent 7deg 22deg)",
                    maskImage:
                      "radial-gradient(circle, black 18%, transparent 68%)",
                    WebkitMaskImage:
                      "radial-gradient(circle, black 18%, transparent 68%)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* radial glow burst */}
          <AnimatePresence>
            {complete && (
              <motion.div
                className="pointer-events-none absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.95, 0.4, 0] }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                style={{
                  background:
                    "radial-gradient(ellipse 62% 82% at 50% 50%, rgba(255,216,132,0.95) 0%, transparent 70%)",
                }}
                aria-hidden
              />
            )}
          </AnimatePresence>

          <motion.p
            className="font-display text-xl font-semibold tracking-[0.14em] text-maroon"
            initial={false}
            animate={
              complete
                ? {
                    scale: [1, 1.14, 1],
                    textShadow: "0 0 26px rgba(212,175,55,0.95)",
                  }
                : { scale: 1 }
            }
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {WEDDING_DATE_LABEL.toUpperCase()}
          </motion.p>
        </div>

        {/* enchanted gold foil cover */}
        <AnimatePresence>
          {!complete && (
            <motion.div
              className="absolute inset-0"
              exit={{ opacity: 0, scale: 1.05, filter: "brightness(1.7)" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              aria-hidden
            >
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
              {/* animated moving shine streaks */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="foil-shine absolute inset-y-[-25%] left-0 w-2/5 bg-gradient-to-r from-transparent via-[rgba(255,252,238,0.55)] to-transparent" />
                <div
                  className="foil-shine absolute inset-y-[-25%] left-0 w-1/5 bg-gradient-to-r from-transparent via-[rgba(255,252,238,0.35)] to-transparent"
                  style={{ animationDelay: "1.4s" }}
                />
              </div>
              {/* twinkling stars over the foil */}
              {!started && (
                <>
                  {[
                    { l: "12%", t: "18%", d: "0s" },
                    { l: "30%", t: "66%", d: "0.7s" },
                    { l: "52%", t: "22%", d: "1.3s" },
                    { l: "74%", t: "58%", d: "0.4s" },
                    { l: "88%", t: "26%", d: "1.8s" },
                    { l: "64%", t: "76%", d: "1s" },
                  ].map((s, i) => (
                    <span
                      key={i}
                      className="twinkle-star pointer-events-none absolute text-[#fff6da]"
                      style={{ left: s.l, top: s.t, animationDelay: s.d }}
                    >
                      <SparkleIcon size={11} />
                    </span>
                  ))}
                </>
              )}
              {/* hint */}
              <motion.div
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1"
                animate={started ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <span className="flex items-center gap-1.5 text-[13px] font-semibold tracking-[0.14em] text-[#5e2f21]">
                  <SparkleIcon size={13} className="text-[#6b4210]" />
                  RUB FOR A MAGICAL SURPRISE
                  <SparkleIcon size={13} className="text-[#6b4210]" />
                </span>
                <span className="text-[10px] tracking-[0.2em] text-[#5e2f21]/70">
                  USE YOUR FINGER
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* sparkles layer */}
        <canvas
          ref={sparkleCanvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        />
      </div>
    </div>
  );
}
