import React from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Search, Users, ShieldCheck, Clock, BarChart3 } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Briefcase, t: "Publiez vos offres", d: "Créez et gérez vos offres d'emploi en quelques clics." },
  { icon: Search, t: "CVthèque qualifiée", d: "Recherchez des enseignants par matière, niveau et expérience." },
  { icon: Users, t: "Gérez les candidatures", d: "Suivez chaque candidature : Envoyée → Entretien → Acceptée." },
  { icon: ShieldCheck, t: "Profils vérifiés", d: "Recrutez en confiance grâce aux profils validés." },
  { icon: Clock, t: "Gagnez du temps", d: "Réduisez vos délais de recrutement drastiquement." },
  { icon: BarChart3, t: "Statistiques", d: "Suivez les vues et performances de vos offres." },
];

export default function ForSchools() {
  const navigate = useNavigate();
  return (
    <PublicLayout>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="flex flex-col justify-center">
          <span className="mb-4 w-fit rounded-full bg-askool-orangelight px-3 py-1 text-sm font-semibold text-askool-orangehover">Pour les établissements</span>
          <h1 className="font-display text-4xl font-bold leading-tight text-gray-900 lg:text-5xl">Recrutez les meilleurs talents éducatifs</h1>
          <p className="mt-4 text-lg text-muted-foreground">Fini le bouche-à-oreille. Publiez vos offres, accédez à une CVthèque qualifiée et recrutez rapidement des profils vérifiés.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button data-testid="schools-register" onClick={() => navigate("/inscription?role=SCHOOL")} className="rounded-xl bg-askool-blue px-6 py-6 text-base text-white hover:bg-askool-bluehover">Inscrire mon école</Button>
            <Button data-testid="schools-pricing" variant="outline" onClick={() => navigate("/tarifs")} className="rounded-xl border-2 border-askool-blue px-6 py-6 text-base text-askool-blue hover:bg-askool-bluelight">Voir les tarifs</Button>
          </div>
        </div>
        <img src="https://images.unsplash.com/photo-1744809482817-9a9d4fc280af?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" alt="Enseignant en classe" className="h-full max-h-[420px] w-full rounded-3xl object-cover shadow-xl" />
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-askool-bluelight text-askool-blue"><f.icon size={24} /></span>
              <h3 className="font-display text-lg font-semibold text-gray-900">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
