"use client";

// ram-mandir — "Ram Mandir" (Ayodhya)
// The opening plays exactly as the design's reference video does
// (owner's words, 2026-11-05: "First page me sirf jaisa video me waisa
// dikhega, fir scroll krenge ussi trah aage badrega" — the first page
// shows only what the video shows; then, when you scroll, it proceeds
// the same way):
//  · FIRST PAGE — the temple scene ALONE fills the entire screen
//    edge-to-edge (cover fit, centre focal): golden Ram Mandir, pink
//    sky, the couple walking the stone path. NOTHING else is on the
//    screen — no tap hint, no button, no card sliver, no blurred
//    backdrop bands. The couple's names then appear WHOLE over the
//    sky in one gentle fade — live HTML (the plate technique), so
//    studio edits show.
//  · SCROLL — the guest scrolls, as in the video: the hero moves up
//    and out, and the cream cover card comes in from below as the
//    next screen (both screens live in this Reveal's own scroll
//    flow). Once the card has been seen, the shared flow takes
//    over: beat 2 settles on the same card screen, then the shared
//    Open Invitation cover and the main invitation follow.
// Choreography (owner's correction, 2026-11-05 — "Mandir ko 3D me
// down kro animation se, fir naam, kyuki overlap ho raha hai"): on
// load the temple DESCENDS — it comes down in 3D (raised, slightly
// farther, tilted) and settles into place; ONLY THEN do the names
// fade in, inside the clear band of pure sky the settled composition
// leaves at the top. The scene artwork itself was re-composed lower
// for this (hero-scene.webp carries a sky extension built from the
// master's own sky above the original crop, so the temple — flag
// included — settles below the names and never touches them).
// After the names, the guest's own scroll is the only other motion:
// no sway, no sparkles, no petals, no tap beats.
// Owner's order (2026-11-07): no tap-prompt text anywhere in this
// opening, and a CLICK on the temple scene does what the first scroll
// did — it advances to the cover card screen (the same scroll, fired
// by the click instead of the wheel/touch). Scrolling stays available
// and unchanged; the click is an addition, not a new sequence.

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ORDERED_COUPLE } from "@/content/wedding";

/* Owner's explicit order for THIS design (2026-11-05): its opening runs
   exactly like the reference video — temple hero → the names reveal →
   the cream cover card — with NO Ganesh beat in between. The shared
   OpeningSequence reads this flag from the theme's own opening
   registration; every other design keeps the shared beat untouched. */
export const skipGaneshBeat = true;

/* ── palette (from the artwork) ──────────────────────────── */
const BROWN = "#5a2d12";
const NAME_BROWN = "#6b3410";
const GOLD = "#b8860b";

const HERO_SCENE = "/assets/ram-mandir/hero-scene.webp";
const CARD_ART = "/assets/ram-mandir/card.webp";

/* ── shared helpers ──────────────────────────────────────── */
function getConfig(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  return (
    (window as unknown as { __easyWedding?: { config?: Record<string, unknown> } })
      .__easyWedding?.config ?? {}
  );
}

/** Couple names in presentation order (host side first) — the canonical
    couple source every shared section uses, so studio edits show here
    exactly as they show on the cover and in the family sections. */
function displayNames(): [string, string] {
  return [ORDERED_COUPLE[0].name, ORDERED_COUPLE[1].name];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/** "2026-12-12" → "Saturday, 12 December 2026" (weekday from the date). */
function formatDateLong(iso?: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1] ?? "";
  const day = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
  return `${WEEKDAYS[day]}, ${Number(m[3])} ${month} ${m[1]}`;
}

/** The wedding date line the cover card carries (the time lives on the
    countdown below, as in the design). */
function weddingDateLine(): string {
  const cfg = getConfig();
  return formatDateLong(
    typeof cfg.date === "string" ? cfg.date : "2026-12-12",
  );
}

