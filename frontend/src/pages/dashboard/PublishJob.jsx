import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

export default function PublishJob() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ subjects: [], levels: [], regions: [], contract_types: [], diplomas: [] });
  const [f, setF] = useState({ title: "", contract_type: "", subject: "", level: "", region: "", location: "", salary: "", experience_required: 0, diploma_required: "", description: "", skills: "", start_date: "", deadline: "", status: "published" });
  useEffect(() => { api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {}); }, []);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (status) => {
    try {
      await api.post("/jobs", { ...f, status, skills: f.skills.split(",").map((s) => s.trim()).filter(Boolean) });
      toast.success(status === "draft" ? "Brouillon enregistré" : "Offre publiée !");
      navigate("/dashboard/offres");
    } catch (e) { toast.error(e.response?.data?.detail || "Erreur"); }
  };

  const Sel = ({ k, label, options }) => (
    <div><Label>{label}</Label><select data-testid={`job-${k}`} value={f[k]} onChange={(e) => set(k, e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Choisir…</option>{options.map((o) => <option key={o}>{o}</option>)}</select></div>
  );

  return (
    <div>
      <PageHeader title="Publier une offre" subtitle="Décrivez le poste pour attirer les meilleurs candidats." />
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Titre du poste</Label><Input data-testid="job-title" value={f.title} onChange={(e) => set("title", e.target.value)} className="mt-1 rounded-lg" placeholder="Ex: Professeur de Mathématiques" /></div>
          <Sel k="contract_type" label="Type de contrat" options={meta.contract_types} />
          <Sel k="subject" label="Matière" options={meta.subjects} />
          <Sel k="level" label="Niveau" options={meta.levels} />
          <Sel k="region" label="Localisation" options={meta.regions} />
          <div><Label>Adresse précise</Label><Input data-testid="job-location" value={f.location} onChange={(e) => set("location", e.target.value)} className="mt-1 rounded-lg" /></div>
          <div><Label>Salaire</Label><Input data-testid="job-salary" value={f.salary} onChange={(e) => set("salary", e.target.value)} className="mt-1 rounded-lg" placeholder="Ex: 150 000 - 200 000 FCFA" /></div>
          <div><Label>Expérience requise (ans)</Label><Input data-testid="job-experience" type="number" min="0" value={f.experience_required} onChange={(e) => set("experience_required", parseInt(e.target.value) || 0)} className="mt-1 rounded-lg" /></div>
          <Sel k="diploma_required" label="Diplôme requis" options={meta.diplomas} />
          <div><Label>Date de début</Label><Input data-testid="job-start" type="date" value={f.start_date} onChange={(e) => set("start_date", e.target.value)} className="mt-1 rounded-lg" /></div>
          <div><Label>Date limite</Label><Input data-testid="job-deadline" type="date" value={f.deadline} onChange={(e) => set("deadline", e.target.value)} className="mt-1 rounded-lg" /></div>
        </div>
        <div className="mt-4"><Label>Description</Label><Textarea data-testid="job-description" value={f.description} onChange={(e) => set("description", e.target.value)} rows={5} className="mt-1 rounded-lg" /></div>
        <div className="mt-4"><Label>Compétences (séparées par des virgules)</Label><Input data-testid="job-skills" value={f.skills} onChange={(e) => set("skills", e.target.value)} className="mt-1 rounded-lg" placeholder="Pédagogie, Rigueur…" /></div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button data-testid="publish-job-btn" onClick={() => submit("published")} disabled={!f.title} className="rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover">Publier l'offre</Button>
          <Button data-testid="draft-job-btn" variant="outline" onClick={() => submit("draft")} disabled={!f.title} className="rounded-xl">Enregistrer en brouillon</Button>
        </div>
      </div>
    </div>
  );
}
