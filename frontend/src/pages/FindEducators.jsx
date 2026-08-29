import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, MapPin, List, Map as MapIcon, X } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import EducatorCard from "@/components/EducatorCard";
import { Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api";

export default function FindEducators() {
  const [sp, setSp] = useSearchParams();
  const [meta, setMeta] = useState({ subjects: [], levels: [], regions: [], service_types: [], diplomas: [] });
  const [data, setData] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    q: sp.get("q") || "", subject: sp.get("subject") || "", level: sp.get("level") || "",
    service_type: sp.get("service_type") || "", region: sp.get("region") || "",
    min_experience: "", diploma: "", max_rate: "", min_rating: "", verified_only: false,
    sort: "relevance",
  });

  useEffect(() => { api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== "" && v !== false) params.set(k, v); });
    try { const { data } = await api.get(`/educators?${params.toString()}`); setData(data); }
    catch { setData({ results: [], total: 0 }); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const reset = () => setFilters({ q: "", subject: "", level: "", service_type: "", region: "", min_experience: "", diploma: "", max_rate: "", min_rating: "", verified_only: false, sort: "relevance" });

  const Select = ({ k, label, options }) => (
    <div><Label className="text-xs">{label}</Label>
      <select data-testid={`filter-${k}`} value={filters[k]} onChange={(e) => set(k, e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-askool-blue">
        <option value="">Tous</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const FiltersPanel = (
    <div className="space-y-4">
      <Select k="subject" label="Matière" options={meta.subjects} />
      <Select k="level" label="Niveau" options={meta.levels} />
      <Select k="service_type" label="Type de service" options={meta.service_types} />
      <Select k="region" label="Localisation" options={meta.regions} />
      <Select k="diploma" label="Diplôme" options={meta.diplomas} />
      <div><Label className="text-xs">Expérience min. (ans)</Label><Input data-testid="filter-min_experience" type="number" min="0" value={filters.min_experience} onChange={(e) => set("min_experience", e.target.value)} className="mt-1 rounded-lg" /></div>
      <div><Label className="text-xs">Tarif max. (FCFA/h)</Label><Input data-testid="filter-max_rate" type="number" min="0" value={filters.max_rate} onChange={(e) => set("max_rate", e.target.value)} className="mt-1 rounded-lg" /></div>
      <Select k="min_rating" label="Note minimale" options={["3", "4", "4.5"]} />
      <label className="flex items-center gap-2 text-sm"><Checkbox data-testid="filter-verified" checked={filters.verified_only} onCheckedChange={(v) => set("verified_only", !!v)} /> Profils vérifiés uniquement</label>
      <Button data-testid="reset-filters" variant="ghost" onClick={reset} className="w-full text-sm text-gray-500"><X size={14} /> Réinitialiser</Button>
    </div>
  );

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 lg:text-4xl">Trouver un éducateur</h1>
        <p className="mt-2 text-muted-foreground">{data.total} éducateur(s) disponibles au Sénégal.</p>

        <div className="mt-6 flex gap-3">
          <Input data-testid="search-query" value={filters.q} onChange={(e) => set("q", e.target.value)} placeholder="Rechercher par nom, matière…" className="rounded-xl" />
          <Button data-testid="toggle-filters" variant="outline" className="rounded-xl lg:hidden" onClick={() => setShowFilters(true)}><SlidersHorizontal size={16} /> Filtres</Button>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
            <button data-testid="view-list" onClick={() => setView("list")} className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${view === "list" ? "bg-askool-blue text-white" : "text-gray-500"}`}><List size={15} /> Liste</button>
            <button data-testid="view-map" onClick={() => setView("map")} className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${view === "map" ? "bg-askool-blue text-white" : "text-gray-500"}`}><MapIcon size={15} /> Carte</button>
          </div>
          <select data-testid="sort-select" value={filters.sort} onChange={(e) => set("sort", e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
            <option value="relevance">Pertinence</option>
            <option value="price">Prix croissant</option>
            <option value="experience">Expérience</option>
            <option value="rating">Note</option>
            <option value="availability">Disponibilité</option>
          </select>
        </div>

        <div className="mt-6 flex gap-8">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-display font-semibold text-gray-900">Filtres</h3>
              {FiltersPanel}
            </div>
          </aside>

          <div className="flex-1">
            {loading ? <Loader /> : data.results.length === 0 ? (
              <EmptyState title="Aucun éducateur trouvé" description="Essayez d'élargir vos critères de recherche." action={<Button onClick={reset} className="rounded-xl bg-askool-blue text-white">Réinitialiser</Button>} />
            ) : view === "map" ? (
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <div className="relative h-[420px] w-full bg-askool-bluelight">
                  <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=60" alt="Carte" className="h-full w-full object-cover opacity-40" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                    {data.results.slice(0, 6).map((e, i) => (
                      <span key={e.user_id} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-askool-blue shadow" style={{ position: "absolute", left: `${15 + (i * 13) % 70}%`, top: `${20 + (i * 17) % 60}%` }}>
                        <MapPin size={12} /> {e.name.split(" ")[0]} · {(e.hourly_rate || 0).toLocaleString()}F
                      </span>
                    ))}
                    <p className="rounded-lg bg-white/90 px-4 py-2 text-sm text-gray-600">Vue carte — {data.total} éducateurs localisés</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.results.map((e) => <EducatorCard key={e.user_id} edu={e} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 right-0 w-80 overflow-y-auto bg-white p-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-display font-semibold">Filtres</h3><button onClick={() => setShowFilters(false)}><X /></button></div>
            {FiltersPanel}
            <Button onClick={() => setShowFilters(false)} className="mt-4 w-full rounded-xl bg-askool-blue text-white">Voir les résultats</Button>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
