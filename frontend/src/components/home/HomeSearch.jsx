import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, UserCheck, Briefcase, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const KINDS = [
  { key: "school", label: "École", path: "/ecoles" },
  { key: "educator", label: "Éducateur", path: "/educateurs" },
  { key: "job", label: "Offre d'emploi", path: "/emplois" },
  { key: "course", label: "Cours", path: "/educateurs", extra: { service_type: "Cours particuliers" } },
  { key: "formation", label: "Formation", path: "/ecoles", extra: { type: "formation" } },
];

const QUICK = [
  { key: "school", label: "Je cherche une école", icon: Building2 },
  { key: "educator", label: "Je cherche un éducateur", icon: UserCheck },
  { key: "job", label: "Je cherche un emploi", icon: Briefcase },
  { key: "course", label: "Je cherche un cours", icon: BookOpen },
];

export default function HomeSearch({ variant = "card" }) {
  const navigate = useNavigate();
  const onDark = variant === "hero";
  const [meta, setMeta] = useState({ subjects: [], levels: [], regions: [] });
  const [kind, setKind] = useState("educator");
  const [f, setF] = useState({ q: "", subject: "", level: "", region: "" });

  useEffect(() => { api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {}); }, []);

  const go = (kindKey, overrides = {}) => {
    const k = KINDS.find((x) => x.key === kindKey) || KINDS[1];
    const params = new URLSearchParams();
    Object.entries({ ...f, ...k.extra, ...overrides }).forEach(([key, v]) => v && params.set(key, v));
    navigate(`${k.path}?${params.toString()}`);
  };

  const Sel = ({ name, placeholder, options }) => (
    <select data-testid={`home-search-${name}`} value={f[name]} onChange={(e) => setF({ ...f, [name]: e.target.value })}
      aria-label={placeholder}
      className="w-full rounded-xl border border-askool-border bg-askool-surface px-3 py-3 text-sm text-askool-text outline-none transition-colors hover:border-askool-blue focus:border-askool-blue">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div data-testid="home-search" className="mx-auto w-full max-w-4xl">
      <div className="rounded-3xl border border-askool-border bg-white p-4 shadow-[0_24px_60px_-24px_rgba(22,41,94,0.45)] sm:p-6">
        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Type de recherche">
          {KINDS.map((k) => (
            <button key={k.key} data-testid={`home-search-kind-${k.key}`} role="tab" aria-selected={kind === k.key}
              onClick={() => setKind(k.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${kind === k.key ? "bg-askool-blue text-white shadow-sm" : "bg-askool-bluelight text-askool-blue hover:bg-askool-bluepale"}`}>
              {k.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-askool-subtle" />
            <input data-testid="home-search-q" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && go(kind)} placeholder="Que recherchez-vous ?" aria-label="Que recherchez-vous ?"
              className="w-full rounded-xl border border-askool-border bg-askool-surface py-3 pl-10 pr-3 text-sm text-askool-ink outline-none transition-colors placeholder:text-askool-subtle focus:border-askool-blue focus:bg-white" />
          </div>
          <Sel name="subject" placeholder="Matière" options={meta.subjects} />
          <Sel name="level" placeholder="Niveau" options={meta.levels} />
          <Sel name="region" placeholder="Localisation" options={meta.regions} />
          <Button data-testid="home-search-submit" onClick={() => go(kind)}
            className="rounded-xl bg-askool-orange px-7 py-6 text-base font-semibold text-white transition-transform hover:bg-askool-orangehover active:scale-[0.98]">
            <Search size={18} /> Rechercher
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK.map((q) => (
          <button key={q.key} data-testid={`home-quick-${q.key}`} onClick={() => go(q.key)}
            className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${onDark ? "border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20" : "border-askool-border bg-white hover:border-askool-blue"}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${onDark ? "bg-white/15 text-white" : "bg-askool-bluelight text-askool-blue"}`}><q.icon size={17} /></span>
            <span className={`text-sm font-medium ${onDark ? "text-white" : "text-askool-ink"}`}>{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
