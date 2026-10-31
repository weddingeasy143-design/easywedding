import {copyText} from "../../../adapters/copy";
// src/components/wedding/InvitationMessage.tsx
// Screen 04 — formal invitation message with framed couple photo + quote.
"use client";
import Image from "next/image";
import { COUPLE, ORDERED_COUPLE } from "@/content/wedding";
import FitImage from "./FitImage";
import { GiftIcon, HeartIcon, UsersIcon } from "./icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { FloralCorners } from "./Ornaments";
import { useGuestName } from "@/lib/guest";

const FEATURES = [
  { label: "Same People", Icon: UsersIcon },
  { label: "Same Love", Icon: HeartIcon },
  { label: "Bigger Blessings", Icon: GiftIcon },
];

export default function InvitationMessage() {
  const guestName = useGuestName();
  return (
    <section id="invitation" className="relative scroll-mt-20 overflow-hidden bg-ivory-deep/60 py-16 sm:py-20">
      <FloralCorners />
      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 lg:max-w-6xl lg:px-12">
        <SectionHeading script={copyText(3,"You're Invited")} />
        {guestName && (
          <Reveal delay={0.05}>
            <p className={`mx-auto -mt-2 mb-6 max-w-xl text-center font-display italic text-[#C0392B] px-4 ${guestName.length > 20 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"}`}>
              Dear {guestName},
            </p>
          </Reveal>
        )}

        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="lg:text-left">
            <Reveal delay={0.1}>
              <p className="mx-auto max-w-xl whitespace-pre-line text-center font-display text-xl italic leading-relaxed text-bark sm:text-2xl lg:mx-0 lg:text-left lg:text-[1.7rem]">
                {COUPLE.invitationMessage}
              </p>
            </Reveal>

            {/* three mini features */}
            <Reveal delay={0.22}>
              <ul className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-2 text-center lg:mx-0">
                {FEATURES.map(({ label, Icon }) => (
                  <li key={label} className="flex flex-col items-center gap-2 px-1">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-cream text-maroon shadow-[0_8px_20px_-10px_rgba(109,16,37,0.5)]">
                      <Icon size={22} />
                    </span>
                    <span className="text-xs font-semibold leading-tight text-bark">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.24}>
              <blockquote className="mx-auto mt-10 max-w-xl text-center lg:mx-0 lg:text-left">
                <p className="font-script text-4xl leading-snug text-maroon sm:text-5xl lg:text-6xl">
                  &ldquo;{COUPLE.quote}&rdquo;
                </p>
              </blockquote>
            </Reveal>
          </div>

          <Reveal delay={0.18} className="mt-10 lg:mt-0">
            <div className="relative mx-auto max-w-sm lg:max-w-md">
              <div className="overflow-hidden rounded-t-[999px] rounded-b-2xl border-[3px] border-gold/70 shadow-[0_24px_60px_-24px_rgba(109,16,37,0.4)]">
                {COUPLE.invitationPhotoFit === "contain" ? (
                  <FitImage
                    src={COUPLE.invitationPhoto}
                    alt={`${ORDERED_COUPLE[0].name} and ${ORDERED_COUPLE[1].name}`}
                    width={600}
                    height={800}
                    className="aspect-[3/4] w-full"
                  />
                ) : (
                  <Image
                    src={COUPLE.invitationPhoto}
                    alt={`${ORDERED_COUPLE[0].name} and ${ORDERED_COUPLE[1].name}`}
                    width={600}
                    height={760}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover"
                  />
                )}
              </div>
              {/* flower arch overlay removed - was covering faces */}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
