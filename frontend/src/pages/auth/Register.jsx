import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { School, GraduationCap, Users, BookOpen, ArrowLeft, ArrowRight, Check } from "lucide-react";
import AuthShell, { GoogleButton } from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const ROLES = [
  { key: "SCHOOL", label: "Établissement", desc: "École, collège, lycée ou centre de formation", icon: School },
  { key: "EDUCATOR", label: "Éducateur", desc: "Enseignant, tuteur, formateur", icon: GraduationCap },
  { key: "PARENT", label: "Parent", desc: "Chercher une école ou un éducateur", icon: Users },
  { key: "ADULT_LEARNER", label: "Apprenant", desc: "Élève, étudiant ou adulte en formation", icon: BookOpen },
];

const TITLES = ["Quel est votre profil ?", "Vos informations", "Votre mot de passe"];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [step, setStep] = useState(sp.get("role") ? 2 : 1);
  const [role, setRole] = useState(sp.get("role") || "");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const roleLabel = ROLES.find((r) => r.key === role)?.label;
  const step2Valid = form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email);
  const step3Valid = form.password.length >= 6;

  const pickRole = (key) => { setRole(key); setStep(2); };

  const submit = async (e) => {
    e.preventDefault();
    if (!step3Valid) return;
    setErr(""); setLoading(true);
    try {
      await register({ ...form, role });
      toast.success("Compte créé ! Bienvenue sur ASKOOL.");
      navigate("/dashboard");
    } catch (e2) {
      setErr(formatApiError(e2.response?.data?.detail) || e2.message);
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title={TITLES[step - 1]}
      subtitle={step === 1 ? "Nous adaptons ASKOOL à votre besoin." : `Étape ${step} sur 3${roleLabel ? ` · ${roleLabel}` : ""}`}
      footer={<>Déjà inscrit ? <Link to="/connexion" className="font-semibold text-askool-blue">Se connecter</Link></>}>

      <div className="mb-6" data-testid="register-progress">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-askool-subtle">
          <span>Étape {step} sur 3</span>
          <span>{Math.round((step / 3) * 100)} %</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-askool-bluelight" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
          <div className="h-full rounded-full bg-askool-blue transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5" data-testid="register-form">
        {step === 1 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLES.map((r) => (
              <button key={r.key} type="button" data-testid={`role-${r.key}`} onClick={() => pickRole(r.key)}
                className={cn("flex flex-col items-start rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5",
                  role === r.key ? "border-askool-blue bg-askool-bluelight" : "border-askool-border hover:border-askool-blue")}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-askool-bluelight text-askool-blue"><r.icon size={19} /></span>
                <span className="mt-3 text-sm font-semibold text-askool-ink">{r.label}</span>
                <span className="mt-0.5 text-xs text-askool-subtle">{r.desc}</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <>
            <GoogleButton role={role} />
            <div className="flex items-center gap-3"><span className="h-px flex-1 bg-askool-border" /><span className="text-xs text-askool-subtle">ou par email</span><span className="h-px flex-1 bg-askool-border" /></div>
            <div><Label>{role === "SCHOOL" ? "Nom de l'établissement" : "Nom complet"}</Label>
              <Input data-testid="register-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1 rounded-lg" /></div>
            <div><Label>Email</Label>
              <Input data-testid="register-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1 rounded-lg" /></div>
            {!step2Valid && (form.name || form.email) && <p className="text-xs text-askool-subtle">Renseignez un nom et un email valide pour continuer.</p>}
          </>
        )}

        {step === 3 && (
          <>
            <div className="rounded-xl border border-askool-border bg-askool-surface p-4 text-sm" data-testid="register-recap">
              <div className="flex justify-between py-0.5"><span className="text-askool-subtle">Profil</span><span className="font-medium text-askool-ink">{roleLabel}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-askool-subtle">Nom</span><span className="font-medium text-askool-ink">{form.name}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-askool-subtle">Email</span><span className="font-medium text-askool-ink">{form.email}</span></div>
            </div>
            <div><Label>Mot de passe</Label>
              <Input data-testid="register-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="mt-1 rounded-lg" placeholder="Min. 6 caractères" /></div>
            <p className={cn("flex items-center gap-1.5 text-xs", step3Valid ? "text-askool-blue" : "text-askool-subtle")}>
              <Check size={13} /> Au moins 6 caractères
            </p>
            {err && <p data-testid="register-error" className="rounded-lg bg-askool-orangelight px-3 py-2 text-sm text-askool-orangehover">{err}</p>}
          </>
        )}

        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button type="button" data-testid="register-back" variant="outline" onClick={() => setStep(step - 1)}
              className="rounded-xl border-askool-blue text-askool-blue hover:bg-askool-bluelight"><ArrowLeft size={16} /> Précédent</Button>
          )}
          {step === 2 && (
            <Button type="button" data-testid="register-next" disabled={!step2Valid} onClick={() => setStep(3)}
              className="flex-1 rounded-xl bg-askool-orange py-6 font-semibold text-white hover:bg-askool-orangehover disabled:opacity-50">
              Continuer <ArrowRight size={16} />
            </Button>
          )}
          {step === 3 && (
            <Button type="submit" data-testid="register-submit" disabled={loading || !step3Valid}
              className="flex-1 rounded-xl bg-askool-orange py-6 font-semibold text-white hover:bg-askool-orangehover disabled:opacity-50">
              {loading ? "Création…" : "Créer mon compte"}
            </Button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}
