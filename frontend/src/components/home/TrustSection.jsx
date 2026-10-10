import React from "react";
import { ShieldCheck, BadgeCheck, MessageSquare, ListChecks } from "lucide-react";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/home/Reveal";
import { IMG } from "@/lib/images";

const GUARANTEES = [
  { t: "Profils vérifiés", d: "Les éducateurs peuvent faire vérifier leurs diplômes et documents.", icon: BadgeCheck },
  { t: "Établissements vérifiés", d: "Les fiches d'établissement passent par une validation ASKOOL.", icon: ShieldCheck },
  { t: "Messagerie intégrée", d: "Échangez sur la plateforme, sans partager vos coordonnées.", icon: MessageSquare },
  { t: "Informations structurées", d: "Matières, niveaux, localisation et contrats présentés de façon homogène.", icon: ListChecks },
];

export default function TrustSection({ counts = {} }) {
  const stats = [
    ["Éducateurs référencés", counts.educators],
    ["Établissements", counts.schools],
    ["Offres publiées", counts.jobs],
  ].filter(([, v]) => typeof v === "number");

  return (
    <section data-testid="trust-section" className="relative overflow-hidden bg-askool-bluedark py-20">
      <img src={IMG.writing} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.14 }} />
      <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(22,41,94,0.95) 0%, rgba(22,41,94,0.92) 50%, rgba(22,41,94,1) 100%)" }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading tone="light" eyebrow="Confiance" title="Une plateforme claire et vérifiée"
          subtitle="Les chiffres ci-dessous proviennent directement des profils publiés sur ASKOOL." />
        {stats.length > 0 && (
          <div className="mb-12 grid gap-5 sm:grid-cols-3">
            {stats.map(([label, value], i) => (
              <Reveal key={label} delay={i * 0.08}>
                <div data-testid={`trust-stat-${label}`} className="rounded-3xl border border-white/10 bg-white/[0.07] px-6 py-7 text-center backdrop-blur-sm">
                  <div className="font-display text-4xl font-bold text-white">{value}</div>
                  <div className="mt-1 text-sm text-white/70">{label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GUARANTEES.map((g, i) => (
            <Reveal key={g.t} delay={i * 0.06}>
              <div data-testid={`trust-${g.t}`} className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center transition-colors duration-300 hover:bg-white/[0.09]">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-askool-greenlight text-askool-greenhover"><g.icon size={19} /></span>
                <h3 className="mt-4 font-display text-base font-semibold text-white">{g.t}</h3>
                <p className="mt-1.5 text-sm text-white/70">{g.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
