import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import AuthShell, { GoogleButton } from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, formatApiError } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login(email, password);
      toast.success("Connexion réussie !");
      navigate(location.state?.from || "/dashboard");
    } catch (e2) {
      setErr(formatApiError(e2.response?.data?.detail) || e2.message);
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Bon retour 👋" subtitle="Connectez-vous à votre espace ASKOOL"
      footer={<>Pas encore de compte ? <Link to="/inscription" className="font-semibold text-askool-blue">Créer un compte</Link></>}>
      <form onSubmit={submit} className="space-y-4" data-testid="login-form">
        <GoogleButton />
        <div className="flex items-center gap-3 py-1"><span className="h-px flex-1 bg-gray-200" /><span className="text-xs text-gray-400">ou</span><span className="h-px flex-1 bg-gray-200" /></div>
        <div><Label>Email</Label><Input data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 rounded-lg" placeholder="vous@email.com" /></div>
        <div>
          <div className="flex items-center justify-between"><Label>Mot de passe</Label><Link to="/mot-de-passe-oublie" className="text-xs font-medium text-askool-blue">Oublié ?</Link></div>
          <Input data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 rounded-lg" placeholder="••••••••" />
        </div>
        {err && <p data-testid="login-error" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <Button data-testid="login-submit" type="submit" disabled={loading} className="w-full rounded-xl bg-askool-blue py-6 text-white hover:bg-askool-bluehover">{loading ? "Connexion…" : "Se connecter"}</Button>
      </form>
    </AuthShell>
  );
}
