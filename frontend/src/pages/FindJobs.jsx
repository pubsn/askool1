import React, { useEffect, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import JobCard from "@/components/JobCard";
import { Loader, EmptyState, PageHeader } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const EMPTY = { q: "", subject: "", level: "", region: "", contract_type: "", school_id: "", max_experience: "", has_salary: false, since_days: "" };

export default function FindJobs({ embedded = false }) {
  const { user } = useAuth();
  const isEdu = user?.role === "EDUCATOR";
  const [meta, setMeta] = useState({ subjects: [], levels: [], regions: [], contract_types: [] });
  const [schools, setSchools] = useState([]);
  const [data, setData] = useState({ results: [], total: 0 });
  const [reco, setReco] = useState(null);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState(EMPTY);

  useEffect(() => {
    api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {});
    api.get("/schools?page_size=100").then(({ data }) => setSchools(data.results)).catch(() => {});
    if (isEdu) api.get("/recommendations/jobs").then(({ data }) => setReco(data)).catch(() => setReco({ recommended: [], nearby: [] }));
  }, [isEdu]);
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
    try { const { data } = await api.get(`/jobs?${params.toString()}`); setData(data); } catch {}
    finally { setLoading(false); }
  }, [f]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const Sel = ({ k, label, options, values }) => (
    <div><Label className="text-xs">{label}</Label>
      <select data-testid={`job-filter-${k}`} value={f[k]} onChange={(e) => set(k, e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-askool-blue">
        <option value="">Tous</option>{options.map((o, i) => <option key={o} value={values ? values[i] : o}>{o}</option>)}
      </select>
    </div>
  );
  const TabBtn = ({ id, label, count }) => <button data-testid={`jobs-tab-${id}`} onClick={() => setTab(id)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === id ? "bg-askool-blue text-white" : "text-gray-500"}`}>{label}{typeof count === "number" ? ` (${count})` : ""}</button>;
  const Grid = ({ items, withScore }) => items.length === 0 ? <EmptyState title="Aucune offre" description="Complétez votre profil (matières, région) pour de meilleures recommandations." /> : (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((j) => <div key={j.offer_id} className="relative">{withScore && <span data-testid={`job-match-${j.offer_id}`} className="absolute right-4 top-4 z-10 rounded-full bg-askool-blue px-2.5 py-1 text-xs font-bold text-white" title={j.match_reasons?.length ? `Correspond à ${j.match_reasons.join(", ")}` : ""}>{j.match_score}% compatible</span>}<JobCard job={j} />{withScore && j.match_reasons?.length > 0 && <p className="mt-1 px-1 text-xs text-muted-foreground">Correspond à {j.match_reasons.join(", ")}.</p>}</div>)}</div>
  );

  const body = (
    <>
      {embedded ? <PageHeader title="Trouver un emploi" subtitle={`${data.total} offre(s) d'emploi dans l'éducation au Sénégal.`} /> : (<><h1 className="font-display text-3xl font-bold text-gray-900 lg:text-4xl">Trouver un emploi</h1><p className="mt-2 text-muted-foreground">{data.total} offre(s) d'emploi dans l'éducation au Sénégal.</p></>)}
      {isEdu && (
        <div className="mt-6 inline-flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          <TabBtn id="all" label="Toutes les offres" count={data.total} />
          <TabBtn id="new" label="Nouvelles offres" />
          <TabBtn id="reco" label="Offres recommandées" count={reco?.recommended?.length} />
          <TabBtn id="near" label="Offres proches de moi" count={reco?.nearby?.length} />
        </div>
      )}
      {(tab === "all" || tab === "new") && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex gap-2">
            <Input data-testid="job-search-query" value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Rechercher un poste, une école…" className="rounded-xl" />
            <Button data-testid="reset-job-filters" variant="ghost" onClick={() => setF(EMPTY)} className="rounded-xl text-gray-500"><RotateCcw size={16} /></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Sel k="subject" label="Matière" options={meta.subjects} />
            <Sel k="level" label="Niveau" options={meta.levels} />
            <Sel k="region" label="Localisation" options={meta.regions} />
            <Sel k="contract_type" label="Contrat" options={meta.contract_types} />
            <Sel k="school_id" label="École" options={schools.map((s) => s.name)} values={schools.map((s) => s.school_id)} />
            <Sel k="max_experience" label="Expérience max. demandée" options={["Débutant (0 an)", "≤ 2 ans", "≤ 5 ans"]} values={["0", "2", "5"]} />
            <Sel k="since_days" label="Date de publication" options={["Dernières 24h", "7 derniers jours", "30 derniers jours"]} values={["1", "7", "30"]} />
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700"><input data-testid="job-filter-salary" type="checkbox" checked={f.has_salary} onChange={(e) => set("has_salary", e.target.checked)} /> Salaire communiqué</label>
          </div>
        </div>
      )}
      <div className="mt-8">
        {tab === "reco" ? (reco ? <Grid items={reco.recommended} withScore /> : <Loader />)
          : tab === "near" ? (reco ? <>{reco.region && <p className="mb-3 text-sm text-muted-foreground">Offres dans votre région : <b>{reco.region}</b></p>}<Grid items={reco.nearby} withScore /></> : <Loader />)
          : loading ? <Loader /> : (() => {
            const items = tab === "new" ? [...data.results].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 12) : data.results;
            return items.length === 0 ? <EmptyState title="Aucune offre trouvée" description="Modifiez vos critères pour voir plus d'offres." /> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="jobs-grid">{items.map((j) => <JobCard key={j.offer_id} job={j} />)}</div>;
          })()}
      </div>
    </>
  );
  if (embedded) return <div>{body}</div>;
  return <PublicLayout><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{body}</div></PublicLayout>;
}
