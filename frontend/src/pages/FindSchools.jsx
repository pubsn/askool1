import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, RotateCcw, List, Map as MapIcon, LocateFixed, GitCompare } from "lucide-react";
import { toast } from "sonner";
import PublicLayout from "@/components/layout/PublicLayout";
import SchoolCard from "@/components/SchoolCard";
import SchoolMap from "@/components/SchoolMap";
import { Loader, EmptyState, PageHeader } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const EMPTY = { q: "", region: "", city: "", district: "", school_type: "", level: "", subject: "", recruiting: "", contract_type: "", verified_only: false, service: "", language: "", education_system: "", has_fees: false, enrollment_open: false };

export default function FindSchools({ embedded = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isParent = user?.role === "PARENT" || user?.role === "ADULT_LEARNER" || !user;
  const [meta, setMeta] = useState({ regions: [], subjects: [], languages: [] });
  const [smeta, setSmeta] = useState({ school_types: [], school_levels: [], recruiting: [], contract_types: [], education_systems: [], family_services: [] });
  const [data, setData] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState("list");
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(15);
  const [compare, setCompare] = useState([]);
  const [f, setF] = useState(() => new URLSearchParams(window.location.search).get("type") === "formation" ? { ...EMPTY, level: "Formation professionnelle" } : EMPTY);

  useEffect(() => {
    api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {});
    api.get("/schools/meta").then(({ data }) => setSmeta(data)).catch(() => {});
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
    if (center) { params.set("near_lat", center[0]); params.set("near_lng", center[1]); params.set("radius_km", radius); }
    params.set("page_size", view === "map" ? 100 : 12);
    try { const { data } = await api.get(`/schools?${params.toString()}`); setData(data); } catch {}
    finally { setLoading(false); }
  }, [f, center, radius, view]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const nearMe = () => {
    if (!navigator.geolocation) return toast.error("Géolocalisation non disponible.");
    navigator.geolocation.getCurrentPosition((p) => { setCenter([p.coords.latitude, p.coords.longitude]); setView("map"); toast.success("Écoles autour de vous"); }, () => toast.error("Position refusée. Cliquez sur la carte pour définir une zone."));
  };
  const toggleCompare = (id) => setCompare((c) => c.includes(id) ? c.filter((x) => x !== id) : c.length >= 4 ? (toast.error("4 écoles maximum"), c) : [...c, id]);

  const Sel = ({ k, label, options }) => (
    <div><Label className="text-xs">{label}</Label>
      <select data-testid={`school-filter-${k}`} value={f[k]} onChange={(e) => set(k, e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-askool-blue">
        <option value="">Tous</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  const Chk = ({ k, label }) => <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700"><input data-testid={`school-filter-${k}`} type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} /> {label}</label>;

  const body = (
    <>
      {embedded ? <PageHeader title="Trouver une école" subtitle={`${data.total} établissement(s) présents sur ASKOOL.`} /> : (
        <><h1 className="font-display text-3xl font-bold text-gray-900 lg:text-4xl">Trouver une école</h1>
          <p className="mt-2 text-muted-foreground">{data.total} établissement(s) scolaires au Sénégal.</p></>
      )}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input data-testid="school-search-query" value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Rechercher une école : nom, ville, quartier, niveau, programme, services…" className="rounded-xl pl-10" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="school-near-me" variant="outline" onClick={nearMe} className="rounded-xl"><LocateFixed size={16} /> Écoles près de moi</Button>
            <Button data-testid="toggle-school-filters" variant="outline" onClick={() => setShowFilters((v) => !v)} className="rounded-xl"><SlidersHorizontal size={16} /> Filtres</Button>
            <Button data-testid="reset-school-filters" variant="ghost" onClick={() => { setF(EMPTY); setCenter(null); }} className="rounded-xl text-gray-500"><RotateCcw size={16} /></Button>
            <div className="inline-flex rounded-xl border border-gray-200 p-0.5">
              <button data-testid="school-view-list" onClick={() => setView("list")} className={`rounded-lg px-3 py-1.5 text-sm ${view === "list" ? "bg-askool-blue text-white" : "text-gray-500"}`}><List size={16} /></button>
              <button data-testid="school-view-map" onClick={() => setView("map")} className={`rounded-lg px-3 py-1.5 text-sm ${view === "map" ? "bg-askool-blue text-white" : "text-gray-500"}`}><MapIcon size={16} /></button>
            </div>
          </div>
        </div>
        <div className={`${showFilters ? "grid" : "hidden"} mt-4 gap-3 sm:grid-cols-2 lg:grid-cols-4`} data-testid="school-filters-panel">
          <Sel k="region" label="Région" options={meta.regions} />
          <div><Label className="text-xs">Ville</Label><Input data-testid="school-filter-city" value={f.city} onChange={(e) => set("city", e.target.value)} className="mt-1 rounded-lg" placeholder="Dakar" /></div>
          <div><Label className="text-xs">Quartier</Label><Input data-testid="school-filter-district" value={f.district} onChange={(e) => set("district", e.target.value)} className="mt-1 rounded-lg" placeholder="Almadies" /></div>
          <Sel k="level" label="Niveau" options={smeta.school_levels} />
          <Sel k="school_type" label="Type d'établissement" options={smeta.school_types} />
          <Sel k="education_system" label="Programme / système éducatif" options={smeta.education_systems || []} />
          <Sel k="service" label="Services" options={smeta.family_services || []} />
          <Sel k="language" label="Langue d'enseignement" options={meta.languages || []} />
          {!isParent && <><Sel k="subject" label="Matière recherchée" options={meta.subjects} /><Sel k="recruiting" label="Recrutement" options={smeta.recruiting} /><Sel k="contract_type" label="Type de contrat" options={smeta.contract_types} /></>}
          <Chk k="verified_only" label="Établissements vérifiés" />
          <Chk k="has_fees" label="Frais de scolarité communiqués" />
          <Chk k="enrollment_open" label="Inscriptions ouvertes" />
        </div>
        {center && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-askool-orangelight/50 px-4 py-2 text-sm" data-testid="zone-bar">
            <span className="font-medium text-gray-800">Zone : {radius} km autour du point</span>
            <input data-testid="radius-slider" type="range" min="1" max="60" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-40 accent-askool-orange" />
            <button data-testid="reset-zone" onClick={() => setCenter(null)} className="text-xs text-askool-blue underline">Réinitialiser la zone</button>
          </div>
        )}
      </div>
      {compare.length > 0 && (
        <div className="sticky top-16 z-10 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-askool-blue/20 bg-white/95 px-4 py-3 shadow-md backdrop-blur" data-testid="compare-bar">
          <span className="text-sm font-medium text-gray-800"><GitCompare size={14} className="mr-1 inline" /> {compare.length} école(s) sélectionnée(s) pour comparaison</span>
          <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setCompare([])} className="rounded-lg">Vider</Button><Button size="sm" data-testid="compare-go" disabled={compare.length < 2} onClick={() => navigate(`${embedded ? "/dashboard" : ""}/comparer?ids=${compare.join(",")}`)} className="rounded-lg bg-askool-blue text-white">Comparer</Button></div>
        </div>
      )}
      <div className="mt-8">
        {view === "map" ? (
          <>
            <p className="mb-2 text-xs text-muted-foreground">Cliquez sur la carte pour définir une zone de recherche.</p>
            <SchoolMap schools={data.results} center={center} radius={center ? radius : null} onPick={(c) => setCenter(c)} />
          </>
        ) : loading ? <Loader /> : data.results.length === 0 ? (
          <EmptyState title="Aucune école trouvée" description="Modifiez vos critères de recherche ou élargissez la zone." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="schools-grid">{data.results.map((s) => <SchoolCard key={s.school_id} school={s} compareChecked={compare.includes(s.school_id)} onCompare={() => toggleCompare(s.school_id)} />)}</div>
        )}
      </div>
    </>
  );
  if (embedded) return <div>{body}</div>;
  return <PublicLayout><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{body}</div></PublicLayout>;
}
