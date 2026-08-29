import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Briefcase, GraduationCap, MapPin, Wallet, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import JobCard from "@/components/JobCard";
import api from "@/lib/api";

export default function Opportunities() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState(null);
  const [requests, setRequests] = useState(null);
  const [contact, setContact] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/jobs").then(({ data }) => setJobs(data.results)).catch(() => setJobs([]));
    api.get("/tutoring-requests/open").then(({ data }) => setRequests(data.results)).catch(() => setRequests([]));
  }, []);

  const send = async () => {
    if (!msg.trim()) return toast.error("Écrivez un message");
    try {
      await api.post("/messages", { recipient_user_id: contact.requester_user_id, content: msg });
      toast.success("Message envoyé !");
      setContact(null); setMsg("");
      navigate("/dashboard/messages");
    } catch { toast.error("Erreur lors de l'envoi"); }
  };

  return (
    <div>
      <PageHeader title="Opportunités" subtitle="Offres publiées par les écoles et demandes des parents / apprenants." />
      <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
        <button data-testid="tab-jobs" onClick={() => setTab("jobs")} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === "jobs" ? "bg-askool-blue text-white" : "text-gray-500"}`}>Offres des écoles {jobs ? `(${jobs.length})` : ""}</button>
        <button data-testid="tab-requests" onClick={() => setTab("requests")} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === "requests" ? "bg-askool-blue text-white" : "text-gray-500"}`}>Demandes des parents {requests ? `(${requests.length})` : ""}</button>
      </div>

      {tab === "jobs" && (
        jobs === null ? <Loader /> : jobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="Aucune offre pour le moment" description="Les offres publiées par les écoles apparaîtront ici." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="jobs-grid">
            {jobs.map((j) => <JobCard key={j.offer_id} job={j} />)}
          </div>
        )
      )}

      {tab === "requests" && (
        requests === null ? <Loader /> : requests.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Aucune demande pour le moment" description="Les demandes de tuteur publiées par les parents et apprenants apparaîtront ici." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="requests-grid">
            {requests.map((r) => (
              <div key={r.request_id} data-testid={`request-${r.request_id}`} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-gray-900">{r.subject || "Tutorat"}{r.level ? ` · ${r.level}` : ""}</h3>
                  {typeof r.match_score === "number" && <span className="shrink-0 rounded-full bg-askool-bluelight px-2.5 py-1 text-xs font-semibold text-askool-blue">{r.match_score}% compatible</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Par {r.requester_name}</p>
                {r.objective && <p className="mt-2 text-sm text-gray-700">{r.objective}</p>}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  {r.region && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {r.region}</span>}
                  {r.mode && <span>{r.mode}</span>}
                  {r.budget ? <span className="inline-flex items-center gap-1"><Wallet size={14} /> {r.budget.toLocaleString()} FCFA/h</span> : null}
                  {r.frequency && <span>{r.frequency}</span>}
                </div>
                <Button data-testid={`contact-request-${r.request_id}`} onClick={() => setContact(r)} className="mt-4 rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover"><MessageSquare size={16} /> Proposer mes services</Button>
              </div>
            ))}
          </div>
        )
      )}

      <Dialog open={!!contact} onOpenChange={(v) => { if (!v) { setContact(null); setMsg(""); } }}>
        <DialogContent data-testid="contact-request-dialog">
          <DialogHeader><DialogTitle>Contacter {contact?.requester_name}</DialogTitle><DialogDescription>Envoyez un message pour proposer votre accompagnement.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Textarea data-testid="contact-message" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Présentez-vous et proposez votre accompagnement…" className="rounded-lg" />
            <Button data-testid="send-contact-btn" onClick={send} className="w-full rounded-xl bg-askool-blue text-white">Envoyer le message</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
