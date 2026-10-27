// src/components/wedding/RoyalMandapInvite.tsx
// Royal mandap "You're Invited" section — full-bleed dramatic design from family's PDF.
// All texts editable via Admin → Site Texts. Animations: diya glow, petals, shimmer.
"use client";

import Image from "next/image";
import { SITE_TEXTS } from "@/content/wedding";
import Reveal from "./Reveal";
import PetalField from "./PetalField";

export default function RoyalMandapInvite() {
  return (
    <section id="invitation" className="relative scroll-mt-20 overflow-hidden">
      {/* royal mandap backdrop */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/ornaments/royal-mandap-invite.webp"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          loading="lazy"
        />
        {/* cinematic light rays from top */}
        <div
          className="absolute inset-0 animate-[rays-spin_24s_linear_infinite] opacity-30"
          style={{
            background:
              "conic-gradient(from 0deg at 50% -10%, transparent 0deg, rgba(255,220,150,0.12) 8deg, transparent 16deg, rgba(255,220,150,0.12) 24deg, transparent 32deg, rgba(255,220,150,0.12) 40deg, transparent 48deg)",
          }}
        />
        {/* diya glow flicker at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 animate-[diya-flicker_3s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 20% 100%, rgba(255,180,80,0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 100%, rgba(255,180,80,0.25) 0%, transparent 60%)",
          }}
        />
        {/* readability gradient for text */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      </div>

      {/* floating petals */}
      <PetalField />

      {/* content */}
      <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center sm:py-28">
        <Reveal>
          <h2 className="font-script text-5xl text-[#ffe9b0] drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-6xl lg:text-7xl">
            {SITE_TEXTS.mandapTitle}
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-6 flex items-center justify-center gap-4" aria-hidden>
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold-light sm:w-24" />
            <span className="text-gold-light">❦</span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold-light sm:w-24" />
          </div>
        </Reveal>

        <Reveal delay={0.25}>
          <div className="mt-8 space-y-3">
            <p className="mandap-shimmer font-display text-lg font-semibold uppercase tracking-[0.35em] text-[#ffe9b0] sm:text-xl lg:text-2xl">
              {SITE_TEXTS.mandapLine1}
            </p>
            <p className="mandap-shimmer font-display text-lg font-semibold uppercase tracking-[0.35em] text-[#ffe9b0] sm:text-xl lg:text-2xl" style={{ animationDelay: "0.4s" }}>
              {SITE_TEXTS.mandapLine2}
            </p>
            <p className="mandap-shimmer font-display text-lg font-semibold uppercase tracking-[0.35em] text-[#ffe9b0] sm:text-xl lg:text-2xl" style={{ animationDelay: "0.8s" }}>
              {SITE_TEXTS.mandapLine3}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.35}>
          <div className="mt-8 flex items-center justify-center gap-4" aria-hidden>
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold-light sm:w-24" />
            <span className="text-gold-light">❦</span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold-light sm:w-24" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
