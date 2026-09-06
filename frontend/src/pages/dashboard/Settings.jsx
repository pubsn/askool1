import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import AvatarCropUpload from "@/components/AvatarCropUpload";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const Card = ({ title, children, testId }) => <div data-testid={testId} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="mb-4 font-display text-lg font-semibold text-gray-900">{title}</h2>{children}</div>;
const Chips = ({ options, value = [], onChange, testId }) => <div className="mt-2 flex flex-wrap gap-2" data-testid={testId}>{options.map((o) => <button key={o} type="button" onClick={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])} className={cn("rounded-full border px-3 py-1 text-sm", value.includes(o) ? "border-askool-blue bg-askool-blue text-white" : "border-gray-200 text-gray-600")}>{o}</button>)}</div>;
const NOTIFS = [["school_news", "Actualités des écoles suivies"], ["enrollment", "Inscriptions et réponses des écoles"], ["messages", "Nouveaux messages"], ["recommendations", "Recommandations d'écoles et de tuteurs"], ["bookings", "Rendez-vous et cours"]];

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const isParent = user?.role === "PARENT" || user?.role === "ADULT_LEARNER";
  const [meta, setMeta] = useState({ regions: [], languages: [] });
  const [smeta, setSmeta] = useState({ school_levels: [], family_services: [], education_systems: [] });
  const [f, setF] = useState({ name: user?.name || "", phone: user?.phone || "", city: user?.city || "", preferred_language: user?.preferred_language || "Français", search_prefs: user?.search_prefs || {}, privacy: user?.privacy || {}, notification_prefs: user?.notification_prefs || {} });
  useEffect(() => { if (isParent) { api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {}); api.get("/schools/meta").then(({ data }) => setSmeta(data)).catch(() => {}); } }, [isParent]);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const sp = (k, v) => set("search_prefs", { ...f.search_prefs, [k]: v });
  const save = async () => { try { await api.put("/users/me/profile", f); await refreshUser(); toast.success("Profil enregistré"); } catch (e) { toast.error(e.response?.data?.detail || "Erreur"); } };
  const locate = () => navigator.geolocation?.getCurrentPosition((p) => { set("search_prefs", { ...f.search_prefs, lat: p.coords.latitude, lng: p.coords.longitude }); toast.success("Position enregistrée pour les recommandations"); }, () => toast.error("Position refusée"));
  const del = async () => { try { await api.delete("/account"); toast.success("Compte supprimé"); await logout(); navigate("/"); } catch { toast.error("Erreur"); } };
  const setAvatar = async (url) => { await api.put("/users/me/avatar", { avatar_url: url }); await refreshUser(); };
  return (
    <div>
      <PageHeader title={isParent ? "Mon profil" : "Paramètres"} subtitle="Gérez votre compte, vos préférences et votre confidentialité." action={isParent && <Button data-testid="save-profile-btn" onClick={save} className="rounded-xl bg-askool-blue text-white">Enregistrer</Button>} />
      <div className="space-y-6">
        <Card title="Photo de profil"><AvatarCropUpload current={user?.avatar_url} onChange={setAvatar} testId="avatar" /></Card>
        {isParent ? (
          <>
            <Card title="Informations personnelles" testId="parent-profile-card">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Nom complet</Label><Input data-testid="profile-name" value={f.name} onChange={(e) => set("name", e.target.value)} className="mt-1 rounded-lg" /></div>
                <div><Label>Email</Label><Input value={user?.email || ""} disabled className="mt-1 rounded-lg bg-gray-50" /></div>
                <div><Label>Téléphone</Label><Input data-testid="profile-phone" value={f.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1 rounded-lg" /></div>
                <div><Label>Ville</Label><select data-testid="profile-city" value={f.city} onChange={(e) => set("city", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Choisir…</option>{meta.regions.map((r) => <option key={r}>{r}</option>)}</select></div>
                <div><Label>Langue préférée</Label><select data-testid="profile-language" value={f.preferred_language} onChange={(e) => set("preferred_language", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">{(meta.languages.length ? meta.languages : ["Français"]).map((l) => <option key={l}>{l}</option>)}</select></div>
              </div>
            </Card>
            <Card title="Préférences de recherche d'école" testId="search-prefs-card">
              <p className="mb-3 text-sm text-muted-foreground">Utilisées pour « Écoles recommandées pour votre enfant ».</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Zone recherchée</Label><select data-testid="pref-region" value={f.search_prefs.region || ""} onChange={(e) => sp("region", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Ma ville</option>{meta.regions.map((r) => <option key={r}>{r}</option>)}</select></div>
                <div><Label>Système éducatif souhaité</Label><select data-testid="pref-system" value={f.search_prefs.education_system || ""} onChange={(e) => sp("education_system", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Indifférent</option>{(smeta.education_systems || []).map((r) => <option key={r}>{r}</option>)}</select></div>
                <div className="sm:col-span-2"><Label>Langues d'enseignement souhaitées</Label><Chips options={meta.languages} value={f.search_prefs.languages || []} onChange={(v) => sp("languages", v)} testId="pref-languages" /></div>
                <div className="sm:col-span-2"><Label>Services importants</Label><Chips options={smeta.family_services || []} value={f.search_prefs.services || []} onChange={(v) => sp("services", v)} testId="pref-services" /></div>
                <div className="sm:col-span-2 flex items-center gap-3"><Button type="button" variant="outline" data-testid="pref-locate" onClick={locate} className="rounded-xl">Utiliser ma position</Button>{f.search_prefs.lat && <span className="text-xs text-emerald-600">Position enregistrée ✓</span>}</div>
              </div>
            </Card>
            <Card title="Confidentialité" testId="privacy-card">
              <p className="mb-3 text-sm text-muted-foreground">Votre profil public reste minimal. Les informations de vos enfants, votre adresse, vos documents et vos demandes sont toujours privés.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[["photo", "Photo de profil"], ["city", "Ville"], ["phone", "Téléphone"]].map(([k, l]) => <div key={k}><Label className="text-sm">{l}</Label><select data-testid={`privacy-${k}`} value={f.privacy[k] || (k === "phone" ? "private" : "public")} onChange={(e) => set("privacy", { ...f.privacy, [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="public">Visible publiquement</option><option value="after_contact">Visible après contact</option><option value="private">Privé</option></select></div>)}
              </div>
            </Card>
            <Card title="Notifications" testId="notif-card">
              <div className="space-y-2">{NOTIFS.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm text-gray-700"><input data-testid={`notif-${k}`} type="checkbox" checked={f.notification_prefs[k] !== false} onChange={(e) => set("notification_prefs", { ...f.notification_prefs, [k]: e.target.checked })} /> {l}</label>)}</div>
            </Card>
          </>
        ) : (
          <Card title="Informations du compte">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Nom</Label><Input value={user?.name || ""} disabled className="mt-1 rounded-lg bg-gray-50" /></div>
              <div><Label>Email</Label><Input value={user?.email || ""} disabled className="mt-1 rounded-lg bg-gray-50" /></div>
              <div><Label>Rôle</Label><Input value={user?.role || ""} disabled className="mt-1 rounded-lg bg-gray-50" /></div>
              <div><Label>Email vérifié</Label><Input value={user?.email_verified ? "Oui ✓" : "Non"} disabled className="mt-1 rounded-lg bg-gray-50" /></div>
            </div>
          </Card>
        )}
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
          <h2 className="mb-2 font-display text-lg font-semibold text-red-700">Zone dangereuse</h2>
          <p className="mb-4 text-sm text-red-600">La suppression de votre compte est définitive.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button data-testid="delete-account-btn" variant="destructive" className="rounded-xl">Supprimer mon compte</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Toutes vos données seront supprimées.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction data-testid="confirm-delete-btn" onClick={del} className="bg-red-600">Supprimer définitivement</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
