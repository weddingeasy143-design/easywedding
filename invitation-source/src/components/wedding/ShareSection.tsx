// src/components/wedding/ShareSection.tsx
// "Share the Joy" — WhatsApp share, native share, copy link, auto QR.
// Design matches the reference: script title, pill buttons, QR in ornate
// golden frame, couple illustration in a golden arch. Fully admin-editable
// (message, link, texts) via /admin/settings → Share section.
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { COUPLE, ORDERED_COUPLE, WEDDING_DATE_LABEL } from "@/content/wedding";
import { DEFAULT_SHARE, type ShareConfig } from "@/server/wedding/site-config";
import { CheckIcon, CopyIcon, ShareIcon, WhatsAppIcon, ChevronRightIcon } from "./icons";
import Reveal from "./Reveal";
import FloralCorners from "./decor/FloralCorners";

function readShare(): ShareConfig {
  const fallback = { ...DEFAULT_SHARE };
  if (typeof document === "undefined") return fallback;
  try {
    const el = document.getElementById("__SITE_CONFIG__");
    const parsed = el?.textContent ? JSON.parse(el.textContent) : null;
    const s = parsed?.share;
    if (s && typeof s === "object") return { ...fallback, ...s };
  } catch {
    /* use defaults */
  }
  return fallback;
}

function fillTemplate(tpl: string, link: string): string {
  return tpl
    .replaceAll("{groom}", COUPLE.groom)
    .replaceAll("{bride}", COUPLE.bride)
    .replaceAll("{date}", WEDDING_DATE_LABEL)
    .replaceAll("{link}", link);
}

