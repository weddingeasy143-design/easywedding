import {copyText} from "../../../adapters/copy";
// src/components/wedding/WeddingTimeline.tsx
// Screen 09 — chronological strip of the four events with refined icons.
"use client";
import { useState } from "react";
import { EVENTS, THEME_STYLES } from "@/content/wedding";
import { useLiveContent } from "./useLiveContent";
import EventDetails from "./EventDetails";
import type { WeddingEvent } from "@/content/wedding";
import {
  CheersIcon,
  HennaIcon,
  LampIcon,
  RingsIcon,
} from "./icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import FloralCorners from "./decor/FloralCorners";

const EVENT_ICONS: Record<WeddingEvent["theme"], (p: { size?: number; style?: React.CSSProperties; className?: string }) => React.ReactElement> = {
  haldi: LampIcon,
  mehendi: HennaIcon,
  wedding: RingsIcon,
  reception: CheersIcon,
};

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString("en-GB", { month: "short" })}`;
}

export default function WeddingTimeline() {
  const { events: liveEvents } = useLiveContent();
  const [selected, setSelected] = useState<WeddingEvent | null>(null);
  const events = [...(liveEvents.length > 0 ? liveEvents : EVENTS)]
    .filter((e) => e.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section id="timeline" className="relative scroll-mt-20 overflow-hidden bg-ivory-deep/60 py-16 sm:py-20">
      <FloralCorners variant="all" sizePct={22} opacity={0.85} />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8 lg:max-w-7xl lg:px-12">
        <SectionHeading script={copyText(9,"Wedding Timeline")} subtitle={copyText(10,"Every celebration, in order")} />

        <Reveal>
          <div className="relative">
            {/* connector line — horizontal on desktop, ornamental */}
            <div
              className="absolute left-0 right-0 top-9 hidden h-[3px] rounded-full bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_10px_rgba(201,154,61,0.5)] lg:block"
              aria-hidden
            />
            {/* connector line — vertical on mobile */}
            <div
              className="absolute bottom-4 left-7 top-4 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-gold to-transparent shadow-[0_0_10px_rgba(201,154,61,0.5)] lg:hidden"
              aria-hidden
            />
            <ol className={`grid gap-6 sm:grid-cols-2 lg:gap-4 ${events.length >= 4 ? "lg:grid-cols-4" : events.length === 3 ? "lg:grid-cols-3" : events.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-1"} ${events.length < 4 ? "lg:max-w-4xl lg:mx-auto" : ""}`}>
              {events.map((event) => {
                const theme = THEME_STYLES[event.theme];
                const Icon = EVENT_ICONS[event.theme];
                return (
                  <li
                    key={event.id}
                    className="relative flex items-center gap-5 text-left lg:flex-col lg:items-center lg:gap-0 lg:text-center"
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(event)}
                      className="relative z-10 flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 bg-ivory shadow-[0_10px_24px_-10px_rgba(109,16,37,0.5)] transition-transform hover:scale-110 active:scale-95 sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]"
                      style={{ borderColor: theme.accent }}
                      aria-label={`View ${event.name} details`}
                    >
                      <Icon size={26} style={{ color: theme.accent }} />
                    </button>
                    <div className="lg:mt-2.5">
                      <h3 className="font-display text-lg font-semibold text-bark">
                        {event.name.replace(" Ceremony", "").replace("The ", "")}
                      </h3>
                      <p className="mt-0.5 text-sm font-medium text-bark-soft">
                        {shortDate(event.dateISO)}
                      </p>
                      <p
                        className="mt-0.5 text-sm font-bold tabular-nums"
                        style={{ color: theme.accent }}
                      >
                        {event.timeLabel}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </Reveal>
      </div>

      {/* event details modal on icon click */}
      <EventDetails event={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
