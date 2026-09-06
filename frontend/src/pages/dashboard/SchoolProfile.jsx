import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, ExternalLink, ShieldCheck } from "lucide-react";
import { PageHeader, Loader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/FileUpload";
import { cn } from "@/lib/utils";
import api, { API_ROOT } from "@/lib/api";

const TABS = ["Identité", "Localisation", "Contact", "Présentation", "Enseignement", "Infrastructures", "Infos pratiques", "FAQ", "Galerie", "Vérification"];
const INIT = { name: "", commercial_name: "", school_type: "", status: "", founded_year: "", students_count: "", teachers_count: "", levels: [], languages: [], education_system: "", description: "", history: "", mission: "", values: "", pedagogy: "", region: "", city: "", district: "", location: "", directions: "", lat: null, lng: null, hide_exact_location: false, phone: "", email: "", website: "", whatsapp: "", socials: {}, contact_visibility: "public", subjects: [], programs: "", methods: "", school_life: [], infrastructures: [], services: [], gallery: [], recruiting: [], contract_types: [], logo: "", cover: "", education_systems: [], registration_fee: "", tuition_fee: "", payment_terms: "", schedule: "", school_calendar: "", admission_conditions: "", min_age: "", required_documents: [], registration_periods: "", available_seats: "", enrollment_open: false, accept_enrollment_requests: false, faq: [] };

function Chips({ label, options, value = [], onChange, testId }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div><Label className="text-sm">{label}</Label>
      <div className="mt-2 flex flex-wrap gap-2" data-testid={testId}>{options.map((o) => <button key={o} type="button" onClick={() => toggle(o)} className={cn("rounded-full border px-3 py-1 text-sm transition-colors", value.includes(o) ? "border-askool-blue bg-askool-blue text-white" : "border-gray-200 text-gray-600 hover:border-gray-300")}>{o}</button>)}</div>
    </div>
  );
}
function ListEditor({ label, value = [], onChange, placeholder, testId }) {
  const [v, setV] = useState("");
  const add = () => { if (v.trim()) { onChange([...value, v.trim()]); setV(""); } };
  return (
    <div><Label className="text-sm">{label}</Label>
      <div className="mt-1 flex gap-2"><Input data-testid={`${testId}-input`} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder={placeholder} className="rounded-lg" /><Button type="button" data-testid={`${testId}-add`} onClick={add} variant="outline" className="rounded-lg">Ajouter</Button></div>
      <div className="mt-2 flex flex-wrap gap-2">{value.map((x, i) => <span key={i} className="inline-flex items-center gap-1 rounded-full bg-askool-bluelight px-3 py-1 text-xs text-askool-blue">{x}<button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 size={12} /></button></span>)}</div>
    </div>
  );
}
const Field = ({ label, k, f, set, type = "text", placeholder, span }) => (
  <div className={span ? "sm:col-span-2" : ""}><Label>{label}</Label><Input data-testid={`school-${k}`} type={type} value={f[k] ?? ""} onChange={(e) => set(k, type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} className="mt-1 rounded-lg" placeholder={placeholder} /></div>
);
const Area = ({ label, k, f, set, rows = 3, placeholder }) => (
  <div><Label>{label}</Label><Textarea data-testid={`school-${k}`} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} rows={rows} className="mt-1 rounded-lg" placeholder={placeholder} /></div>
);

