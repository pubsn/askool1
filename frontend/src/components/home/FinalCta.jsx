import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/home/Reveal";
import { IMG } from "@/lib/images";

export default function FinalCta() {
  const navigate = useNavigate();
  return (
    <section data-testid="final-cta" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-askool-border px-6 py-16 text-center sm:px-12">
          <img src={IMG.students} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(22,41,94,0.95) 0%, rgba(32,60,137,0.90) 50%, rgba(22,41,94,0.96) 100%)" }} />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Prêt à utiliser ASKOOL ?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-body-base text-white/80">
              Rejoignez une plateforme pensée pour faciliter les échanges entre établissements, éducateurs, parents et apprenants.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button data-testid="cta-register" onClick={() => navigate("/inscription")}
                className="rounded-xl bg-askool-orange px-7 py-6 text-base font-semibold text-white transition-transform hover:bg-askool-orangehover active:scale-[0.98]">
                Créer mon compte <ArrowRight size={17} />
              </Button>
              <Button data-testid="cta-explore" variant="outline" onClick={() => navigate("/explorer")}
                className="rounded-xl border-white/40 bg-white/10 px-7 py-6 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white">
                <Compass size={17} /> Explorer ASKOOL
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
