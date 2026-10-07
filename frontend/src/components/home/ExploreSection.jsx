import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, GraduationCap, Briefcase, BookOpen, Award, ArrowRight } from "lucide-react";

const CATEGORIES = [
  { t: "Écoles", d: "Trouvez et comparez les établissements.", icon: Building2, to: "/ecoles" },
  { t: "Éducateurs", d: "Consultez des profils et trouvez les compétences adaptées.", icon: GraduationCap, to: "/educateurs" },
  { t: "Opportunités", d: "Découvrez les offres publiées par les établissements.", icon: Briefcase, to: "/emplois" },
  { t: "Cours particuliers", d: "Trouvez un éducateur selon vos besoins.", icon: BookOpen, to: "/educateurs?service_type=Cours+particuliers" },
  { t: "Formations", d: "Explorez les formations disponibles.", icon: Award, to: "/ecoles?type=formation" },
];

export default function ExploreSection() {
  const navigate = useNavigate();
  return (
    <section id="explorer" data-testid="explore-section" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <span className="text-label-base font-semibold uppercase tracking-widest text-askool-blue">Catégories</span>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-askool-ink sm:text-4xl">Explorez ASKOOL</h2>
        <p className="mt-3 text-askool-text">Cinq espaces pour couvrir tous vos besoins éducatifs, de la recherche d'école au recrutement.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {CATEGORIES.map((c) => (
          <button key={c.t} data-testid={`explore-${c.t}`} onClick={() => navigate(c.to)}
            className="group flex h-full flex-col items-start rounded-2xl border border-askool-border bg-white p-6 text-left shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-askool-blue hover:shadow-card-hover">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-askool-bluelight text-askool-blue transition-colors group-hover:bg-askool-blue group-hover:text-white"><c.icon size={22} /></span>
            <h3 className="font-display text-base font-semibold text-askool-ink">{c.t}</h3>
            <p className="mt-2 flex-1 text-sm text-askool-text">{c.d}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-askool-blue">Découvrir <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
          </button>
        ))}
      </div>
    </section>
  );
}
