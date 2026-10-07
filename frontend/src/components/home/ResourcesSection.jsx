import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Compass, Building2, Users, HelpCircle, Wallet } from "lucide-react";

// Editorial content available today = the platform's own guide pages (no blog API exists yet).
const RESOURCES = [
  { cat: "Orientation", t: "Comment ça marche", d: "Le parcours complet selon votre profil : école, éducateur, parent ou apprenant.", to: "/comment-ca-marche", icon: Compass },
  { cat: "Recrutement", t: "ASKOOL pour les établissements", d: "Publier une offre, consulter la CVthèque et recruter des profils vérifiés.", to: "/pour-les-ecoles", icon: Building2 },
  { cat: "Conseils aux éducateurs", t: "Valoriser son profil", d: "Compétences, diplômes et vérification : les bonnes pratiques pour être contacté.", to: "/inscription?role=EDUCATOR", icon: Users },
  { cat: "Formations", t: "Tarifs et abonnements", d: "Les formules disponibles pour les éducateurs et les établissements.", to: "/tarifs", icon: Wallet },
  { cat: "Conseils aux parents", t: "Questions fréquentes", d: "Sécurité, vérification des profils, réservations et paiements.", to: "/faq", icon: HelpCircle },
];

export default function ResourcesSection() {
  const navigate = useNavigate();
  return (
    <section id="actualites" data-testid="resources-section" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <span className="text-label-base font-semibold uppercase tracking-widest text-askool-blue">Actualités et conseils</span>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-askool-ink sm:text-4xl">Guides et ressources ASKOOL</h2>
        <p className="mt-3 text-askool-text">Les guides publiés sur la plateforme pour vous aider à avancer dans votre projet éducatif.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map((r) => (
          <button key={r.t} data-testid={`resource-${r.t}`} onClick={() => navigate(r.to)}
            className="group flex h-full flex-col rounded-2xl border border-askool-border bg-white p-6 text-left shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-askool-blue hover:shadow-card-hover">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-askool-bluelight text-askool-blue"><r.icon size={20} /></span>
            <span className="mt-5 w-fit rounded-full bg-askool-bluelight px-2.5 py-0.5 text-xs font-medium text-askool-blue">{r.cat}</span>
            <h3 className="mt-2 font-display text-base font-semibold text-askool-ink">{r.t}</h3>
            <p className="mt-2 flex-1 text-sm text-askool-text">{r.d}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-askool-blue">Lire le guide <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
          </button>
        ))}
      </div>
    </section>
  );
}
