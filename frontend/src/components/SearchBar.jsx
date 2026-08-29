import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function SearchBar({ variant = "hero" }) {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ subjects: [], levels: [], regions: [], service_types: [] });
  const [f, setF] = useState({ service_type: "", subject: "", level: "", region: "" });

  useEffect(() => { api.get("/meta").then(({ data }) => setMeta(data)).catch(() => {}); }, []);

  const submit = () => {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
    navigate(`/educateurs?${params.toString()}`);
  };

  const Sel = ({ name, placeholder, options }) => (
    <div className="relative flex-1">
      <select data-testid={`search-${name}`} value={f[name]} onChange={(e) => setF({ ...f, [name]: e.target.value })}
        className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 pr-8 text-sm text-gray-800 outline-none focus:border-askool-blue focus:ring-2 focus:ring-askool-blue/20">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );

  return (
    <div data-testid="search-bar" className="rounded-2xl border border-gray-100 bg-white p-3 shadow-lg">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Sel name="service_type" placeholder="Type de service" options={meta.service_types} />
        <Sel name="subject" placeholder="Matière" options={meta.subjects} />
        <Sel name="level" placeholder="Niveau" options={meta.levels} />
        <Sel name="region" placeholder="Localisation" options={meta.regions} />
        <Button data-testid="search-submit" onClick={submit}
          className="rounded-xl bg-askool-orange px-6 py-3 font-semibold text-black hover:bg-askool-orangehover md:w-auto">
          <Search size={18} /> Rechercher
        </Button>
      </div>
    </div>
  );
}
