"use client";

// mandir-darwaza — "Mandir Darwaza" (Temple Doors)
// Beat 0 for this design is the temple gate itself: the closed golden
// doors fill the whole screen and the artwork IS the button (owner's
// order, 2026-11-07: "do new templates se tap to open wala hata do —
// waha darwaja pe click krte hai khule"). There is NO text prompt of
// any kind on the gate — no "Tap to Open", no button pill, no hint.
// A click (or Enter/Space on the focused gate) anywhere on the doors
// fires the same onReveal the old Tap to Open tap fired, and the
// shared flow continues exactly as before (Ganesh beat, curtain,
// Open Invitation cover). The design registers no Curtain of its own:
// beat 2 falls back to the shared name-reveal curtain in
// OpeningSequence, untouched.

import { useCallback, useRef } from "react";

const GATE_ART = "/assets/mandir-darwaza/doors-closed.webp";

export function Reveal({ onReveal }: { onReveal: () => void }) {
  const firedRef = useRef(false);
  const open = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onReveal();
  }, [onReveal]);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "#2a030b", cursor: "pointer" }}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Open the invitation"
    >
      <img
        src={GATE_ART}
        alt="Closed golden temple doors with marigold garlands and brass diyas"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
