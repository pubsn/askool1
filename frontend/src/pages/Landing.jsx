import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import HomeSearch from "@/components/home/HomeSearch";
import ExploreSection from "@/components/home/ExploreSection";
import AudienceSection from "@/components/home/AudienceSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import TrustSection from "@/components/home/TrustSection";
import ResourcesSection from "@/components/home/ResourcesSection";
import FinalCta from "@/components/home/FinalCta";
import EducatorCard from "@/components/EducatorCard";
import JobCard from "@/components/JobCard";
import SchoolCard from "@/components/SchoolCard";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const SectionHead = ({ eyebrow, title, subtitle, action }) => (
  <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-2xl">
      <span className="text-label-base font-semibold uppercase tracking-widest text-askool-blue">{eyebrow}</span>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-askool-ink sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-askool-text">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export default function Landing() {
  const navigate = useNavigate();
  const [educators, setEducators] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [schools, setSchools] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    api.get("/educators?sort=relevance&page_size=3").then(({ data }) => { setEducators(data.results); setCounts((c) => ({ ...c, educators: data.total })); }).catch(() => {});
    api.get("/jobs?page_size=3").then(({ data }) => { setJobs(data.results); setCounts((c) => ({ ...c, jobs: data.total })); }).catch(() => {});
    api.get("/schools?page_size=3").then(({ data }) => { setSchools(data.results); setCounts((c) => ({ ...c, schools: data.total })); }).catch(() => {});
  }, []);

  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 150);
  }, [hash]);

  const SeeAll = ({ label, to, testId }) => (
    <Button data-testid={testId} variant="outline" onClick={() => navigate(to)}
      className="w-fit rounded-xl border-askool-blue text-askool-blue hover:bg-askool-bluelight">
      {label} <ArrowRight size={15} />
    </Button>
  );

  return (
    <PublicLayout>
      {/* 2. HERO + recherche */}
      <section className="border-b border-askool-border bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="max-w-3xl">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-askool-bluelight px-3 py-1 text-sm font-medium text-askool-blue">
              <ShieldCheck size={15} /> Plateforme éducative · Sénégal
            </span>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
              className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-askool-ink sm:text-5xl lg:text-6xl">
              Trouvez ce qu'il vous faut pour <span className="text-askool-blue">votre projet éducatif.</span>
            </motion.h1>
            <p className="mt-5 max-w-2xl text-base text-askool-text sm:text-lg">
              École, éducateur, emploi, cours particuliers ou formation : trouvez rapidement ce dont vous avez besoin sur ASKOOL.
            </p>
          </div>
          <div className="mt-8"><HomeSearch /></div>
        </div>
      </section>

      {/* 3. EXPLORER */}
      <ExploreSection />

      {/* 4. VOUS ÊTES */}
      <AudienceSection />

      {/* 5. COMMENT ÇA MARCHE */}
      <HowItWorksSection />

      {/* 6. ÉDUCATEURS */}
      {educators.length > 0 && (
        <section data-testid="home-educators" className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="Éducateurs" title="Des éducateurs près de chez vous"
              subtitle="Enseignants, tuteurs et formateurs présents sur la plateforme."
              action={<SeeAll label="Voir tous les éducateurs" to="/educateurs" testId="see-all-educators" />} />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {educators.map((e) => <EducatorCard key={e.user_id} edu={e} />)}
            </div>
          </div>
        </section>
      )}

      {/* 7. OFFRES D'EMPLOI */}
      {jobs.length > 0 && (
        <section data-testid="home-jobs" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHead eyebrow="Opportunités" title="Dernières offres d'emploi"
            subtitle="Les postes publiés par les établissements sur ASKOOL."
            action={<SeeAll label="Voir toutes les offres" to="/emplois" testId="see-all-jobs" />} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => <JobCard key={j.offer_id} job={j} />)}
          </div>
        </section>
      )}

      {/* 8. ÉTABLISSEMENTS */}
      {schools.length > 0 && (
        <section data-testid="home-schools" className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="Établissements" title="Écoles et établissements référencés"
              subtitle="Consultez leur fiche complète : niveaux, langues, infos pratiques et actualités."
              action={<SeeAll label="Voir toutes les écoles" to="/ecoles" testId="see-all-schools" />} />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {schools.map((s) => <SchoolCard key={s.school_id} school={s} />)}
            </div>
          </div>
        </section>
      )}

      {/* 9. CONFIANCE */}
      <TrustSection counts={counts} />

      {/* 10. ACTUALITÉS ET CONSEILS */}
      <ResourcesSection />

      {/* 11. CTA FINAL */}
      <FinalCta />
    </PublicLayout>
  );
}
