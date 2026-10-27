import {copyText} from "../../../adapters/copy";
// src/components/wedding/Venue.tsx
// Screen 08 — venue page redesigned to match the Canva reference (100%):
// cream background, floral corners, petals, gold pin header, map preview
// card, maroon CTA buttons, 3-column info strip, full-bleed venue photo
// with decorative scalloped top edge.
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { VENUE } from "@/content/wedding";
import { DirectionsIcon, PhoneIcon, PinIcon, ShareIcon } from "./icons";
import Reveal from "./Reveal";


/** Small gold divider with a heart in the middle (as in the reference). */
function HeartDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-24 bg-gradient-to-r from-transparent via-gold to-gold sm:w-32" />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#C9993D" aria-hidden>
        <path d="M12 21s-7.5-4.9-10-9.3C.4 8.6 2.4 5 5.8 5c2 0 3.4 1.1 4.2 2.4h4C14.8 6.1 16.2 5 18.2 5c3.4 0 5.4 3.6 3.8 6.7C19.5 16.1 12 21 12 21z" transform="scale(0.9) translate(1.3 1.3)" />
      </svg>
      <span className="h-px w-24 bg-gradient-to-l from-transparent via-gold to-gold sm:w-32" />
    </div>
  );
}

/** Scattered rose petals (decorative, as in the reference). */
function Petals() {
  const petals = [
    { left: "6%", top: "4%", size: 22, rotate: 24, delay: "0s" },
    { left: "88%", top: "7%", size: 18, rotate: -30, delay: "1.2s" },
    { left: "12%", top: "22%", size: 26, rotate: -14, delay: "0.6s" },
    { left: "82%", top: "28%", size: 20, rotate: 40, delay: "2s" },
    { left: "4%", top: "45%", size: 18, rotate: 60, delay: "1.6s" },
    { left: "93%", top: "52%", size: 24, rotate: -45, delay: "0.3s" },
    { left: "10%", top: "68%", size: 20, rotate: 15, delay: "2.4s" },
    { left: "86%", top: "74%", size: 22, rotate: -20, delay: "1s" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden" aria-hidden>
      {petals.map((p, i) => (
        <svg
          key={i}
          width={p.size}
          height={p.size}
          viewBox="0 0 24 24"
          className="absolute animate-[petal-float_7s_ease-in-out_infinite]"
          style={{
            left: p.left,
            top: p.top,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: p.delay,
            opacity: 0.75,
          }}
        >
          <path
            d="M12 2C7 7 5 12 5 16c0 3 3 6 7 6s7-3 7-6c0-4-2-9-7-14z"
            fill="#F8A9C0"
          />
          <path
            d="M12 2C7 7 5 12 5 16c0 3 3 6 7 6s7-3 7-6c0-4-2-9-7-14z"
            fill="#F472A0"
            opacity="0.45"
            transform="translate(2 1) scale(0.85)"
          />
        </svg>
      ))}
      <style>{`@keyframes petal-float { 0%,100% { margin-top: 0; } 50% { margin-top: -12px; } }`}</style>
    </div>
  );
}

export default function Venue() {
  const [contactPhone, setContactPhone] = useState("");
  const [venuePhoto, setVenuePhoto] = useState(VENUE.photo);
  const [venueMapUrl, setVenueMapUrl] = useState(VENUE.mapUrl);
  const [venueFit, setVenueFit] = useState<"cover" | "contain">("cover");

  useEffect(() => {
    try {
      const el = document.getElementById("__SITE_CONFIG__");
      const parsed = el?.textContent ? JSON.parse(el.textContent) : null;
      const p = parsed?.contactPhone;
      if (typeof p === "string" && p.trim()) setContactPhone(p.trim());
      const c = parsed?.content;
      if (c && typeof c.venuePhoto === "string" && c.venuePhoto.trim())
        setVenuePhoto(c.venuePhoto.trim());
      if (c && typeof c.venueMapUrl === "string" && c.venueMapUrl.trim())
        setVenueMapUrl(c.venueMapUrl.trim());
      const f = c?.venuePhotoFit;
      if (f === "contain" || f === "cover") setVenueFit(f);
    } catch {
      /* keep defaults */
    }
  }, []);

  const mapUrl = venueMapUrl || VENUE.mapUrl;
  // Directions opens the SAME admin-configured location (Google Maps app
  // shows its own Directions button from there) — never a different place.
  const directionsUrl = mapUrl;

  return (
    <section
      id="venue"
      className="relative scroll-mt-20 overflow-hidden bg-[#FFFBF4] pt-14 sm:pt-16"
    >
      {/* FloralCorners removed - was causing white patch artifacts */}
      <Petals />

      <div className="relative z-10 mx-auto max-w-2xl px-5 sm:px-8">
        {/* ── header ─────────────────────────────── */}
        <Reveal className="text-center">
          <p className="flex justify-center text-gold-deep" aria-hidden>
            <PinIcon size={30} />
          </p>
          <h2 className="mt-2 font-display text-5xl font-semibold text-maroon sm:text-6xl">
            {VENUE.name}
          </h2>
          <p className="mt-3 text-[15px] tracking-wide text-[#7A5C4D] sm:text-base">
            {VENUE.full}
          </p>
          <HeartDivider className="mt-5" />
          <p className="mx-auto mt-5 max-w-md font-display text-[19px] italic leading-relaxed text-[#6B4A3A] sm:text-xl">
            {copyText(33,"Join us as we celebrate love, laughter and new beginnings at our family home.")}
          </p>
          <HeartDivider className="mt-5" />
        </Reveal>

        {/* ── map preview card ───────────────────── */}
        <Reveal delay={0.1}>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 block overflow-hidden rounded-[28px] border border-gold/60 bg-[#FFFDF8] shadow-[0_18px_45px_-20px_rgba(139,30,45,0.35)]"
            aria-label="Open venue location in Google Maps"
          >
            <div className="relative flex flex-col items-center px-6 py-10">
              {/* subtle grid pattern */}
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(201,153,61,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(201,153,61,.18) 1px, transparent 1px)",
                  backgroundSize: "34px 34px",
                }}
                aria-hidden
              />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-maroon text-ivory shadow-[0_10px_25px_-8px_rgba(139,30,45,0.7)] transition group-hover:scale-110">
                <PinIcon size={34} />
              </span>
              <span className="relative mt-4 font-display text-2xl font-semibold text-maroon">
                {VENUE.name}
              </span>
              <span className="relative mt-2 text-[13px] font-medium uppercase tracking-[0.28em] text-[#7A5C4D]">
                Tap to preview on the map
              </span>
            </div>
          </a>
        </Reveal>

        {/* ── CTA buttons ────────────────────────── */}
        <Reveal delay={0.16}>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-maroon px-6 py-4 text-[15px] font-bold uppercase tracking-[0.18em] text-ivory shadow-[0_16px_35px_-12px_rgba(139,30,45,0.65)] transition hover:bg-[#6d1420] active:scale-[0.98]"
          >
            <PinIcon size={20} />
            Open in Google Maps
          </a>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {contactPhone && (
              <a
                href={`tel:${contactPhone.replace(/[^+\d]/g, "")}`}
                className="flex items-center justify-center gap-1.5 rounded-full border border-maroon/40 bg-white/70 px-2 py-3 text-[13px] font-bold uppercase tracking-wider text-maroon transition hover:bg-maroon hover:text-ivory active:scale-[0.97]"
              >
                <PhoneIcon size={16} />
                Call
              </a>
            )}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-full border border-maroon/40 bg-white/70 px-2 py-3 text-[13px] font-bold uppercase tracking-wider text-maroon transition hover:bg-maroon hover:text-ivory active:scale-[0.97]"
            >
              <DirectionsIcon size={16} />
              Directions
            </a>
            <button
              type="button"
              onClick={() => {
                const text = `${VENUE.name} — ${mapUrl}`;
                if (navigator.share) {
                  navigator.share({ title: "Wedding Venue", text, url: mapUrl }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(text).catch(() => {});
                }
              }}
              className="flex items-center justify-center gap-1.5 rounded-full border border-maroon/40 bg-white/70 px-2 py-3 text-[13px] font-bold uppercase tracking-wider text-maroon transition hover:bg-maroon hover:text-ivory active:scale-[0.97]"
            >
              <ShareIcon size={16} />
              <span className="leading-tight">Share<br className="sm:hidden" /> Location</span>
            </button>
          </div>
        </Reveal>

        {/* ── info strip ─────────────────────────── */}
        <Reveal delay={0.2}>
          <div className="mt-10 grid grid-cols-3 items-start">
            <div className="flex flex-col items-center px-2 text-center">
              <span className="text-maroon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3l9-8z" />
                </svg>
              </span>
              <p className="mt-2 font-display text-[15px] leading-snug text-[#6B4A3A] sm:text-base">
                {copyText(29,"Our Family")}<br />{copyText(30,"Home")}
              </p>
            </div>
            <div className="relative flex flex-col items-center px-2 text-center">
              <span className="absolute left-0 top-1 h-[85%] w-px bg-gradient-to-b from-transparent via-gold to-transparent" aria-hidden />
              <span className="absolute right-0 top-1 h-[85%] w-px bg-gradient-to-b from-transparent via-gold to-transparent" aria-hidden />
              <span className="text-maroon">
                <PinIcon size={26} />
              </span>
              <p className="mt-2 font-display text-[15px] font-semibold leading-snug text-maroon sm:text-base">
                {VENUE.name}
              </p>
              <p className="font-display text-[13px] leading-snug text-[#6B4A3A] sm:text-sm">
                Bokaro, Jharkhand
              </p>
            </div>
            <div className="flex flex-col items-center px-2 text-center">
              <span className="text-maroon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 21s-7.5-4.9-10-9.3C.4 8.6 2.4 5 5.8 5c2 0 3.4 1.1 4.2 2.3C10.8 6.1 12.2 5 14.2 5c3.4 0 5.4 3.6 3.8 6.7C19.5 16.1 12 21 12 21z" />
                </svg>
              </span>
              <p className="mt-2 font-display text-[15px] leading-snug text-[#6B4A3A] sm:text-base">
                {copyText(31,"Where Our")}<br />{copyText(32,"Celebration Begins")}
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── venue photo, full-bleed with decorative top edge ── */}
      <Reveal delay={0.1} className="relative z-10 mt-10">
        <div className="relative">
          <div className="relative overflow-hidden">
            {venueFit === "contain" ? (
              <div className="relative bg-[#2b0f14]">
                <Image
                  src={venuePhoto}
                  alt={VENUE.name}
                  width={1200}
                  height={750}
                  loading="lazy"
                  className="h-auto w-full object-contain"
                />
              </div>
            ) : (
              <Image
                src={venuePhoto}
                alt={VENUE.name}
                width={1200}
                height={750}
                loading="lazy"
                className="h-auto w-full object-cover"
              />
            )}
            {/* warm glow at top of photo */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#FFFBF4]/60 to-transparent"
              aria-hidden
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
