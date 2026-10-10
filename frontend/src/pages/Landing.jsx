import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import HomeSearch from "@/components/home/HomeSearch";
import ExploreSection from "@/components/home/ExploreSection";
import AudienceSection from "@/components/home/AudienceSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import TrustSection from "@/components/home/TrustSection";
import ResourcesSection from "@/components/home/ResourcesSection";
import FinalCta from "@/components/home/FinalCta";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/home/Reveal";
import EducatorCard from "@/components/EducatorCard";
import JobCard from "@/components/JobCard";
import SchoolCard from "@/components/SchoolCard";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { IMG } from "@/lib/images";

export default function Landing() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { hash } = useLocation();
  const [educators, setEducators] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [schools, setSchools] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    api.get("/educators?sort=relevance&page_size=3").then(({ data }) => { setEducators(data.results); setCounts((c) => ({ ...c, educators: data.total })); }).catch(() => {});
    api.get("/jobs?page_size=3").then(({ data }) => { setJobs(data.results); setCounts((c) => ({ ...c, jobs: data.total })); }).catch(() => {});
    api.get("/schools?page_size=3").then(({ data }) => { setSchools(data.results); setCounts((c) => ({ ...c, schools: data.total })); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 150);
  }, [hash]);

  const SeeAll = ({ label, to, testId }) => (
    <Reveal className="mt-10 text-center">
      <Button data-testid={testId} variant="outline" onClick={() => navigate(to)}
        className="rounded-xl border-askool-blue text-askool-blue transition-colors hover:bg-askool-blue hover:text-white">
        {label} <ArrowRight size={15} />
      </Button>
    </Reveal>
  );

  return (
    <PublicLayout>
      {/* 1. HERO immersif */}
      <section data-testid="home-hero" className="relative isolate overflow-hidden">
        <img src={IMG.hero} alt="Élèves dans une salle de classe" className="absolute inset-0 h-full w-full object-cover object-center" />
        <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(22,41,94,0.90) 0%, rgba(22,41,94,0.84) 45%, rgba(22,41,94,0.95) 100%)" }} />
        <span aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 0%, rgba(238,115,31,0.22), transparent 55%)" }} />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-16 text-center sm:px-6 lg:pb-20 lg:pt-24">
          <motion.span initial={reduce ? false : { opacity: 0, y: 12 }} animate={reduce ? false : { opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur-md">
            <ShieldCheck size={15} /> Plateforme éducative · Sénégal
          </motion.span>
          <motion.h1 initial={reduce ? false : { opacity: 0, y: 18 }} animate={reduce ? false : { opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
            className="mx-auto mt-6 max-w-3xl font-display text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
            Trouvez ce qu'il vous faut pour <span className="text-askool-orange">votre projet éducatif.</span>
          </motion.h1>
          <motion.p initial={reduce ? false : { opacity: 0, y: 18 }} animate={reduce ? false : { opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}
            className="mx-auto mt-5 max-w-2xl text-body-base text-white/80 sm:text-base">
            École, éducateur, emploi, cours particuliers ou formation : trouvez rapidement ce dont vous avez besoin sur ASKOOL.
          </motion.p>
          <motion.div initial={reduce ? false : { opacity: 0, y: 22 }} animate={reduce ? false : { opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-10">
            <HomeSearch variant="hero" />
          </motion.div>
        </div>
      </section>

      {/* 2. EXPLORER */}
      <ExploreSection />

      {/* 3. VOUS ÊTES */}
      <AudienceSection />

      {/* 4. COMMENT ÇA MARCHE */}
      <HowItWorksSection />

      {/* 5. ÉDUCATEURS */}
      {educators.length > 0 && (
        <section data-testid="home-educators" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Éducateurs" title="Éducateurs recommandés"
              subtitle="Enseignants, tuteurs et formateurs présents sur la plateforme." />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {educators.map((e, i) => <Reveal key={e.user_id} delay={i * 0.06}><EducatorCard edu={e} /></Reveal>)}
            </div>
            <SeeAll label="Voir tous les éducateurs" to="/educateurs" testId="see-all-educators" />
          </div>
        </section>
      )}

      {/* 6. OFFRES D'EMPLOI */}
      {jobs.length > 0 && (
        <section data-testid="home-jobs" className="bg-askool-cream py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Opportunités" title="Dernières offres d'emploi"
              subtitle="Les postes publiés par les établissements sur ASKOOL." />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((j, i) => <Reveal key={j.offer_id} delay={i * 0.06}><JobCard job={j} /></Reveal>)}
            </div>
            <SeeAll label="Voir toutes les offres" to="/emplois" testId="see-all-jobs" />
          </div>
        </section>
      )}

      {/* 7. ÉTABLISSEMENTS */}
      {schools.length > 0 && (
        <section data-testid="home-schools" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Établissements" title="Établissements à découvrir"
              subtitle="Niveaux, langues, informations pratiques et actualités sur chaque fiche." />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {schools.map((s, i) => <Reveal key={s.school_id} delay={i * 0.06}><SchoolCard school={s} /></Reveal>)}
            </div>
            <SeeAll label="Voir toutes les écoles" to="/ecoles" testId="see-all-schools" />
          </div>
        </section>
      )}

      {/* 8. CONFIANCE */}
      <TrustSection counts={counts} />

      {/* 9. ACTUALITÉS ET CONSEILS */}
      <ResourcesSection />

      {/* 10. CTA FINAL */}
      <FinalCta />
    </PublicLayout>
  );
}
