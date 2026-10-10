import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { School, GraduationCap, Users, BookOpen, ArrowRight, UserPlus, Search, MessagesSquare, CheckCircle2 } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/home/Reveal";
import { Button } from "@/components/ui/button";
import { IMG } from "@/lib/images";

const PROFILES = [
  {
    key: "SCHOOL", label: "Établissement", icon: School, img: IMG.classroom,
    intro: "Recrutez des enseignants vérifiés et faites connaître votre établissement aux familles.",
    steps: [["Créez la fiche de votre établissement", "Niveaux, langues, infos pratiques, photos et localisation."],
            ["Publiez une offre ou consultez la CVthèque", "Décrivez le poste, la matière et le niveau recherchés."],
            ["Étudiez les candidatures", "Comparez les profils, échangez par messagerie et présélectionnez."],
            ["Recrutez et publiez vos actualités", "Informez vos abonnés : inscriptions, événements, résultats."]],
    cta: "Inscrire mon établissement",
  },
  {
    key: "EDUCATOR", label: "Éducateur", icon: GraduationCap, img: IMG.teacher,
    intro: "Un seul profil pour vos candidatures en école et vos cours particuliers.",
    steps: [["Créez votre profil professionnel", "Matières, niveaux, diplômes, expérience et zone d'intervention."],
            ["Faites vérifier vos documents", "Diplômes et pièces justificatives validés par ASKOOL."],
            ["Postulez ou recevez des demandes", "Offres d'écoles, demandes de cours et propositions directes."],
            ["Développez votre activité", "Avis vérifiés, statistiques de profil et visibilité Premium."]],
    cta: "Créer mon profil éducateur",
  },
  {
    key: "PARENT", label: "Parent", icon: Users, img: IMG.students,
    intro: "Trouvez l'école et l'accompagnement qui conviennent à chacun de vos enfants.",
    steps: [["Créez le profil de vos enfants", "Classe, matières et besoins d'accompagnement."],
            ["Recherchez et comparez", "Filtres par niveau, localisation et budget, carte interactive."],
            ["Suivez vos écoles favorites", "Recevez leurs actualités et leurs campagnes d'inscription."],
            ["Contactez et réservez", "Messagerie sécurisée, demandes d'inscription et réservation de cours."]],
    cta: "Créer mon compte parent",
  },
  {
    key: "ADULT_LEARNER", label: "Apprenant", icon: BookOpen, img: IMG.writing,
    intro: "Reprenez vos études ou montez en compétences avec le bon accompagnement.",
    steps: [["Décrivez votre projet", "Niveau actuel, domaine visé et objectifs d'apprentissage."],
            ["Explorez écoles et formations", "Centres de formation, écoles et éducateurs disponibles."],
            ["Échangez avec un éducateur", "Messagerie intégrée et réservation de cours particuliers."],
            ["Suivez votre parcours", "Cours terminés, heures d'apprentissage et objectifs atteints."]],
    cta: "Créer mon compte apprenant",
  },
];

const BASE_STEPS = [
  { n: "01", t: "Créez votre profil", d: "Présentez votre établissement, vos compétences ou vos besoins.", icon: UserPlus, tone: "bg-askool-bluelight text-askool-blue" },
  { n: "02", t: "Recherchez ou publiez", d: "Trouvez un profil, une école, une formation ou une opportunité.", icon: Search, tone: "bg-askool-greenlight text-askool-green" },
  { n: "03", t: "Échangez et avancez", d: "Contactez la personne et construisez votre projet.", icon: MessagesSquare, tone: "bg-askool-orangelight text-askool-orangehover" },
];

