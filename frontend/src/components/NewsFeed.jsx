import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, Building2, ArrowRight } from "lucide-react";
import { CAT_COLORS } from "@/pages/dashboard/SchoolNews";
import api from "@/lib/api";
import PostReactions from "@/components/PostReactions";

const timeAgo = (iso) => { const m = Math.floor((Date.now() - new Date(iso)) / 60000); if (m < 60) return `Il y a ${Math.max(1, m)} min`; const h = Math.floor(m / 60); if (h < 24) return `Il y a ${h} h`; const d = Math.floor(h / 24); return d < 7 ? `Il y a ${d} j` : new Date(iso).toLocaleDateString("fr-FR"); };

export default function NewsFeed({ limit = 6 }) {
  const navigate = useNavigate();
  const [feed, setFeed] = useState(null);
  useEffect(() => { api.get(`/feed?limit=${limit}`).then(({ data }) => setFeed(data)).catch(() => setFeed({ results: [], following_count: 0 })); }, [limit]);
  return (
    <div data-testid="news-feed" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-gray-900"><Newspaper size={18} className="text-askool-blue" /> Fil d'actualités des écoles suivies</h2>
        <button data-testid="feed-manage-follows" onClick={() => navigate("/dashboard/favoris")} className="flex items-center gap-1 text-xs font-medium text-askool-blue hover:underline">Gérer mes écoles suivies <ArrowRight size={12} /></button>
      </div>
      {feed === null ? <p className="text-sm text-muted-foreground">Chargement…</p> : feed.results.length === 0 ? (
        <div data-testid="feed-empty" className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-muted-foreground">
          {feed.following_count === 0 ? "Suivez des écoles pour voir leurs actualités, événements et besoins ici." : "Aucune actualité publiée pour le moment par les écoles que vous suivez."}
          <div className="mt-3"><button data-testid="feed-find-schools" onClick={() => navigate("/dashboard/ecoles")} className="rounded-xl bg-askool-blue px-4 py-2 text-sm font-medium text-white">Trouver une école</button></div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {feed.results.map((p) => (
            <div key={p.post_id} data-testid={`feed-item-${p.post_id}`} className="flex w-full gap-3 py-3 text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-askool-bluelight">{p.school_logo ? <img src={p.school_logo} alt="" className="h-full w-full object-cover" /> : <Building2 size={18} className="text-askool-blue" />}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-medium text-gray-900">{p.school_name}</span><span className={`rounded-full px-2 py-0.5 font-medium ${CAT_COLORS[p.category] || "bg-gray-100 text-gray-700"}`}>{p.category}</span><span className="text-muted-foreground">{timeAgo(p.created_at)}</span></div>
                <div className="mt-0.5 font-display text-sm font-semibold text-gray-900">{p.title}</div>
                <p className="text-sm text-gray-600">{p.content}</p>
                {(p.images?.length > 0 || p.image) && <div className="mt-2 flex gap-2">{(p.images?.length ? p.images : [p.image]).slice(0, 4).map((u, i) => <img key={i} src={u} alt="" className="h-16 w-16 rounded-lg object-cover" />)}</div>}
                <PostReactions post={p} schoolUserId={p.school_user_id} />
                <button data-testid={`feed-view-school-${p.post_id}`} onClick={() => navigate(`/ecoles/${p.school_slug}#actualites`)} className="mt-2 text-xs font-medium text-askool-blue hover:underline">Voir l'école →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
