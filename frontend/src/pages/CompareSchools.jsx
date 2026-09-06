import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, Minus, Building2 } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Loader, PageHeader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const has = (arr, kw) => (arr || []).some((x) => x.toLowerCase().includes(kw));
const ROWS = [
  ["Localisation", (s) => [s.city || s.location, s.region].filter(Boolean).join(", ")],
  ["Type", (s) => s.school_type],
  ["Niveaux", (s) => s.levels?.join(", ")],
  ["Programme", (s) => s.education_systems?.join(", ") || s.education_system],
  ["Langues", (s) => s.languages?.join(", ")],
  ["Transport", (s) => has(s.services, "transport") ? true : null],
  ["Cantine", (s) => has(s.services, "cantine") || has(s.services, "restauration") ? true : null],
  ["Internat", (s) => has(s.services, "internat") ? true : null],
  ["Activités", (s) => s.school_life?.length ? true : null],
  ["Bibliothèque", (s) => has(s.infrastructures, "biblioth") ? true : null],
  ["Laboratoire", (s) => has(s.infrastructures, "labo") ? true : null],
  ["Frais de scolarité", (s) => s.tuition_fee || (s.contact_visibility ? "Sur demande" : "")],
  ["Frais d'inscription", (s) => s.registration_fee],
  ["Inscriptions", (s) => s.enrollment_open ? "Ouvertes" : ""],
  ["Effectif", (s) => s.students_count ? `≈ ${s.students_count} élèves` : ""],
  ["Vérifié", (s) => s.is_verified ? true : null],
  ["Note", (s) => s.reviews_count ? `${s.rating} ★ (${s.reviews_count})` : ""],
];

export default function CompareSchools({ embedded = false }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get(`/schools/compare?ids=${params.get("ids") || ""}`).then(({ data }) => setRows(data.results)).catch(() => setRows([])); }, [params]);
  const body = rows === null ? <Loader /> : rows.length < 2 ? (
    <EmptyState icon={Building2} title="Sélectionnez au moins 2 écoles" description="Cochez « Comparer » sur les cartes des écoles." action={<Button onClick={() => navigate(embedded ? "/dashboard/ecoles" : "/ecoles")} className="rounded-xl bg-askool-blue text-white">Trouver une école</Button>} />
  ) : (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm" data-testid="compare-table">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-100">
          <th className="p-4 text-left text-xs font-semibold uppercase text-gray-400">Critère</th>
          {rows.map((s) => <th key={s.school_id} className="p-4 text-left"><button onClick={() => navigate(`/ecoles/${s.slug}`)} className="flex items-center gap-2 font-display font-semibold text-gray-900 hover:text-askool-blue">{s.logo && <img src={s.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />}{s.name}</button></th>)}
        </tr></thead>
        <tbody>
          {ROWS.map(([label, fn]) => {
            const vals = rows.map(fn);
            if (vals.every((v) => v === null || v === "" || v === undefined)) return null;
            return (
              <tr key={label} className="border-b border-gray-50 odd:bg-gray-50/40" data-testid={`compare-row-${label}`}>
                <td className="p-4 font-medium text-gray-700">{label}</td>
                {vals.map((v, i) => <td key={i} className="p-4 text-gray-800">{v === true ? <Check size={18} className="text-emerald-600" /> : v === null || v === "" || v === undefined ? <Minus size={16} className="text-gray-300" /> : v}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="p-4 text-xs text-muted-foreground">Seules les informations réellement renseignées par les établissements sont comparées.</p>
    </div>
  );
  const head = embedded ? <PageHeader title="Comparer des écoles" subtitle="Comparez les critères renseignés par les établissements." /> : <h1 className="mb-6 font-display text-3xl font-bold text-gray-900">Comparer des écoles</h1>;
  if (embedded) return <div>{head}{body}</div>;
  return <PublicLayout><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{head}{body}</div></PublicLayout>;
}
