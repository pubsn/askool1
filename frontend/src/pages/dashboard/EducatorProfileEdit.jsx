import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Loader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import api, { API_ROOT } from "@/lib/api";
import FileUpload from "@/components/FileUpload";
import SecureFile from "@/components/SecureFile";
import { Trash2, FileText } from "lucide-react";
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
  const [docs, setDocs] = useState([]);
  const [f, setF] = useState({
    profession: "", bio: "", region: "", location: "", subjects: [], levels: [], languages: [],
    specialties: [], services: [], experience_years: 0, hourly_rate: 0, photo: "", available_now: true,
    diplomas: [], experiences: [], availability: { days: [], hours: "", zones: [] }, privacy: {},
  });

  useEffect(() => {
    Promise.all([api.get("/meta"), api.get("/educators/me")]).then(([m, p]) => {
      setMeta(m.data);
      if (p.data.profile) setF((prev) => ({ ...prev, ...p.data.profile, availability: p.data.profile.availability || prev.availability }));
      setLoading(false);
    }).catch(() => setLoading(false));
    loadDocs();
  }, []);

  const loadDocs = () => api.get("/uploads/mine").then(({ data }) => setDocs(data.results.filter((d) => d.category === "cv" || d.category === "diploma"))).catch(() => {});
  const removeDoc = async (id) => { try { await api.delete(`/uploads/${id}`); loadDocs(); } catch {} };

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const save = async () => {
    setSaving(true);
    try { await api.put("/educators/me", f); toast.success("Profil enregistré !"); refreshUser(); }
    catch { toast.error("Erreur lors de l'enregistrement."); }
    finally { setSaving(false); }
  };
  const submitVerif = async () => {
    if (docs.length === 0) { toast.error("Ajoutez au moins un document (CV ou diplôme) avant de demander la vérification."); return; }
    try { await api.post("/verifications", { documents: docs.map((d) => ({ file_id: d.file_id, category: d.category, name: d.original_filename })) }); toast.success("Demande de vérification envoyée à l'administrateur."); }
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
            <div>
              <Label>Photo de profil</Label>
              <div className="mt-1 flex items-center gap-3">
                {f.photo ? <img src={f.photo} alt="aperçu" className="h-14 w-14 rounded-xl object-cover" /> : <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-400 text-xs">Photo</span>}
                <FileUpload category="photo" visibility="public" accept="image/*" testId="upload-photo"
                  onUploaded={(file) => set("photo", `${API_ROOT}/files/${file.file_id}`)}>Téléverser une photo</FileUpload>
              </div>
            </div>
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
        <Card title="Documents (CV & diplômes)">
          <p className="mb-3 text-sm text-muted-foreground">Vos documents sont <b>privés</b> et sécurisés. Ils ne sont jamais rendus publics et servent uniquement à la vérification.</p>
          <div className="flex flex-wrap gap-3">
            <FileUpload category="cv" visibility="private" accept=".pdf,image/*" testId="upload-cv" onUploaded={loadDocs}>Téléverser mon CV</FileUpload>
            <FileUpload category="diploma" visibility="private" accept=".pdf,image/*" testId="upload-diploma" onUploaded={loadDocs}>Ajouter un diplôme</FileUpload>
          </div>
          {docs.length > 0 && (
            <div className="mt-4 space-y-2">
              {docs.map((d) => (
                <div key={d.file_id} data-testid={`doc-${d.file_id}`} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="flex items-center gap-3">
                    {(d.content_type || "").startsWith("image") ? <SecureFile fileId={d.file_id} contentType={d.content_type} filename={d.original_filename} className="h-10 w-10 rounded object-cover" /> : <FileText size={18} className="text-askool-blue" />}
                    <div>
                      <div className="text-sm font-medium text-gray-800">{d.original_filename}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="rounded bg-gray-200 px-1.5 py-0.5">{d.category === "cv" ? "CV" : "Diplôme"}</span><span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">Privé</span></div>
                    </div>
                  </div>
                  <button data-testid={`del-doc-${d.file_id}`} onClick={() => removeDoc(d.file_id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Confidentialité">
          <p className="mb-3 text-sm text-muted-foreground">Choisissez ce que les visiteurs de votre profil peuvent voir. Vos documents (CV, diplômes, pièces d'identité) restent toujours privés.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[["contact", "Coordonnées (téléphone, email)"], ["location", "Localisation précise"], ["experience", "Diplômes & expériences"]].map(([k, label]) => (
              <div key={k}><Label className="text-sm">{label}</Label>
                <select data-testid={`privacy-${k}`} value={f.privacy?.[k] || "public"} onChange={(e) => set("privacy", { ...(f.privacy || {}), [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  <option value="public">Visible publiquement</option><option value="after_contact">Visible après contact</option><option value="private">Privé</option>
                </select></div>
            ))}
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
