import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import AuthShell from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { formatApiError } from "@/context/AuthContext";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const token = sp.get("token") || "";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Mot de passe mis à jour !");
      navigate("/connexion");
    } catch (e2) { setErr(formatApiError(e2.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Nouveau mot de passe" subtitle="Choisissez un nouveau mot de passe sécurisé"
      footer={<Link to="/connexion" className="font-semibold text-askool-blue">← Retour à la connexion</Link>}>
      <form onSubmit={submit} className="space-y-4" data-testid="reset-form">
        <div><Label>Nouveau mot de passe</Label><Input data-testid="reset-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1 rounded-lg" placeholder="Min. 6 caractères" /></div>
        {err && <p data-testid="reset-error" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <Button data-testid="reset-submit" type="submit" disabled={loading || !token} className="w-full rounded-xl bg-askool-blue py-6 text-white hover:bg-askool-bluehover">{loading ? "…" : "Réinitialiser"}</Button>
      </form>
    </AuthShell>
  );
}
