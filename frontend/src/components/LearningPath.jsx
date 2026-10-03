import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Route, CheckCircle2, Circle, Plus, Trash2, Clock, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function LearningPath() {
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [label, setLabel] = useState("");
  const load = () => api.get("/learner/progress").then(({ data }) => setP(data)).catch(() => setP({ goals: [], lessons_total: 0, lessons_done: 0, hours: 0, percent: 0 }));
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!label.trim()) return;
    try { const { data } = await api.post("/learner/goals", { label }); setLabel(""); setP((s) => ({ ...s, goals: data.goals })); load(); toast.success("Objectif ajouté"); }
    catch (e) { toast.error(e.response?.data?.detail || "Erreur"); }
  };
  const toggle = async (g) => {
    try { const { data } = await api.put(`/learner/goals/${g.goal_id}`, { done: !g.done }); setP((s) => ({ ...s, goals: data.goals })); load(); }
    catch { toast.error("Erreur"); }
  };
  const remove = async (g) => {
    try { const { data } = await api.delete(`/learner/goals/${g.goal_id}`); setP((s) => ({ ...s, goals: data.goals })); load(); }
    catch { toast.error("Erreur"); }
  };
  if (!p) return null;
  return (
    <div data-testid="learning-path" className="rounded-2xl border border-askool-border bg-white p-5 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-section-title font-semibold text-askool-ink"><Route size={18} className="text-askool-blue" /> Mon parcours d'apprentissage</h2>
      <p className="mt-1 text-xs text-askool-subtle">Tes cours terminés et tes objectifs atteints, pour voir le chemin parcouru.</p>

      <div className="mt-4">
        <div className="mb-1 flex items-end justify-between">
          <span className="text-sm text-askool-text">Progression</span>
          <span data-testid="path-percent" className="font-display text-2xl font-bold text-askool-blue">{p.percent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-askool-bluelight" role="progressbar" aria-valuenow={p.percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-askool-blue transition-all duration-500" style={{ width: `${p.percent}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[[CalendarCheck, "Cours terminés", `${p.lessons_done}/${p.lessons_total}`, "path-lessons"],
          [Clock, "Heures d'apprentissage", p.hours, "path-hours"],
          [CheckCircle2, "Objectifs atteints", `${p.goals_done || 0}/${(p.goals || []).length}`, "path-goals-count"]].map(([Icon, label2, value, tid]) => (
          <div key={tid} data-testid={tid} className="rounded-xl border border-askool-border bg-askool-surface px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-askool-text"><Icon size={14} className="text-askool-blue" /> {label2}</div>
            <div className={`mt-1 font-display text-xl font-bold ${value === 0 || value === "0/0" ? "text-askool-subtle" : "text-askool-ink"}`}>{value}</div>
          </div>
        ))}
      </div>

      {p.next_lesson && (
        <button data-testid="path-next-lesson" onClick={() => navigate("/dashboard/reservations")}
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-askool-orangelight px-4 py-3 text-left transition-colors hover:bg-askool-orangelight/70">
          <span className="text-sm text-askool-orangehover">Prochain cours : <strong>{p.next_lesson.subject || "Cours"}</strong> le {new Date(p.next_lesson.date).toLocaleDateString("fr-FR")} à {p.next_lesson.time}</span>
          <span className="text-xs font-semibold text-askool-orangehover">Voir →</span>
        </button>
      )}

      <div className="mt-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-askool-subtle">Mes objectifs</div>
        <div className="space-y-2" data-testid="path-goals">
          {(p.goals || []).length === 0 && <p className="text-sm text-askool-subtle">Ajoute un premier objectif, par exemple « Terminer 10 cours d'anglais ».</p>}
          {(p.goals || []).map((g) => (
            <div key={g.goal_id} data-testid={`goal-${g.goal_id}`} className="flex items-center gap-3 rounded-xl border border-askool-border px-3 py-2">
              <button data-testid={`goal-toggle-${g.goal_id}`} onClick={() => toggle(g)} aria-label={g.done ? "Marquer comme non atteint" : "Marquer comme atteint"}
                className={g.done ? "text-askool-blue" : "text-askool-subtle transition-colors hover:text-askool-blue"}>
                {g.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>
              <span className={`flex-1 text-sm ${g.done ? "text-askool-subtle line-through" : "text-askool-ink"}`}>{g.label}</span>
              <button data-testid={`goal-delete-${g.goal_id}`} onClick={() => remove(g)} aria-label="Supprimer l'objectif" className="text-askool-subtle transition-colors hover:text-askool-orange"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input data-testid="goal-input" value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nouvel objectif…" className="rounded-lg" />
          <Button data-testid="goal-add" onClick={add} disabled={!label.trim()} variant="outline" className="rounded-lg"><Plus size={16} /> Ajouter</Button>
        </div>
      </div>
    </div>
  );
}
