import {useMotionPreference} from "../../../adapters/motion-preference";
import {copyText} from "../../../adapters/copy";
// src/components/wedding/Hero.tsx
// Screen 03 — wedding card hero: Ganesh, "{SITE_TEXTS.youreInvited}", couple names
// with a prominent "weds", date, venue + live countdown.
"use client";

import { SITE_TEXTS } from "@/content/wedding";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { COUPLE, ORDERED_COUPLE, VENUE, WEDDING_DATE_ISO, WEDDING_DATE_LABEL } from "@/content/wedding";
import { useGuestName } from "@/lib/guest";
import { CalendarIcon, ChevronDownIcon, PinIcon } from "./icons";
import PetalField from "./PetalField";
import Reveal from "./Reveal";

function useCountdown(targetIso: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(targetIso).getTime();
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff <= 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

function CountTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-[64px] flex-col items-center rounded-xl border border-gold/60 bg-gradient-to-b from-maroon to-maroon-deep px-2 py-2.5 shadow-[0_8px_20px_-8px_rgba(109,16,37,0.6)] lg:min-w-[96px] lg:px-4 lg:py-4">
      <span className="font-display text-2xl font-semibold tabular-nums text-gold-light lg:text-4xl">
        {value}
      </span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ivory/80 lg:text-xs">
        {label}
      </span>
    </div>
  );
}

/** gold flourish line used around "weds" */
function FlourishLine({ flip = false }: { flip?: boolean }) {
  return (
    <span
      className={`h-px w-16 sm:w-24 lg:w-32 ${flip ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-transparent via-gold to-gold-deep`}
      aria-hidden
    />
  );
}

