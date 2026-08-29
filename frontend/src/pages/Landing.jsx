import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Search, Briefcase, Users, GraduationCap, Star, ArrowRight, CheckCircle2, School, UserSearch } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import SearchBar from "@/components/SearchBar";
import EducatorCard from "@/components/EducatorCard";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const JOURNEYS = [
  { key: "schools", title: "Pour les écoles", icon: School, iconClass: "bg-askool-bluelight text-askool-blue",
    steps: ["Créez votre compte", "Publiez votre offre", "Trouvez les candidats", "Recrutez"] },
  { key: "parents", title: "Pour les parents / apprenants", icon: Users, iconClass: "bg-askool-orangelight text-askool-orangehover",
    steps: ["Recherchez", "Comparez", "Contactez", "Réservez"] },
  { key: "educators", title: "Pour les éducateurs", icon: GraduationCap, iconClass: "bg-emerald-50 text-emerald-600",
    steps: ["Créez votre profil", "Valorisez vos compétences", "Postulez ou recevez des demandes", "Développez votre activité"] },
];

export default function Landing() {
  const navigate = useNavigate();
  const [educators, setEducators] = useState([]);

  useEffect(() => {
    api.get("/educators?sort=relevance&page_size=3").then(({ data }) => setEducators(data.results)).catch(() => {});
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-askool-orange/10 blur-3xl" />
        <div className="absolute -left-32 top-40 h-96 w-96 rounded-full bg-askool-blue/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pt-20">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-askool-bluelight px-3 py-1 text-sm font-medium text-askool-blue">
              <ShieldCheck size={15} /> Talents éducatifs vérifiés · Sénégal
            </span>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="font-display text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Trouvez le bon éducateur. <span className="text-askool-blue">Trouvez la bonne opportunité.</span>
            </motion.h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              ASKOOL connecte les établissements, les enseignants, les tuteurs et les apprenants sur une seule plateforme.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button data-testid="hero-find-educator" onClick={() => navigate("/educateurs")}
                className="rounded-xl bg-askool-blue px-6 py-6 text-base text-white hover:bg-askool-bluehover">
                <UserSearch size={18} /> Trouver un éducateur
              </Button>
              <Button data-testid="hero-find-job" onClick={() => navigate("/emplois")}
                variant="outline" className="rounded-xl border-2 border-askool-blue px-6 py-6 text-base text-askool-blue hover:bg-askool-bluelight">
                <Briefcase size={18} /> Trouver un emploi
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Profils vérifiés</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Avis authentiques</span>
            </div>
          </div>
          <div className="relative flex items-center">
            <img src="https://images.unsplash.com/photo-1567057419565-4349c49d8a04?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
              alt="Élèves sénégalais souriants" className="h-full max-h-[440px] w-full rounded-3xl object-cover shadow-xl" />
          </div>
        </div>
        <div className="mx-auto -mt-6 max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <SearchBar />
        </div>
      </section>

      {/* Categories / value */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: School, t: "Établissements", d: "Publiez vos offres et recrutez des profils qualifiés rapidement.", to: "/pour-les-ecoles" },
            { icon: Users, t: "Parents & apprenants", d: "Trouvez le tuteur idéal par matière, niveau et localisation.", to: "/educateurs" },
            { icon: GraduationCap, t: "Éducateurs", d: "Un profil unique pour enseigner, tutorer et postuler.", to: "/inscription" },
          ].map((c) => (
            <button key={c.t} data-testid={`category-${c.t}`} onClick={() => navigate(c.to)}
              className="group flex flex-col items-start rounded-2xl border border-gray-100 bg-white p-7 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-askool-bluelight text-askool-blue"><c.icon size={24} /></span>
              <h3 className="font-display text-xl font-semibold text-gray-900">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-medium text-askool-blue">Découvrir <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-gray-900 lg:text-4xl">Comment ça marche</h2>
          <p className="mt-3 text-muted-foreground">Trois parcours simples, une seule plateforme.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {JOURNEYS.map((j) => (
            <div key={j.key} className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${j.iconClass}`}><j.icon size={22} /></span>
                <h3 className="font-display text-lg font-semibold text-gray-900">{j.title}</h3>
              </div>
              <ol className="space-y-3">
                {j.steps.map((s, i) => (
                  <li key={s} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-askool-blue text-xs font-bold text-white">{i + 1}</span>
                    <span className="text-sm text-gray-700">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Featured educators */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-gray-900">Éducateurs en vedette</h2>
            <p className="mt-2 text-muted-foreground">Des talents vérifiés, prêts à vous accompagner.</p>
          </div>
          <Button data-testid="see-all-educators" variant="ghost" onClick={() => navigate("/educateurs")} className="hidden text-askool-blue sm:flex">
            Tout voir <ArrowRight size={16} />
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {educators.map((e) => <EducatorCard key={e.user_id} edu={e} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-askool-blue px-8 py-14 text-center shadow-xl">
          <h2 className="font-display text-3xl font-bold text-white lg:text-4xl">Prêt à rejoindre ASKOOL ?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-blue-100">Créez votre compte gratuitement et commencez en quelques secondes.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button data-testid="cta-register" onClick={() => navigate("/inscription")}
              className="rounded-xl bg-askool-orange px-7 py-6 text-base font-semibold text-black hover:bg-askool-orangehover">Créer un compte</Button>
            <Button data-testid="cta-schools" onClick={() => navigate("/pour-les-ecoles")}
              variant="outline" className="rounded-xl border-2 border-white bg-transparent px-7 py-6 text-base text-white hover:bg-white/10">Je suis une école</Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
