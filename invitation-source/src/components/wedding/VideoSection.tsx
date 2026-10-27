import {copyText} from "../../../adapters/copy";
// src/components/wedding/VideoSection.tsx
// Screen 11 — invitation film player frame. Until the admin uploads the
// video, the frame shows a thumbnail + "coming soon" toast on tap.
"use client";

import { useState } from "react";
import Image from "next/image";
import FitImage from "./FitImage";
import { motion, AnimatePresence } from "framer-motion";
import { COUPLE } from "@/content/wedding";
import { PlayIcon } from "./icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import FloralCorners from "./decor/FloralCorners";
import RoyalFrame from "./decor/RoyalFrame";

export default function VideoSection() {
  const [toast, setToast] = useState(false);

  const onPlay = () => {
    setToast(true);
    window.setTimeout(() => setToast(false), 2600);
  };

  return (
    <section id="video" className="relative scroll-mt-20 overflow-hidden bg-ivory-deep/60 py-16 sm:py-20">
      <FloralCorners variant="top" size="w-32 sm:w-44" opacity={0.9} />
      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 lg:max-w-5xl lg:px-12">
        <SectionHeading script={copyText(13,"Video Section")} subtitle={copyText(14,"Our invitation film")} />

        <Reveal>
          <RoyalFrame corners={56} className="overflow-hidden bg-maroon-deep shadow-[0_24px_60px_-24px_rgba(109,16,37,0.5)]">
            {/* thumbnail */}
            <div className="relative aspect-video">
              {COUPLE.heroPhotoFit === "contain" ? (
                <FitImage
                  src={COUPLE.heroPhoto}
                  alt={`${COUPLE.groom} and ${COUPLE.bride}`}
                  width={960}
                  height={540}
                  className="h-full w-full"
                />
              ) : (
                <Image
                  src={COUPLE.heroPhoto}
                  alt={`${COUPLE.groom} and ${COUPLE.bride}`}
                  width={960}
                  height={540}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-maroon-deep/45" aria-hidden />

              {/* play button */}
              <button
                type="button"
                onClick={onPlay}
                aria-label="Play invitation video"
                className="group absolute inset-0 flex items-center justify-center"
              >
                <span className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold-light/90 bg-maroon-deep/55 text-gold-light backdrop-blur-sm transition group-hover:scale-110 group-hover:bg-maroon-deep/75">
                  <span className="absolute inset-0 animate-ping rounded-full border border-gold-light/60" aria-hidden />
                  <PlayIcon size={34} />
                </span>
                <span className="absolute mt-32 font-display text-lg italic text-ivory/90">
                  Our invitation film premieres here soon
                </span>
              </button>

              {/* duration bar */}
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
                <span className="text-xs font-semibold tabular-nums text-ivory/90">
                  0:00 / 1:28
                </span>
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25"
                  aria-hidden
                >
                  <div className="h-full w-0 rounded-full bg-gold-light" />
                </div>
              </div>
            </div>
          </RoyalFrame>
        </Reveal>
      </div>

      {/* coming-soon toast */}
      <AnimatePresence>
        {toast && (
          <motion.p
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="fixed bottom-24 left-1/2 z-[95] w-max max-w-[90vw] -translate-x-1/2 rounded-full border border-gold/60 bg-maroon-deep/95 px-6 py-3 text-center text-sm font-semibold text-gold-light shadow-2xl backdrop-blur"
            role="status"
          >
            Our video is coming soon — stay tuned!
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
