import React from "react";
import { ShieldCheck, BadgeCheck, MessageSquare, ListChecks } from "lucide-react";

const GUARANTEES = [
  { t: "Profils vérifiés", d: "Les éducateurs peuvent faire vérifier leurs diplômes et documents.", icon: BadgeCheck },
  { t: "Établissements vérifiés", d: "Les fiches d'établissement passent par une validation ASKOOL.", icon: ShieldCheck },
  { t: "Messagerie intégrée", d: "Échangez directement sur la plateforme, sans partager vos coordonnées.", icon: MessageSquare },
  { t: "Informations structurées", d: "Matières, niveaux, localisation et contrats présentés de façon homogène.", icon: ListChecks },
];

export default function TrustSection({ counts }) {
  const stats = [
    ["Éducateurs référencés", counts.educators],
    ["Établissements", counts.schools],
    ["Offres publiées", counts.jobs],
  ].filter(([, v]) => typeof v === "number");
  return (
    <section data-testid="trust-section" className="bg-askool-bluedark py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <span className="text-label-base font-semibold uppercase tracking-widest text-white/60">Confiance</span>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Une plateforme claire et vérifiée</h2>
          <p className="mt-3 text-white/70">Les chiffres ci-dessous proviennent directement des profils publiés sur ASKOOL.</p>
        </div>
        {stats.length > 0 && (
          <div className="mb-10 grid gap-5 sm:grid-cols-3">
            {stats.map(([label, value]) => (
              <div key={label} data-testid={`trust-stat-${label}`} className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5">
                <div className="font-display text-4xl font-bold text-white">{value}</div>
                <div className="mt-1 text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GUARANTEES.map((g) => (
            <div key={g.t} data-testid={`trust-${g.t}`} className="rounded-2xl border border-white/10 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"><g.icon size={18} /></span>
              <h3 className="mt-4 font-display text-base font-semibold text-white">{g.t}</h3>
              <p className="mt-1 text-sm text-white/70">{g.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
