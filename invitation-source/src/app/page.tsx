// src/app/page.tsx
// Public wedding invitation — single-page flow.
"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import OpeningSequence from "@/components/wedding/OpeningSequence";
import OpeningPreloader from "@/components/wedding/OpeningPreloader";
import DoorReveal from "@/components/wedding/DoorReveal";
import Hero from "@/components/wedding/Hero";
import FamilyIntro from "@/components/wedding/FamilyIntro";
import InvitationMessage from "@/components/wedding/InvitationMessage";
import StoryTimeline from "@/components/wedding/StoryTimeline";
import EventsGrid from "@/components/wedding/EventsGrid";
import WeddingTimeline from "@/components/wedding/WeddingTimeline";
import Venue from "@/components/wedding/Venue";
import Gallery from "@/components/wedding/Gallery";
import VideoSection from "@/components/wedding/VideoSection";
import RSVPForm from "@/components/wedding/RSVPForm";
import SagunBlessings from "@/components/wedding/SagunBlessings";
import ShareSection from "@/components/wedding/ShareSection";
import ThankYou from "@/components/wedding/ThankYou";
import DesktopNav from "@/components/wedding/DesktopNav";
import MusicControl from "@/components/wedding/MusicControl";
import PetalField from "@/components/wedding/PetalField";
import InvalidInvitationLink from "@/components/wedding/InvalidInvitationLink";
import { useInvitationLinkStatus } from "@/lib/guest";
import { celebrationTime, stopMusic } from "@/lib/music";

type Stage = "opening" | "doors" | "main";

export default function Home() {
  const [stage, setStage] = useState<Stage>("opening");
  // Revoked/deleted personal links stop opening the site entirely.
  const linkGate = useInvitationLinkStatus();

  // Fresh start on every load/reload: browsers restore the old scroll
  // position and keep the #hash (e.g. #gallery), which would leave the
  // visitor stuck at the last-viewed section. Clear both so the
  // invitation always begins from the opening, at the very top.
  useEffect(() => {
    try {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      // The hash contains the Easy Wedding invitation snapshot; retain it.
    } catch {
      /* noop */
    }
    window.scrollTo(0, 0);
  }, []);

  // lock scroll while the opening / door experience is active
  useEffect(() => {
    document.body.style.overflow = stage === "main" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [stage]);

  const openInvitation = useCallback(() => {
    setStage("doors"); // navigation must never be blocked by audio
    try {
      celebrationTime(); // aarti -> crossfade to wedding celebration
    } catch {
      // stay silent — the invitation flow continues regardless
    }
  }, []);

  const onDoorsDone = useCallback(() => {
    setStage("main");
    window.scrollTo({ top: 0 });
  }, []);

  // Safety net: never leave the user stuck on the door screen.
  // If timers ever fail, force-advance after 12s.
  useEffect(() => {
    if (stage !== "doors") return;
    const t = setTimeout(() => {
      setStage((s) => (s === "doors" ? "main" : s));
    }, 12000);
    return () => clearTimeout(t);
  }, [stage]);

  const replay = useCallback(() => {
    stopMusic();
    window.scrollTo({ top: 0 });
    setStage("opening");
  }, []);

  useEffect(() => {
    const open = () => { setStage("main"); window.scrollTo(0,0); };
    window.addEventListener("wedding:open",open);
    window.addEventListener("wedding:replay",replay);
    return () => {window.removeEventListener("wedding:open",open);window.removeEventListener("wedding:replay",replay);};
  },[replay]);

  // A revoked/deleted personal invitation link never opens the site.
  // (Plain public links have no token and are unaffected.)
  if (linkGate.hasToken && linkGate.status === "invalid") {
    return <InvalidInvitationLink />;
  }

  return (
    <main data-invitation-phase={stage} className="min-h-screen bg-ivory text-bark lg:wedding-desktop-bg">
      {/* rich royal backdrop outside the invitation card (desktop only) */}
      <div
        className="pointer-events-none fixed inset-0 hidden lg:block"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(201,154,61,0.14) 0%, transparent 70%)," +
            "radial-gradient(ellipse 50% 40% at 50% 100%, rgba(201,154,61,0.10) 0%, transparent 70%)," +
            "radial-gradient(circle at 8% 20%, rgba(201,154,61,0.06) 0%, transparent 22%)," +
            "radial-gradient(circle at 92% 80%, rgba(201,154,61,0.06) 0%, transparent 22%)",
        }}
      />
      <OpeningPreloader />
      <AnimatePresence>
        {stage === "opening" && (
          <OpeningSequence key="opening" onOpen={openInvitation} />
        )}
        {stage === "doors" && (
          <DoorReveal key="doors" onDone={onDoorsDone} />
        )}
      </AnimatePresence>

      {stage === "main" && (
        <>
          <PetalField count={12} />
          {(window as any).__easyWedding.musicEnabled && <MusicControl />}
          <DesktopNav />

          {/* centered invitation column; widens into a full layout on desktop */}
          <div className="relative mx-auto w-full max-w-md border-x border-gold/25 bg-ivory pb-12 shadow-[0_0_80px_-30px_rgba(109,16,37,0.45)] lg:max-w-6xl lg:border-x-2 lg:pt-16 lg:shadow-[0_0_120px_-20px_rgba(0,0,0,0.7)] xl:max-w-7xl">
            <FamilyIntro />
            <Hero />
            <InvitationMessage />
            <StoryTimeline />
            <EventsGrid />
            <WeddingTimeline />
            <Venue />
            <Gallery />
            <VideoSection />
            <RSVPForm />
            <SagunBlessings />
            <ShareSection />
            <ThankYou onReplay={replay} />
          </div>
        </>
      )}
    </main>
  );
}
