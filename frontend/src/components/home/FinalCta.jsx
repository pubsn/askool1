import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FinalCta() {
  const navigate = useNavigate();
  return (
    <section data-testid="final-cta" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-askool-border bg-white px-6 py-14 text-center shadow-card sm:px-12">
        <h2 className="font-display text-3xl font-bold tracking-tight text-askool-ink sm:text-4xl">Prêt à utiliser ASKOOL ?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-askool-text">
          Rejoignez une plateforme pensée pour faciliter les échanges entre établissements, éducateurs, parents et apprenants.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button data-testid="cta-register" onClick={() => navigate("/inscription")}
            className="rounded-xl bg-askool-orange px-7 py-6 text-base font-semibold text-white hover:bg-askool-orangehover">
            Créer mon compte <ArrowRight size={17} />
          </Button>
          <Button data-testid="cta-explore" variant="outline" onClick={() => document.getElementById("explorer")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-xl border-askool-blue px-7 py-6 text-base text-askool-blue hover:bg-askool-bluelight">
            <Compass size={17} /> Explorer ASKOOL
          </Button>
        </div>
      </div>
    </section>
  );
}
