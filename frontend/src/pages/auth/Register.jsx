import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { School, GraduationCap, Users, BookOpen } from "lucide-react";
import AuthShell, { GoogleButton } from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const ROLES = [
  { key: "EDUCATOR", label: "Éducateur", desc: "Enseignant, tuteur, formateur", icon: GraduationCap },
  { key: "SCHOOL", label: "École", desc: "Établissement scolaire", icon: School },
  { key: "PARENT", label: "Parent", desc: "Chercher un tuteur", icon: Users },
  { key: "ADULT_LEARNER", label: "Apprenant", desc: "Adulte en formation", icon: BookOpen },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [role, setRole] = useState(sp.get("role") || "EDUCATOR");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
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
    <AuthShell title="Créer un compte" subtitle="Rejoignez ASKOOL en quelques secondes"
      footer={<>Déjà inscrit ? <Link to="/connexion" className="font-semibold text-askool-blue">Se connecter</Link></>}>
      <form onSubmit={submit} className="space-y-4" data-testid="register-form">
        <div>
          <Label>Je suis…</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button key={r.key} type="button" data-testid={`role-${r.key}`} onClick={() => setRole(r.key)}
                className={cn("flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                  role === r.key ? "border-askool-blue bg-askool-bluelight ring-1 ring-askool-blue" : "border-gray-200 hover:border-gray-300")}>
                <r.icon size={18} className={role === r.key ? "text-askool-blue" : "text-gray-400"} />
                <span className="mt-1 text-sm font-semibold text-gray-900">{r.label}</span>
                <span className="text-[11px] text-muted-foreground">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <GoogleButton role={role} />
        <div className="flex items-center gap-3 py-1"><span className="h-px flex-1 bg-gray-200" /><span className="text-xs text-gray-400">ou</span><span className="h-px flex-1 bg-gray-200" /></div>
        <div><Label>{role === "SCHOOL" ? "Nom de l'établissement" : "Nom complet"}</Label><Input data-testid="register-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1 rounded-lg" /></div>
        <div><Label>Email</Label><Input data-testid="register-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1 rounded-lg" /></div>
        <div><Label>Mot de passe</Label><Input data-testid="register-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="mt-1 rounded-lg" placeholder="Min. 6 caractères" /></div>
        {err && <p data-testid="register-error" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <Button data-testid="register-submit" type="submit" disabled={loading} className="w-full rounded-xl bg-askool-orange py-6 font-semibold text-black hover:bg-askool-orangehover">{loading ? "Création…" : "Créer mon compte"}</Button>
      </form>
    </AuthShell>
  );
}
