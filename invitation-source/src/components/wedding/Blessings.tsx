import {copyText} from "../../../adapters/copy";
// src/components/wedding/Blessings.tsx
// Screen 13 — guest blessings: form (POST /api/blessings) + approved list (GET).
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { CheckIcon } from "./icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import FloralCorners from "./decor/FloralCorners";

interface Blessing {
  id: string;
  name: string;
  message: string;
  createdAt?: string;
}

const inputCls =
  "w-full rounded-xl border border-gold/50 bg-white/80 px-4 py-3 text-[15px] text-bark placeholder:text-bark-soft/50 outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/15";

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default function Blessings() {
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [qr, setQr] = useState("");

  useEffect(() => {
    const href = window.location.href.split("#")[0]!;
    QRCode.toDataURL(href, {
      width: 220,
      margin: 2,
      color: { dark: "#4a241c", light: "#fff7e8" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/blessings", { cache: "no-store" });
        if (!res.ok) throw new Error("load failed");
        const data = await res.json();
        if (!cancelled) setBlessings(Array.isArray(data.blessings) ? data.blessings : []);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setFormError("");
    if (!name.trim()) return setFormError("Please enter your name.");
    if (!message.trim()) return setFormError("Please write your blessing.");
    setSending(true);
    try {
      const res = await fetch("/api/blessings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not save your blessing.");
      setSent(true);
      setName("");
      setMessage("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="blessings" className="relative scroll-mt-20 overflow-hidden bg-ivory-deep/60 py-16 sm:py-20">
      <FloralCorners variant="top" sizePct={22} opacity={0.9} />
      <div className="relative mx-auto max-w-xl px-5 sm:px-8 lg:max-w-6xl lg:px-12">
        <SectionHeading
          script="Send Your Blessings"
          subtitle="Your kind words mean a lot to us"
        />

        {/* approved blessings list */}
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
          {loading && (
            <div className="space-y-4" aria-hidden>
              {[0, 1].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-gold/40 bg-white/60 p-5">
                  <div className="h-4 w-1/3 rounded bg-gold/30" />
                  <div className="mt-3 h-3 w-full rounded bg-gold/20" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-gold/20" />
                </div>
              ))}
            </div>
          )}
          {!loading && loadError && (
            <p className="rounded-2xl border border-gold/40 bg-white/60 p-5 text-center text-sm text-bark-soft">
              Blessings could not be loaded right now — please check back later.
            </p>
          )}
          {!loading && !loadError && blessings.length === 0 && (
            <p className="rounded-2xl border border-gold/40 bg-white/60 p-5 text-center font-display text-lg italic text-bark-soft">
              Be the first to shower your blessings on the couple.
            </p>
          )}
          {blessings.map((b) => (
            <Reveal key={b.id}>
              <article className="rounded-2xl border border-gold/40 bg-white/70 p-5 shadow-[0_12px_30px_-18px_rgba(109,16,37,0.4)]">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-maroon to-maroon-deep font-display text-lg font-semibold text-gold-light"
                    aria-hidden
                  >
                    {b.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3 className="font-semibold text-bark">{b.name}</h3>
                    {b.createdAt && (
                      <p className="text-xs text-bark-soft/80">{timeAgo(b.createdAt)}</p>
                    )}
                  </div>
                </div>
                <p className="mt-3 leading-relaxed text-bark-soft">{b.message}</p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* submission + QR side by side on desktop */}
        <div className="mt-8 lg:mt-12 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
        {/* submission */}
        <Reveal>
          {!showForm && !sent && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="btn-royal w-full"
            >
              Write a Blessing
            </button>
          )}

          {sent && (
            <div className="rounded-2xl border border-gold/60 bg-cream p-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-gold-deep text-maroon-deep">
                <CheckIcon size={28} />
              </span>
              <p className="mt-3 font-script text-3xl text-maroon">{copyText(18,"Thank you!")}</p>
              <p className="mt-1 text-sm text-bark-soft">
                Your blessing has been received and will appear here once approved.
              </p>
            </div>
          )}

          {showForm && !sent && (
            <form onSubmit={submit} className="royal-frame bg-cream/80 px-5 py-6" noValidate>
              <div className="space-y-4">
                <div>
                  <label htmlFor="blessing-name" className="mb-1.5 block text-sm font-semibold text-bark">
                    Your Name <span className="text-maroon">*</span>
                  </label>
                  <input
                    id="blessing-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className={inputCls}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="blessing-message" className="mb-1.5 block text-sm font-semibold text-bark">
                    Your Blessing <span className="text-maroon">*</span>
                  </label>
                  <textarea
                    id="blessing-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your heartfelt wishes…"
                    rows={4}
                    className={`${inputCls} resize-none`}
                  />
                </div>
                {formError && (
                  <p role="alert" className="rounded-xl bg-maroon/10 px-4 py-2.5 text-sm font-medium text-maroon">
                    {formError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button type="submit" disabled={sending} className="btn-royal flex-1 disabled:opacity-70">
                    {sending ? "Sending…" : "Send Blessing"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-royal-outline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </Reveal>

        {/* QR — scan to open invitation */}
        <Reveal className="mt-10 lg:mt-0">
          <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-gold/50 bg-cream/70 px-6 py-7 shadow-[0_16px_40px_-24px_rgba(109,16,37,0.45)] lg:py-10">
            {qr ? (
              <div className="rounded-2xl border border-gold/60 bg-ivory p-3 shadow-inner">
                <Image
                  src={qr}
                  alt="QR code linking to this invitation"
                  width={180}
                  height={180}
                  className="h-40 w-40"
                  unoptimized
                />
              </div>
            ) : (
              <div className="h-40 w-40 animate-pulse rounded-2xl bg-gold/20" aria-hidden />
            )}
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-bark-soft">
              Scan to Open Invitation
            </p>
          </div>
        </Reveal>
        </div>
      </div>
    </section>
  );
}
