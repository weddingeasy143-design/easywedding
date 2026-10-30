import {copyText} from "../../../adapters/copy";
// src/components/wedding/SagunBlessings.tsx
// "Send Your Blessings via UPI (Sagun)" — digital sagun + blessings form,
// matching the family's PDF design. All copy/QRs/UPI IDs editable at
// /admin/blessings (stored in wedding_config.sagun).
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DEFAULT_SAGUN, type SagunConfig } from "@/server/wedding/site-config";
import Reveal from "./Reveal";

function readSagun(): SagunConfig {
  const fallback = { ...DEFAULT_SAGUN };
  if (typeof document === "undefined") return fallback;
  try {
    const el = document.getElementById("__SITE_CONFIG__");
    const parsed = el?.textContent ? JSON.parse(el.textContent) : null;
    const s = parsed?.sagun;
    if (s && typeof s === "object") return { ...fallback, ...s };
  } catch {
    /* use defaults */
  }
  return fallback;
}

const inputCls =
  "w-full rounded-xl border border-gold/50 bg-white/90 px-4 py-3 text-[15px] text-bark placeholder:text-bark-soft/50 outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/15";

/** Small gold heart divider: — ❤ — */
function HeartDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-16 bg-gold/70 sm:w-24" />
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#c0392b]" aria-hidden>
        <path d="M12 21s-7.5-4.9-10-9.3C.4 8.6 2.4 5 5.7 5c2 0 3.4 1.1 4.3 2.6h4c.9-1.5 2.3-2.6 4.3-2.6 3.3 0 5.3 3.6 3.7 6.7C19.5 16.1 12 21 12 21z" transform="scale(0.92) translate(1,0)" />
      </svg>
      <span className="h-px w-16 bg-gold/70 sm:w-24" />
    </div>
  );
}

