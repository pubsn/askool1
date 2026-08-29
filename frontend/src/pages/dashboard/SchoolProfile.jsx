import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Loader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

export default function SchoolProfile() {
  const [meta, setMeta] = useState({ regions: [] });
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ name: "", region: "", location: "", description: "", school_type: "", logo: "" });
  useEffect(() => {
    Promise.all([api.get("/meta"), api.get("/schools/me")]).then(([m, s]) => {
      setMeta(m.data); if (s.data.school) setF((p) => ({ ...p, ...s.data.school })); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const save = async () => { try { await api.put("/schools/me", f); toast.success("Établissement enregistré !"); } catch { toast.error("Erreur"); } };
  if (loading) return <Loader />;
  return (
    <div>
      <PageHeader title="Mon établissement" subtitle="Renseignez les informations de votre école." action={<Button data-testid="save-school-btn" onClick={save} className="rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover">Enregistrer</Button>} />
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Nom de l'établissement</Label><Input data-testid="school-name" value={f.name} onChange={(e) => set("name", e.target.value)} className="mt-1 rounded-lg" /></div>
          <div><Label>Type</Label><Input data-testid="school-type" value={f.school_type} onChange={(e) => set("school_type", e.target.value)} className="mt-1 rounded-lg" placeholder="Ex: Privé - Général" /></div>
          <div><Label>Région</Label><select data-testid="school-region" value={f.region} onChange={(e) => set("region", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Choisir…</option>{meta.regions.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className="sm:col-span-2"><Label>Adresse</Label><Input data-testid="school-location" value={f.location} onChange={(e) => set("location", e.target.value)} className="mt-1 rounded-lg" /></div>
        </div>
        <div className="mt-4"><Label>Description</Label><Textarea data-testid="school-description" value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} className="mt-1 rounded-lg" /></div>
      </div>
    </div>
  );
}
