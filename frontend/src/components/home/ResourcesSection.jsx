import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Compass, Building2, Users, HelpCircle, Wallet } from "lucide-react";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/home/Reveal";
import { IMG } from "@/lib/images";

// Editorial content available today = the platform's own guide pages (no blog API exists yet).
const RESOURCES = [
  { cat: "Orientation", t: "Comment ça marche", d: "Le parcours complet selon votre profil : école, éducateur, parent ou apprenant.", to: "/comment-ca-marche", icon: Compass, img: IMG.teacher },
  { cat: "Recrutement", t: "ASKOOL pour les établissements", d: "Publier une offre, consulter la CVthèque et recruter des profils vérifiés.", to: "/pour-les-ecoles", icon: Building2, img: IMG.classroom },
  { cat: "Conseils aux éducateurs", t: "Valoriser son profil", d: "Compétences, diplômes et vérification : les bonnes pratiques pour être contacté.", to: "/inscription?role=EDUCATOR", icon: Users, img: IMG.students },
  { cat: "Formations", t: "Tarifs et abonnements", d: "Les formules disponibles pour les éducateurs et les établissements.", to: "/tarifs", icon: Wallet, img: IMG.writing },
  { cat: "Conseils aux parents", t: "Questions fréquentes", d: "Sécurité, vérification des profils, réservations et paiements.", to: "/faq", icon: HelpCircle, img: IMG.hero },
];

export default function ResourcesSection() {
  const navigate = useNavigate();
  return (
    <section id="actualites" data-testid="resources-section" className="scroll-mt-24 bg-askool-cream py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Actualités et conseils" title="Guides et ressources ASKOOL"
          subtitle="Les guides publiés sur la plateforme pour vous aider à avancer dans votre projet éducatif." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCES.map((r, i) => (
            <Reveal key={r.t} delay={i * 0.06}>
              <button data-testid={`resource-${r.t}`} onClick={() => navigate(r.to)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-askool-sand bg-white text-left shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover">
                <span className="relative block h-36 overflow-hidden">
                  <img src={r.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-askool-blue shadow-sm">{r.cat}</span>
                </span>
                <span className="flex flex-1 flex-col p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-askool-bluelight text-askool-blue"><r.icon size={18} /></span>
                  <span className="mt-4 font-display text-base font-semibold text-askool-ink">{r.t}</span>
                  <span className="mt-2 flex-1 text-sm text-askool-text">{r.d}</span>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-askool-blue">
                    Lire le guide <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
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
