import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HandHelping } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STATUSES = ["Envoyée", "Consultée", "Intéressée", "Refusée"];
const COLORS = { "Envoyée": "bg-gray-100 text-gray-700", "Consultée": "bg-blue-100 text-blue-700", "Intéressée": "bg-emerald-100 text-emerald-700", "Refusée": "bg-red-100 text-red-700" };

export default function Proposals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSchool = user?.role === "SCHOOL";
  const [rows, setRows] = useState(null);
  const load = () => api.get(isSchool ? "/proposals/received" : "/proposals/mine").then(({ data }) => setRows(data.results)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const changeStatus = async (id, status) => { try { await api.put(`/proposals/${id}/status`, { status }); toast.success("Statut mis à jour"); load(); } catch { toast.error("Erreur"); } };
  if (rows === null) return <Loader />;
  return (
    <div>
      <PageHeader title={isSchool ? "Propositions de services reçues" : "Mes propositions de services"} subtitle={isSchool ? "Des éducateurs vous proposent spontanément leurs services." : "Suivez les propositions envoyées aux écoles."} />
      {rows.length === 0 ? (
        <EmptyState icon={HandHelping} title="Aucune proposition" description={isSchool ? "Les propositions spontanées des éducateurs apparaîtront ici." : "Proposez vos services à une école depuis son profil."}
          action={!isSchool && <Button data-testid="empty-find-school" onClick={() => navigate("/dashboard/ecoles")} className="rounded-xl bg-askool-blue text-white">Trouver une école</Button>} />
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <div key={p.proposal_id} data-testid={`proposal-${p.proposal_id}`} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-gray-900">{p.service_type}{p.subject ? ` · ${p.subject}` : ""}{p.level ? ` · ${p.level}` : ""}</h3>
                  <p className="text-sm text-muted-foreground">{isSchool ? `De ${p.educator_name}` : <button className="text-askool-blue hover:underline" onClick={() => navigate(`/ecoles/${p.school_slug}`)}>{p.school_name}</button>} · {new Date(p.created_at).toLocaleDateString("fr-FR")}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-gray-600">{p.availability && <span>Disponibilité : {p.availability}</span>}{p.experience && <span>Expérience : {p.experience}</span>}</div>
                  <p className="mt-2 text-sm text-gray-700">"{p.message}"</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${COLORS[p.status]}`}>{p.status}</span>
                  {isSchool && (
                    <Select value={p.status} onValueChange={(v) => changeStatus(p.proposal_id, v)}>
                      <SelectTrigger data-testid={`prop-status-${p.proposal_id}`} className="w-36 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  {isSchool && <Button size="sm" variant="outline" data-testid={`prop-profile-${p.proposal_id}`} onClick={() => navigate(`/educateurs/${p.educator_user_id}`)} className="rounded-lg">Voir le profil</Button>}
                  <Button size="sm" variant="outline" data-testid={`prop-msg-${p.proposal_id}`} onClick={() => navigate("/dashboard/messages")} className="rounded-lg">Messagerie</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
