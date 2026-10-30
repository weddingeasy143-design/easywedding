import {copyText} from "../../../adapters/copy";
// src/components/wedding/EventsGrid.tsx
// Screen 06 — four visually distinct event cards from EVENTS.
"use client";

import { useState } from "react";
import Image from "next/image";
import { THEME_STYLES } from "@/content/wedding";
import type { WeddingEvent } from "@/content/wedding";
import { useLiveContent } from "./useLiveContent";
import FitImage from "./FitImage";
import { googleCalendarUrl } from "@/lib/calendar";
import { CalendarPlusIcon, ClockIcon, PinIcon } from "./icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import EventDetails from "./EventDetails";
import FloralCorners from "./decor/FloralCorners";

function EventCard({
  event,
  onDetails,
}: {
  event: WeddingEvent;
  onDetails: (e: WeddingEvent) => void;
}) {
  const theme = THEME_STYLES[event.theme];
  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-3xl border-2 bg-white/80 shadow-[0_20px_50px_-24px_rgba(109,16,37,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgba(109,16,37,0.5)] active:scale-[0.98]"
      style={{
        borderColor: `${theme.accent}55`,
        ["--tw-shadow-color" as string]: `${theme.accent}44`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 30px 60px -20px ${theme.accent}66, 0 0 0 1px ${theme.accent}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div className={`bg-gradient-to-br ${theme.gradient} p-2.5 pb-0`}>
        <div className="overflow-hidden rounded-t-[1.15rem] rounded-b-lg">
          {event.imageFit === "cover" ? (
            <Image
              src={event.image}
              alt={event.name}
              width={640}
              height={420}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          ) : (
            <FitImage
              src={event.image}
              alt={event.name}
              width={640}
              height={400}
              lockFrame
              className="aspect-[16/10] w-full"
            />
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4 text-center">
        <h3
          className="font-display text-xl font-bold uppercase tracking-[0.1em]"
          style={{ color: theme.accent }}
        >
          {event.name}
        </h3>
        <div className="mt-3 space-y-1.5 text-sm font-medium text-bark-soft">
          <p className="flex items-center justify-center gap-1.5">
            <CalendarPlusIcon size={15} className="shrink-0" />
            <span>{event.dateLabel}</span>
          </p>
          <p className="flex items-center justify-center gap-1.5">
            <ClockIcon size={15} className="shrink-0" />
            <span>{event.timeLabel}</span>
          </p>
        </div>
        <div className="mx-auto mt-3 h-px w-16" style={{ background: `${theme.accent}44` }} />
        <p
          className="mt-2.5 px-1 font-script text-2xl leading-snug"
          style={{ color: theme.accent }}
        >
          {event.tagline}
        </p>
        <div className="mt-auto grid grid-cols-3 gap-1.5 pt-5 sm:gap-2">
          <button
            type="button"
            onClick={() => onDetails(event)}
            className="rounded-full border px-1 py-2 text-[10px] font-semibold uppercase tracking-wide transition hover:-translate-y-0.5 sm:text-xs"
            style={{ borderColor: `${theme.accent}66`, color: theme.accent }}
          >
            Details
          </button>
          <a
            href={googleCalendarUrl({
              title: `${event.name} — ${(window as any).__easyWedding.config.partner1} & ${(window as any).__easyWedding.config.partner2}`,
              description: `${event.description || ""}\n\n⏰ Tip: Set a reminder for 1 day before so you don't miss it!`,
              location: event.address,
              startISO: event.dateISO,
              durationHours: 3,
            })}
            target="_blank"
            rel="noopener noreferrer"
            title="Add to Google Calendar"
            className="rounded-full border px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide transition hover:-translate-y-0.5 sm:text-xs"
            style={{ borderColor: `${theme.accent}66`, color: theme.accent }}
          >
            📅 Save Date
          </a>
          <a
            href={event.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide transition hover:-translate-y-0.5 sm:text-xs"
            style={{ borderColor: `${theme.accent}66`, color: theme.accent }}
          >
            Map
          </a>
        </div>
      </div>
    </article>
  );
}

export default function EventsGrid() {
  const [selected, setSelected] = useState<WeddingEvent | null>(null);
  const { events: liveEvents } = useLiveContent();
  const events = [...liveEvents]
    .filter((e) => e.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section id="events" className="relative scroll-mt-20 overflow-hidden bg-ivory-deep/60 py-16 sm:py-20">
      <FloralCorners variant="top" sizePct={22} opacity={0.9} />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8 lg:max-w-7xl lg:px-12">
        <SectionHeading
          script={copyText(7,"Wedding Festivities")}
          subtitle={copyText(8,"Join Us for Our Special Moments")}
        />
        <div className={`grid gap-6 sm:grid-cols-2 ${events.length >= 4 ? "xl:grid-cols-4" : events.length === 3 ? "xl:grid-cols-3" : events.length === 2 ? "xl:grid-cols-2" : "xl:grid-cols-1"} ${events.length < 4 ? "xl:max-w-5xl xl:mx-auto" : ""}`}>
          {events.map((event, i) => (
            <Reveal key={event.id} delay={0.06 * i}>
              <EventCard event={event} onDetails={setSelected} />
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-bark-soft">
            <PinIcon size={16} className="text-gold-deep" />
            All celebrations at {(window as any).__easyWedding.config.venue}, {(window as any).__easyWedding.config.city}
          </p>
        </Reveal>
      </div>
      <EventDetails event={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
