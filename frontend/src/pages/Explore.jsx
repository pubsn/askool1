import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import HomeSearch from "@/components/home/HomeSearch";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/home/Reveal";
import { CATEGORIES } from "@/components/home/ExploreSection";
import EducatorCard from "@/components/EducatorCard";
import JobCard from "@/components/JobCard";
import SchoolCard from "@/components/SchoolCard";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { IMG } from "@/lib/images";

export default function Explore() {
  const navigate = useNavigate();
  const [educators, setEducators] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [schools, setSchools] = useState([]);
  const [formations, setFormations] = useState([]);

  useEffect(() => {
    api.get("/educators?page_size=3").then(({ data }) => setEducators(data.results)).catch(() => {});
    api.get("/jobs?page_size=3").then(({ data }) => setJobs(data.results)).catch(() => {});
    api.get("/schools?page_size=3").then(({ data }) => setSchools(data.results)).catch(() => {});
    api.get("/schools?type=formation&page_size=3").then(({ data }) => setFormations(data.results)).catch(() => {});
  }, []);

  const Block = ({ id, eyebrow, title, subtitle, items, render, to, cta, bg }) => (
    items.length > 0 ? (
      <section id={id} data-testid={`explore-block-${id}`} className={`scroll-mt-24 py-20 ${bg}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((it, i) => <Reveal key={i} delay={i * 0.06}>{render(it)}</Reveal>)}
          </div>
          <Reveal className="mt-10 text-center">
            <Button data-testid={`explore-cta-${id}`} variant="outline" onClick={() => navigate(to)}
              className="rounded-xl border-askool-blue text-askool-blue transition-colors hover:bg-askool-blue hover:text-white">
              {cta} <ArrowRight size={15} />
            </Button>
          </Reveal>
        </div>
      </section>
    ) : null
  );

  return (
    <PublicLayout>
      <section data-testid="explore-hero" className="relative isolate overflow-hidden">
        <img src={IMG.classroom} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(22,41,94,0.92) 0%, rgba(22,41,94,0.96) 100%)" }} />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur-md">
            <Compass size={15} /> Explorer ASKOOL
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Tout ce que vous pouvez trouver sur ASKOOL
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-base text-white/80">
            Écoles, éducateurs, offres d'emploi, cours particuliers et formations : lancez votre recherche ou parcourez les catégories.
          </p>
          <div className="mt-10"><HomeSearch variant="hero" /></div>
        </div>
      </section>

      <section data-testid="explore-categories" className="bg-askool-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Catégories" title="Par où souhaitez-vous commencer ?"
            subtitle="Chaque catégorie mène à une recherche complète, avec filtres par matière, niveau et localisation." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.t} delay={i * 0.06} className={i === 0 ? "lg:col-span-2" : ""}>
                <button data-testid={`explore-page-cat-${c.t}`} onClick={() => navigate(c.to)}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-askool-sand bg-white text-left shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover">
                  <span className="relative block h-40 overflow-hidden">
                    <img src={c.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(22,41,94,0.60) 0%, rgba(22,41,94,0.05) 70%, transparent 100%)" }} />
                    <span className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-askool-blue shadow-sm"><c.icon size={19} /></span>
                  </span>
                  <span className="flex flex-1 flex-col p-6">
                    <span className="font-display text-base font-semibold text-askool-ink">{c.t}</span>
                    <span className="mt-2 flex-1 text-sm text-askool-text">{c.d}</span>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-askool-blue">
                      Ouvrir la recherche <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Block id="ecoles" eyebrow="Établissements" title="Établissements référencés"
        subtitle="Consultez leur fiche complète : niveaux, langues, infos pratiques et actualités."
        items={schools} render={(s) => <SchoolCard school={s} />} to="/ecoles" cta="Voir toutes les écoles" bg="bg-white" />

      <Block id="educateurs" eyebrow="Éducateurs" title="Éducateurs disponibles"
        subtitle="Enseignants, tuteurs et formateurs, avec matières, niveaux et localisation."
        items={educators} render={(e) => <EducatorCard edu={e} />} to="/educateurs" cta="Voir tous les éducateurs" bg="bg-askool-surface" />

      <Block id="emplois" eyebrow="Opportunités" title="Offres d'emploi en cours"
        subtitle="Les postes publiés par les établissements sur la plateforme."
        items={jobs} render={(j) => <JobCard job={j} />} to="/emplois" cta="Voir toutes les offres" bg="bg-white" />

      <Block id="formations" eyebrow="Formations" title="Centres et formations"
        subtitle="Les organismes de formation professionnelle référencés sur ASKOOL."
        items={formations} render={(s) => <SchoolCard school={s} />} to="/ecoles?type=formation" cta="Voir toutes les formations" bg="bg-askool-cream" />

      <section data-testid="explore-final" className="bg-white px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-askool-border bg-askool-bluedark px-6 py-14 text-center sm:px-12">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Vous ne trouvez pas ce que vous cherchez ?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-body-base text-white/80">
              Créez votre compte pour publier un besoin, être contacté par des éducateurs et suivre vos écoles favorites.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button data-testid="explore-register" onClick={() => navigate("/inscription")}
                className="rounded-xl bg-askool-orange px-7 py-6 text-base font-semibold text-white hover:bg-askool-orangehover">
                Créer mon compte <ArrowRight size={17} />
              </Button>
              <Button data-testid="explore-how" variant="outline" onClick={() => navigate("/comment-ca-marche")}
                className="rounded-xl border-white/40 bg-white/10 px-7 py-6 text-base text-white hover:bg-white/20 hover:text-white">
                Comment ça marche
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
