import React from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Target, Heart, Users } from "lucide-react";

export default function About() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold text-gray-900 lg:text-5xl">À propos d'ASKOOL</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          ASKOOL est née d'un constat simple : au Sénégal, écoles, enseignants et familles peinent à se trouver.
          Notre mission est de connecter les talents éducatifs aux écoles et aux apprenants, en toute confiance.
        </p>
        <img src="https://images.unsplash.com/photo-1548102245-c79dbcfa9f92?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000"
          alt="Apprenants sénégalais" className="my-10 h-72 w-full rounded-3xl object-cover shadow-lg" />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, t: "Notre mission", d: "Faciliter l'accès à un enseignement de qualité pour tous." },
            { icon: Heart, t: "Nos valeurs", d: "Confiance, proximité, accessibilité et professionnalisme." },
            { icon: Users, t: "Notre communauté", d: "Des milliers d'éducateurs, d'écoles et de familles connectés." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-askool-bluelight text-askool-blue"><c.icon size={22} /></span>
              <h3 className="font-display text-lg font-semibold text-gray-900">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
