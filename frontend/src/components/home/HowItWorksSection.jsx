import React from "react";
import { UserPlus, Search, MessagesSquare } from "lucide-react";

const STEPS = [
  { n: "01", t: "Créez votre profil", d: "Présentez votre établissement, vos compétences ou vos besoins.", icon: UserPlus },
  { n: "02", t: "Recherchez ou publiez", d: "Trouvez un profil, une école, une formation ou une opportunité.", icon: Search },
  { n: "03", t: "Échangez et avancez", d: "Contactez la personne et construisez votre projet.", icon: MessagesSquare },
];

export default function HowItWorksSection() {
  return (
    <section id="comment-ca-marche" data-testid="how-section" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <span className="text-label-base font-semibold uppercase tracking-widest text-askool-blue">Parcours</span>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-askool-ink sm:text-4xl">Comment ça marche ?</h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} data-testid={`how-step-${s.n}`} className="relative overflow-hidden rounded-2xl border border-askool-border bg-white p-7 shadow-card">
            <span aria-hidden className="absolute right-5 top-3 font-display text-6xl font-bold text-askool-bluelight">{s.n}</span>
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-askool-bluelight text-askool-blue"><s.icon size={22} /></span>
            <h3 className="relative mt-5 font-display text-lg font-semibold text-askool-ink"><span className="text-askool-blue">{s.n}</span> — {s.t}</h3>
            <p className="relative mt-2 text-sm text-askool-text">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
