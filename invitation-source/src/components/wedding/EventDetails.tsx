// src/components/wedding/EventDetails.tsx
// Screen 07 — reusable event detail modal: full info + Add to Calendar + View Location.
"use client";

import { useEffect } from "react";
import Image from "next/image";
import FitImage from "./FitImage";
import { motion, AnimatePresence } from "framer-motion";
import type { WeddingEvent } from "@/content/wedding";
import { THEME_STYLES } from "@/content/wedding";
import { downloadEventIcs } from "@/lib/ics";
import {
  CalendarPlusIcon,
  ClockIcon,
  CloseIcon,
  PinIcon,
} from "./icons";
import RoyalFrame from "./decor/RoyalFrame";

export default function EventDetails({
  event,
  onClose,
}: {
  event: WeddingEvent | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [event, onClose]);

  const theme = event ? THEME_STYLES[event.theme] : null;

  // "Tuesday, 24 November 2026" -> "24 November 2026 (Tuesday)"
  const prettyDate = event
    ? event.dateLabel.replace(/^(\w+),\s*(.+)$/, "$2 ($1)")
    : "";

  return (
    <AnimatePresence>
      {event && theme && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-maroon-deep/60 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${event.name} details`}
        >
          <motion.div
            className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto bg-ivory shadow-2xl sm:rounded-sm"
            initial={{ y: 80, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
          <RoyalFrame corners={48} border={false} className="rounded-t-3xl sm:rounded-3xl">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-maroon-deep/70 text-ivory backdrop-blur transition hover:bg-maroon-deep"
            >
              <CloseIcon size={18} />
            </button>

            <div className="relative">
              {event.imageFit === "cover" ? (
                <Image
                  src={event.image}
                  alt={event.name}
                  width={800}
                  height={500}
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <FitImage
                  src={event.image}
                  alt={event.name}
                  width={800}
                  height={500}
                  lockFrame
                  className="aspect-[16/10] w-full"
                />
              )}
              <div
                className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent"
                aria-hidden
              />
            </div>

            <div className="px-6 pb-8 pt-5 sm:px-8">
              <p
                className="font-script text-4xl"
                style={{ color: theme.accent }}
              >
                {event.name}
              </p>
              <p className="mt-1 font-display text-lg italic text-bark-soft">
                {event.tagline}
              </p>

              <dl className="mt-5 space-y-3 text-[15px]">
                <div className="flex items-center gap-3">
                  <CalendarPlusIcon size={20} className="shrink-0 text-gold-deep" />
                  <div>
                    <dt className="sr-only">Date</dt>
                    <dd className="font-semibold text-bark">{prettyDate}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon size={20} className="shrink-0 text-gold-deep" />
                  <div>
                    <dt className="sr-only">Time</dt>
                    <dd className="font-semibold text-bark">{event.timeLabel}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <PinIcon size={20} className="mt-0.5 shrink-0 text-gold-deep" />
                  <div>
                    <dt className="sr-only">Venue</dt>
                    <dd className="font-semibold text-bark">{event.venue}</dd>
                    <dd className="text-sm text-bark-soft">{event.address}</dd>
                  </div>
                </div>
              </dl>

              <p className="mt-5 leading-relaxed text-bark-soft">
                {event.description}
              </p>

              {event.dressCode && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-4 py-1.5 text-sm font-medium text-bark">
                  <span aria-hidden>✦</span> Dress code: {event.dressCode}
                </p>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => downloadEventIcs(event)}
                  className="btn-royal flex-1"
                >
                  <CalendarPlusIcon size={18} />
                  Add to Calendar
                </button>
                <a
                  href={event.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-royal-outline flex-1"
                >
                  <PinIcon size={18} />
                  View Location
                </a>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-5 w-full text-center text-sm font-semibold uppercase tracking-[0.2em] text-bark-soft transition-colors hover:text-maroon"
              >
                Back to Events
              </button>
            </div>
          </RoyalFrame>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