/** The couple's names as one block — script, "Weds", script. (Owner's
    order, 2026-11-05: "Weds hota hai, na ki and" — the joiner in this
    design's opening is "Weds", in the same small gold script styling
    the "and" had.) Used on the hero (over the sky, `compact` — the
    block stays inside the sky band) and on the cover card (over the
    painted-out plate); in both places it is a single unit that
    appears whole. */
function NamesBlock({ dateLine, compact }: { dateLine?: string; compact?: boolean }) {
  const [first, second] = displayNames();
  const nameSize = compact ? "min(8.6vw, 5.8dvh)" : "min(9.9vw, 6.6dvh)";
  const wedsSize = compact ? "min(3.4vw, 2.3dvh)" : "min(3.9vw, 2.6dvh)";
  return (
    <>
      <p
        className="font-script"
        style={{
          color: NAME_BROWN,
          fontSize: nameSize,
          lineHeight: 1.12,
          textShadow: "0 1px 0 rgba(255,250,235,0.7)",
        }}
      >
        {first}
      </p>
      <div
        className="flex items-center justify-center gap-3"
        style={{ margin: compact ? "0.15em 0" : "0.25em 0" }}
        aria-hidden
      >
        <span
          className="h-px w-10"
          style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }}
        />
        <span
          className="font-display italic"
          style={{ color: GOLD, fontSize: wedsSize }}
        >
          Weds
        </span>
        <span
          className="h-px w-10"
          style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }}
        />
      </div>
      <p
        className="font-script"
        style={{
          color: NAME_BROWN,
          fontSize: nameSize,
          lineHeight: 1.12,
          textShadow: "0 1px 0 rgba(255,250,235,0.7)",
        }}
      >
        {second}
      </p>
      {dateLine ? (
        <p
          className="font-display font-semibold"
          style={{
            color: BROWN,
            fontSize: "min(3.2vw, 2.1dvh)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginTop: "0.45em",
            whiteSpace: "nowrap",
          }}
        >
          {dateLine}
        </p>
      ) : null}
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   The cream cover card as a full screen — Ganesh ji, garlands,
   chhatris and the two peacocks are the artwork (shipped with
   the painted names removed); the couple's names and the
   wedding date are live HTML over the card's blank plate.
   The SAME screen rendering serves the Reveal's second scroll
   screen and beat 2, so the scroll handover is seamless.
   ══════════════════════════════════════════════════════════ */
function CardScreen({
  dateLine,
  onTap,
}: {
  dateLine: string;
  onTap?: () => void;
}) {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "#2a1408", cursor: onTap ? "pointer" : undefined }}
      onClick={onTap}
      role={onTap ? "button" : undefined}
      aria-label="The wedding invitation cover"
    >
      {/* blurred card backdrop fills any screen taller than the artwork */}
      <img
        src={CARD_ART}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: "blur(20px) brightness(0.7)", transform: "scale(1.18)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{ width: "min(100vw, 119.07dvh)", aspectRatio: "1024 / 860" }}
        >
          <img
            src={CARD_ART}
            alt="Wedding invitation cover — Ganesh ji, marigold garlands and two peacocks"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* ── the name plate — live HTML over the painted-out card ── */}
          <div
            className="absolute text-center"
            style={{ left: "7%", right: "7%", top: "26.3%", height: "44%" }}
          >
            <NamesBlock dateLine={dateLine} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BEAT 0 — Reveal: a scroll-led first page, exactly like the
   video. Screen 1 is the temple scene alone, full-bleed, with
   the names fading in over the sky. The guest SCROLLS: the
   hero moves up and out while the cover card (screen 2, same
   flow) comes in from below. When the card has been seen, the
   opening hands over to the shared flow (beat 2).
   ══════════════════════════════════════════════════════════ */
