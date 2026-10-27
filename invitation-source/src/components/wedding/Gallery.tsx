import {useMotionPreference} from "../../../adapters/motion-preference";
import {copyText} from "../../../adapters/copy";
// src/components/wedding/Gallery.tsx
// Screen 10 — swipeable carousel (arrows + dots) + full-screen lightbox.
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import FitImage from "./FitImage";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveContent } from "./useLiveContent";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

import RoyalFrame from "./decor/RoyalFrame";

function focusStyle(focus?: string): React.CSSProperties {
  const [x, y] = (focus || "50,50").split(",").map((n) => {
    const v = parseFloat(n);
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 50;
  });
  return { objectPosition: `${x}% ${y}%` };
}

export default function Gallery() {
  const reduce=useMotionPreference();
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const { gallery } = useLiveContent();
  const total = gallery.length;

  const step = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + total) % total),
    [total]
  );

  // Continuous autoplay — smooth fade carousel. Pauses on hover/touch/lightbox.
  const [autoPaused, setAutoPaused] = useState(false);
  useEffect(() => {
    if (reduce || lightbox || autoPaused || total <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, 4000);
    return () => clearInterval(t);
  }, [reduce, lightbox, autoPaused, total]);

  // keyboard for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, step]);

  // touch swipe
  const [touchX, setTouchX] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) =>
    setTouchX(e.touches[0]?.clientX ?? null);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX;
    if (dx > 48) step(-1);
    else if (dx < -48) step(1);
    setTouchX(null);
  };

  // Guard: empty gallery (e.g., all photos deleted) — render nothing instead of crashing
  if (gallery.length === 0) return null;

  const photo = gallery[index] ?? gallery[0]!;

  return (
    <section id="gallery" className="relative scroll-mt-20 overflow-hidden py-16 sm:py-20">
      {/* FloralCorners removed - was causing white patch artifacts */}
      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 lg:max-w-6xl lg:px-12">
        <SectionHeading script={copyText(11,"Our Moments")} subtitle={copyText(12,"A few special moments from our journey")} />

        <Reveal>
          {/* carousel in ornate royal frame */}
          <RoyalFrame corners={48} className="overflow-hidden bg-maroon-deep shadow-[0_24px_60px_-24px_rgba(109,16,37,0.5)]">
          <div
            className="relative aspect-[4/3] overflow-hidden"
            onTouchStart={(e) => {
              setAutoPaused(true);
              onTouchStart(e);
            }}
            onTouchEnd={(e) => {
              onTouchEnd(e);
              setAutoPaused(false);
            }}
            onMouseEnter={() => setAutoPaused(true)}
            onMouseLeave={() => setAutoPaused(false)}
          >
            <AnimatePresence initial={false}>
              <motion.button
                key={photo.src}
                type="button"
                onClick={() => setLightbox(true)}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 block h-full w-full"
                aria-label={`View photo: ${photo.caption}`}
              >
                {photo.fit === "contain" ? (
                  <FitImage
                    src={photo.src}
                    alt={photo.caption ?? "Wedding photo"}
                    width={900}
                    height={675}
                    className="h-full w-full"
                  />
                ) : (
                  <Image
                    src={photo.src}
                    alt={photo.caption ?? "Wedding photo"}
                    width={900}
                    height={675}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    style={focusStyle(photo.focus)}
                  />
                )}
              </motion.button>
            </AnimatePresence>

            {/* caption */}
            <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-5 pb-4 pt-10 text-center font-script text-3xl text-ivory">
              {photo.caption}
            </p>

            {/* arrows */}
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-maroon-deep/60 text-ivory backdrop-blur transition hover:bg-maroon-deep/85"
            >
              <ChevronLeftIcon size={20} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-maroon-deep/60 text-ivory backdrop-blur transition hover:bg-maroon-deep/85"
            >
              <ChevronRightIcon size={20} />
            </button>

            {/* counter */}
            <span className="absolute right-4 top-4 rounded-full bg-maroon-deep/60 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-ivory backdrop-blur">
              {index + 1} / {total}
            </span>
          </div>
          </RoyalFrame>

          {/* thumbnail strip — horizontal scroll on mobile, dots removed */}
          <div className="mt-5 flex gap-3 overflow-x-auto pb-2 lg:hidden" aria-label="Photo thumbnails">
            {gallery.map((p, i) => (
              <button
                key={p.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to photo ${i + 1}: ${p.caption}`}
                aria-current={i === index || undefined}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  i === index
                    ? "border-maroon shadow-[0_10px_24px_-10px_rgba(109,16,37,0.6)]"
                    : "border-gold/40 opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={p.src}
                  alt=""
                  width={160}
                  height={160}
                  loading="lazy"
                  className={`h-full w-full ${p.fit === "contain" ? "object-contain bg-cream" : "object-cover"}`}
                  style={focusStyle(p.focus)}
                />
              </button>
            ))}
          </div>

          {/* thumbnail grid — desktop */}
          <div className="mt-6 hidden grid-cols-4 gap-4 lg:grid">
            {gallery.map((p, i) => (
              <button
                key={p.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`View photo ${i + 1}: ${p.caption}`}
                className={`overflow-hidden rounded-xl border-2 transition-all ${
                  i === index
                    ? "border-maroon shadow-[0_12px_30px_-12px_rgba(109,16,37,0.6)]"
                    : "border-gold/40 opacity-70 hover:-translate-y-0.5 hover:opacity-100"
                }`}
              >
                {p.fit === "contain" ? (
                  <FitImage
                    src={p.src}
                    alt={p.caption ?? "Wedding photo"}
                    width={320}
                    height={240}
                    className="aspect-[4/3] w-full"
                  />
                ) : (
                  <Image
                    src={p.src}
                    alt={p.caption ?? "Wedding photo"}
                    width={320}
                    height={240}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                    style={focusStyle(p.focus)}
                  />
                )}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {/* lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col bg-maroon-deep/95 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="flex items-center justify-between px-5 py-4 text-ivory">
              <span className="text-sm tracking-[0.2em]">
                {index + 1} / {total}
              </span>
              <button
                type="button"
                onClick={() => setLightbox(false)}
                aria-label="Close viewer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div
              className="relative flex flex-1 items-center justify-center px-2 pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.figure
                  key={photo.src}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.28 }}
                  className="max-h-full"
                >
                  <div className="border border-gold/60 p-1.5 shadow-2xl">
                    <div className="border border-gold/30">
                      <Image
                        src={photo.src}
                        alt={photo.caption ?? "Wedding photo"}
                        width={900}
                        height={1200}
                        className="max-h-[64dvh] w-auto object-contain"
                        priority
                      />
                    </div>
                  </div>
                  <figcaption className="mt-3 text-center font-script text-3xl text-gold-light">
                    {photo.caption}
                  </figcaption>
                </motion.figure>
              </AnimatePresence>

              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-ivory transition hover:bg-white/25"
              >
                <ChevronLeftIcon size={20} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-ivory transition hover:bg-white/25"
              >
                <ChevronRightIcon size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