export default function Hero() {
  const reduce=useMotionPreference();
  const [dateRevealed, setDateRevealed] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  // Auto magical reveal when scrolled into view
  useEffect(() => {
    const el = dateRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Small delay for dramatic effect, then reveal
          setTimeout(() => setDateRevealed(true), 600);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const guestName = useGuestName();
  const { days, hours, minutes, seconds, done } = useCountdown(WEDDING_DATE_ISO);

  return (
    <section id="home" className="relative scroll-mt-20 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 glow-warm" aria-hidden />
      <PetalField count={8} className="opacity-70" />

      <div className="relative mx-auto max-w-3xl px-4 pb-14 pt-8 text-center sm:px-8 sm:pt-12 lg:max-w-4xl lg:px-12">
        {/* ── wedding card ── */}
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border-2 border-gold/70 bg-[#fffdf6] px-5 py-10 shadow-[0_30px_80px_-30px_rgba(109,16,37,0.35)] sm:px-10 sm:py-12">
            {/* inner gold hairline */}
            <div className="pointer-events-none absolute inset-2 rounded-xl border border-gold/40" aria-hidden />

            {/* hanging bells toran across the top */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 overflow-hidden sm:h-24" aria-hidden>
              <Image
                src="/ornaments/hanging-bells.webp"
                alt=""
                width={1200}
                height={220}
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="h-full w-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-[#fffdf6]" />
            </div>

            {/* Ganesh in oval glow */}
            <div className="relative mx-auto mt-14 h-36 w-28 sm:mt-16 sm:h-44 sm:w-36">
              <div
                className="absolute -inset-4 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,200,120,0.55) 0%, rgba(255,180,100,0.18) 55%, transparent 72%)",
                }}
                aria-hidden
              />
              <div className="relative h-full w-full overflow-hidden rounded-[50%] border-2 border-gold/60 shadow-[0_10px_30px_-10px_rgba(109,16,37,0.4)]">
                <Image
                  src="/ornaments/ganesh-divine.webp"
                  alt="Lord Ganesha"
                  fill
                  priority
                  sizes="144px"
                  className="object-cover"
                />
              </div>
            </div>

            <p className="mt-4 font-display text-sm tracking-[0.25em] text-maroon/80 sm:text-base">
              {copyText(21,"Shree Ganeshaya Namah")}
            </p>

            {/* gold divider */}
            <div className="mx-auto mt-4 flex items-center justify-center gap-3" aria-hidden>
              <span className="h-px w-20 bg-gradient-to-r from-transparent to-gold-deep" />
              <span className="text-lg text-gold-deep">❧</span>
              <span className="h-px w-20 bg-gradient-to-l from-transparent to-gold-deep" />
            </div>

            {guestName && (
              <p className={`mt-5 font-script text-[#C0392B] ${guestName.length > 20 ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"} leading-tight px-4`}>
                Dear {guestName},
              </p>
            )}
            <h2 className="mt-5 font-display text-2xl font-semibold uppercase tracking-[0.3em] text-maroon sm:text-3xl lg:text-4xl">
              {SITE_TEXTS.youreInvited}
            </h2>
            <p className="mt-2 font-display text-[11px] font-medium uppercase tracking-[0.4em] text-bark/70 sm:text-xs">
              {copyText(23,"To the wedding of")}
            </p>

            {/* names with prominent weds */}
            <p className="mt-6 font-script text-6xl leading-[1.15] text-maroon sm:text-7xl lg:text-8xl">
              {ORDERED_COUPLE[0].name}
            </p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <FlourishLine />
              <span className="font-display text-4xl italic text-gold-deep sm:text-5xl">
                weds
              </span>
              <FlourishLine flip />
            </div>
            <p className="mt-3 font-script text-6xl leading-[1.15] text-maroon sm:text-7xl lg:text-8xl">
              {ORDERED_COUPLE[1].name}
            </p>

            {/* heart divider */}
            <div className="mx-auto mt-6 flex items-center justify-center gap-3" aria-hidden>
              <span className="h-px w-24 bg-gradient-to-r from-transparent to-gold-deep sm:w-32" />
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/70 bg-ivory text-sm text-maroon shadow">
                ♥
              </span>
              <span className="h-px w-24 bg-gradient-to-l from-transparent to-gold-deep sm:w-32" />
            </div>

            {/* date — auto magical reveal on scroll */}
            <div ref={dateRef} className="mt-6 flex min-h-[48px] items-center justify-center">
              {!dateRevealed ? (
                <span className="flex items-center gap-3 text-gold/70" aria-hidden>
                  <span className="date-sparkle text-lg">✦</span>
                  <span className="date-sparkle text-sm" style={{ animationDelay: "0.7s" }}>✦</span>
                  <span className="date-sparkle text-lg" style={{ animationDelay: "1.4s" }}>✦</span>
                </span>
              ) : (
                <p className="flex items-center justify-center gap-2.5 font-display text-lg font-semibold uppercase tracking-[0.22em] sm:text-xl animate-[date-reveal-pop_1.2s_ease-out]">
                  <CalendarIcon size={20} className="shrink-0 text-maroon" />
                  <span className="relative inline-block">
                    <span className="magical-date">{WEDDING_DATE_LABEL.toUpperCase()}</span>
                    <span className="date-sparkle pointer-events-none absolute -right-5 -top-2 text-sm text-gold" aria-hidden style={{ animationDelay: "0.3s" }}>✦</span>
                    <span className="date-sparkle pointer-events-none absolute -left-4 top-1 text-xs text-gold-light" aria-hidden style={{ animationDelay: "1.1s" }}>✦</span>
                  </span>
                </p>
              )}
            </div>
            <p className="mt-3 flex items-start justify-center gap-2 font-display text-sm leading-relaxed text-bark sm:text-base">
              <PinIcon size={18} className="mt-0.5 shrink-0 text-maroon" />
              <span>
                {VENUE.name}, {VENUE.addressLines[0]}
                <br />
                {VENUE.addressLines.slice(1).join(", ")} — {VENUE.pin}
              </span>
            </p>

            {/* floral bottom corners */}
            <Image
              src="/ornaments/floral-corner.webp"
              alt=""
              width={180}
              height={180}
              aria-hidden
              className="pointer-events-none absolute -bottom-2 -left-2 w-28 opacity-90 sm:w-36"
            />
            <Image
              src="/ornaments/floral-corner.webp"
              alt=""
              width={180}
              height={180}
              aria-hidden
              className="pointer-events-none absolute -bottom-2 -right-2 w-28 -scale-x-100 opacity-90 sm:w-36"
            />
          </div>
        </Reveal>

        {/* countdown */}
        <Reveal delay={0.2}>
          <div
            className="mt-8 flex items-stretch justify-center gap-2.5 sm:gap-3"
            role="timer"
            aria-label={
              done
                ? "The wedding day has arrived"
                : `Countdown: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds remaining`
            }
          >
            <CountTile value={String(days)} label="Days" />
            <CountTile value={pad(hours)} label="Hours" />
            <CountTile value={pad(minutes)} label="Minutes" />
            <CountTile value={pad(seconds)} label="Seconds" />
          </div>
          {done && (
            <p className="mt-4 font-script text-3xl text-maroon">
              The celebration has begun!
            </p>
          )}
        </Reveal>

        {/* quote */}
        <Reveal delay={0.28}>
          <blockquote className="mx-auto mt-10 max-w-md lg:max-w-2xl">
            <p className="font-script text-3xl italic leading-snug text-maroon sm:text-4xl lg:text-5xl">
              &ldquo;{COUPLE.quote}&rdquo;
            </p>
          </blockquote>
          <a
            href="#invitation"
            className="mt-8 inline-flex flex-col items-center gap-1 text-bark-soft transition-colors hover:text-maroon"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.28em]">
              {copyText(25,"Scroll to Explore")}
            </span>
            <motion.span
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 1.8, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }}
            >
              <ChevronDownIcon size={22} />
            </motion.span>
          </a>
        </Reveal>
      </div>


    </section>
  );
}
