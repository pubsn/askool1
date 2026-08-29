import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Loader, EmptyState, MatchBadge } from "@/components/common";
import EducatorCard from "@/components/EducatorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, PlusCircle, Sparkles } from "lucide-react";
import api from "@/lib/api";

export default function TutoringRequests() {
  const [meta, setMeta] = useState({ subjects: [], levels: [], regions: [] });
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState(null);
  const [f, setF] = useState({ subject: "", level: "", objective: "", frequency: "", hours: 1, region: "", mode: "Présentiel", budget: 0, availability: "", notes: "" });

  useEffect(() => { api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {}); }, []);
  const load = () => api.get("/tutoring-requests/mine").then(({ data }) => setRows(data.results)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const { data } = await api.post("/tutoring-requests", f);
      toast.success("Demande créée ! Voici les profils recommandés.");
      setOpen(false);
      const m = await api.get(`/tutoring-requests/${data.request.request_id}/matches`);
      setMatches(m.data.results);
      load();
    } catch { toast.error("Erreur"); }
  };
  const showMatches = async (id) => { const { data } = await api.get(`/tutoring-requests/${id}/matches`); setMatches(data.results); };

  const Sel = ({ k, label, options }) => (
    <div><Label>{label}</Label><select data-testid={`req-${k}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Choisir…</option>{options.map((o) => <option key={o}>{o}</option>)}</select></div>
  );

  if (rows === null) return <Loader />;
  return (
    <div>
      <PageHeader title="Mes demandes de tuteur" subtitle="Décrivez votre besoin et recevez des profils compatibles."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button data-testid="new-request-btn" className="rounded-xl bg-askool-orange font-semibold text-black"><PlusCircle size={16} /> Nouvelle demande</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Demande de tuteur</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Sel k="subject" label="Matière" options={meta.subjects} />
                <Sel k="level" label="Niveau" options={meta.levels} />
                <Sel k="region" label="Localisation" options={meta.regions} />
                <div><Label>Objectif</Label><Input data-testid="req-objective" value={f.objective} onChange={(e) => setF({ ...f, objective: e.target.value })} className="mt-1 rounded-lg" placeholder="Ex: Remise à niveau, préparation examen" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Fréquence</Label><Input data-testid="req-frequency" value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })} className="mt-1 rounded-lg" placeholder="2x/semaine" /></div>
                  <div><Label>Heures/séance</Label><Input data-testid="req-hours" type="number" min="1" value={f.hours} onChange={(e) => setF({ ...f, hours: parseInt(e.target.value) || 1 })} className="mt-1 rounded-lg" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Mode</Label><select data-testid="req-mode" value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option>Présentiel</option><option>À distance</option></select></div>
                  <div><Label>Budget (FCFA/h)</Label><Input data-testid="req-budget" type="number" min="0" value={f.budget} onChange={(e) => setF({ ...f, budget: parseInt(e.target.value) || 0 })} className="mt-1 rounded-lg" /></div>
                </div>
                <div><Label>Disponibilités</Label><Input data-testid="req-availability" value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })} className="mt-1 rounded-lg" placeholder="Ex: soirs et week-ends" /></div>
                <div><Label>Informations complémentaires</Label><Textarea data-testid="req-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="mt-1 rounded-lg" /></div>
                <Button data-testid="save-request-btn" onClick={save} disabled={!f.subject} className="w-full rounded-xl bg-askool-blue text-white">Trouver des tuteurs</Button>
              </div>
            </DialogContent>
          </Dialog>
        } />

      {matches && (
        <div className="mb-8 rounded-2xl border-2 border-askool-orange/40 bg-askool-orangelight/40 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-gray-900"><Sparkles size={18} className="text-askool-orangehover" /> Tuteurs recommandés pour vous</h2>
          {matches.length === 0 ? <p className="text-sm text-muted-foreground">Aucun tuteur correspondant pour le moment.</p> : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{matches.map((e) => <EducatorCard key={e.user_id} edu={e} />)}</div>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="Aucune demande" description="Créez une demande pour recevoir des recommandations de tuteurs." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.request_id} data-testid={`request-${r.request_id}`} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display font-semibold text-gray-900">{r.subject} · {r.level}</h3>
                <p className="text-sm text-muted-foreground">{r.objective} · {r.region} · {r.mode} · Budget {r.budget} F/h</p>
              </div>
              <Button data-testid={`view-matches-${r.request_id}`} onClick={() => showMatches(r.request_id)} className="rounded-xl bg-askool-blue text-white">Voir les tuteurs</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
