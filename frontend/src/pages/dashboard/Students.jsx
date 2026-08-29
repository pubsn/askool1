import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Loader, EmptyState, Tag } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, PlusCircle } from "lucide-react";
import api from "@/lib/api";

export default function Students() {
  const [rows, setRows] = useState(null);
  const [f, setF] = useState({ name: "", class_level: "", subjects: "", location: "", needs: "", availability: "" });
  const [open, setOpen] = useState(false);
  const load = () => api.get("/students").then(({ data }) => setRows(data.results)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const save = async () => {
    try { await api.post("/students", { ...f, subjects: f.subjects.split(",").map((s) => s.trim()).filter(Boolean) }); toast.success("Élève ajouté"); setOpen(false); setF({ name: "", class_level: "", subjects: "", location: "", needs: "", availability: "" }); load(); }
    catch { toast.error("Erreur"); }
  };
  if (rows === null) return <Loader />;
  return (
    <div>
      <PageHeader title="Mes élèves" subtitle="Créez un profil pour chaque enfant afin d'affiner vos demandes."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button data-testid="add-student-btn" className="rounded-xl bg-askool-orange font-semibold text-black"><PlusCircle size={16} /> Ajouter un élève</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Nouvel élève</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Prénom</Label><Input data-testid="student-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1 rounded-lg" placeholder="Ex: Amadou" /></div>
                <div><Label>Classe</Label><Input data-testid="student-class" value={f.class_level} onChange={(e) => setF({ ...f, class_level: e.target.value })} className="mt-1 rounded-lg" placeholder="Ex: 4e" /></div>
                <div><Label>Matières (virgules)</Label><Input data-testid="student-subjects" value={f.subjects} onChange={(e) => setF({ ...f, subjects: e.target.value })} className="mt-1 rounded-lg" placeholder="Maths, Français" /></div>
                <div><Label>Localisation</Label><Input data-testid="student-location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} className="mt-1 rounded-lg" /></div>
                <div><Label>Besoins particuliers</Label><Textarea data-testid="student-needs" value={f.needs} onChange={(e) => setF({ ...f, needs: e.target.value })} className="mt-1 rounded-lg" /></div>
                <Button data-testid="save-student-btn" onClick={save} disabled={!f.name} className="w-full rounded-xl bg-askool-blue text-white">Enregistrer</Button>
              </div>
            </DialogContent>
          </Dialog>
        } />
      {rows.length === 0 ? (
        <EmptyState icon={Users} title="Aucun élève enregistré" description="Ajoutez un premier élève pour lancer une demande de tuteur." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <div key={s.student_id} data-testid={`student-${s.student_id}`} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-askool-bluelight font-bold text-askool-blue">{s.name.charAt(0)}</span><div><h3 className="font-display font-semibold text-gray-900">{s.name}</h3><p className="text-sm text-muted-foreground">Classe : {s.class_level}</p></div></div>
              <div className="mt-3 flex flex-wrap gap-1.5">{(s.subjects || []).map((sub) => <Tag key={sub}>{sub}</Tag>)}</div>
              {s.needs && <p className="mt-2 text-sm text-gray-600">{s.needs}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
