import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Loader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function Chips({ label, options, value, onChange, testId }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-2 flex flex-wrap gap-2" data-testid={testId}>
        {options.map((o) => (
          <button key={o} type="button" onClick={() => toggle(o)}
            className={cn("rounded-full border px-3 py-1 text-sm transition-colors", value.includes(o) ? "border-askool-blue bg-askool-blue text-white" : "border-gray-200 text-gray-600 hover:border-gray-300")}>{o}</button>
        ))}
      </div>
    </div>
  );
}

export default function EducatorProfileEdit() {
  const { refreshUser } = useAuth();
  const [meta, setMeta] = useState({ subjects: [], levels: [], regions: [], service_types: [], languages: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    profession: "", bio: "", region: "", location: "", subjects: [], levels: [], languages: [],
    specialties: [], services: [], experience_years: 0, hourly_rate: 0, photo: "", available_now: true,
    diplomas: [], experiences: [], availability: { days: [], hours: "", zones: [] },
  });

  useEffect(() => {
    Promise.all([api.get("/meta"), api.get("/educators/me")]).then(([m, p]) => {
      setMeta(m.data);
      if (p.data.profile) setF((prev) => ({ ...prev, ...p.data.profile, availability: p.data.profile.availability || prev.availability }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const save = async () => {
    setSaving(true);
    try { await api.put("/educators/me", f); toast.success("Profil enregistré !"); refreshUser(); }
    catch { toast.error("Erreur lors de l'enregistrement."); }
    finally { setSaving(false); }
  };
  const submitVerif = async () => {
    try { await api.post("/verifications", { documents: [{ type: "diplome", name: "diplome.pdf" }] }); toast.success("Demande de vérification envoyée à l'administrateur."); }
    catch { toast.error("Erreur."); }
  };

  if (loading) return <Loader />;
  const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  return (
    <div>
      <PageHeader title="Mon profil éducateur" subtitle="Valorisez vos compétences pour attirer écoles et apprenants."
        action={<Button data-testid="save-profile-btn" onClick={save} disabled={saving} className="rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover">{saving ? "Enregistrement…" : "Enregistrer"}</Button>} />
      <div className="space-y-6">
        <Card title="Informations">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Profession</Label><Input data-testid="input-profession" value={f.profession} onChange={(e) => set("profession", e.target.value)} className="mt-1 rounded-lg" placeholder="Ex: Professeur de Mathématiques" /></div>
            <div><Label>Photo (URL)</Label><Input data-testid="input-photo" value={f.photo || ""} onChange={(e) => set("photo", e.target.value)} className="mt-1 rounded-lg" placeholder="https://…" /></div>
            <div><Label>Région</Label>
              <select data-testid="input-region" value={f.region} onChange={(e) => set("region", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Choisir…</option>{meta.regions.map((r) => <option key={r}>{r}</option>)}</select>
            </div>
            <div><Label>Localisation précise</Label><Input data-testid="input-location" value={f.location} onChange={(e) => set("location", e.target.value)} className="mt-1 rounded-lg" placeholder="Ex: Plateau, Dakar" /></div>
          </div>
          <div className="mt-4"><Label>Présentation</Label><Textarea data-testid="input-bio" value={f.bio} onChange={(e) => set("bio", e.target.value)} rows={4} className="mt-1 rounded-lg" /></div>
        </Card>
        <Card title="Compétences">
          <div className="space-y-4">
            <Chips label="Matières" options={meta.subjects} value={f.subjects} onChange={(v) => set("subjects", v)} testId="chips-subjects" />
            <Chips label="Niveaux" options={meta.levels} value={f.levels} onChange={(v) => set("levels", v)} testId="chips-levels" />
            <Chips label="Langues" options={meta.languages} value={f.languages} onChange={(v) => set("languages", v)} testId="chips-languages" />
            <Chips label="Services proposés" options={meta.service_types} value={f.services} onChange={(v) => set("services", v)} testId="chips-services" />
          </div>
        </Card>
        <Card title="Expérience & Tarif">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Années d'expérience</Label><Input data-testid="input-experience" type="number" min="0" value={f.experience_years} onChange={(e) => set("experience_years", parseInt(e.target.value) || 0)} className="mt-1 rounded-lg" /></div>
            <div><Label>Tarif (FCFA/heure)</Label><Input data-testid="input-rate" type="number" min="0" value={f.hourly_rate} onChange={(e) => set("hourly_rate", parseInt(e.target.value) || 0)} className="mt-1 rounded-lg" /></div>
          </div>
        </Card>
        <Card title="Disponibilité">
          <Chips label="Jours disponibles" options={DAYS} value={f.availability?.days || []} onChange={(v) => set("availability", { ...f.availability, days: v })} testId="chips-days" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><Label>Horaires</Label><Input data-testid="input-hours" value={f.availability?.hours || ""} onChange={(e) => set("availability", { ...f.availability, hours: e.target.value })} className="mt-1 rounded-lg" placeholder="Ex: 16h - 19h" /></div>
          </div>
        </Card>
        <Card title="Vérification du profil">
          <p className="mb-3 text-sm text-muted-foreground">Soumettez vos documents (diplômes, pièce d'identité) pour obtenir le badge « Profil vérifié ». Vos documents restent privés.</p>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">Statut : {f.verification_status || "Non vérifié"}</span>
            <Button data-testid="submit-verification-btn" variant="outline" onClick={submitVerif} className="rounded-xl border-askool-blue text-askool-blue">Demander la vérification</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="mb-4 font-display text-lg font-semibold text-gray-900">{title}</h2>{children}</div>;
}
