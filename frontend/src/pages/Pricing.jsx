import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import api from "@/lib/api";

function PlanGrid({ plans }) {
  const navigate = useNavigate();
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((p) => (
        <div key={p.name} data-testid={`plan-${p.name}`}
          className={`relative flex flex-col rounded-2xl border p-7 shadow-sm ${p.highlight ? "border-askool-orange bg-white ring-2 ring-askool-orange" : "border-gray-100 bg-white"}`}>
          {p.highlight && <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-askool-orange px-3 py-1 text-xs font-bold text-black"><Sparkles size={12} /> Populaire</span>}
          <h3 className="font-display text-xl font-semibold text-gray-900">{p.name}</h3>
          <div className="mt-2 font-display text-3xl font-bold text-askool-blue">{p.price}</div>
          <ul className="mt-5 flex-1 space-y-3">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-700"><Check size={17} className="mt-0.5 shrink-0 text-emerald-500" /> {f}</li>
            ))}
          </ul>
          <Button data-testid={`choose-plan-${p.name}`} onClick={() => navigate("/inscription")}
            className={`mt-6 rounded-xl ${p.highlight ? "bg-askool-orange font-semibold text-black hover:bg-askool-orangehover" : "bg-askool-blue text-white hover:bg-askool-bluehover"}`}>Choisir</Button>
        </div>
      ))}
    </div>
  );
}

export default function Pricing() {
  const [plans, setPlans] = useState({ educator: [], school: [], family: [] });
  useEffect(() => { api.get("/plans").then(({ data }) => setPlans(data.plans)).catch(() => {}); }, []);
  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl font-bold text-gray-900 lg:text-5xl">Des tarifs simples et transparents</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Choisissez la formule adaptée à votre profil. Sans engagement.</p>
        </div>
        <Tabs defaultValue="educator" className="w-full">
          <TabsList className="mx-auto mb-10 grid w-full max-w-md grid-cols-3 rounded-xl bg-askool-bluelight p-1">
            <TabsTrigger data-testid="tab-educator" value="educator">Éducateurs</TabsTrigger>
            <TabsTrigger data-testid="tab-school" value="school">Écoles</TabsTrigger>
            <TabsTrigger data-testid="tab-family" value="family">Familles</TabsTrigger>
          </TabsList>
          <TabsContent value="educator"><PlanGrid plans={plans.educator} /></TabsContent>
          <TabsContent value="school"><PlanGrid plans={plans.school} /></TabsContent>
          <TabsContent value="family"><PlanGrid plans={plans.family} /></TabsContent>
        </Tabs>
        <p className="mt-10 text-center text-sm text-muted-foreground">💳 Paiement Mobile Money (Orange Money, Wave) bientôt disponible.</p>
      </div>
    </PublicLayout>
  );
}