export function Reveal({ onReveal }: { onReveal: () => void }) {
  const firedRef = useRef(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  // A click on the temple scene advances to the cover card — exactly
  // the move the guest's first scroll makes (the card scrolls into
  // view inside this Reveal's own scroll flow, and the dwell handover
  // below takes it from there).
  const advanceToCard = useCallback(() => {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Hand over once the guest has scrolled the cover card into view
  // and dwelled on it briefly. Scrolling back up cancels the handover.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (timer === undefined) {
              timer = window.setTimeout(() => {
                if (firedRef.current) return;
                firedRef.current = true;
                onRevealRef.current();
              }, 1800);
            }
          } else if (timer !== undefined) {
            window.clearTimeout(timer);
            timer = undefined;
          }
        }
      },
      { threshold: 0.75 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const dateLine = weddingDateLine();

  return (
    <div
      className="h-full w-full overflow-y-auto"
      style={{
        background: "#2a1408",
        scrollSnapType: "y mandatory",
        overscrollBehavior: "contain",
        scrollbarWidth: "none",
      }}
      role="region"
      aria-label="Ram Mandir invitation"
    >
      {/* ── SCREEN 1 — the temple scene alone, edge-to-edge ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "100%", scrollSnapAlign: "start", cursor: "pointer" }}
        onClick={advanceToCard}
      >
        {/* keyboard route to the same advance the click/scroll makes —
            focusable but never visible (no text prompt on this design) */}
        <button type="button" className="sr-only" onClick={advanceToCard}>
          View the invitation cover
        </button>
        {/* the temple DESCENDS into place — it starts raised, slightly
            farther away and tilted in 3D, then comes down and settles
            (ease-out, 1.5s). The settled artwork is composed lower in
            the frame, leaving a clean band of pure sky at the top. */}
        <motion.div
          className="absolute inset-0"
          style={{
            transformPerspective: 1000,
            transformOrigin: "50% 55%",
            willChange: "transform",
          }}
          initial={{ y: "-8%", scale: 1.13, rotateX: 5 }}
          animate={{ y: "0%", scale: 1, rotateX: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={HERO_SCENE}
            alt="Golden Ram Mandir with the couple walking towards it beneath a temple-pink sky"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center" }}
          />
        </motion.div>
        {/* ONLY AFTER the temple has settled, the names appear WHOLE
            over the sky — one gentle fade (delay 1.8s = the 1.5s
            descent plus a breath). The block sits at 12.5%, inside the
            clear sky band the re-composed scene leaves at the top —
            the temple, saffron flag included, settles below ~27% of
            the frame, so the names never touch it; 12.5% also keeps
            the block fully clear of the demo surface's preview
            banner, which overlays the top of the first screen in
            template previews. */}
        <motion.div
          className="absolute inset-x-0 text-center"
          style={{ top: "12.5%" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.8, ease: "easeOut" }}
        >
          <NamesBlock compact />
        </motion.div>
      </div>

      {/* ── SCREEN 2 — the cover card, reached by scrolling ── */}
      <div
        ref={cardRef}
        className="relative w-full"
        style={{ height: "100%", scrollSnapAlign: "start" }}
      >
        <CardScreen dateLine={dateLine} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BEAT 2 — Curtain: the cover card, settled. The guest has
   already scrolled to this same screen inside the Reveal;
   beat 2 holds it on the shared schedule, then the shared
   Open Invitation cover takes over.
   ══════════════════════════════════════════════════════════ */
export function Curtain({
  onDone,
  autoPlay,
}: {
  onDone: () => void;
  autoPlay?: boolean;
}) {
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finishOnce = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  }, []);

  // Advances on the shared schedule in auto-play; a manual tap finishes
  // shortly after the tap. The card itself is static — nothing composes,
  // rises or flips; it is simply the settled screen.
  useEffect(() => {
    if (!autoPlay) return;
    const t = setTimeout(finishOnce, 3600);
    return () => clearTimeout(t);
  }, [autoPlay, finishOnce]);

  const tapFinish = useCallback(() => {
    if (autoPlay) return;
    setTimeout(finishOnce, 350);
  }, [autoPlay, finishOnce]);

  return (
    <CardScreen
      dateLine={weddingDateLine()}
      onTap={autoPlay ? undefined : tapFinish}
    />
  );
}
