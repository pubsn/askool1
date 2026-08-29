import React, { useEffect, useState, useCallback } from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import JobCard from "@/components/JobCard";
import { Loader, EmptyState } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

export default function FindJobs() {
  const [meta, setMeta] = useState({ subjects: [], levels: [], regions: [], contract_types: [] });
  const [data, setData] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ q: "", subject: "", level: "", region: "", contract_type: "" });

  useEffect(() => { api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {}); }, []);
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
    try { const { data } = await api.get(`/jobs?${params.toString()}`); setData(data); } catch {}
    finally { setLoading(false); }
  }, [f]);
  useEffect(() => { load(); }, [load]);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const Sel = ({ k, label, options }) => (
    <div><Label className="text-xs">{label}</Label>
      <select data-testid={`job-filter-${k}`} value={f[k]} onChange={(e) => set(k, e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-askool-blue">
        <option value="">Tous</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 lg:text-4xl">Trouver un emploi</h1>
        <p className="mt-2 text-muted-foreground">{data.total} offre(s) d'emploi dans l'éducation au Sénégal.</p>
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <Input data-testid="job-search-query" value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Rechercher un poste, une école…" className="mb-4 rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Sel k="subject" label="Matière" options={meta.subjects} />
            <Sel k="level" label="Niveau" options={meta.levels} />
            <Sel k="region" label="Localisation" options={meta.regions} />
            <Sel k="contract_type" label="Contrat" options={meta.contract_types} />
          </div>
        </div>
        <div className="mt-8">
          {loading ? <Loader /> : data.results.length === 0 ? (
            <EmptyState title="Aucune offre trouvée" description="Modifiez vos critères pour voir plus d'offres." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{data.results.map((j) => <JobCard key={j.offer_id} job={j} />)}</div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
