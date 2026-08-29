import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Loader, EmptyState, Stars, VerifiedBadge, Tag } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Heart } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function CVtheque() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ subjects: [], levels: [], regions: [], diplomas: [] });
  const [data, setData] = useState({ results: [] });
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ q: "", subject: "", level: "", region: "", diploma: "" });
  useEffect(() => { api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {}); }, []);
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
    try { const { data } = await api.get(`/educators?${params.toString()}&page_size=24`); setData(data); } catch {}
    finally { setLoading(false); }
  }, [f]);
  useEffect(() => { load(); }, [load]);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const save = async (e) => { try { const { data } = await api.post("/favorites", { target_type: "educator", target_id: e.user_id }); toast.success(data.favorited ? "Candidat sauvegardé" : "Retiré"); } catch {} };
  const invite = async (e) => { try { await api.post("/messages", { recipient_user_id: e.user_id, content: `Bonjour ${e.name}, nous serions intéressés par votre profil. Souhaitez-vous postuler à nos offres ?` }); toast.success("Invitation envoyée"); navigate("/dashboard/messages"); } catch { toast.error("Erreur"); } };

  const Sel = ({ k, label, options }) => (
    <div><Label className="text-xs">{label}</Label><select data-testid={`cv-${k}`} value={f[k]} onChange={(e) => set(k, e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Tous</option>{options.map((o) => <option key={o}>{o}</option>)}</select></div>
  );

  return (
    <div>
      <PageHeader title="CVthèque" subtitle="Recherchez et contactez des enseignants qualifiés." />
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <Input data-testid="cv-search" value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Rechercher par nom, matière…" className="mb-4 rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Sel k="subject" label="Matière" options={meta.subjects} /><Sel k="level" label="Niveau" options={meta.levels} /><Sel k="region" label="Localisation" options={meta.regions} /><Sel k="diploma" label="Diplôme" options={meta.diplomas} /></div>
      </div>
      {loading ? <Loader /> : data.results.length === 0 ? <EmptyState icon={Search} title="Aucun candidat trouvé" /> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.results.map((e) => (
            <div key={e.user_id} data-testid={`cv-card-${e.user_id}`} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex gap-3">
                <img src={e.photo} alt={e.name} className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display font-semibold text-gray-900">{e.name}</h3>
                  <p className="truncate text-sm text-askool-blue">{e.profession}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} /> {e.region} · {e.experience_years} ans</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{e.subjects?.slice(0, 3).map((s) => <Tag key={s}>{s}</Tag>)}</div>
              <div className="mt-2">{e.is_verified && <VerifiedBadge />}</div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => navigate(`/educateurs/${e.user_id}`)} className="rounded-lg bg-askool-blue text-white">Voir</Button>
                <Button size="sm" variant="outline" onClick={() => save(e)} className="rounded-lg"><Heart size={14} /></Button>
                <Button size="sm" variant="outline" onClick={() => invite(e)} className="rounded-lg">Inviter</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
