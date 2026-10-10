import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, GraduationCap, Users, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/home/Reveal";

const AUDIENCES = [
  { role: "SCHOOL", t: "Établissement", d: "Recrutez des enseignants et développez votre établissement.", icon: Building2, tone: "blue" },
  { role: "EDUCATOR", t: "Éducateur", d: "Trouvez des opportunités et développez votre activité.", icon: GraduationCap, tone: "green" },
  { role: "PARENT", t: "Parent", d: "Trouvez une école ou un éducateur pour votre enfant.", icon: Users, tone: "orange" },
  { role: "ADULT_LEARNER", t: "Apprenant", d: "Trouvez une école, une formation ou un éducateur pour vous.", icon: BookOpen, tone: "blue" },
];

const TONES = {
  blue: "bg-askool-bluelight text-askool-blue",
  green: "bg-askool-greenlight text-askool-green",
  orange: "bg-askool-orangelight text-askool-orangehover",
};

export default function AudienceSection() {
  const navigate = useNavigate();
  return (
    <section data-testid="audience-section" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Vous êtes…" title="ASKOOL s'adapte à votre besoin"
          subtitle="Un espace dédié pour chaque profil, avec les bons outils dès l'inscription." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a, i) => (
            <Reveal key={a.role} delay={i * 0.06}>
              <div data-testid={`audience-${a.role}`}
                className="group flex h-full flex-col items-center rounded-3xl border border-askool-border bg-askool-surface p-7 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-askool-blue hover:bg-white hover:shadow-card-hover">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${TONES[a.tone]}`}><a.icon size={24} /></span>
                <h3 className="mt-5 font-display text-base font-semibold uppercase tracking-wide text-askool-ink">{a.t}</h3>
                <p className="mt-2 flex-1 text-sm text-askool-text">{a.d}</p>
                <Button data-testid={`audience-start-${a.role}`} variant="outline" onClick={() => navigate(`/inscription?role=${a.role}`)}
                  className="mt-6 w-full rounded-xl border-askool-blue text-askool-blue transition-colors hover:bg-askool-blue hover:text-white">
                  Commencer <ArrowRight size={15} />
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