function InfoIcon({ kind }: { kind: "heart" | "gift" | "couple" | "hands" }) {
  const cls = "h-8 w-8 shrink-0";
  if (kind === "heart")
    return (
      <svg viewBox="0 0 24 24" className={`${cls} fill-[#c0392b]`} aria-hidden>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  if (kind === "gift")
    return (
      <svg viewBox="0 0 24 24" className={`${cls} fill-none stroke-maroon stroke-[1.8]`} aria-hidden>
        <rect x="3" y="8" width="18" height="4" rx="1" className="fill-maroon stroke-none" />
        <path d="M5 12v8a1 1 0 001 1h12a1 1 0 001-1v-8M12 8v13M12 8s-4.5.2-5.5-1.5C5.7 5 7 3.5 8.5 4 10 4.5 12 8 12 8zm0 0s4.5.2 5.5-1.5C18.3 5 17 3.5 15.5 4 14 4.5 12 8 12 8z" />
      </svg>
    );
  if (kind === "couple")
    return (
      <svg viewBox="0 0 24 24" className={`${cls} fill-none stroke-maroon stroke-[1.8]`} aria-hidden>
        <circle cx="8.5" cy="7" r="3" />
        <circle cx="16" cy="8.5" r="2.4" />
        <path d="M3.5 20c0-3 2.2-5 5-5s5 2 5 5M13.5 20c.2-2.4 1.6-4 3.5-4 1.5 0 2.8 1.2 3 3.5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={`${cls} fill-none stroke-maroon stroke-[1.8]`} aria-hidden>
      <path d="M12 3v10M12 13l-4.5 3.5c-1.2 1-1.4 2.8-.4 4 .9 1 2.5 1.1 3.6.2L12 19.5l1.3 1.2c1.1.9 2.7.8 3.6-.2 1-1.2.8-3-.4-4L12 13zM7 8l-2.5 3M17 8l2.5 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SagunBlessings() {
  const [cfg, setCfg] = useState<SagunConfig>({ ...DEFAULT_SAGUN });
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setCfg(readSagun());
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

  const hasQr1 = Boolean(cfg.qr1Image || cfg.qr1UpiId);
  const hasQr2 = Boolean(cfg.qr2Image || cfg.qr2UpiId);
  const hasUpi = hasQr1 || hasQr2;

  return (
    <section id="blessings" className="relative scroll-mt-20 overflow-hidden py-16 sm:py-20">
      {/* illustrated backdrop */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/sagun/bg.jpg"
          alt=""
          fill
          className="object-cover object-top"
          priority={false}
        />
        <div className="absolute inset-0 bg-ivory/40" />
      </div>

      {/* hanging marigold garlands (from the design) */}
      <div className="pointer-events-none absolute left-0 top-0 z-10" aria-hidden>
        <Image
          src="/sagun/garland-1.webp"
          alt=""
          width={220}
          height={212}
          className="h-auto w-28 opacity-95 sm:w-40 lg:w-52"
          unoptimized
        />
      </div>
      <div className="pointer-events-none absolute right-0 top-0 z-10" aria-hidden>
        <Image
          src="/sagun/garland-2.webp"
          alt=""
          width={200}
          height={212}
          className="h-auto w-28 -scale-x-100 opacity-95 sm:w-40 lg:w-52"
          unoptimized
        />
      </div>

      <div className="relative z-20 mx-auto max-w-6xl px-5 pt-16 sm:px-8 sm:pt-20 lg:px-12">
        {/* ── header ── */}
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="font-script text-5xl leading-tight text-maroon sm:text-6xl lg:text-7xl">
              {cfg.title}
            </h2>
          </Reveal>
          <HeartDivider className="mt-3" />
          <Reveal>
            <p className="mt-3 font-display text-lg italic text-maroon sm:text-xl">
              {cfg.subtitle}
            </p>
          </Reveal>

          {/* side quotes (desktop) */}
          <p className="absolute -left-56 top-16 z-10 hidden w-48 font-display text-lg italic leading-snug text-bark xl:block">
            {cfg.quoteLeft}
          </p>
          <p className="absolute -right-56 top-16 z-10 hidden w-48 font-display text-lg italic leading-snug text-bark xl:block">
            {cfg.quoteRight}
          </p>

          {/* diya thali (left) + couple (right) — from the design */}
          <div
            className="pointer-events-none absolute -left-64 top-56 hidden w-52 xl:block"
            aria-hidden
          >
            <Image
              src="/sagun/diya.webp"
              alt=""
              width={326}
              height={204}
              className="h-auto w-full opacity-95"
              unoptimized
            />
          </div>
          <div
            className="pointer-events-none absolute -right-80 top-56 hidden w-80 xl:block"
            aria-hidden
          >
            <Image
              src="/sagun/couple.webp"
              alt=""
              width={460}
              height={326}
              className="h-auto w-full opacity-95"
              unoptimized
            />
          </div>

          <Reveal>
            <div className="mx-auto mt-6 flex max-w-xl items-start justify-center gap-1 text-maroon">
              <span className="font-display text-4xl leading-none text-gold-deep" aria-hidden>
                &ldquo;
              </span>
              <p className="font-display text-xl font-semibold sm:text-2xl">
                &ldquo;{cfg.quote}&rdquo;
              </p>
              <span className="font-display text-4xl leading-none text-gold-deep" aria-hidden>
                &rdquo;
              </span>
            </div>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-bark">
              {cfg.hindiText}
            </p>
          </Reveal>

          {/* side quotes (mobile/tablet, stacked) */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:hidden">
            <Reveal>
              <p className="font-display text-base italic text-bark">{cfg.quoteLeft}</p>
              <HeartDivider className="mt-2" />
            </Reveal>
            <Reveal>
              <p className="font-display text-base italic text-bark">{cfg.quoteRight}</p>
              <HeartDivider className="mt-2" />
            </Reveal>
          </div>
        </div>

        {/* ── main grid ── */}
        <div className={hasUpi ? "mt-10 grid gap-8 lg:mt-14 lg:grid-cols-2 lg:gap-10" : "mt-10 lg:mt-14 mx-auto max-w-2xl"}>
          {/* left: info strip + form */}
          <div>
            <Reveal>
              <div className="grid grid-cols-2 gap-y-4 rounded-2xl border border-gold/40 bg-cream/90 px-4 py-5 shadow-sm sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-gold/30">
                {(
                  [
                    { icon: "heart", text: "Send your sagun amount" },
                    { icon: "gift", text: "Bless us digitally" },
                    { icon: "couple", text: "Share your wishes" },
                    { icon: "hands", text: "Your blessings are priceless" },
                  ] as const
                ).map((it) => (
                  <div key={it.text} className="flex items-center gap-2.5 px-2 sm:justify-center">
                    <InfoIcon kind={it.icon} />
                    <span className="text-[13px] font-medium leading-tight text-bark">
                      {it.text}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal className="mt-6">
              <div className="rounded-2xl border-2 border-gold/60 bg-cream/95 p-5 shadow-[0_16px_40px_-24px_rgba(109,16,37,0.45)] sm:p-7">
                {sent ? (
                  <div className="py-8 text-center">
                    <p className="font-script text-4xl text-maroon">{copyText(18,"Thank you!")}</p>
                    <p className="mt-2 text-sm text-bark-soft">
                      Your blessing is ready. Review it and send it to the couple.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submit} noValidate>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="sagun-name"
                          className="mb-1.5 block text-[15px] font-bold text-bark"
                        >
                          {cfg.nameLabel} <span className="text-maroon">*</span>
                        </label>
                        <input
                          id="sagun-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={cfg.namePlaceholder}
                          className={inputCls}
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <textarea
                          id="sagun-wishes"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={cfg.wishesPlaceholder}
                          rows={4}
                          className={`${inputCls} resize-none`}
                          aria-label="Write your good wishes for the couple"
                        />
                      </div>
                      {formError && (
                        <p
                          role="alert"
                          className="rounded-xl bg-maroon/10 px-4 py-2.5 text-sm font-medium text-maroon"
                        >
                          {formError}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={sending}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#a51f36] to-[#7c1226] px-6 py-3.5 font-display text-lg font-semibold text-ivory shadow-lg transition hover:brightness-110 disabled:opacity-70"
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-ivory/90" aria-hidden>
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {sending ? "Sending…" : cfg.formButton}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </Reveal>
          </div>

          {/* right: UPI panel — only when the couple has added a QR or UPI id;
              with neither, the panel used to render two blank white cards
              whose pay links had an empty payee address */}
          {hasUpi && (
          <Reveal>
            <div className="overflow-hidden rounded-2xl border-2 border-gold/60 bg-cream/95 shadow-[0_16px_40px_-24px_rgba(109,16,37,0.45)]">
              {/* maroon banner */}
              <div className="relative bg-gradient-to-b from-[#a51f36] to-[#7c1226] px-6 py-4 text-center">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-light/90" aria-hidden>
                  ❦
                </span>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 scale-x-[-1] text-gold-light/90" aria-hidden>
                  ❦
                </span>
                <h3 className="font-display text-lg font-semibold tracking-wide text-ivory sm:text-xl">
                  {cfg.upiTitle}
                </h3>
              </div>

              <div className="p-4 sm:p-6">
                <div className={hasQr1 && hasQr2 ? "grid grid-cols-2 items-stretch gap-3 sm:gap-4" : "grid grid-cols-1 items-stretch gap-3 sm:gap-4 mx-auto w-full max-w-[300px]"}>
                  {/* QR 1 */}
                  {hasQr1 && (
                  <div className="flex flex-col items-center">
                    <p className="z-10 -mb-3.5 rounded-full bg-gradient-to-b from-[#a51f36] to-[#7c1226] px-4 py-1 font-display text-sm font-semibold text-ivory shadow">
                      {cfg.qr1Label}
                    </p>
                    <div className="flex w-full flex-1 flex-col items-center justify-start overflow-hidden rounded-xl border border-gold/50 bg-white/70 px-3 pb-4 pt-6 text-center">
                      <div className="aspect-square w-full max-w-[230px]">
                        {cfg.qr1Image ? (
                          <Image
                            src={cfg.qr1Image}
                            alt={`${cfg.qr1Label} QR code`}
                            width={460}
                            height={460}
                            className="h-full w-full rounded-lg object-contain"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-lg bg-maroon/5 px-3 text-center font-display text-sm font-semibold text-maroon">
                            Pay via UPI app — tap the UPI ID below
                          </div>
                        )}
                      </div>
                      {cfg.qr1UpiId && (
                      <a
                        href={`upi://pay?pa=${encodeURIComponent(cfg.qr1UpiId)}&pn=${encodeURIComponent((window as any).__easyWedding.config.partner1+" & "+(window as any).__easyWedding.config.partner2)}&cu=INR`}
                        className="mt-3 flex min-h-[32px] items-center justify-center break-all px-1 font-display text-xs font-semibold text-bark underline decoration-gold/60 underline-offset-2 hover:text-maroon"
                        title="Tap to pay via UPI app"
                      >
                        {cfg.qr1UpiId} ↗
                      </a>
                      )}
                      {cfg.qr1IconsImage && (
                        <div className="relative mt-2 h-6 w-full max-w-[150px]">
                          <Image
                            src={cfg.qr1IconsImage}
                            alt="UPI apps accepted"
                            fill
                            sizes="150px"
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>)}
                  {/* QR 2 */}
                  {hasQr2 && (
                  <div className="flex flex-col items-center">
                    <p className="z-10 -mb-3.5 rounded-full bg-gradient-to-b from-[#a51f36] to-[#7c1226] px-4 py-1 font-display text-sm font-semibold text-ivory shadow">
                      {cfg.qr2Label}
                    </p>
                    <div className="flex w-full flex-1 flex-col items-center justify-start overflow-hidden rounded-xl border border-gold/50 bg-white/70 px-3 pb-4 pt-6 text-center">
                      <div className="aspect-square w-full max-w-[230px]">
                        {cfg.qr2Image ? (
                          <Image
                            src={cfg.qr2Image}
                            alt={`${cfg.qr2Label} QR code`}
                            width={460}
                            height={460}
                            className="h-full w-full rounded-lg object-contain"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-lg bg-maroon/5 px-3 text-center font-display text-sm font-semibold text-maroon">
                            Pay via UPI app — tap the UPI ID below
                          </div>
                        )}
                      </div>
                      {cfg.qr2UpiId && (
                      <a
                        href={`upi://pay?pa=${encodeURIComponent(cfg.qr2UpiId)}&pn=${encodeURIComponent((window as any).__easyWedding.config.partner1+" & "+(window as any).__easyWedding.config.partner2)}&cu=INR`}
                        className="mt-3 flex min-h-[32px] items-center justify-center break-all px-1 font-display text-xs font-semibold text-bark underline decoration-gold/60 underline-offset-2 hover:text-maroon"
                        title="Tap to pay via UPI app"
                      >
                        {cfg.qr2UpiId} ↗
                      </a>
                      )}
                      {cfg.qr2IconsImage && (
                        <div className="relative mt-2 h-6 w-full max-w-[150px]">
                          <Image
                            src={cfg.qr2IconsImage}
                            alt="UPI apps accepted"
                            fill
                            sizes="150px"
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>)}
                </div>

                {/* bottom strip */}
                <div className="mt-4 rounded-2xl border border-[#e8b4b4]/60 bg-[#fdeeee] px-4 py-4 text-center">
                  <p className="font-display text-base font-bold text-maroon sm:text-lg">
                    {cfg.bottomLine1}
                  </p>
                  <p className="mt-2 text-[13px] font-medium text-bark">
                    <span className="text-[#c0392b]" aria-hidden>❤ </span>
                    {cfg.bottomLine2}
                    <span className="text-[#c0392b]" aria-hidden> ❤</span>
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
