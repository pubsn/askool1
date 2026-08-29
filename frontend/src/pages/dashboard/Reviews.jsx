import React, { useEffect, useState } from "react";
import { PageHeader, Loader, EmptyState, Stars } from "@/components/common";
import { Star } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Reviews() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/educators/${user.user_id}`).then(({ data }) => setData(data)).catch(() => setData(false)); }, [user]);
  if (data === null) return <Loader />;
  const reviews = data?.reviews || [];
  return (
    <div>
      <PageHeader title="Mes avis" subtitle={`Note moyenne : ${data?.profile?.rating || 0}★ sur ${reviews.length} avis`} />
      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="Aucun avis pour le moment" description="Vos avis apparaîtront ici après vos prestations." />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.review_id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{r.author_name}</span>
                <span className="flex items-center gap-2"><Stars value={r.rating} size={14} />{r.verified && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-600">Vérifié</span>}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground"><span>Ponctualité {r.punctuality}★</span><span>Pédagogie {r.pedagogy}★</span><span>Communication {r.communication}★</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
