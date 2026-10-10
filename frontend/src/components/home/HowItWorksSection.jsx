import React from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Search, MessagesSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/home/Reveal";

const STEPS = [
  { n: "01", t: "Créez votre profil", d: "Présentez votre établissement, vos compétences ou vos besoins.", icon: UserPlus, tone: "bg-askool-bluelight text-askool-blue" },
  { n: "02", t: "Recherchez ou publiez", d: "Trouvez un profil, une école, une formation ou une opportunité.", icon: Search, tone: "bg-askool-greenlight text-askool-green" },
  { n: "03", t: "Échangez et avancez", d: "Contactez la personne et construisez votre projet.", icon: MessagesSquare, tone: "bg-askool-orangelight text-askool-orangehover" },
];

export default function HowItWorksSection() {
  const navigate = useNavigate();
  return (
    <section id="comment-ca-marche" data-testid="how-section" className="scroll-mt-24 bg-askool-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Parcours" title="Comment ça marche ?"
          subtitle="Trois étapes simples, les mêmes pour les écoles, les éducateurs, les parents et les apprenants." />
        <div className="relative">
          {/* connector line */}
          <span aria-hidden className="absolute left-0 right-0 top-[76px] hidden h-px bg-gradient-to-r from-transparent via-askool-bluepale to-transparent lg:block" />
          <div className="grid gap-6 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div data-testid={`how-step-${s.n}`} className="relative flex h-full flex-col items-center rounded-3xl border border-askool-border bg-white px-7 pb-8 pt-10 text-center shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover">
                  <span className={`absolute -top-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-askool-border bg-white font-display text-base font-bold text-askool-blue shadow-card`}>{s.n}</span>
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${s.tone}`}><s.icon size={24} /></span>
                  <h3 className="mt-5 font-display text-base font-semibold text-askool-ink">{s.t}</h3>
                  <p className="mt-2 text-sm text-askool-text">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={0.2} className="mt-10 text-center">
          <Button data-testid="how-section-more" variant="outline" onClick={() => navigate("/comment-ca-marche")}
            className="rounded-xl border-askool-blue text-askool-blue hover:bg-askool-bluelight">
            Voir le détail par profil <ArrowRight size={15} />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
