import React, { useEffect, useState } from "react";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Check, Paperclip } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const STATUSES = ["Envoyée", "Consultée", "Présélectionnée", "Entretien", "Acceptée", "Refusée"];
const FLOW = ["Envoyée", "Consultée", "Présélectionnée", "Entretien", "Acceptée"];
const COLORS = {
  "Envoyée": "bg-gray-100 text-gray-700", "Consultée": "bg-blue-100 text-blue-700",
  "Présélectionnée": "bg-indigo-100 text-indigo-700", "Entretien": "bg-amber-100 text-amber-700",
  "Acceptée": "bg-emerald-100 text-emerald-700", "Refusée": "bg-red-100 text-red-700",
};

function Timeline({ status, timeline = [] }) {
  const refused = status === "Refusée";
  const idx = refused ? FLOW.length - 1 : FLOW.indexOf(status);
  const dates = Object.fromEntries(timeline.map((t) => [t.status, t.at]));
  return (
    <div className="mt-4 flex items-center" data-testid="application-timeline">
      {FLOW.map((s, i) => {
        const label = i === FLOW.length - 1 && refused ? "Refusée" : s;
        const done = i <= idx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center text-center" style={{ minWidth: 64 }}>
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold", done ? (refused && i === idx ? "bg-red-500 text-white" : "bg-askool-blue text-white") : "bg-gray-200 text-gray-500")}>{done ? <Check size={12} /> : i + 1}</span>
              <span className={cn("mt-1 text-[10px]", done ? "font-medium text-gray-800" : "text-gray-400")}>{label}</span>
              {dates[label] && <span className="text-[9px] text-gray-400">{new Date(dates[label]).toLocaleDateString("fr-FR")}</span>}
            </div>
            {i < FLOW.length - 1 && <div className={cn("mb-5 h-0.5 flex-1", i < idx ? "bg-askool-blue" : "bg-gray-200")} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSchool = user?.role === "SCHOOL";
  const [rows, setRows] = useState(null);
  const load = () => api.get(isSchool ? "/applications/received" : "/applications/mine").then(({ data }) => setRows(data.results)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const changeStatus = async (id, status) => { try { await api.put(`/applications/${id}/status`, { status }); toast.success("Statut mis à jour"); load(); } catch { toast.error("Erreur"); } };
  if (rows === null) return <Loader />;

  return (
    <div>
      <PageHeader title={isSchool ? "Candidatures reçues" : "Mes candidatures"} subtitle={isSchool ? "Gérez les candidatures et faites avancer vos recrutements." : "Suivez l'état de vos candidatures : Envoyée → Consultée → Présélectionnée → Entretien → Acceptée / Refusée."} />
      {rows.length === 0 ? (
        <EmptyState icon={FileText} title={isSchool ? "Aucune candidature reçue" : "Tu n'as encore envoyé aucune candidature."} description={isSchool ? "Publiez des offres pour recevoir des candidatures." : "Trouve une opportunité qui te correspond."}
          action={<Button data-testid="empty-cta" onClick={() => navigate(isSchool ? "/dashboard/publier" : "/dashboard/emplois")} className="rounded-xl bg-askool-blue text-white">{isSchool ? "Publier une offre" : "Trouver un emploi"}</Button>} />
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <div key={a.application_id} data-testid={`application-${a.application_id}`} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-gray-900">{a.offer_title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isSchool ? `Candidat : ${a.educator_name}${a.snapshot?.profession ? ` · ${a.snapshot.profession}` : ""}${a.snapshot ? ` · ${a.snapshot.experience_years} an(s) d'exp.` : ""}` : (a.school_slug ? <button className="text-askool-blue hover:underline" onClick={() => navigate(`/ecoles/${a.school_slug}`)}>{a.school_name}</button> : a.school_name)}
                    {" · "}Candidature du {new Date(a.created_at).toLocaleDateString("fr-FR")}{a.updated_at && ` · Màj ${new Date(a.updated_at).toLocaleDateString("fr-FR")}`}
                  </p>
                  {a.cover_letter && <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{a.cover_letter}</p>}
                  {a.message && !a.cover_letter && <p className="mt-1 text-sm text-gray-500">"{a.message}"</p>}
                  {a.documents?.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{a.documents.map((d) => <span key={d.file_id} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"><Paperclip size={11} /> {d.name}</span>)}</div>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${COLORS[a.status]}`}>{a.status}</span>
                  {isSchool && (
                    <Select value={a.status} onValueChange={(v) => changeStatus(a.application_id, v)}>
                      <SelectTrigger data-testid={`status-select-${a.application_id}`} className="w-40 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  {isSchool && <Button size="sm" variant="outline" data-testid={`view-profile-${a.application_id}`} onClick={() => navigate(`/educateurs/${a.educator_user_id}`)} className="rounded-lg">Voir le profil</Button>}
                  {isSchool && <Button size="sm" variant="outline" onClick={() => api.post("/messages", { recipient_user_id: a.educator_user_id, content: `Bonjour ${a.educator_name}, concernant votre candidature.`, context: `Candidature — ${a.offer_title}` }).then(() => { toast.success("Message envoyé"); navigate("/dashboard/messages"); })} className="rounded-lg">Contacter</Button>}
                </div>
              </div>
              {!isSchool && <Timeline status={a.status} timeline={a.timeline} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
