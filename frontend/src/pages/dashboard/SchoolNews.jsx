import React, { useEffect, useState } from "react";
import { Newspaper, Trash2, Bell, Pencil, Eye, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Loader, EmptyState, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/FileUpload";
import api, { API_ROOT } from "@/lib/api";

export const CAT_COLORS = { "Actualité": "bg-askool-bluelight text-askool-blue", "Événement": "bg-emerald-50 text-emerald-700", "Inscription": "bg-emerald-100 text-emerald-800", "Vie scolaire": "bg-sky-50 text-sky-700", "Résultats": "bg-violet-50 text-violet-700", "Information aux parents": "bg-amber-50 text-amber-700", "Activité": "bg-teal-50 text-teal-700", "Besoin de recrutement": "bg-askool-orangelight text-askool-orangehover", "Annonce": "bg-gray-100 text-gray-700" };
const EMPTY = { title: "", content: "", category: "Actualité", images: [], video_url: "" };

export default function SchoolNews() {
  const [posts, setPosts] = useState(null);
  const [cats, setCats] = useState(Object.keys(CAT_COLORS));
  const [stats, setStats] = useState({});
  const [f, setF] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [sending, setSending] = useState(false);
  const load = () => { api.get("/schools/me/posts").then(({ data }) => setPosts(data.results)).catch(() => setPosts([])); api.get("/schools/me/posts/stats").then(({ data }) => setStats(data)).catch(() => {}); };
  useEffect(() => { load(); api.get("/schools/meta").then(({ data }) => data.post_categories && setCats(data.post_categories)).catch(() => {}); }, []);
  const publish = async () => {
    if (!f.title.trim() || !f.content.trim()) return toast.error("Titre et contenu requis.");
    setSending(true);
    try {
      if (editing) { await api.put(`/schools/me/posts/${editing}`, f); toast.success("Publication modifiée"); }
      else { const { data } = await api.post("/schools/me/posts", f); toast.success(`Publié ! ${data.notified} abonné(s) notifié(s).`); }
      setF(EMPTY); setEditing(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || "Erreur"); } finally { setSending(false); }
  };
  const remove = async (id) => { try { await api.delete(`/schools/me/posts/${id}`); toast.success("Supprimée"); load(); } catch { toast.error("Erreur"); } };
  const startEdit = (p) => { setEditing(p.post_id); setF({ title: p.title, content: p.content, category: p.category, images: p.images || (p.image ? [p.image] : []), video_url: p.video_url || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <div>
      <PageHeader title="Mes publications" subtitle="Publiez vos actualités, événements, inscriptions et informations aux familles : vos abonnés sont notifiés." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Newspaper} label="Publications" value={stats.posts || 0} testId="news-stat-posts" />
        <StatCard icon={Eye} label="Vues" value={stats.views || 0} accent="orange" testId="news-stat-views" />
        <StatCard icon={Users} label="Abonnés" value={stats.followers || 0} accent="green" testId="news-stat-followers" />
        <StatCard icon={BarChart3} label="Abonnés atteints" value={stats.reached || 0} testId="news-stat-reached" />
      </div>
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm" data-testid="news-form">
        {editing && <div className="mb-3 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"><span>Modification d'une publication</span><button onClick={() => { setEditing(null); setF(EMPTY); }} className="underline">Annuler</button></div>}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2"><Label>Titre</Label><Input data-testid="news-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="mt-1 rounded-lg" placeholder="Ouverture des inscriptions 2027-2028" /></div>
          <div><Label>Catégorie</Label><select data-testid="news-category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">{cats.map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="mt-4"><Label>Contenu</Label><Textarea data-testid="news-content" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} rows={4} className="mt-1 rounded-lg" placeholder="Décrivez l'actualité, l'événement ou l'information…" /></div>
        <div className="mt-4"><Label>Vidéo YouTube (lien, optionnel)</Label><Input data-testid="news-video" value={f.video_url} onChange={(e) => setF({ ...f, video_url: e.target.value })} className="mt-1 rounded-lg" placeholder="https://www.youtube.com/watch?v=…" /></div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <FileUpload category="photo" visibility="public" accept="image/*" testId="news-upload-image" onUploaded={(file) => setF((p) => ({ ...p, images: [...p.images, `${API_ROOT}/files/${file.file_id}`] }))}>Ajouter une image</FileUpload>
          {f.images.map((u, i) => <span key={i} className="relative"><img src={u} alt="" className="h-12 w-12 rounded-lg object-cover" /><button onClick={() => setF((p) => ({ ...p, images: p.images.filter((_, j) => j !== i) }))} className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 text-red-500 shadow"><Trash2 size={10} /></button></span>)}
          <Button data-testid="news-publish" onClick={publish} disabled={sending} className="ml-auto rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover"><Bell size={16} /> {sending ? "Envoi…" : editing ? "Enregistrer" : "Publier et notifier"}</Button>
        </div>
      </div>
      {posts === null ? <Loader /> : posts.length === 0 ? <EmptyState icon={Newspaper} title="Aucune publication" description="Votre première publication apparaîtra sur votre profil public." /> : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.post_id} data-testid={`news-${p.post_id}`} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              {(p.images?.[0] || p.image) && <img src={p.images?.[0] || p.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CAT_COLORS[p.category] || "bg-gray-100"}`}>{p.category}</span><span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("fr-FR")} · {p.views || 0} vues · {p.notified || 0} notifiés</span></div>
                <h3 className="mt-1 font-display font-semibold text-gray-900">{p.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{p.content}</p>
              </div>
              <div className="flex flex-col gap-2 self-start"><button data-testid={`news-edit-${p.post_id}`} onClick={() => startEdit(p)} className="text-gray-400 hover:text-askool-blue"><Pencil size={16} /></button><button data-testid={`news-delete-${p.post_id}`} onClick={() => remove(p.post_id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
