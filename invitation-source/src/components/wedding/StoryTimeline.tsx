import {copyText} from "../../../adapters/copy";
// src/components/wedding/StoryTimeline.tsx
// Screen 05 — vertical story timeline (live DB content, seed fallback).
import Image from "next/image";
import FitImage from "./FitImage";
import { useLiveContent } from "./useLiveContent";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { GoldFlourishDivider } from "./Ornaments";

/** small gold flower node for the timeline spine */
function FlowerNode({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      aria-hidden
    >
      <circle cx="20" cy="20" r="19" fill="#fff7e8" stroke="#c99a3d" strokeWidth="1.5" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="20"
          cy="12.5"
          rx="4.2"
          ry="6.5"
          fill="#e9b949"
          stroke="#b8860b"
          strokeWidth="1"
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="4" fill="#8d1730" />
      <circle cx="20" cy="20" r="1.8" fill="#f5d67b" />
    </svg>
  );
}

export default function StoryTimeline() {
  const { story } = useLiveContent();
  const entries = [...story].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <section id="story" className="relative scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:max-w-6xl lg:px-12">
        <SectionHeading script={copyText(5,"Our Story")} subtitle={copyText(6,"Two Hearts, One Journey")} />

        <div className="relative">
          {/* timeline spine — rich gold with glow */}
          <div
            className="absolute bottom-0 top-0 left-[26px] w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-gold/20 via-gold to-gold/20 shadow-[0_0_12px_rgba(201,154,61,0.55)] sm:left-1/2"
            aria-hidden
          />

          <div className="space-y-12 sm:space-y-16">
            {entries.map((entry, i) => {
              const leftSide = i % 2 === 0;
              return (
                <div key={entry.title}>
                  {i > 0 && (
                    <Reveal className="pb-10 sm:pb-14" aria-hidden>
                      <GoldFlourishDivider className="mx-auto max-w-[200px] opacity-80" />
                    </Reveal>
                  )}
                  <Reveal delay={0.05}>
                  <article
                    className={`relative pl-16 sm:w-1/2 sm:pl-0 ${
                      leftSide
                        ? "sm:pr-14 sm:text-right"
                        : "sm:ml-auto sm:pl-14"
                    }`}
                  >
                    {/* flower node on the spine */}
                    <FlowerNode
                      className={`absolute top-1 h-10 w-10 drop-shadow-[0_2px_6px_rgba(201,154,61,0.5)] ${
                        leftSide
                          ? "left-[7px] sm:left-auto sm:-right-5"
                          : "left-[7px] sm:-left-5"
                      }`}
                    />
                    <h3 className="font-script text-4xl text-maroon lg:text-5xl">
                      {entry.title}
                    </h3>
                    {entry.dateLabel && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-gold-deep">
                        {entry.dateLabel}
                      </p>
                    )}
                    <p className="mt-2 text-[15px] leading-relaxed text-bark-soft">
                      {entry.description}
                    </p>
                    {entry.photo && (
                      <div
                        className={`mt-4 max-w-[220px] ${
                          leftSide ? "sm:ml-auto" : ""
                        }`}
                      >
                        <div className="overflow-hidden rounded-t-[999px] rounded-b-2xl border-2 border-gold/70 p-1 bg-cream shadow-[0_16px_40px_-18px_rgba(109,16,37,0.45)]">
                          <div className="overflow-hidden rounded-t-[999px] rounded-b-xl">
                            {entry.photoFit === "cover" ? (
                              <Image
                                src={entry.photo}
                                alt={entry.title}
                                width={440}
                                height={560}
                                loading="lazy"
                                className="aspect-[3/4] w-full object-cover"
                              />
                            ) : (
                              <FitImage
                                src={entry.photo}
                                alt={entry.title}
                                width={440}
                                height={560}
                                className="aspect-[3/4] w-full"
                              />
                            )}
                        </div>
                      </div>
                    </div>
                    )}
                  </article>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