export default function HowItWorks() {
  const navigate = useNavigate();
  const [active, setActive] = useState("SCHOOL");
  const profile = PROFILES.find((p) => p.key === active);

  return (
    <PublicLayout>
      <section data-testid="how-hero" className="relative isolate overflow-hidden">
        <img src={IMG.hero} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(22,41,94,0.92) 0%, rgba(22,41,94,0.96) 100%)" }} />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">Comment ça marche ?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-base text-white/80">
            ASKOOL met en relation les établissements, les éducateurs, les parents et les apprenants. Voici le parcours, étape par étape.
          </p>
        </div>
      </section>

      {/* parcours commun */}
      <section data-testid="how-common" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Le principe" title="Trois étapes, quel que soit votre profil" />
          <div className="relative">
            <span aria-hidden className="absolute left-0 right-0 top-[76px] hidden h-px bg-gradient-to-r from-transparent via-askool-bluepale to-transparent lg:block" />
            <div className="grid gap-6 lg:grid-cols-3">
              {BASE_STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.1}>
                  <div data-testid={`how-page-step-${s.n}`} className="relative flex h-full flex-col items-center rounded-3xl border border-askool-border bg-askool-surface px-7 pb-8 pt-10 text-center transition-all duration-300 hover:-translate-y-1.5 hover:bg-white hover:shadow-card-hover">
                    <span className="absolute -top-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-askool-border bg-white font-display text-base font-bold text-askool-blue shadow-card">{s.n}</span>
                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${s.tone}`}><s.icon size={24} /></span>
                    <h3 className="mt-5 font-display text-base font-semibold text-askool-ink">{s.t}</h3>
                    <p className="mt-2 text-sm text-askool-text">{s.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* parcours par profil */}
      <section data-testid="how-profiles" className="bg-askool-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Par profil" title="Votre parcours détaillé"
            subtitle="Choisissez votre profil pour voir les étapes qui vous concernent." />
          <div className="mb-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Profils">
            {PROFILES.map((p) => (
              <button key={p.key} data-testid={`how-tab-${p.key}`} role="tab" aria-selected={active === p.key} onClick={() => setActive(p.key)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${active === p.key ? "bg-askool-blue text-white shadow-sm" : "border border-askool-sand bg-white text-askool-text hover:border-askool-blue hover:text-askool-blue"}`}>
                <p.icon size={16} /> {p.label}
              </button>
            ))}
          </div>

          <Reveal key={active} className="overflow-hidden rounded-[2rem] border border-askool-sand bg-white shadow-card">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-[220px]">
                <img src={profile.img} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
                <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(22,41,94,0.90) 0%, rgba(22,41,94,0.45) 55%, rgba(22,41,94,0.10) 100%)" }} />
                <div className="relative flex h-full flex-col justify-end p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-askool-blue"><profile.icon size={22} /></span>
                  <h3 className="mt-4 font-display text-xl font-bold text-white">{profile.label}</h3>
                  <p className="mt-2 text-sm text-white/85">{profile.intro}</p>
                </div>
              </div>
              <div className="p-8">
                <ol className="space-y-5">
                  {profile.steps.map(([t, d], i) => (
                    <li key={t} data-testid={`how-profile-step-${i + 1}`} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-askool-bluelight font-display text-sm font-bold text-askool-blue">{i + 1}</span>
                      <span>
                        <span className="block font-display text-base font-semibold text-askool-ink">{t}</span>
                        <span className="mt-1 block text-sm text-askool-text">{d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <Button data-testid={`how-cta-${profile.key}`} onClick={() => navigate(`/inscription?role=${profile.key}`)}
                  className="mt-8 w-full rounded-xl bg-askool-orange py-6 font-semibold text-white hover:bg-askool-orangehover sm:w-auto sm:px-7">
                  {profile.cta} <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* garanties */}
      <section data-testid="how-guarantees" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Bon à savoir" title="Ce qu'ASKOOL prend en charge" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {["Vérification des diplômes et des fiches d'établissement",
              "Messagerie intégrée, sans partage de coordonnées",
              "Avis publiés uniquement après une mise en relation",
              "Informations structurées : matières, niveaux, localisation"].map((t, i) => (
              <Reveal key={t} delay={i * 0.06}>
                <div className="flex h-full items-start gap-3 rounded-2xl border border-askool-border bg-askool-surface p-5">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-askool-green" />
                  <span className="text-sm text-askool-text">{t}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12 text-center">
            <Button data-testid="how-explore-cta" variant="outline" onClick={() => navigate("/explorer")}
              className="rounded-xl border-askool-blue text-askool-blue transition-colors hover:bg-askool-blue hover:text-white">
              Explorer ASKOOL <ArrowRight size={15} />
            </Button>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
}
