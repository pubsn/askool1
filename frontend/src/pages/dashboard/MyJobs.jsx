import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Briefcase, Eye, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function MyJobs() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const load = () => api.get("/jobs/mine").then(({ data }) => setRows(data.results)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const close = async (job) => { try { await api.put(`/jobs/${job.offer_id}`, { ...job, status: "closed" }); toast.success("Offre fermée"); load(); } catch { toast.error("Erreur"); } };

  if (rows === null) return <Loader />;
  return (
    <div>
      <PageHeader title="Mes offres" subtitle="Gérez vos offres d'emploi publiées." action={<Button data-testid="new-offer-btn" onClick={() => navigate("/dashboard/publier")} className="rounded-xl bg-askool-orange font-semibold text-black">Publier une offre</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon={Briefcase} title="Aucune offre publiée" description="Publiez votre première offre d'emploi." action={<Button onClick={() => navigate("/dashboard/publier")} className="rounded-xl bg-askool-blue text-white">Publier une offre</Button>} />
      ) : (
        <div className="space-y-3">
          {rows.map((j) => (
            <div key={j.offer_id} data-testid={`myjob-${j.offer_id}`} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-gray-900">{j.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${j.status === "published" ? "bg-emerald-100 text-emerald-700" : j.status === "draft" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{j.status === "published" ? "Publiée" : j.status === "draft" ? "Brouillon" : "Fermée"}</span>
                </div>
                <div className="mt-1 flex gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Eye size={14} /> {j.views || 0} vues</span><span className="flex items-center gap-1"><Users size={14} /> {j.applications_count || 0} candidatures</span></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/candidatures")} className="rounded-lg">Candidatures</Button>
                <Button size="sm" variant="outline" onClick={() => navigate(`/emplois/${j.offer_id}`)} className="rounded-lg">Aperçu</Button>
                {j.status !== "closed" && <Button size="sm" variant="ghost" onClick={() => close(j)} className="rounded-lg text-red-500">Fermer</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
