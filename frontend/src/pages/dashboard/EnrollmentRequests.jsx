import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STATUSES = ["Envoyée", "Consultée", "En cours", "Acceptée", "Refusée"];
const COLORS = { "Envoyée": "bg-gray-100 text-gray-700", "Consultée": "bg-blue-100 text-blue-700", "En cours": "bg-amber-100 text-amber-700", "Acceptée": "bg-emerald-100 text-emerald-700", "Refusée": "bg-red-100 text-red-700" };

export default function EnrollmentRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSchool = user?.role === "SCHOOL";
  const [rows, setRows] = useState(null);
  const load = () => api.get(isSchool ? "/enrollment-requests/received" : "/enrollment-requests/mine").then(({ data }) => setRows(data.results)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const change = async (id, status) => { try { await api.put(`/enrollment-requests/${id}/status`, { status }); toast.success("Statut mis à jour"); load(); } catch { toast.error("Erreur"); } };
  if (rows === null) return <Loader />;
  return (
    <div>
      <PageHeader title={isSchool ? "Demandes d'inscription reçues" : "Mes demandes d'inscription"} subtitle={isSchool ? "Traitez les demandes envoyées par les familles." : "Suivez vos demandes auprès des écoles."} />
      {rows.length === 0 ? <EmptyState icon={ClipboardList} title="Aucune demande" description={isSchool ? "Activez « Accepter les demandes d'inscription » dans Mon établissement > Infos pratiques." : "Envoyez une demande depuis le profil d'une école."} action={!isSchool && <Button onClick={() => navigate("/dashboard/ecoles")} className="rounded-xl bg-askool-blue text-white">Trouver une école</Button>} /> : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.request_id} data-testid={`enrollment-${r.request_id}`} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-gray-900">{r.child_name} — {r.level} · {r.school_year}</h3>
                <p className="text-sm text-muted-foreground">{isSchool ? `Famille : ${r.parent_name}${r.phone ? ` · ${r.phone}` : ""} · ${r.parent_email}` : <button className="text-askool-blue hover:underline" onClick={() => navigate(`/ecoles/${r.school_slug}`)}>{r.school_name}</button>} · {new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                {r.message && <p className="mt-2 text-sm text-gray-700">"{r.message}"</p>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${COLORS[r.status]}`}>{r.status}</span>
                {isSchool && <Select value={r.status} onValueChange={(v) => change(r.request_id, v)}><SelectTrigger data-testid={`enroll-status-${r.request_id}`} className="w-36 rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>}
                {isSchool && <Button size="sm" variant="outline" data-testid={`enroll-msg-${r.request_id}`} onClick={() => api.post("/messages", { recipient_user_id: r.parent_user_id, content: `Bonjour ${r.parent_name}, concernant votre demande d'inscription pour ${r.child_name}.`, context: `Inscription — ${r.child_name}` }).then(() => navigate("/dashboard/messages"))} className="rounded-lg">Contacter</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