/** Small vertical golden flourish seen on the left inside each button. */
function ButtonFlourish() {
  return (
    <svg viewBox="0 0 12 44" className="h-9 w-3 shrink-0 text-[#b98a2f]" aria-hidden>
      <path
        d="M6 2c-2 4-2 8 0 12-2 4-2 8 0 12-2 4-2 8 0 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="6" cy="22" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 8l1.6 2-1.6 2-1.6-2zM6 32l1.6 2-1.6 2-1.6-2z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

function ShareButton({
  onClick,
  icon,
  iconBg,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-full border-2 border-[#c9a24b] bg-[#fffdf6] p-[3px] text-left shadow-[0_8px_20px_-10px_rgba(146,104,44,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(146,104,44,0.6)]"
    >
      <span className="flex items-center gap-3 rounded-full border border-[#c9a24b]/70 px-3 py-2">
        <ButtonFlourish />
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow ${iconBg}`}
        >
          {icon}
        </span>
        <span className="flex-1 font-display text-[22px] text-[#5a2e22]">{label}</span>
        <span className="pr-2 text-[#a67c2e] transition group-hover:translate-x-0.5">
          <ChevronRightIcon size={20} />
        </span>
      </span>
    </button>
  );
}

export default function ShareSection() {
  const [cfg, setCfg] = useState<ShareConfig>({ ...DEFAULT_SHARE });
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [qrUnavailable, setQrUnavailable] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const c = readShare();
    setCfg(c);
    // Admin link wins; otherwise the current page URL. QR auto-generates.
    const link = c.shareUrl.trim() || window.location.href.split("#")[0]!;
    setUrl(link);
    QRCode.toDataURL(link, {
      width: 260,
      margin: 2,
      color: { dark: "#4a241c", light: "#fffdf7" },
    })
      .then((v) => {
        // Preview links carry the whole invitation config in the URL —
        // far more than any QR code can hold — so generation returns "".
        // In that case the QR frame must disappear, not sit blank forever.
        if (v) setQr(v);
        else setQrUnavailable(true);
      })
      .catch(() => setQrUnavailable(true));
  }, []);

  const message = fillTemplate(cfg.whatsappMessage, url);

  const whatsappShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ORDERED_COUPLE[0].name} weds ${ORDERED_COUPLE[1].name} — Wedding Invitation`,
          text: message,
          url,
        });
      } catch {
        /* user dismissed */
      }
    } else {
      copyLink();
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section id="share" className="relative scroll-mt-20 overflow-hidden py-16 sm:py-20">
      <FloralCorners variant="top" sizePct={24} opacity={0.95} />

      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 lg:max-w-6xl lg:px-12">
        {/* header — matches reference */}
        <div className="text-center">
          <h2 className="font-script text-6xl leading-tight text-[#9b1b32] sm:text-7xl">{cfg.title}</h2>
          <p className="mt-2 font-display text-xl italic text-[#6b4a3a] sm:text-2xl">{cfg.subtitle}</p>
          <div className="mt-4 flex items-center justify-center gap-3" aria-hidden>
            <span className="h-px w-20 bg-gold/70 sm:w-28" />
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#c0392b]">
              <path d="M12 21s-7.5-4.9-10-9.3C.4 8.6 2.4 5 5.7 5c2 0 3.4 1.1 4.3 2.6h4c.9-1.5 2.3-2.6 4.3-2.6 3.3 0 5.3 3.6 3.7 6.7C19.5 16.1 12 21 12 21z" />
            </svg>
            <span className="h-px w-20 bg-gold/70 sm:w-28" />
          </div>
          <div className="relative mx-auto mt-3 h-8 w-72 sm:w-96" aria-hidden>
            <Image
              src="/ornaments/gold-divider-flourish.webp"
              alt=""
              fill
              sizes="384px"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>

        <Reveal>
          {/* main card */}
          <div className="relative mt-8 rounded-2xl border-2 border-gold/70 bg-[#fffdf6]/95 p-5 shadow-[0_24px_60px_-28px_rgba(109,16,37,0.35)] sm:p-8">
            {/* inner hairline */}
            <div className="pointer-events-none absolute inset-2 rounded-xl border border-gold/40" aria-hidden />

            <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
              {/* left: buttons + QR */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-sm space-y-3">
                  <ShareButton
                    onClick={whatsappShare}
                    icon={<WhatsAppIcon size={22} />}
                    iconBg="bg-[#25d366]"
                    label="WhatsApp"
                  />
                  <ShareButton
                    onClick={nativeShare}
                    icon={<ShareIcon size={22} />}
                    iconBg="bg-[#8e1f36]"
                    label="Share"
                  />
                  <ShareButton
                    onClick={copyLink}
                    icon={copied ? <CheckIcon size={22} /> : <CopyIcon size={22} />}
                    iconBg="bg-[#a67c2e]"
                    label={copied ? "Copied!" : "Copy Link"}
                  />
                </div>

                {/* QR in ornate golden frame — hidden entirely when no QR
                    can be generated (e.g. preview links too long to encode) */}
                {!qrUnavailable && (<>
                <div className="relative mt-7">
                  <div className="rounded-xl border-2 border-gold/80 bg-white p-2.5 shadow-[0_12px_30px_-12px_rgba(146,104,44,0.55)]">
                    <div className="rounded-lg border border-gold/40 p-1.5">
                      {qr ? (
                        <Image
                          src={qr}
                          alt="QR code linking to this invitation"
                          width={200}
                          height={200}
                          className="h-44 w-44 sm:h-48 sm:w-48"
                          unoptimized
                        />
                      ) : (
                        <div className="h-44 w-44 animate-pulse bg-gold/20 sm:h-48 sm:w-48" aria-hidden />
                      )}
                    </div>
                  </div>
                  {/* tiny florals flanking the QR */}
                  <div className="pointer-events-none absolute -left-9 top-1/2 hidden h-24 w-8 -translate-y-1/2 sm:block" aria-hidden>
                    <Image src="/ornaments/floral-corner.webp" alt="" fill sizes="32px" className="object-contain" unoptimized />
                  </div>
                  <div className="pointer-events-none absolute -right-9 top-1/2 hidden h-24 w-8 -translate-y-1/2 -scale-x-100 sm:block" aria-hidden>
                    <Image src="/ornaments/floral-corner.webp" alt="" fill sizes="32px" className="object-contain" unoptimized />
                  </div>
                </div>
                <p className="mt-4 rounded-full bg-[#f7dee3] px-6 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#8e1f36]">
                  {cfg.scanLabel}
                </p>
                </>)}
              </div>

              {/* right: couple in golden arch */}
              <div className="relative mx-auto w-full max-w-sm">
                <div
                  className="relative overflow-hidden border-2 border-gold/70 bg-[#fff9ef] shadow-[0_18px_44px_-20px_rgba(146,104,44,0.6)]"
                  style={{ borderRadius: "999px 999px 18px 18px" }}
                >
                  <div className="relative aspect-[4/5] w-full">
                    <Image
                      src="/share/couple-back.webp"
                      alt="Illustration of the wedding couple"
                      fill
                      sizes="(max-width: 1024px) 90vw, 420px"
                      className="object-cover object-top"
                      unoptimized
                    />
                  </div>
                </div>
                {/* hanging charm at arch apex */}
                <div className="absolute -top-1 left-1/2 h-10 w-10 -translate-x-1/2" aria-hidden>
                  <Image src="/ornaments/hanging-bells.webp" alt="" fill sizes="40px" className="object-contain" unoptimized />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
