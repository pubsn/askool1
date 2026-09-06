import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, GraduationCap, Building2, ShieldCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SchoolCard({ school, matchScore }) {
  const navigate = useNavigate();
  const s = school;
  return (
    <div data-testid={`school-card-${s.school_id}`} className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-28 bg-askool-bluelight">
        {s.cover && <img src={s.cover} alt="" className="h-full w-full object-cover" />}
        {typeof matchScore === "number" && <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-askool-blue">{matchScore}% compatible</span>}
        <div className="absolute -bottom-6 left-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow">
          {s.logo ? <img src={s.logo} alt={s.name} className="h-full w-full object-cover" /> : <Building2 className="text-askool-blue" size={24} />}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-8">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-gray-900">{s.name}</h3>
          {s.is_verified && <span data-testid="school-verified-badge" className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600"><ShieldCheck size={12} /> Vérifié</span>}
        </div>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          {s.school_type && <div className="flex items-center gap-1.5"><Building2 size={14} /> {s.school_type}</div>}
          <div className="flex items-center gap-1.5"><MapPin size={14} /> {[s.city || s.location, s.region].filter(Boolean).join(", ") || "Sénégal"}</div>
          {s.levels?.length > 0 && <div className="flex items-center gap-1.5"><GraduationCap size={14} /> {s.levels.join(" · ")}</div>}
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.offers_count ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            <Briefcase size={12} /> {s.offers_count || 0} offre{s.offers_count > 1 ? "s" : ""} disponible{s.offers_count > 1 ? "s" : ""}
          </span>
        </div>
        <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
          <Button data-testid={`view-school-${s.school_id}`} onClick={() => navigate(`/ecoles/${s.slug}`)} className="flex-1 rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover">Voir l'école</Button>
          <Button data-testid={`view-school-offers-${s.school_id}`} variant="outline" onClick={() => navigate(`/ecoles/${s.slug}#offres`)} className="flex-1 rounded-xl border-askool-blue text-askool-blue">Voir les offres</Button>
        </div>
      </div>
    </div>
  );
}
