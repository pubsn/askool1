import React, { useEffect, useState } from "react";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const STATUSES = ["Envoyée", "Consultée", "Présélectionnée", "Entretien", "Acceptée", "Refusée"];
const COLORS = {
  "Envoyée": "bg-gray-100 text-gray-700", "Consultée": "bg-blue-100 text-blue-700",
  "Présélectionnée": "bg-indigo-100 text-indigo-700", "Entretien": "bg-amber-100 text-amber-700",
  "Acceptée": "bg-emerald-100 text-emerald-700", "Refusée": "bg-red-100 text-red-700",
};

export default function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSchool = user?.role === "SCHOOL";
  const [rows, setRows] = useState(null);

  const load = () => {
    const url = isSchool ? "/applications/received" : "/applications/mine";
    api.get(url).then(({ data }) => setRows(data.results)).catch(() => setRows([]));
  };
  useEffect(() => { load(); }, []);

  const changeStatus = async (id, status) => {
    try { await api.put(`/applications/${id}/status`, { status }); toast.success("Statut mis à jour"); load(); }
    catch { toast.error("Erreur"); }
  };

  if (rows === null) return <Loader />;

  return (
    <div>
      <PageHeader title={isSchool ? "Candidatures reçues" : "Mes candidatures"} subtitle={isSchool ? "Gérez les candidatures et faites avancer vos recrutements." : "Suivez l'état de vos candidatures."} />
      {rows.length === 0 ? (
        <EmptyState icon={FileText} title={isSchool ? "Aucune candidature reçue" : "Tu n'as encore envoyé aucune candidature."} description={isSchool ? "Publiez des offres pour recevoir des candidatures." : "Trouve une opportunité qui te correspond."}
          action={<Button data-testid="empty-cta" onClick={() => navigate(isSchool ? "/dashboard/publier" : "/emplois")} className="rounded-xl bg-askool-blue text-white">{isSchool ? "Publier une offre" : "Trouver une opportunité"}</Button>} />
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <div key={a.application_id} data-testid={`application-${a.application_id}`} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display font-semibold text-gray-900">{a.offer_title}</h3>
                <p className="text-sm text-muted-foreground">{isSchool ? `Candidat : ${a.educator_name}` : a.school_name}</p>
                {a.message && <p className="mt-1 text-sm text-gray-500">"{a.message}"</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${COLORS[a.status]}`}>{a.status}</span>
                {isSchool && (
                  <Select value={a.status} onValueChange={(v) => changeStatus(a.application_id, v)}>
                    <SelectTrigger data-testid={`status-select-${a.application_id}`} className="w-40 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                {isSchool && <Button size="sm" variant="outline" data-testid={`view-profile-${a.application_id}`} onClick={() => navigate(`/educateurs/${a.educator_user_id}`)} className="rounded-lg">Voir le profil</Button>}
                {isSchool && <Button size="sm" variant="outline" onClick={() => api.post("/messages", { recipient_user_id: a.educator_user_id, content: `Bonjour ${a.educator_name}, concernant votre candidature.` }).then(() => { toast.success("Message envoyé"); navigate("/dashboard/messages"); })} className="rounded-lg">Contacter</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
