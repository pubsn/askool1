import React, { useEffect, useState } from "react";
import { Newspaper, Trash2, Bell } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/FileUpload";
import api, { API_ROOT } from "@/lib/api";

const CATS = ["Actualité", "Événement", "Besoin de recrutement", "Annonce"];
export const CAT_COLORS = { "Actualité": "bg-askool-bluelight text-askool-blue", "Événement": "bg-emerald-50 text-emerald-700", "Besoin de recrutement": "bg-askool-orangelight text-askool-orangehover", "Annonce": "bg-gray-100 text-gray-700" };

export default function SchoolNews() {
  const [posts, setPosts] = useState(null);
  const [f, setF] = useState({ title: "", content: "", category: "Actualité", image: "" });
  const [sending, setSending] = useState(false);
  const load = () => api.get("/schools/me/posts").then(({ data }) => setPosts(data.results)).catch(() => setPosts([]));
  useEffect(() => { load(); }, []);
  const publish = async () => {
    if (!f.title.trim() || !f.content.trim()) return toast.error("Titre et contenu requis.");
    setSending(true);
    try { const { data } = await api.post("/schools/me/posts", { ...f, image: f.image || null }); toast.success(`Publié ! ${data.notified} abonné(s) notifié(s).`); setF({ title: "", content: "", category: "Actualité", image: "" }); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Erreur"); } finally { setSending(false); }
  };
  const remove = async (id) => { try { await api.delete(`/schools/me/posts/${id}`); toast.success("Supprimée"); load(); } catch { toast.error("Erreur"); } };
  return (
    <div>
      <PageHeader title="Actualités de l'établissement" subtitle="Publiez vos événements, annonces et besoins : les éducateurs qui vous suivent sont notifiés." />
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm" data-testid="news-form">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2"><Label>Titre</Label><Input data-testid="news-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="mt-1 rounded-lg" placeholder="Journée portes ouvertes le 15 juin" /></div>
          <div><Label>Catégorie</Label><select data-testid="news-category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="mt-4"><Label>Contenu</Label><Textarea data-testid="news-content" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} rows={4} className="mt-1 rounded-lg" placeholder="Décrivez l'actualité, l'événement ou le besoin…" /></div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <FileUpload category="photo" visibility="public" accept="image/*" testId="news-upload-image" onUploaded={(file) => setF({ ...f, image: `${API_ROOT}/files/${file.file_id}` })}>Ajouter une image</FileUpload>
          {f.image && <img src={f.image} alt="" className="h-12 w-12 rounded-lg object-cover" />}
          <Button data-testid="news-publish" onClick={publish} disabled={sending} className="ml-auto rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover"><Bell size={16} /> {sending ? "Publication…" : "Publier et notifier"}</Button>
        </div>
      </div>
      {posts === null ? <Loader /> : posts.length === 0 ? <EmptyState icon={Newspaper} title="Aucune actualité" description="Votre première publication apparaîtra sur votre profil public." /> : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.post_id} data-testid={`news-${p.post_id}`} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              {p.image && <img src={p.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CAT_COLORS[p.category]}`}>{p.category}</span><span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("fr-FR")}</span></div>
                <h3 className="mt-1 font-display font-semibold text-gray-900">{p.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{p.content}</p>
              </div>
              <button data-testid={`news-delete-${p.post_id}`} onClick={() => remove(p.post_id)} className="self-start text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
