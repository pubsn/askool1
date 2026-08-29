import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post("/auth/forgot-password", { email }); } catch {}
    setSent(true); setLoading(false);
  };
  return (
    <AuthShell title="Mot de passe oublié" subtitle="Recevez un lien de réinitialisation par email"
      footer={<Link to="/connexion" className="font-semibold text-askool-blue">← Retour à la connexion</Link>}>
      {sent ? (
        <div data-testid="forgot-success" className="rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
          Si cet email est enregistré, un lien de réinitialisation vient d'être envoyé. Vérifiez votre boîte de réception.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" data-testid="forgot-form">
          <div><Label>Email</Label><Input data-testid="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 rounded-lg" placeholder="vous@email.com" /></div>
          <Button data-testid="forgot-submit" type="submit" disabled={loading} className="w-full rounded-xl bg-askool-blue py-6 text-white hover:bg-askool-bluehover">{loading ? "Envoi…" : "Envoyer le lien"}</Button>
        </form>
      )}
    </AuthShell>
  );
}
