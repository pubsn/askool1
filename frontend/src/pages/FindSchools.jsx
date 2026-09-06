import React, { useEffect, useState, useCallback } from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import SchoolCard from "@/components/SchoolCard";
import { Loader, EmptyState, PageHeader } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const EMPTY = { q: "", region: "", city: "", district: "", school_type: "", level: "", subject: "", recruiting: "", contract_type: "", verified_only: false };

export default function FindSchools({ embedded = false }) {
  const [meta, setMeta] = useState({ regions: [], subjects: [] });
  const [smeta, setSmeta] = useState({ school_types: [], school_levels: [], recruiting: [], contract_types: [] });
  const [data, setData] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [f, setF] = useState(EMPTY);

  useEffect(() => {
    api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {});
    api.get("/schools/meta").then(({ data }) => setSmeta(data)).catch(() => {});
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
    try { const { data } = await api.get(`/schools?${params.toString()}`); setData(data); } catch {}
    finally { setLoading(false); }
  }, [f]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const Sel = ({ k, label, options }) => (
    <div><Label className="text-xs">{label}</Label>
      <select data-testid={`school-filter-${k}`} value={f[k]} onChange={(e) => set(k, e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-askool-blue">
        <option value="">Tous</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const body = (
    <>
      {embedded ? <PageHeader title="Trouver une école" subtitle={`${data.total} établissement(s) présents sur ASKOOL.`} /> : (
        <><h1 className="font-display text-3xl font-bold text-gray-900 lg:text-4xl">Trouver une école</h1>
          <p className="mt-2 text-muted-foreground">{data.total} établissement(s) scolaires au Sénégal.</p></>
      )}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input data-testid="school-search-query" value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Rechercher une école : nom, ville, quartier, matière… (ex. « École privée à Dakar »)" className="rounded-xl pl-10" />
          </div>
          <Button data-testid="toggle-school-filters" variant="outline" onClick={() => setShowFilters((v) => !v)} className="rounded-xl"><SlidersHorizontal size={16} /> Filtres</Button>
          <Button data-testid="reset-school-filters" variant="ghost" onClick={() => setF(EMPTY)} className="rounded-xl text-gray-500"><RotateCcw size={16} /> Réinitialiser</Button>
        </div>
        <div className={`${showFilters ? "grid" : "hidden"} mt-4 gap-3 sm:grid-cols-2 lg:grid-cols-4`} data-testid="school-filters-panel">
          <Sel k="region" label="Région" options={meta.regions} />
          <div><Label className="text-xs">Ville</Label><Input data-testid="school-filter-city" value={f.city} onChange={(e) => set("city", e.target.value)} className="mt-1 rounded-lg" placeholder="Dakar" /></div>
          <div><Label className="text-xs">Quartier</Label><Input data-testid="school-filter-district" value={f.district} onChange={(e) => set("district", e.target.value)} className="mt-1 rounded-lg" placeholder="Sacré-Cœur" /></div>
          <Sel k="school_type" label="Type d'établissement" options={smeta.school_types} />
          <Sel k="level" label="Niveau" options={smeta.school_levels} />
          <Sel k="subject" label="Matière recherchée" options={meta.subjects} />
          <Sel k="recruiting" label="Recrutement" options={smeta.recruiting} />
          <Sel k="contract_type" label="Type de contrat" options={smeta.contract_types} />
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2"><input data-testid="school-filter-verified" type="checkbox" checked={f.verified_only} onChange={(e) => set("verified_only", e.target.checked)} /> Établissements vérifiés uniquement</label>
        </div>
      </div>
      <div className="mt-8">
        {loading ? <Loader /> : data.results.length === 0 ? (
          <EmptyState title="Aucune école trouvée" description="Modifiez vos critères de recherche." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="schools-grid">{data.results.map((s) => <SchoolCard key={s.school_id} school={s} />)}</div>
        )}
      </div>
    </>
  );
  if (embedded) return <div>{body}</div>;
  return <PublicLayout><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{body}</div></PublicLayout>;
}
