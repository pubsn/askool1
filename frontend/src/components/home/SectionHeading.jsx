import React from "react";
import Reveal from "@/components/home/Reveal";

/** Centred section heading used across the public pages. */
export default function SectionHeading({ eyebrow, title, subtitle, tone = "dark" }) {
  const isLight = tone === "light";
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      {eyebrow && (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${isLight ? "bg-white/10 text-white/80" : "bg-askool-bluelight text-askool-blue"}`}>
          {eyebrow}
        </span>
      )}
      <h2 className={`mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl ${isLight ? "text-white" : "text-askool-ink"}`}>{title}</h2>
      {subtitle && <p className={`mx-auto mt-3 max-w-xl text-body-base ${isLight ? "text-white/70" : "text-askool-text"}`}>{subtitle}</p>}
      <span aria-hidden className={`mx-auto mt-6 block h-0.5 w-16 rounded-full ${isLight ? "bg-white/30" : "bg-askool-orange"}`} />
    </Reveal>
  );
}
