import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, GraduationCap, Users, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const AUDIENCES = [
  { role: "SCHOOL", t: "Établissement", d: "Recrutez des enseignants et développez votre établissement.", icon: Building2 },
  { role: "EDUCATOR", t: "Éducateur", d: "Trouvez des opportunités et développez votre activité.", icon: GraduationCap },
  { role: "PARENT", t: "Parent", d: "Trouvez une école ou un éducateur pour votre enfant.", icon: Users },
  { role: "ADULT_LEARNER", t: "Apprenant", d: "Trouvez une école, une formation ou un éducateur pour vous.", icon: BookOpen },
];

export default function AudienceSection() {
  const navigate = useNavigate();
  return (
    <section data-testid="audience-section" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <span className="text-label-base font-semibold uppercase tracking-widest text-askool-blue">Votre profil</span>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-askool-ink sm:text-4xl">ASKOOL s'adapte à votre besoin</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a) => (
            <div key={a.role} data-testid={`audience-${a.role}`}
              className="flex flex-col rounded-2xl border border-askool-border bg-askool-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-askool-blue hover:bg-white hover:shadow-card">
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-askool-bluelight text-askool-blue"><a.icon size={22} /></span>
              <h3 className="font-display text-base font-semibold uppercase tracking-wide text-askool-ink">{a.t}</h3>
              <p className="mt-2 flex-1 text-sm text-askool-text">{a.d}</p>
              <Button data-testid={`audience-start-${a.role}`} variant="outline" onClick={() => navigate(`/inscription?role=${a.role}`)}
                className="mt-5 rounded-xl border-askool-blue text-askool-blue hover:bg-askool-bluelight">
                Commencer <ArrowRight size={15} />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
