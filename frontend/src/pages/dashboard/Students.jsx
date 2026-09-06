import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Loader, EmptyState, Tag } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, PlusCircle, Pencil, Trash2, Lock } from "lucide-react";
import api from "@/lib/api";

const EMPTY = { name: "", class_level: "", subjects: "", location: "", needs: "", availability: "", current_school: "", objectives: "", preferences: "", birth_year: "" };

export default function Students() {
  const [rows, setRows] = useState(null);
  const [f, setF] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const load = () => api.get("/students").then(({ data }) => setRows(data.results)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const openNew = () => { setEditing(null); setF(EMPTY); setOpen(true); };
  const openEdit = (s) => { setEditing(s.student_id); setF({ ...EMPTY, ...s, subjects: (s.subjects || []).join(", "), birth_year: s.birth_year || "" }); setOpen(true); };
  const save = async () => {
    const payload = { ...f, subjects: f.subjects.split(",").map((s) => s.trim()).filter(Boolean), birth_year: f.birth_year ? Number(f.birth_year) : null };
    try { if (editing) await api.put(`/students/${editing}`, payload); else await api.post("/students", payload); toast.success(editing ? "Profil modifié" : "Enfant ajouté"); setOpen(false); load(); }
    catch { toast.error("Erreur"); }
  };
  const remove = async (id) => { try { await api.delete(`/students/${id}`); toast.success("Profil supprimé"); load(); } catch { toast.error("Erreur"); } };
  if (rows === null) return <Loader />;
  const F = ({ k, label, placeholder, type = "text" }) => <div><Label>{label}</Label><Input data-testid={`student-${k}`} type={type} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="mt-1 rounded-lg" placeholder={placeholder} /></div>;
  return (
    <div>
      <PageHeader title="Mes enfants" subtitle="Un profil par enfant pour des recommandations d'écoles et de tuteurs adaptées." action={<Button data-testid="add-student-btn" onClick={openNew} className="rounded-xl bg-askool-orange font-semibold text-black"><PlusCircle size={16} /> Ajouter un enfant</Button>} />
      <p className="mb-4 flex items-center gap-1 text-xs text-muted-foreground"><Lock size={12} /> Les profils de vos enfants sont privés et ne sont jamais affichés publiquement.</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Modifier le profil" : "Nouvel enfant"}</DialogTitle><DialogDescription>Informations privées, utilisées uniquement pour vos recherches.</DialogDescription></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <F k="name" label="Prénom" placeholder="Amadou" /><F k="class_level" label="Classe" placeholder="5e, CM2…" />
            <F k="birth_year" label="Année de naissance" type="number" placeholder="2014" /><F k="current_school" label="Établissement actuel" placeholder="École …" />
            <div className="sm:col-span-2"><F k="subjects" label="Matières à renforcer (virgules)" placeholder="Maths, Français" /></div>
            <div className="sm:col-span-2"><Label>Objectifs scolaires</Label><Textarea data-testid="student-objectives" value={f.objectives} onChange={(e) => setF({ ...f, objectives: e.target.value })} rows={2} className="mt-1 rounded-lg" placeholder="Réussir le BFEM, intégrer un lycée bilingue…" /></div>
            <div className="sm:col-span-2"><Label>Préférences (école, pédagogie, services)</Label><Textarea data-testid="student-preferences" value={f.preferences} onChange={(e) => setF({ ...f, preferences: e.target.value })} rows={2} className="mt-1 rounded-lg" placeholder="École bilingue avec cantine et transport…" /></div>
            <div className="sm:col-span-2"><Label>Besoins particuliers</Label><Textarea data-testid="student-needs" value={f.needs} onChange={(e) => setF({ ...f, needs: e.target.value })} rows={2} className="mt-1 rounded-lg" /></div>
            <F k="location" label="Localisation" /><F k="availability" label="Disponibilités" placeholder="Mercredi après-midi" />
          </div>
          <Button data-testid="save-student-btn" onClick={save} disabled={!f.name} className="w-full rounded-xl bg-askool-blue text-white">Enregistrer</Button>
        </DialogContent>
      </Dialog>
      {rows.length === 0 ? <EmptyState icon={Users} title="Aucun enfant enregistré" description="Ajoutez un premier profil pour recevoir des recommandations." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <div key={s.student_id} data-testid={`student-${s.student_id}`} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-askool-bluelight font-bold text-askool-blue">{s.name.charAt(0)}</span><div><h3 className="font-display font-semibold text-gray-900">{s.name}</h3><p className="text-sm text-muted-foreground">Classe : {s.class_level || "—"}{s.current_school ? ` · ${s.current_school}` : ""}</p></div></div>
                <div className="flex gap-1"><button data-testid={`edit-student-${s.student_id}`} onClick={() => openEdit(s)} className="text-gray-400 hover:text-askool-blue"><Pencil size={15} /></button><button data-testid={`delete-student-${s.student_id}`} onClick={() => remove(s.student_id)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{(s.subjects || []).map((sub) => <Tag key={sub}>{sub}</Tag>)}</div>
              {s.objectives && <p className="mt-2 text-sm text-gray-700"><b>Objectifs :</b> {s.objectives}</p>}
              {s.preferences && <p className="mt-1 text-sm text-gray-600"><b>Préférences :</b> {s.preferences}</p>}
              {s.needs && <p className="mt-1 text-sm text-gray-600">{s.needs}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
