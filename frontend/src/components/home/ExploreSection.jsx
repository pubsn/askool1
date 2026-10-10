import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, GraduationCap, Briefcase, BookOpen, Award, ArrowRight } from "lucide-react";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/home/Reveal";
import { IMG } from "@/lib/images";

export const CATEGORIES = [
  { t: "Écoles", d: "Trouvez et comparez les établissements.", icon: Building2, to: "/ecoles", img: IMG.classroom },
  { t: "Éducateurs", d: "Consultez des profils et trouvez les compétences adaptées.", icon: GraduationCap, to: "/educateurs", img: IMG.teacher },
  { t: "Opportunités", d: "Découvrez les offres publiées par les établissements.", icon: Briefcase, to: "/emplois", img: IMG.students },
  { t: "Cours particuliers", d: "Trouvez un éducateur selon vos besoins.", icon: BookOpen, to: "/educateurs?service_type=Cours+particuliers", img: IMG.writing },
  { t: "Formations", d: "Explorez les formations disponibles.", icon: Award, to: "/ecoles?type=formation", img: IMG.hero },
];

export default function ExploreSection() {
  const navigate = useNavigate();
  return (
    <section id="explorer" data-testid="explore-section" className="scroll-mt-24 bg-askool-cream py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Catégories" title="Explorez ASKOOL"
          subtitle="Cinq espaces pour couvrir tous vos besoins éducatifs, de la recherche d'école au recrutement." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.t} delay={i * 0.06} className={i === 0 ? "lg:col-span-2" : ""}>
              <button data-testid={`explore-${c.t}`} onClick={() => navigate(c.to)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-askool-sand bg-white text-left shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover">
                <span className="relative block h-40 w-full overflow-hidden">
                  <img src={c.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(22,41,94,0.60) 0%, rgba(22,41,94,0.05) 70%, transparent 100%)" }} />
                  <span className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-askool-blue shadow-sm"><c.icon size={19} /></span>
                </span>
                <span className="flex flex-1 flex-col p-6">
                  <span className="font-display text-base font-semibold text-askool-ink">{c.t}</span>
                  <span className="mt-2 flex-1 text-sm text-askool-text">{c.d}</span>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-askool-blue">
                    Découvrir <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
