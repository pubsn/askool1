import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Briefcase, GraduationCap, Calendar, Award, Building2, Clock } from "lucide-react";
import { toast } from "sonner";
import PublicLayout from "@/components/layout/PublicLayout";
import { Loader, Tag } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function JobDetail() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => { api.get(`/jobs/${offerId}`).then(({ data }) => setJob(data.job)).catch(() => setJob(false)); }, [offerId]);
  if (job === null) return <PublicLayout><Loader /></PublicLayout>;
  if (job === false) return <PublicLayout><div className="py-24 text-center">Offre introuvable.</div></PublicLayout>;

  const apply = async () => {
    if (!user) { toast.error("Connectez-vous pour postuler."); navigate("/connexion"); return; }
    if (user.role !== "EDUCATOR" && user.role !== "ADMIN") { toast.error("Seuls les éducateurs peuvent postuler."); return; }
    try { await api.post("/applications", { offer_id: offerId, message: msg }); toast.success("Candidature envoyée !"); navigate("/dashboard/candidatures"); }
    catch (e) { toast.error(e.response?.data?.detail || "Erreur."); }
  };

  const Info = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
      <Icon size={18} className="text-askool-blue" /><div><div className="text-xs text-muted-foreground">{label}</div><div className="text-sm font-medium text-gray-900">{value}</div></div>
    </div>
  );

  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <span className="rounded-md bg-askool-orangelight px-2 py-0.5 text-xs font-semibold text-askool-orangehover">{job.contract_type}</span>
          <h1 className="mt-3 font-display text-2xl font-bold text-gray-900 sm:text-3xl">{job.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-askool-blue"><Building2 size={15} /> {job.school_name}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Info icon={Briefcase} label="Matière" value={job.subject} />
            <Info icon={GraduationCap} label="Niveau" value={job.level} />
            <Info icon={MapPin} label="Localisation" value={`${job.location || job.region}`} />
            <Info icon={Award} label="Salaire" value={job.salary} />
            <Info icon={Clock} label="Expérience requise" value={`${job.experience_required} an(s)`} />
            <Info icon={Award} label="Diplôme requis" value={job.diploma_required} />
            <Info icon={Calendar} label="Début" value={job.start_date} />
            <Info icon={Calendar} label="Date limite" value={job.deadline} />
          </div>
          <div className="mt-6">
            <h2 className="mb-2 font-display font-semibold text-gray-900">Description</h2>
            <p className="text-gray-700">{job.description}</p>
          </div>
          {job.skills?.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{job.skills.map((s) => <Tag key={s}>{s}</Tag>)}</div>}
          <div className="mt-8">
            <Dialog>
              <DialogTrigger asChild><Button data-testid="apply-btn" className="rounded-xl bg-askool-blue px-8 py-6 text-base text-white hover:bg-askool-bluehover">Postuler à cette offre</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Postuler — {job.title}</DialogTitle></DialogHeader>
                <Textarea data-testid="application-message" value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} placeholder="Message de motivation (optionnel)…" className="rounded-lg" />
                <Button data-testid="confirm-apply-btn" onClick={apply} className="rounded-xl bg-askool-blue text-white">Envoyer ma candidature</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
