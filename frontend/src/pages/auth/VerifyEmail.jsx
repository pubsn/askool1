import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthShell from "@/pages/auth/AuthShell";
import api from "@/lib/api";
import { Loader } from "@/components/common";

export default function VerifyEmail() {
  const [sp] = useSearchParams();
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    const token = sp.get("token");
    if (!token) { setStatus("error"); return; }
    api.post("/auth/verify-email", { token }).then(() => setStatus("ok")).catch(() => setStatus("error"));
  }, [sp]);
  return (
    <AuthShell title="Vérification de l'email" footer={<Link to="/connexion" className="font-semibold text-askool-blue">Aller à la connexion</Link>}>
      {status === "loading" && <Loader label="Vérification…" />}
      {status === "ok" && <div data-testid="verify-ok" className="rounded-xl bg-emerald-50 px-4 py-4 text-emerald-700">✓ Votre email a été vérifié avec succès !</div>}
      {status === "error" && <div data-testid="verify-error" className="rounded-xl bg-red-50 px-4 py-4 text-red-600">Lien de vérification invalide ou expiré.</div>}
    </AuthShell>
  );
}
