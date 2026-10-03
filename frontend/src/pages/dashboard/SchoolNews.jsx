import React, { useEffect, useState } from "react";
import { Newspaper, Trash2, Bell, Pencil, Eye, Users, CalendarClock, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Loader, EmptyState, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/FileUpload";
import api, { API_ROOT } from "@/lib/api";
import PostReactions from "@/components/PostReactions";
import { useAuth } from "@/context/AuthContext";

export const CAT_COLORS = { "Actualité": "bg-askool-bluelight text-askool-blue", "Événement": "bg-askool-bluelight text-askool-bluedark", "Inscription": "bg-askool-bluepale text-askool-bluedark", "Vie scolaire": "bg-askool-bluelight text-askool-blue", "Résultats": "bg-askool-bluepale text-askool-blue", "Information aux parents": "bg-askool-orangelight text-askool-orangehover", "Activité": "bg-askool-bluelight text-askool-bluedark", "Besoin de recrutement": "bg-askool-orangelight text-askool-orangehover", "Annonce": "bg-askool-bluepale text-askool-text" };
const EMPTY = { title: "", content: "", category: "Actualité", images: [], video_url: "", scheduled_at: "" };
const fmtDateTime = (iso) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const toLocalInput = (iso) => { if (!iso) return ""; const d = new Date(iso); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

export default function SchoolNews() {
  const { user } = useAuth();
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
    const payload = { ...f, scheduled_at: f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null };
    setSending(true);
    try {
      if (editing) { await api.put(`/schools/me/posts/${editing}`, payload); toast.success("Publication modifiée"); }
      else { const { data } = await api.post("/schools/me/posts", payload); toast.success(data.scheduled ? `Programmée pour le ${fmtDateTime(data.post.scheduled_at)}` : `Publié ! ${data.notified} abonné(s) notifié(s).`); }
      setF(EMPTY); setEditing(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || "Erreur"); } finally { setSending(false); }
  };
  const remove = async (id) => { try { await api.delete(`/schools/me/posts/${id}`); toast.success("Supprimée"); load(); } catch { toast.error("Erreur"); } };
  const publishNow = async (id) => { try { const { data } = await api.post(`/schools/me/posts/${id}/publish-now`); toast.success(`Publiée ! ${data.notified} abonné(s) notifié(s).`); load(); } catch (e) { toast.error(e.response?.data?.detail || "Erreur"); } };
  const unschedule = async (id) => { try { await api.post(`/schools/me/posts/${id}/unschedule`); toast.success("Programmation annulée — publication en brouillon"); load(); } catch (e) { toast.error(e.response?.data?.detail || "Erreur"); } };
  const startEdit = (p) => { setEditing(p.post_id); setF({ title: p.title, content: p.content, category: p.category, images: p.images || (p.image ? [p.image] : []), video_url: p.video_url || "", scheduled_at: toLocalInput(p.scheduled_at) }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const pending = (posts || []).filter((p) => p.status === "scheduled" || p.status === "draft");
  const published = (posts || []).filter((p) => !p.status || p.status === "published");
  const editingPost = (posts || []).find((p) => p.post_id === editing);
  const canSchedule = !editing || (editingPost && editingPost.status !== "published" && editingPost.status !== undefined);

  const PostRow = ({ p }) => (
    <div key={p.post_id} data-testid={`news-${p.post_id}`} className="flex gap-4 rounded-2xl border border-askool-border bg-white p-5 shadow-card">
      {(p.images?.[0] || p.image) && <img src={p.images?.[0] || p.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CAT_COLORS[p.category] || "bg-askool-bluepale"}`}>{p.category}</span>
          {p.status === "scheduled" && <span data-testid={`news-scheduled-badge-${p.post_id}`} className="inline-flex items-center gap-1 rounded-full bg-askool-orangelight px-2.5 py-0.5 text-xs font-medium text-askool-orangehover"><CalendarClock size={12} /> Programmée le {fmtDateTime(p.scheduled_at)}</span>}
          {p.status === "draft" && <span data-testid={`news-draft-badge-${p.post_id}`} className="rounded-full bg-askool-bluepale px-2.5 py-0.5 text-xs font-medium text-askool-text">Brouillon</span>}
          <span className="text-xs text-askool-subtle">{new Date(p.created_at).toLocaleDateString("fr-FR")}{(!p.status || p.status === "published") && ` · ${p.views || 0} vues · ${p.notified || 0} notifiés`}</span>
        </div>
        <h3 className="mt-1 font-display font-semibold text-askool-ink">{p.title}</h3>
        <p className="mt-1 whitespace-pre-line text-sm text-askool-text">{p.content}</p>
        {(!p.status || p.status === "published") ? <PostReactions post={p} schoolUserId={user?.user_id} defaultOpen={(p.comments_count || 0) > 0} /> : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button data-testid={`news-publish-now-${p.post_id}`} size="sm" onClick={() => publishNow(p.post_id)} className="rounded-lg bg-askool-blue text-white hover:bg-askool-bluehover"><Send size={14} /> Publier maintenant</Button>
            {p.status === "scheduled" && <Button data-testid={`news-unschedule-${p.post_id}`} size="sm" variant="outline" onClick={() => unschedule(p.post_id)} className="rounded-lg">Annuler la programmation</Button>}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 self-start">
        <button data-testid={`news-edit-${p.post_id}`} onClick={() => startEdit(p)} className="text-askool-subtle transition-colors hover:text-askool-blue"><Pencil size={16} /></button>
        <button data-testid={`news-delete-${p.post_id}`} onClick={() => remove(p.post_id)} className="text-askool-subtle transition-colors hover:text-askool-orange"><Trash2 size={16} /></button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Mes publications" subtitle="Publiez vos actualités, événements, inscriptions et informations aux familles : vos abonnés sont notifiés." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Newspaper} label="Publications" value={stats.posts || 0} testId="news-stat-posts" />
        <StatCard icon={Eye} label="Vues" value={stats.views || 0} accent="orange" testId="news-stat-views" />
        <StatCard icon={Users} label="Abonnés" value={stats.followers || 0} testId="news-stat-followers" />
        <StatCard icon={CalendarClock} label="Programmées" value={stats.scheduled || 0} accent={stats.scheduled ? "orange" : "blue"} testId="news-stat-scheduled" />
      </div>
      <div className="mb-6 rounded-2xl border border-askool-border bg-white p-6 shadow-card" data-testid="news-form">
        {editing && <div className="mb-3 flex items-center justify-between rounded-lg bg-askool-orangelight px-3 py-2 text-sm text-askool-orangehover"><span>Modification d'une publication</span><button onClick={() => { setEditing(null); setF(EMPTY); }} className="underline">Annuler</button></div>}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2"><Label>Titre</Label><Input data-testid="news-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="mt-1 rounded-lg" placeholder="Ouverture des inscriptions 2027-2028" /></div>
          <div><Label>Catégorie</Label><select data-testid="news-category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="mt-1 w-full rounded-lg border border-askool-border bg-askool-surface px-3 py-2 text-sm">{cats.map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="mt-4"><Label>Contenu</Label><Textarea data-testid="news-content" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} rows={4} className="mt-1 rounded-lg" placeholder="Décrivez l'actualité, l'événement ou l'information…" /></div>
        <div className="mt-4"><Label>Vidéo YouTube (lien, optionnel)</Label><Input data-testid="news-video" value={f.video_url} onChange={(e) => setF({ ...f, video_url: e.target.value })} className="mt-1 rounded-lg" placeholder="https://www.youtube.com/watch?v=…" /></div>
        {canSchedule && (
          <div className="mt-4 rounded-xl border border-askool-border bg-askool-surface p-4">
            <Label className="flex items-center gap-2"><CalendarClock size={15} className="text-askool-blue" /> Publier plus tard (optionnel)</Label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Input data-testid="news-schedule" type="datetime-local" value={f.scheduled_at} onChange={(e) => setF({ ...f, scheduled_at: e.target.value })} className="w-auto rounded-lg bg-white" />
              {f.scheduled_at && <button data-testid="news-schedule-clear" onClick={() => setF({ ...f, scheduled_at: "" })} className="text-sm text-askool-blue underline">Publier immédiatement</button>}
            </div>
            <p className="mt-2 text-xs text-askool-subtle">Laissez vide pour publier tout de suite. Sinon la publication reste visible de vous seul puis part automatiquement à l'heure choisie, avec notification des abonnés.</p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <FileUpload category="photo" visibility="public" accept="image/*" testId="news-upload-image" onUploaded={(file) => setF((p) => ({ ...p, images: [...p.images, `${API_ROOT}/files/${file.file_id}`] }))}>Ajouter une image</FileUpload>
          {f.images.map((u, i) => <span key={i} className="relative"><img src={u} alt="" className="h-12 w-12 rounded-lg object-cover" /><button onClick={() => setF((p) => ({ ...p, images: p.images.filter((_, j) => j !== i) }))} className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 text-askool-orange shadow"><Trash2 size={10} /></button></span>)}
          <Button data-testid="news-publish" onClick={publish} disabled={sending} className="ml-auto rounded-xl bg-askool-orange font-semibold text-white hover:bg-askool-orangehover">
            {f.scheduled_at ? <CalendarClock size={16} /> : <Bell size={16} />} {sending ? "Envoi…" : editing ? "Enregistrer" : f.scheduled_at ? "Programmer" : "Publier et notifier"}
          </Button>
        </div>
      </div>
      {posts === null ? <Loader /> : posts.length === 0 ? <EmptyState icon={Newspaper} title="Aucune publication" description="Votre première publication apparaîtra sur votre profil public." /> : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section data-testid="news-upcoming">
              <h2 className="mb-3 flex items-center gap-2 font-display text-section-title font-semibold text-askool-ink"><CalendarClock size={18} className="text-askool-orange" /> À venir <span className="rounded-full bg-askool-orangelight px-2 py-0.5 text-xs font-medium text-askool-orangehover">{pending.length}</span></h2>
              <p className="mb-3 text-sm text-askool-subtle">Visible uniquement par votre établissement jusqu'à la publication.</p>
              <div className="space-y-3">{pending.map((p) => <PostRow key={p.post_id} p={p} />)}</div>
            </section>
          )}
          <section data-testid="news-published">
            {pending.length > 0 && <h2 className="mb-3 flex items-center gap-2 font-display text-section-title font-semibold text-askool-ink"><Newspaper size={18} className="text-askool-blue" /> En ligne</h2>}
            <div className="space-y-3">{published.map((p) => <PostRow key={p.post_id} p={p} />)}</div>
          </section>
        </div>
      )}
    </div>
  );
}
