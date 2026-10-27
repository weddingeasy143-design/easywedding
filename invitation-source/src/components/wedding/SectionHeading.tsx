// src/components/wedding/SectionHeading.tsx
// Royal section heading: script title + serif subtitle + gold flourish divider.
import Reveal from "./Reveal";
import { GoldFlourishDivider } from "./Ornaments";

export default function SectionHeading({
  script,
  subtitle,
  align = "center",
}: {
  script: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const alignCls = align === "center" ? "text-center" : "text-left";
  return (
    <Reveal className={`${alignCls} mb-8 sm:mb-10`}>
      <h2 className="font-script text-5xl sm:text-6xl lg:text-7xl text-maroon leading-tight">
        {script}
      </h2>
      {subtitle && (
        <p className="mt-2 font-display italic text-lg sm:text-xl lg:text-2xl text-bark-soft">
          {subtitle}
        </p>
      )}
      <GoldFlourishDivider
        className={`mt-4 ${align === "center" ? "mx-auto" : ""}`}
      />
    </Reveal>
  );
}
