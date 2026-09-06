import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Briefcase, GraduationCap, Calendar, Award, Building2, Clock, CheckCircle2, ShieldCheck, Paperclip } from "lucide-react";
import { toast } from "sonner";
import PublicLayout from "@/components/layout/PublicLayout";
import { Loader, Tag } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import FileUpload from "@/components/FileUpload";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function JobDetail() {
  const { offerId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState(null);
  const [letter, setLetter] = useState("");
  const [msg, setMsg] = useState("");
  const [selDocs, setSelDocs] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { api.get(`/jobs/${offerId}`).then(({ data }) => setJob(data.job)).catch(() => setJob(false)); }, [offerId]);
  useEffect(() => { if (job && params.get("postuler") === "1") startApply(); }, [job]);

  const startApply = async () => {
    if (!user) { toast.error("Connectez-vous pour postuler."); navigate("/connexion"); return; }
    if (user.role !== "EDUCATOR" && user.role !== "ADMIN") { toast.error("Seuls les éducateurs peuvent postuler."); return; }
    try { const { data } = await api.get("/applications/preview"); setPreview(data); setSelDocs(data.documents.filter((d) => d.category === "cv").map((d) => d.file_id)); } catch { setPreview({ profile: {}, documents: [] }); }
    setStep(1); setOpen(true);
  };
  const submit = async () => {
    setSending(true);
    try { await api.post("/applications", { offer_id: offerId, message: msg, cover_letter: letter, document_file_ids: selDocs }); setSent(true); }
    catch (e) { toast.error(e.response?.data?.detail || "Erreur."); }
    finally { setSending(false); }
  };

  if (job === null) return <PublicLayout><Loader /></PublicLayout>;
  if (job === false) return <PublicLayout><div className="py-24 text-center">Offre introuvable.</div></PublicLayout>;
  const p = preview?.profile || {};
  const toggleDoc = (id) => setSelDocs((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const Info = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
      <Icon size={18} className="text-askool-blue" /><div><div className="text-xs text-muted-foreground">{label}</div><div className="text-sm font-medium text-gray-900">{value || "—"}</div></div>
    </div>
  );

  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <span className="rounded-md bg-askool-orangelight px-2 py-0.5 text-xs font-semibold text-askool-orangehover">{job.contract_type}</span>
          <h1 className="mt-3 font-display text-2xl font-bold text-gray-900 sm:text-3xl">{job.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-askool-blue">
            <Building2 size={15} />
            {job.school_slug ? <button data-testid="job-school-link" onClick={() => navigate(`/ecoles/${job.school_slug}`)} className="hover:underline">{job.school_name}</button> : job.school_name}
          </p>
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
            <p className="whitespace-pre-line text-gray-700">{job.description}</p>
          </div>
          {job.skills?.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{job.skills.map((s) => <Tag key={s}>{s}</Tag>)}</div>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button data-testid="apply-btn" onClick={startApply} className="rounded-xl bg-askool-blue px-8 py-6 text-base text-white hover:bg-askool-bluehover">Postuler maintenant</Button>
            {job.school_slug && <Button data-testid="view-school-btn" variant="outline" onClick={() => navigate(`/ecoles/${job.school_slug}`)} className="rounded-xl px-6 py-6 text-base">Voir l'école</Button>}
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v && sent) navigate("/dashboard/candidatures"); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" data-testid="apply-dialog">
          {sent ? (
            <div className="py-6 text-center" data-testid="apply-success">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
              <h3 className="mt-3 font-display text-xl font-bold text-gray-900">Candidature envoyée !</h3>
              <p className="mt-1 text-sm text-muted-foreground">{job.school_name} a bien reçu votre candidature. Vous serez notifié à chaque changement de statut.</p>
              <Button data-testid="go-applications" onClick={() => navigate("/dashboard/candidatures")} className="mt-5 rounded-xl bg-askool-blue text-white">Suivre dans « Mes candidatures »</Button>
            </div>
          ) : (
            <>
              <DialogHeader><DialogTitle>Postuler — {job.title}</DialogTitle><DialogDescription>Étape {step}/2 · {step === 1 ? "Votre profil ASKOOL sert de candidature. Complétez-la." : "Aperçu avant envoi."}</DialogDescription></DialogHeader>
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-askool-bluelight/60 p-4 text-sm" data-testid="apply-profile-summary">
                    <div className="flex items-center gap-2 font-semibold text-gray-900">{p.name} {p.is_verified && <ShieldCheck size={14} className="text-emerald-600" />}</div>
                    <div className="text-gray-700">{p.profession || "Profession non renseignée"} · {p.experience_years || 0} an(s) d'expérience</div>
                    <div className="mt-1 text-xs text-gray-600">{p.email} · {p.phone}</div>
                    <div className="mt-2 flex flex-wrap gap-1">{(p.subjects || []).map((s) => <Tag key={s}>{s}</Tag>)}</div>
                    {p.diplomas?.length > 0 && <div className="mt-2 text-xs text-gray-600">Diplômes : {p.diplomas.map((d) => `${d.title}${d.school ? ` (${d.school})` : ""}`).join(", ")}</div>}
                    <button className="mt-2 text-xs text-askool-blue underline" onClick={() => navigate("/dashboard/profil")}>Modifier mon profil</button>
                  </div>
                  <div><Label>Lettre de motivation</Label><Textarea data-testid="apply-cover-letter" value={letter} onChange={(e) => setLetter(e.target.value)} rows={6} placeholder="Madame, Monsieur, …" className="mt-1 rounded-lg" /></div>
                  <div><Label>Message personnalisé (optionnel)</Label><Textarea data-testid="application-message" value={msg} onChange={(e) => setMsg(e.target.value)} rows={2} className="mt-1 rounded-lg" /></div>
                  <div>
                    <Label>Documents joints (CV, diplômes)</Label>
                    <div className="mt-2 space-y-1">
                      {(preview?.documents || []).filter((d) => d.visibility === "private").map((d) => (
                        <label key={d.file_id} className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"><input type="checkbox" data-testid={`apply-doc-${d.file_id}`} checked={selDocs.includes(d.file_id)} onChange={() => toggleDoc(d.file_id)} /><Paperclip size={13} /> {d.original_filename} <span className="text-xs text-muted-foreground">({d.category})</span></label>
                      ))}
                    </div>
                    <div className="mt-2"><FileUpload category="cv" visibility="private" accept="application/pdf,image/*" testId="apply-upload-doc" onUploaded={(file) => { setPreview((pv) => ({ ...pv, documents: [file, ...pv.documents] })); setSelDocs((s) => [...s, file.file_id]); }}>Ajouter un document</FileUpload></div>
                  </div>
                  <Button data-testid="apply-next" onClick={() => setStep(2)} className="w-full rounded-xl bg-askool-blue text-white">Aperçu de la candidature</Button>
                </div>
              ) : (
                <div className="space-y-4" data-testid="apply-preview">
                  <div className="rounded-xl border border-gray-100 p-4 text-sm">
                    <div className="text-xs font-semibold uppercase text-gray-400">Candidat</div>
                    <div className="font-semibold text-gray-900">{p.name} — {p.profession}</div>
                    <div className="text-gray-600">{p.experience_years || 0} an(s) d'expérience · {(p.subjects || []).join(", ")}</div>
                    <div className="mt-3 text-xs font-semibold uppercase text-gray-400">Lettre de motivation</div>
                    <p className="whitespace-pre-line text-gray-700">{letter || <i className="text-gray-400">Aucune lettre</i>}</p>
                    {msg && <><div className="mt-3 text-xs font-semibold uppercase text-gray-400">Message</div><p className="text-gray-700">{msg}</p></>}
                    <div className="mt-3 text-xs font-semibold uppercase text-gray-400">Documents ({selDocs.length})</div>
                    <p className="text-gray-700">{(preview?.documents || []).filter((d) => selDocs.includes(d.file_id)).map((d) => d.original_filename).join(", ") || <i className="text-gray-400">Aucun</i>}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" data-testid="apply-back" onClick={() => setStep(1)} className="flex-1 rounded-xl">Modifier</Button>
                    <Button data-testid="confirm-apply-btn" onClick={submit} disabled={sending} className="flex-1 rounded-xl bg-askool-orange font-semibold text-black">{sending ? "Envoi…" : "Envoyer ma candidature"}</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
