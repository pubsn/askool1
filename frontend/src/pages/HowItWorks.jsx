import React from "react";
import { useNavigate } from "react-router-dom";
import { School, Users, GraduationCap } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";

const J = [
  { title: "Pour les écoles", icon: School, cls: "bg-askool-bluelight text-askool-blue",
    steps: [["Créez votre compte", "Inscrivez votre établissement en quelques minutes."],
            ["Publiez votre offre", "Décrivez le poste, la matière et le niveau recherchés."],
            ["Trouvez les candidats", "Recevez des candidatures et consultez la CVthèque."],
            ["Recrutez", "Contactez, présélectionnez et recrutez le bon profil."]] },
  { title: "Pour les parents / apprenants", icon: Users, cls: "bg-askool-orangelight text-askool-orangehover",
    steps: [["Recherchez", "Filtrez par matière, niveau, localisation et budget."],
            ["Comparez", "Consultez les profils, avis et tarifs des tuteurs."],
            ["Contactez", "Échangez via la messagerie sécurisée."],
            ["Réservez", "Planifiez vos cours et laissez un avis après la séance."]] },
  { title: "Pour les éducateurs", icon: GraduationCap, cls: "bg-emerald-50 text-emerald-600",
    steps: [["Créez votre profil", "Un profil unique pour toutes vos activités."],
            ["Valorisez vos compétences", "Matières, niveaux, diplômes et expériences."],
            ["Postulez ou recevez des demandes", "Emplois en école ou cours particuliers."],
            ["Développez votre activité", "Avis, statistiques et visibilité Premium."]] },
];

export default function HowItWorks() {
  const navigate = useNavigate();
  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h1 className="font-display text-4xl font-bold text-gray-900 lg:text-5xl">Comment ça marche</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">ASKOOL simplifie la mise en relation entre écoles, éducateurs et apprenants.</p>
        </div>
        <div className="space-y-14">
          {J.map((j) => (
            <div key={j.title}>
              <div className="mb-6 flex items-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${j.cls}`}><j.icon size={24} /></span>
                <h2 className="font-display text-2xl font-semibold text-gray-900">{j.title}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {j.steps.map(([t, d], i) => (
                  <div key={t} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-askool-blue text-sm font-bold text-white">{i + 1}</span>
                    <h3 className="font-display font-semibold text-gray-900">{t}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Button data-testid="hiw-cta" onClick={() => navigate("/inscription")} className="rounded-xl bg-askool-orange px-8 py-6 text-base font-semibold text-black hover:bg-askool-orangehover">Commencer maintenant</Button>
        </div>
      </div>
    </PublicLayout>
  );
}
