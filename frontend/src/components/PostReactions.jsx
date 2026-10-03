import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Send, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import SharePost from "@/components/SharePost";
import { useAuth } from "@/context/AuthContext";

export default function PostReactions({ post, schoolUserId, defaultOpen = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [count, setCount] = useState(post.comments_count || 0);
  const [open, setOpen] = useState(defaultOpen);
  const [comments, setComments] = useState(null);
  const [text, setText] = useState("");
  const isOwner = user && user.user_id === schoolUserId;
  const requireAuth = () => { if (!user) { toast.error("Connectez-vous pour réagir."); navigate("/connexion"); return false; } return true; };
  const load = () => api.get(`/posts/${post.post_id}/comments`).then(({ data }) => setComments(data.results)).catch(() => setComments([]));
  useEffect(() => { if (open && comments === null) load(); }, [open]);
  const like = async () => { if (!requireAuth()) return; try { const { data } = await api.post(`/posts/${post.post_id}/like`); setLiked(data.liked); setLikes(data.likes_count); } catch { toast.error("Erreur"); } };
  const send = async () => {
    if (!requireAuth() || !text.trim()) return;
    try { const { data } = await api.post(`/posts/${post.post_id}/comments`, { content: text }); setComments((c) => [...(c || []), data.comment]); setCount((n) => n + 1); setText(""); toast.success(isOwner ? "Réponse publiée" : "Commentaire publié"); }
    catch (e) { toast.error(e.response?.data?.detail || "Erreur"); }
  };
  const remove = async (id) => { try { await api.delete(`/posts/${post.post_id}/comments/${id}`); setComments((c) => c.filter((x) => x.comment_id !== id)); setCount((n) => n - 1); } catch { toast.error("Erreur"); } };
  return (
    <div className="mt-3" data-testid={`reactions-${post.post_id}`}>
      <div className="flex items-center gap-4 text-sm">
        <button data-testid={`like-${post.post_id}`} onClick={like} disabled={isOwner} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors ${liked ? "bg-red-50 text-red-500" : "text-gray-500 hover:bg-gray-100"} ${isOwner ? "cursor-default" : ""}`}><Heart size={15} className={liked ? "fill-red-500" : ""} /> {likes}</button>
        <button data-testid={`comments-toggle-${post.post_id}`} onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-askool-text transition-colors hover:bg-askool-bluelight hover:text-askool-blue"><MessageCircle size={15} /> {count} commentaire{count > 1 ? "s" : ""}</button>
        {post.school_slug && <SharePost post={post} />}
      </div>
      {open && (
        <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3" data-testid={`comments-${post.post_id}`}>
          {comments === null ? <p className="text-xs text-muted-foreground">Chargement…</p> : comments.length === 0 ? <p className="text-xs text-muted-foreground">Aucun commentaire. {isOwner ? "" : "Soyez le premier à réagir."}</p> : comments.map((c) => (
            <div key={c.comment_id} data-testid={`comment-${c.comment_id}`} className={`flex gap-2 ${c.is_school ? "ml-6" : ""}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold ${c.is_school ? "bg-askool-blue text-white" : "bg-askool-orangelight text-askool-orangehover"}`}>{c.is_school ? <Building2 size={13} /> : c.author_avatar ? <img src={c.author_avatar} alt="" className="h-full w-full object-cover" /> : (c.author_name || "?").charAt(0)}</span>
              <div className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm ${c.is_school ? "border border-askool-blue/20 bg-askool-bluelight/50" : "bg-white"}`}>
                <div className="flex items-center gap-2 text-xs"><span className="font-semibold text-gray-900">{c.author_name}</span>{c.is_school && <span className="rounded bg-askool-blue px-1.5 py-0.5 text-[10px] font-medium text-white">École</span>}<span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                  {(isOwner || user?.user_id === c.user_id) && <button data-testid={`delete-comment-${c.comment_id}`} onClick={() => remove(c.comment_id)} className="ml-auto text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>}</div>
                <p className="text-gray-700">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Input data-testid={`comment-input-${post.post_id}`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={isOwner ? "Répondre au nom de l'école…" : "Écrire un commentaire…"} className="rounded-lg bg-white text-sm" />
            <button data-testid={`comment-send-${post.post_id}`} onClick={send} disabled={!text.trim()} className="rounded-lg bg-askool-blue px-3 text-white disabled:opacity-40"><Send size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
