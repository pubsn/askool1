import React, { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Loader } from "@/components/common";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Subscription() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const audience = user?.role === "SCHOOL" ? "school" : (user?.role === "PARENT" || user?.role === "ADULT_LEARNER") ? "family" : "educator";
  useEffect(() => { api.get("/plans").then(({ data }) => setPlans(data.plans[audience] || [])).catch(() => {}); }, [audience]);

  const subscribe = async (plan) => {
    try { await api.post("/subscriptions", { plan: plan.name, audience }); toast.success("Abonnement enregistré. Paiement Mobile Money bientôt disponible."); refreshUser(); }
    catch { toast.error("Erreur"); }
  };

  if (!plans.length) return <Loader />;
  return (
    <div>
      <PageHeader title={audience === "educator" ? "Passez à Premium" : "Abonnement"} subtitle="Choisissez la formule adaptée à vos besoins." />
      {user?.is_premium && <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✓ Vous bénéficiez actuellement d'un abonnement Premium.</div>}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} data-testid={`sub-plan-${p.name}`} className={`relative flex flex-col rounded-2xl border p-7 shadow-sm ${p.highlight ? "border-askool-orange ring-2 ring-askool-orange" : "border-gray-100"} bg-white`}>
            {p.highlight && <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-askool-orange px-3 py-1 text-xs font-bold text-black"><Sparkles size={12} /> Recommandé</span>}
            <h3 className="font-display text-xl font-semibold text-gray-900">{p.name}</h3>
            <div className="mt-2 font-display text-2xl font-bold text-askool-blue">{p.price}</div>
            <ul className="mt-5 flex-1 space-y-2">{p.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm text-gray-700"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {f}</li>)}</ul>
            <Button data-testid={`subscribe-${p.name}`} onClick={() => subscribe(p)} className={`mt-6 rounded-xl ${p.highlight ? "bg-askool-orange font-semibold text-black hover:bg-askool-orangehover" : "bg-askool-blue text-white hover:bg-askool-bluehover"}`}>Choisir cette formule</Button>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">💳 Le paiement se fera via Mobile Money (Orange Money, Wave) — intégration en préparation.</p>
    </div>
  );
}