export default function SchoolProfile() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ regions: [], subjects: [], languages: [] });
  const [smeta, setSmeta] = useState({ school_types: [], school_levels: [], recruiting: [], contract_types: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Identité");
  const [f, setF] = useState(INIT);
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    Promise.all([api.get("/meta"), api.get("/schools/meta"), api.get("/schools/me")]).then(([m, sm, s]) => {
      setMeta(m.data); setSmeta(sm.data); if (s.data.school) setF((p) => ({ ...p, ...s.data.school })); setLoading(false);
    }).catch(() => setLoading(false));
    api.get("/uploads/mine").then(({ data }) => setDocs(data.results.filter((d) => d.visibility === "private"))).catch(() => {});
  }, []);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const save = async () => {
    if (!f.name.trim()) return toast.error("Le nom de l'établissement est requis.");
    const payload = { ...f, founded_year: f.founded_year || null, students_count: f.students_count || null, teachers_count: f.teachers_count || null, min_age: f.min_age || null, available_seats: f.available_seats || null };
    try { const { data } = await api.put("/schools/me", payload); setF((p) => ({ ...p, ...data.school })); toast.success("Établissement enregistré !"); } catch (e) { toast.error(e.response?.data?.detail || "Erreur"); }
  };
  const submitVerif = async () => {
    if (docs.length === 0) return toast.error("Téléversez au moins un document (agrément, registre, etc.).");
    try { await api.post("/verifications", { documents: docs.map((d) => ({ file_id: d.file_id, category: d.category, name: d.original_filename })) }); toast.success("Demande de vérification envoyée."); set("verification_status", "En cours de vérification"); } catch { toast.error("Erreur."); }
  };
  const fileUrl = (file) => `${API_ROOT}/files/${file.file_id}`;
  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="Mon établissement" subtitle="Construisez une fiche établissement complète et professionnelle." action={
        <div className="flex gap-2">
          {f.slug && <Button data-testid="view-public-school" variant="outline" onClick={() => navigate(`/ecoles/${f.slug}`)} className="rounded-xl"><ExternalLink size={16} /> Voir ma page publique</Button>}
          <Button data-testid="save-school-btn" onClick={save} className="rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover">Enregistrer</Button>
        </div>} />
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 hide-scrollbar">
        {TABS.map((t) => <button key={t} data-testid={`school-tab-${t}`} onClick={() => setTab(t)} className={cn("whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium", tab === t ? "bg-askool-blue text-white" : "text-gray-500 hover:bg-gray-50")}>{t}</button>)}
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {tab === "Identité" && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <div className="relative h-40 bg-askool-bluelight">{f.cover && <img src={f.cover} alt="couverture" data-testid="school-cover-preview" className="h-full w-full object-cover" />}
                <div className="absolute bottom-3 right-3"><FileUpload category="photo" visibility="public" accept="image/*" testId="upload-school-cover" onUploaded={(file) => set("cover", fileUrl(file))}>Photo de couverture</FileUpload></div>
              </div>
              <div className="flex items-center gap-4 p-4">
                {f.logo ? <img src={f.logo} alt="logo" data-testid="school-logo-preview" className="h-16 w-16 rounded-xl object-cover" /> : <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400">Logo</span>}
                <FileUpload category="photo" visibility="public" accept="image/*" testId="upload-school-logo" onUploaded={(file) => set("logo", fileUrl(file))}>Téléverser le logo</FileUpload>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom officiel *" k="name" f={f} set={set} /><Field label="Nom commercial" k="commercial_name" f={f} set={set} />
              <div><Label>Type d'établissement</Label><select data-testid="school-school_type" value={f.school_type} onChange={(e) => set("school_type", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Choisir…</option>{smeta.school_types.map((r) => <option key={r}>{r}</option>)}</select></div>
              <Field label="Statut" k="status" f={f} set={set} placeholder="Privé laïc, confessionnel, public…" />
              <Field label="Année de création" k="founded_year" f={f} set={set} type="number" /><Field label="Système éducatif" k="education_system" f={f} set={set} placeholder="Programme sénégalais" />
              <Field label="Nombre approximatif d'élèves" k="students_count" f={f} set={set} type="number" /><Field label="Nombre d'enseignants" k="teachers_count" f={f} set={set} type="number" />
            </div>
            <Chips label="Niveaux enseignés" options={smeta.school_levels} value={f.levels} onChange={(v) => set("levels", v)} testId="school-levels" />
            <Chips label="Langues d'enseignement" options={meta.languages} value={f.languages} onChange={(v) => set("languages", v)} testId="school-languages" />
            <Chips label="Recrutement" options={smeta.recruiting} value={f.recruiting} onChange={(v) => set("recruiting", v)} testId="school-recruiting" />
            <Chips label="Types de contrat proposés" options={smeta.contract_types} value={f.contract_types} onChange={(v) => set("contract_types", v)} testId="school-contract_types" />
          </div>
        )}
        {tab === "Localisation" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Région</Label><select data-testid="school-region" value={f.region} onChange={(e) => set("region", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Choisir…</option>{meta.regions.map((r) => <option key={r}>{r}</option>)}</select></div>
            <Field label="Ville" k="city" f={f} set={set} /><Field label="Quartier" k="district" f={f} set={set} /><Field label="Adresse" k="location" f={f} set={set} />
            <div className="sm:col-span-2"><Area label="Indications complémentaires" k="directions" f={f} set={set} rows={2} placeholder="En face de la pharmacie, 2e rue à gauche…" /></div>
            <Field label="Latitude" k="lat" f={f} set={set} type="number" placeholder="14.71" /><Field label="Longitude" k="lng" f={f} set={set} type="number" placeholder="-17.46" />
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input data-testid="school-hide-location" type="checkbox" checked={!!f.hide_exact_location} onChange={(e) => set("hide_exact_location", e.target.checked)} /> Masquer l'adresse exacte et la carte au public</label>
          </div>
        )}
        {tab === "Contact" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Téléphone professionnel" k="phone" f={f} set={set} /><Field label="Email professionnel" k="email" f={f} set={set} type="email" />
            <Field label="WhatsApp professionnel" k="whatsapp" f={f} set={set} /><Field label="Site internet" k="website" f={f} set={set} placeholder="https://" />
            {["facebook", "instagram", "linkedin"].map((n) => <div key={n}><Label className="capitalize">{n}</Label><Input data-testid={`school-social-${n}`} value={f.socials?.[n] || ""} onChange={(e) => set("socials", { ...f.socials, [n]: e.target.value })} className="mt-1 rounded-lg" placeholder="https://" /></div>)}
            <div><Label>Visibilité des coordonnées</Label>
              <select data-testid="school-contact_visibility" value={f.contact_visibility} onChange={(e) => set("contact_visibility", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <option value="public">Visible publiquement</option><option value="after_contact">Visible après un premier contact</option><option value="private">Privé (messagerie uniquement)</option>
              </select></div>
          </div>
        )}
        {tab === "Présentation" && (
          <div className="space-y-4">
            <Area label="Présentation de l'école" k="description" f={f} set={set} rows={5} /><Area label="Histoire" k="history" f={f} set={set} /><Area label="Mission" k="mission" f={f} set={set} rows={2} /><Area label="Valeurs" k="values" f={f} set={set} rows={2} /><Area label="Méthode pédagogique" k="pedagogy" f={f} set={set} />
          </div>
        )}
        {tab === "Enseignement" && (
          <div className="space-y-5">
            <Chips label="Matières principales" options={meta.subjects} value={f.subjects} onChange={(v) => set("subjects", v)} testId="school-subjects" />
            <Area label="Programmes" k="programs" f={f} set={set} /><Area label="Méthodes pédagogiques" k="methods" f={f} set={set} />
            <ListEditor label="Vie scolaire (clubs, sport, événements…)" value={f.school_life} onChange={(v) => set("school_life", v)} placeholder="Club de robotique" testId="school-life" />
          </div>
        )}
        {tab === "Infrastructures" && (
          <div className="space-y-5">
            <ListEditor label="Infrastructures" value={f.infrastructures} onChange={(v) => set("infrastructures", v)} placeholder="Laboratoire, bibliothèque, cantine…" testId="school-infra" />
            <ListEditor label="Services" value={f.services} onChange={(v) => set("services", v)} placeholder="Transport scolaire, restauration…" testId="school-services" />
          </div>
        )}
        {tab === "Infos pratiques" && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">Ces informations aident les familles. N'indiquez que ce que vous souhaitez communiquer ; les champs vides ne sont pas affichés.</p>
            <Chips label="Systèmes éducatifs / programmes" options={smeta.education_systems || []} value={f.education_systems} onChange={(v) => set("education_systems", v)} testId="school-education_systems" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Frais d'inscription" k="registration_fee" f={f} set={set} placeholder="25 000 FCFA" /><Field label="Frais de scolarité" k="tuition_fee" f={f} set={set} placeholder="À partir de 350 000 FCFA / an" />
              <Field label="Modalités de paiement" k="payment_terms" f={f} set={set} placeholder="3 tranches" /><Field label="Horaires" k="schedule" f={f} set={set} placeholder="8h–13h / 15h–17h" />
              <Field label="Calendrier scolaire" k="school_calendar" f={f} set={set} placeholder="Rentrée le 1er octobre" /><Field label="Conditions d'admission" k="admission_conditions" f={f} set={set} />
              <Field label="Âge minimum" k="min_age" f={f} set={set} type="number" /><Field label="Places disponibles" k="available_seats" f={f} set={set} type="number" />
              <Field label="Périodes d'inscription" k="registration_periods" f={f} set={set} placeholder="Mai à septembre" span />
            </div>
            <ListEditor label="Documents nécessaires à l'inscription" value={f.required_documents} onChange={(v) => set("required_documents", v)} placeholder="Extrait de naissance" testId="school-docs" />
            <label className="flex items-center gap-2 text-sm"><input data-testid="school-enrollment_open" type="checkbox" checked={!!f.enrollment_open} onChange={(e) => set("enrollment_open", e.target.checked)} /> Inscriptions ouvertes actuellement</label>
            <label className="flex items-center gap-2 text-sm"><input data-testid="school-accept_enrollment" type="checkbox" checked={!!f.accept_enrollment_requests} onChange={(e) => set("accept_enrollment_requests", e.target.checked)} /> Accepter les demandes d'inscription en ligne via ASKOOL</label>
          </div>
        )}
        {tab === "FAQ" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Répondez aux questions que les familles posent le plus souvent (niveaux, horaires, frais, cantine, transport, inscription, documents, rentrée).</p>
            {(f.faq || []).map((q, i) => (
              <div key={i} data-testid={`faq-edit-${i}`} className="rounded-xl border border-gray-100 p-3">
                <Input value={q.q} onChange={(e) => set("faq", f.faq.map((x, j) => j === i ? { ...x, q: e.target.value } : x))} placeholder="Question" className="rounded-lg font-medium" />
                <Textarea value={q.a} onChange={(e) => set("faq", f.faq.map((x, j) => j === i ? { ...x, a: e.target.value } : x))} placeholder="Réponse" rows={2} className="mt-2 rounded-lg" />
                <button type="button" onClick={() => set("faq", f.faq.filter((_, j) => j !== i))} className="mt-2 flex items-center gap-1 text-xs text-red-500"><Trash2 size={12} /> Supprimer</button>
              </div>
            ))}
            <Button type="button" data-testid="faq-add" variant="outline" onClick={() => set("faq", [...(f.faq || []), { q: "", a: "" }])} className="rounded-xl">+ Ajouter une question</Button>
          </div>
        )}
        {tab === "Galerie" && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <FileUpload category="photo" visibility="public" accept="image/*" testId="upload-gallery" onUploaded={(file) => set("gallery", [...(f.gallery || []), { url: fileUrl(file), caption: "", category: "Vie scolaire" }])}>Ajouter une photo</FileUpload>
              <span className="text-xs text-muted-foreground">Photos d'événements, salles de classe, activités, infrastructures.</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(f.gallery || []).map((g, i) => (
                <div key={i} data-testid={`gallery-edit-${i}`} className="overflow-hidden rounded-xl border border-gray-100">
                  <img src={g.url} alt="" className="h-36 w-full object-cover" />
                  <div className="space-y-2 p-3">
                    <Input value={g.caption} onChange={(e) => set("gallery", f.gallery.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))} placeholder="Légende" className="rounded-lg text-sm" />
                    <select value={g.category} onChange={(e) => set("gallery", f.gallery.map((x, j) => j === i ? { ...x, category: e.target.value } : x))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm">{["Vie scolaire", "Salles de classe", "Événements", "Activités", "Infrastructures"].map((c) => <option key={c}>{c}</option>)}</select>
                    <button type="button" data-testid={`gallery-remove-${i}`} onClick={() => set("gallery", f.gallery.filter((_, j) => j !== i))} className="flex items-center gap-1 text-xs text-red-500"><Trash2 size={12} /> Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "Vérification" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Obtenez le badge <b>« Établissement vérifié »</b> en soumettant vos documents officiels (agrément, autorisation d'ouverture, NINEA). Ces documents restent strictement privés et ne sont jamais affichés publiquement.</p>
            <div className="flex flex-wrap items-center gap-3">
              <span data-testid="school-verif-status" className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", f.is_verified ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600")}><ShieldCheck size={13} /> Statut : {f.verification_status || "Non vérifié"}</span>
              <FileUpload category="diploma" visibility="private" accept="image/*,application/pdf" testId="upload-school-doc" onUploaded={(file) => setDocs((d) => [file, ...d])}>Ajouter un document</FileUpload>
              <Button data-testid="submit-school-verification" variant="outline" onClick={submitVerif} className="rounded-xl border-askool-blue text-askool-blue">Demander la vérification</Button>
            </div>
            {docs.length > 0 && <ul className="text-sm text-gray-700">{docs.map((d) => <li key={d.file_id}>• {d.original_filename}</li>)}</ul>}
          </div>
        )}
      </div>
    </div>
  );
}
