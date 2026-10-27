import Ganesh from "../../../adapters/Ganesh";
import {copyText} from "../../../adapters/copy";
// src/components/wedding/FamilyIntro.tsx
// Home page's FIRST section — both families' introduction, like a
// traditional wedding card: groom's photo + parents, "weds" medallion,
// bride's photo + parents. All content editable at /admin/couple.
import { SITE_TEXTS } from "@/content/wedding";
import Image from "next/image";
import { COUPLE, FAMILY } from "@/content/wedding";
import Reveal from "./Reveal";
import { FloralCorners } from "./Ornaments";

/** "x,y" (percentages) → CSS object-position so any photo auto-frames. */
function focusStyle(focus: string): React.CSSProperties {
  const [x, y] = focus.split(",").map((n) => {
    const v = parseFloat(n);
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 50;
  });
  return { objectPosition: `${x}% ${y}%` };
}

/** Parents' names in traditional Indian wedding-card style:
    each parent on its own line in elegant maroon serif, joined by a
    golden "&". Falls back to plain rendering when there is no "&". */
function ParentsNames({ names }: { names: string }) {
  const parts = names
    .split("&")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) {
    return (
      <p className="mt-3 font-display text-xl font-semibold leading-snug text-maroon lg:text-2xl">
        {names}
      </p>
    );
  }
  return (
    <div className="mt-3">
      {parts.map((part, i) => (
        <span key={i}>
          <p className="font-display text-xl font-semibold leading-snug tracking-wide text-maroon lg:text-2xl">
            {part}
          </p>
          {i < parts.length - 1 && (
            <p className="my-0.5 font-script text-2xl leading-none text-gold-deep lg:text-3xl">
              &
            </p>
          )}
        </span>
      ))}
    </div>
  );
}

function FamilyCard({
  photo,
  focus,
  fit,
  name,
  relationLabel,
  parents,
  address,
  delay,
}: {
  photo: string;
  focus: string;
  fit: "cover" | "contain";
  name: string;
  relationLabel: string;
  parents: string;
  address: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="w-full">
      <div className="mx-auto max-w-xs text-center lg:max-w-sm">
        {/* arch-framed portrait */}
        <div className="relative mx-auto w-52 sm:w-60 lg:w-64">
          <div className="overflow-hidden rounded-t-[999px] rounded-b-3xl border-[3px] border-gold/70 shadow-[0_24px_60px_-24px_rgba(109,16,37,0.45)]">
            <div className="relative aspect-[3/4] w-full bg-cream">
              {photo ? (
                <Image
                  src={photo}
                  alt={name}
                  fill
                  sizes="(max-width: 1024px) 240px, 300px"
                  className={fit === "contain" ? "object-contain" : "object-cover"}
                  style={focusStyle(focus)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-cream text-6xl">
                  🙏
                </div>
              )}
            </div>
          </div>
          {/* small floral badge on the arch */}
          <div className="absolute -bottom-4 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-gold/70 bg-ivory text-lg shadow-md">
            🌸
          </div>
        </div>

        <p className="mt-7 font-script text-5xl leading-tight text-maroon lg:text-6xl">
          {name}
        </p>
        <p className="mt-2 font-display text-sm italic tracking-wide text-bark/70">
          {relationLabel}
        </p>
        <div className="mx-auto mt-1 flex w-24 items-center gap-2">
          <span className="h-px flex-1 bg-gold/60" />
          <span className="text-xs text-gold">✦</span>
          <span className="h-px flex-1 bg-gold/60" />
        </div>
        <ParentsNames names={parents} />
        <p className="mt-2 whitespace-pre-line font-display text-sm leading-relaxed text-bark/80 lg:text-base">
          {address}
        </p>
      </div>
    </Reveal>
  );
}

export default function FamilyIntro() {
  return (
    <section id="family" className="relative scroll-mt-20 overflow-hidden bg-ivory py-14 sm:py-16 lg:py-20">
      <FloralCorners />
      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 lg:max-w-6xl lg:px-12">
        {/* traditional header */}
        <Reveal>
          <Ganesh className="theme-ganesh-family" />
          <p className="text-center font-display text-base tracking-[0.2em] text-maroon/80 lg:text-lg">
            {copyText(21,"Shree Ganeshaya Namah")}
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-3 text-center font-script text-5xl leading-tight text-maroon sm:text-6xl lg:text-7xl">
            {SITE_TEXTS.youreInvited}
          </h2>
          <p className="mt-2 text-center font-display text-xs font-semibold uppercase tracking-[0.35em] text-bark/70 lg:text-sm">
            {copyText(4,"To our wedding celebration")}
          </p>
        </Reveal>

        {/* families */}
        <div className="mt-10 lg:mt-14 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-8">
          <FamilyCard
            photo={FAMILY.groomPhoto}
            focus={FAMILY.groomPhotoFocus}
            fit={FAMILY.groomPhotoFit}
            name={COUPLE.groom}
            relationLabel={FAMILY.groomRelationLabel}
            parents={FAMILY.groomParents}
            address={FAMILY.groomAddress}
            delay={0.15}
          />

          {/* weds medallion */}
          <Reveal delay={0.25} className="my-10 lg:my-0 lg:pt-24">
            <div className="relative mx-auto flex h-32 w-32 items-center justify-center lg:h-48 lg:w-48">
              <div
                className="absolute inset-0 rounded-full border-2 border-gold/80 bg-cream shadow-[0_16px_40px_-16px_rgba(109,16,37,0.5)]"
                style={{
                  background:
                    "radial-gradient(circle at 38% 32%, #fffdf6 0%, #f7ecd4 60%, #eed9ac 100%)",
                }}
              />
              <div className="absolute inset-2 rounded-full border border-gold/50" />
              <div className="relative text-center">
                <p className="font-script text-5xl leading-none text-maroon lg:text-6xl">
                  weds
                </p>
                <p className="mt-1.5 text-lg leading-none lg:text-xl">
                  <span className="text-gold">💛</span>
                  <span className="text-maroon">❤️</span>
                </p>
              </div>
            </div>
          </Reveal>

          <FamilyCard
            photo={FAMILY.bridePhoto}
            focus={FAMILY.bridePhotoFocus}
            fit={FAMILY.bridePhotoFit}
            name={COUPLE.bride}
            relationLabel={FAMILY.brideRelationLabel}
            parents={FAMILY.brideParents}
            address={FAMILY.brideAddress}
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
}
