import {useMotionPreference} from "../../../adapters/motion-preference";
import {copyText} from "../../../adapters/copy";
// src/components/wedding/RSVPForm.tsx
// Screen 12 — guest RSVP form. POSTs to /api/rsvp; success shows gold check.
"use client";

import { useState } from "react";
import { normalizeIndianPhone } from "@/lib/phone";
import { motion } from "framer-motion";
import { EVENTS, VENUE, THEME_STYLES } from "@/content/wedding";
import { useLiveContent } from "./useLiveContent";
import { CheckIcon, CalendarPlusIcon, ClockIcon, PinIcon } from "./icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import FloralCorners from "./decor/FloralCorners";
import PetalField from "./PetalField";

type FoodPref = "veg" | "non-veg" | "both";

const inputCls =
  "w-full rounded-xl border border-gold/50 bg-white/80 px-4 py-3 text-[15px] text-bark placeholder:text-bark-soft/50 outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/15";

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString("en-GB", { month: "short" })}`;
}

export default function RSVPForm() {
  const reduce=useMotionPreference();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState("2");
  const [events, setEvents] = useState<string[]>(["wedding"]);
  const { events: liveEvents } = useLiveContent();
  const allEvents = liveEvents.length > 0 ? liveEvents : EVENTS;
  const [foodPref, setFoodPref] = useState<FoodPref>("veg");
  const [message, setMessage] = useState("");
  const [songRequest, setSongRequest] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const toggleEvent = (id: string) =>
    setEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setError("");

    if (!name.trim()) return setError("Please enter your name.");
    const mobile = normalizeIndianPhone(phone);
    if (!mobile) {
      setError(
        "Please enter a valid 10-digit Indian mobile number — with or without +91."
      );
      /* Take the guest straight to the field that needs fixing. */
      const el = document.getElementById("rsvp-phone");
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      (el as HTMLInputElement | null)?.focus({ preventScroll: true });
      return;
    }
    const guestCount = parseInt(guests, 10);
    if (!guestCount || guestCount < 1 || guestCount > 50)
      return setError("Number of guests must be between 1 and 50.");
    if (events.length === 0) return setError("Please select at least one event.");

    setStatus("sending");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: mobile,
          guests: guestCount,
          events,
          foodPref,
          message: message.trim() || undefined,
          songRequest: songRequest.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const issue =
          data?.issues?.fieldErrors &&
          (Object.values(data.issues.fieldErrors).flat()[0] as string | undefined);
        throw new Error(issue || data?.error || "Could not submit your RSVP.");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  };

  if (status === "done") {
    return (
      <section id="rsvp" className="relative scroll-mt-20 overflow-hidden py-16 sm:py-20">
        <FloralCorners variant="all" sizePct={24} />
        {/* petals rain on successful RSVP */}
        <PetalField count={26} />
        <div className="relative mx-auto max-w-xl px-5 text-center sm:px-8">
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 13 }}
            className="relative mx-auto flex h-24 w-24 items-center justify-center"
          >
            {/* golden halo rings */}
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-gold"
              aria-hidden
              initial={{ scale: 0.7, opacity: 0.9 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.6, repeat: reduce ? 0 : Infinity, ease: "easeOut" }}
            />
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 text-white shadow-[0_16px_40px_-12px_rgba(16,122,63,0.7)] ring-4 ring-gold/50">
              <CheckIcon size={44} />
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 font-script text-6xl text-maroon"
          >
            {copyText(18,"Thank You!")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.6 }}
            className="mt-3 font-display text-lg italic leading-relaxed text-bark-soft"
          >
            Your reply is ready. Review it and send it to the couple.
            <br />
            We&rsquo;re so happy to have you with us on our special day!
          </motion.p>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setName("");
              setPhone("");
              setMessage("");
              setSongRequest("");
            }}
            className="btn-royal mt-8"
          >
            Back to Home
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="rsvp" className="relative scroll-mt-20 overflow-hidden py-16 sm:py-20">
      <FloralCorners variant="top" sizePct={22} opacity={0.9} />
      <div className="relative mx-auto max-w-xl px-5 sm:px-8 lg:max-w-6xl lg:px-12">
        <SectionHeading
          script={copyText(15,"Will You Celebrate With Us?")}
          subtitle={copyText(16,"Please RSVP and let us know your presence — it will mean a lot to us!")}
        />

        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-10">
        <Reveal>
          <form
            onSubmit={submit}
            className="royal-frame bg-cream/80 px-5 py-7 shadow-[0_24px_60px_-28px_rgba(109,16,37,0.45)] sm:px-8"
            noValidate
          >
            <div className="space-y-5">
              <div>
                <label htmlFor="rsvp-name" className="mb-1.5 block text-sm font-semibold text-bark">
                  Your Name <span className="text-maroon">*</span>
                </label>
                <input
                  id="rsvp-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className={inputCls}
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="rsvp-phone" className="mb-1.5 block text-sm font-semibold text-bark">
                  Phone Number <span className="text-maroon">*</span>
                </label>
                <input
                  id="rsvp-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => {
                    /* Show the number exactly as it will be saved, so the
                       guest can see their +91 number was accepted. */
                    const m = normalizeIndianPhone(phone);
                    if (m && m !== phone) setPhone(m);
                  }}
                  placeholder="e.g. +91 98765 43210"
                  className={inputCls}
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={17}
                />
              </div>

              <div>
                <label htmlFor="rsvp-guests" className="mb-1.5 block text-sm font-semibold text-bark">
                  Number of Guests <span className="text-maroon">*</span>
                </label>
                <select
                  id="rsvp-guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className={inputCls}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset>
                <legend className="mb-2 block text-sm font-semibold text-bark">
                  Which events will you attend? <span className="text-maroon">*</span>
                </legend>
                <div className="grid grid-cols-2 gap-2.5">
                  {allEvents.map((event) => (
                    <label
                      key={event.id}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
                        events.includes(event.id)
                          ? "border-maroon bg-maroon/5 font-semibold text-maroon"
                          : "border-gold/50 bg-white/70 text-bark-soft"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={events.includes(event.id)}
                        onChange={() => toggleEvent(event.id)}
                        className="h-4 w-4 accent-[#8d1730]"
                      />
                      <span>
                        {event.name.replace(" Ceremony", "").replace("The ", "")}
                        <span className="block text-xs font-normal opacity-75">
                          {shortDate(event.dateISO)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 block text-sm font-semibold text-bark">
                  Food Preference <span className="text-maroon">*</span>
                </legend>
                <div className="flex gap-2.5">
                  {(["veg", "non-veg", "both"] as FoodPref[]).map((pref) => (
                    <label
                      key={pref}
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-sm capitalize transition ${
                        foodPref === pref
                          ? "border-maroon bg-maroon font-semibold text-ivory"
                          : "border-gold/50 bg-white/70 text-bark-soft"
                      }`}
                    >
                      <input
                        type="radio"
                        name="foodPref"
                        value={pref}
                        checked={foodPref === pref}
                        onChange={() => setFoodPref(pref)}
                        className="sr-only"
                      />
                      {pref === "non-veg" ? "Non-Veg" : pref[0]!.toUpperCase() + pref.slice(1)}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="rsvp-message" className="mb-1.5 block text-sm font-semibold text-bark">
                  Your Message / Blessings
                </label>
                <textarea
                  id="rsvp-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your blessings…"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <label htmlFor="rsvp-song" className="mb-1.5 block text-sm font-semibold text-bark">
                  🎵 Song Request <span className="font-normal text-bark-soft">(optional)</span>
                </label>
                <input
                  id="rsvp-song"
                  type="text"
                  value={songRequest}
                  onChange={(e) => setSongRequest(e.target.value)}
                  placeholder="Which song should the DJ play for you?"
                  maxLength={200}
                  className={inputCls}
                />
              </div>

              {error && (
                <p role="alert" className="rounded-xl bg-maroon/10 px-4 py-2.5 text-sm font-medium text-maroon">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-royal w-full disabled:cursor-wait disabled:opacity-70"
              >
                {status === "sending" ? "Sending…" : "Confirm RSVP"}
              </button>
            </div>
          </form>
        </Reveal>

        {/* celebration details — desktop aside */}
        <Reveal delay={0.1} className="mt-8 lg:mt-0">
          <aside className="royal-frame bg-cream/80 p-6 shadow-[0_24px_60px_-28px_rgba(109,16,37,0.45)] lg:sticky lg:top-24">
            <h3 className="font-script text-4xl text-maroon">{copyText(17,"Celebration Details")}</h3>
            <ul className="mt-5 space-y-4">
              {[...allEvents]
                .filter((e) => e.enabled)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((event) => {
                  const theme = THEME_STYLES[event.theme];
                  return (
                    <li key={event.id} className="flex items-start gap-3">
                      <span
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: theme.accent }}
                        aria-hidden
                      />
                      <div>
                        <p className="font-display text-base font-semibold text-bark">
                          {event.name}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-bark-soft">
                          <span className="inline-flex items-center gap-1">
                            <CalendarPlusIcon size={13} />
                            {event.dateLabel}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon size={13} />
                            {event.timeLabel}
                          </span>
                        </p>
                      </div>
                    </li>
                  );
                })}
            </ul>
            <div className="gold-divider my-5" aria-hidden>
              <span className="text-gold-deep">✦</span>
            </div>
            <p className="flex items-start gap-2 text-sm leading-relaxed text-bark-soft">
              <PinIcon size={16} className="mt-0.5 shrink-0 text-maroon" />
              <span>
                {VENUE.name}, {VENUE.addressLines.join(", ")} — {VENUE.pin}
              </span>
            </p>
          </aside>
        </Reveal>
        </div>
      </div>
    </section>
  );
}
