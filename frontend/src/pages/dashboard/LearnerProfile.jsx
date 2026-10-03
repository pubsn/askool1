import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Pencil, GraduationCap, Building2, BookOpen, Target, Lock, Calendar, FileText, Heart, Bell, Search, Sparkles, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Loader, Tag } from "@/components/common";

const ActionCard = ({ icon: Icon, title, onClick }) => (
  <button onClick={onClick} data-testid={`action-${title}`} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-askool-bluelight text-askool-blue"><Icon size={20} /></span>
    <span className="font-display font-semibold text-gray-900">{title}</span>
  </button>
);
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AvatarCropUpload from "@/components/AvatarCropUpload";
import EducatorCard from "@/components/EducatorCard";
import SchoolCard from "@/components/SchoolCard";
import NewsFeed from "@/components/NewsFeed";
import LearningPath from "@/components/LearningPath";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STATUSES = ["Élève", "Étudiant", "Apprenant"];
const LEVELS = ["Collège", "Lycée", "Formation professionnelle", "Licence", "Master", "Doctorat", "Autre"];
const EMPTY = { status: "Apprenant", study_level: "", current_institution: "", field: "", subjects: [], objectives: "", location: "" };

export default function LearnerProfile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ subjects: [], regions: [] });
  const [ov, setOv] = useState({});
  const [reco, setReco] = useState(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ ...EMPTY, ...(user?.learner_profile || {}) });
  const [privacy, setPrivacy] = useState(user?.privacy || {});
  useEffect(() => {
    api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {});
    api.get("/learner/overview").then(({ data }) => setOv(data)).catch(() => {});
    api.get("/learner/recommendations").then(({ data }) => setReco(data)).catch(() => setReco({ educators: [], schools: [], formations: [] }));
  }, [user?.learner_profile]);
  const lp = user?.learner_profile || {};
  const save = async () => {
    try { await api.put("/users/me/profile", { learner_profile: f, privacy, city: f.location || user?.city }); await refreshUser(); toast.success("Profil enregistré"); setOpen(false); }
    catch (e) { toast.error(e.response?.data?.detail || "Erreur"); }
  };
  const support = async () => {
    try { const { data } = await api.get("/support/contact"); await api.post("/messages", { recipient_user_id: data.user_id, content: "Bonjour, j'ai besoin d'aide concernant mon compte ASKOOL.", context: "Support ASKOOL" }); navigate("/dashboard/messages"); }
    catch { toast.error("Support indisponible pour le moment."); }
  };
  const Act = ({ icon: Icon, label, value, to, testId }) => (
    <button data-testid={testId} onClick={() => navigate(to)} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-askool-bluelight text-askool-blue"><Icon size={18} /></span><span className="font-medium text-gray-900">{label}</span></div>
      <span className="font-display text-2xl font-bold text-askool-blue">{value ?? 0}</span>
    </button>
  );
  return (
    <div data-testid="learner-profile">
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="h-28 bg-askool-blue" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="-mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-askool-bluelight shadow-md">
            {user?.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center font-display text-3xl font-bold text-askool-blue">{user?.name?.charAt(0)}</span>}
          </div>
          <div className="flex-1 sm:pt-4">
            <h1 className="font-display text-2xl font-bold text-gray-900" data-testid="learner-name">{user?.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span data-testid="learner-status" className="rounded-full bg-askool-orangelight px-2.5 py-0.5 text-xs font-semibold text-askool-orangehover">{lp.status || "Apprenant"}</span>
              {(lp.location || user?.city) && <span className="flex items-center gap-1"><MapPin size={14} /> {lp.location || user?.city}</span>}
              {lp.study_level && <span className="flex items-center gap-1"><GraduationCap size={14} /> {lp.study_level}</span>}
            </div>
          </div>
          <Button data-testid="edit-learner-profile" onClick={() => { setF({ ...EMPTY, ...lp }); setOpen(true); }} className="rounded-xl bg-askool-blue text-white sm:mb-1"><Pencil size={15} /> Modifier le profil</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2" data-testid="learner-info">
          <h2 className="mb-3 font-display text-lg font-semibold text-gray-900">Informations principales</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[["Niveau d'étude", lp.study_level], ["Établissement actuel", lp.current_institution], ["Domaine / filière", lp.field], ["Localisation", lp.location || user?.city]].map(([l, v]) => <div key={l} className="rounded-lg bg-gray-50 px-4 py-3"><div className="text-xs text-muted-foreground">{l}</div><div className="text-sm font-medium text-gray-900">{v || <span className="text-gray-400">Non renseigné</span>}</div></div>)}
          </div>
          <div className="mt-3"><div className="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-500"><BookOpen size={12} /> Matières recherchées</div>{lp.subjects?.length ? <div className="flex flex-wrap gap-1.5">{lp.subjects.map((s) => <Tag key={s}>{s}</Tag>)}</div> : <p className="text-sm text-gray-400">Ajoutez vos matières pour de meilleures recommandations.</p>}</div>
          <div className="mt-3"><div className="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-500"><Target size={12} /> Objectifs d'apprentissage</div><p className="text-sm text-gray-700">{lp.objectives || <span className="text-gray-400">Non renseigné</span>}</p></div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-gray-900"><Lock size={16} className="text-askool-blue" /> Confidentialité</h2>
          <p className="text-xs text-muted-foreground">Votre adresse, téléphone, documents et informations administratives ne sont jamais affichés publiquement.</p>
          <div className="mt-3 space-y-1 text-sm text-gray-700">{[["photo", "Photo"], ["city", "Localisation"], ["study", "Niveau & matières"]].map(([k, l]) => <div key={k} className="flex justify-between"><span>{l}</span><span className="text-xs font-medium text-askool-blue">{{ public: "Public", after_contact: "Après contact", private: "Privé" }[privacy[k] || "public"]}</span></div>)}</div>
          <Button variant="outline" data-testid="learner-support" onClick={support} className="mt-4 w-full rounded-xl"><LifeBuoy size={15} /> Contacter le support ASKOOL</Button>
        </div>
      </div>

      <div className="mt-6"><LearningPath /></div>

      <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-gray-900">Mes activités</h2>      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Act icon={Calendar} label="Mes cours" value={ov.bookings} to="/dashboard/reservations" testId="act-bookings" />
        <Act icon={FileText} label="Mes demandes" value={(ov.requests || 0) + (ov.enrollments || 0)} to="/dashboard/demandes" testId="act-requests" />
        <Act icon={Heart} label="Mes éducateurs favoris" value={ov.favorite_educators} to="/dashboard/favoris" testId="act-fav-educators" />
        <Act icon={Building2} label="Mes écoles favorites" value={ov.favorite_schools} to="/dashboard/favoris" testId="act-fav-schools" />
        <Act icon={Bell} label="Mes écoles suivies" value={ov.following} to="/dashboard/favoris" testId="act-following" />
        <Act icon={Search} label="Mes recherches" value={ov.searches} to="/dashboard/alertes" testId="act-searches" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ActionCard icon={Search} title="Trouver un éducateur" onClick={() => navigate("/dashboard/tuteurs")} />
        <ActionCard icon={Building2} title="Trouver une école" onClick={() => navigate("/dashboard/ecoles")} />
        <ActionCard icon={GraduationCap} title="Trouver une formation" onClick={() => navigate("/dashboard/ecoles?type=formation")} />
      </div>

      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm" data-testid="learner-recommendations">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-gray-900"><Sparkles size={18} className="text-askool-orange" /> Recommandé pour toi</h2>
        <p className="mb-4 text-xs text-muted-foreground">Basé sur ton niveau, tes matières, tes objectifs et ta localisation.</p>
        {reco === null ? <Loader /> : (
          <div className="space-y-6">
            <div><h3 className="mb-2 text-sm font-semibold text-gray-700">Éducateurs recommandés</h3>{reco.educators.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{reco.educators.map((e) => <div key={e.user_id} className="relative"><span className="absolute right-3 top-3 z-10 rounded-full bg-askool-blue px-2 py-0.5 text-[11px] font-bold text-white">{e.match_score}%</span><EducatorCard edu={e} /></div>)}</div> : <p className="text-sm text-gray-400">Aucun éducateur trouvé.</p>}</div>
            <div><h3 className="mb-2 text-sm font-semibold text-gray-700">Écoles recommandées</h3>{reco.schools.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{reco.schools.map((s) => <SchoolCard key={s.school_id} school={s} matchScore={s.match_score} matchReasons={s.match_reasons} />)}</div> : <p className="text-sm text-gray-400">Aucune école trouvée.</p>}</div>
            <div><h3 className="mb-2 text-sm font-semibold text-gray-700">Formations recommandées</h3>{reco.formations.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{reco.formations.map((s) => <SchoolCard key={s.school_id} school={s} matchScore={s.match_score} matchReasons={s.match_reasons} />)}</div> : <p className="text-sm text-gray-400">Aucun centre de formation référencé pour le moment.</p>}</div>
          </div>
        )}
      </div>
      <div className="mt-6"><NewsFeed /></div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="learner-edit-dialog"><DialogHeader><DialogTitle>Modifier mon profil</DialogTitle><DialogDescription>Ces informations personnalisent tes recommandations.</DialogDescription></DialogHeader>
          <AvatarCropUpload current={user?.avatar_url} onChange={async (url) => { await api.put("/users/me/avatar", { avatar_url: url }); await refreshUser(); }} testId="learner-avatar" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Statut</Label><select data-testid="lp-status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><Label>Niveau d'étude</Label><select data-testid="lp-level" value={f.study_level} onChange={(e) => setF({ ...f, study_level: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Choisir…</option>{LEVELS.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><Label>Établissement actuel (facultatif)</Label><Input data-testid="lp-institution" value={f.current_institution} onChange={(e) => setF({ ...f, current_institution: e.target.value })} className="mt-1 rounded-lg" /></div>
            <div><Label>Domaine / filière</Label><Input data-testid="lp-field" value={f.field} onChange={(e) => setF({ ...f, field: e.target.value })} className="mt-1 rounded-lg" placeholder="Informatique, Comptabilité…" /></div>
            <div className="sm:col-span-2"><Label>Localisation</Label><select data-testid="lp-location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Choisir…</option>{meta.regions.map((r) => <option key={r}>{r}</option>)}</select></div>
            <div className="sm:col-span-2"><Label>Matières recherchées</Label><div className="mt-2 flex flex-wrap gap-2" data-testid="lp-subjects">{meta.subjects.map((s) => <button key={s} type="button" onClick={() => setF({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s] })} className={cn("rounded-full border px-3 py-1 text-xs", f.subjects.includes(s) ? "border-askool-blue bg-askool-blue text-white" : "border-gray-200 text-gray-600")}>{s}</button>)}</div></div>
            <div className="sm:col-span-2"><Label>Objectifs d'apprentissage</Label><Textarea data-testid="lp-objectives" value={f.objectives} onChange={(e) => setF({ ...f, objectives: e.target.value })} rows={3} className="mt-1 rounded-lg" placeholder="Réussir mon BTS, améliorer mon anglais professionnel…" /></div>
            <div className="sm:col-span-2 grid gap-2 sm:grid-cols-3">{[["photo", "Photo"], ["city", "Localisation"], ["study", "Niveau & matières"]].map(([k, l]) => <div key={k}><Label className="text-xs">{l}</Label><select data-testid={`lp-privacy-${k}`} value={privacy[k] || "public"} onChange={(e) => setPrivacy({ ...privacy, [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs"><option value="public">Public</option><option value="after_contact">Après contact</option><option value="private">Privé</option></select></div>)}</div>
          </div>
          <Button data-testid="lp-save" onClick={save} className="w-full rounded-xl bg-askool-blue text-white">Enregistrer</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
