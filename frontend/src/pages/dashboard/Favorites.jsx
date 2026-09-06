import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import EducatorCard from "@/components/EducatorCard";
import SchoolCard from "@/components/SchoolCard";
import { Button } from "@/components/ui/button";
import { Heart, Building2, Bell } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdu = user?.role === "EDUCATOR";
  const [tab, setTab] = useState(isEdu ? "schools" : "educators");
  const [educators, setEducators] = useState(null);
  const [schools, setSchools] = useState(null);
  const [following, setFollowing] = useState(null);
  useEffect(() => {
    api.get("/favorites").then(async ({ data }) => {
      const eduFavs = data.results.filter((f) => f.target_type === "educator");
      const list = await Promise.all(eduFavs.map((f) => api.get(`/educators/${f.target_id}`).then((r) => r.data.profile).catch(() => null)));
      setEducators(list.filter(Boolean));
    }).catch(() => setEducators([]));
    api.get("/schools/favorites/mine").then(({ data }) => setSchools(data.results)).catch(() => setSchools([]));
    api.get("/schools/following/mine").then(({ data }) => setFollowing(data.results)).catch(() => setFollowing([]));
  }, []);
  const Tab = ({ id, label, icon: Icon, count }) => <button data-testid={`fav-tab-${id}`} onClick={() => setTab(id)} className={`inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium ${tab === id ? "bg-askool-blue text-white" : "text-gray-500"}`}><Icon size={14} /> {label}{count != null ? ` (${count})` : ""}</button>;
  return (
    <div>
      <PageHeader title="Mes favoris" subtitle="Retrouvez les éducateurs et les écoles que vous suivez." />
      <div className="mb-6 inline-flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
        <Tab id="schools" label="Écoles favorites" icon={Building2} count={schools?.length} />
        <Tab id="following" label="Écoles suivies" icon={Bell} count={following?.length} />
        <Tab id="educators" label="Éducateurs" icon={Heart} count={educators?.length} />
      </div>
      {tab === "educators" && (educators === null ? <Loader /> : educators.length === 0 ? (
        <EmptyState icon={Heart} title="Aucun éducateur favori" description="Ajoutez des éducateurs à vos favoris depuis leur profil." action={<Button onClick={() => navigate("/educateurs")} className="rounded-xl bg-askool-blue text-white">Explorer les éducateurs</Button>} />
      ) : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{educators.map((e) => <EducatorCard key={e.user_id} edu={e} />)}</div>)}
      {tab === "schools" && (schools === null ? <Loader /> : schools.length === 0 ? (
        <EmptyState icon={Building2} title="Aucune école favorite" description="Ajoutez des écoles à vos favoris depuis leur profil." action={<Button data-testid="fav-find-schools" onClick={() => navigate(isEdu ? "/dashboard/ecoles" : "/ecoles")} className="rounded-xl bg-askool-blue text-white">Trouver une école</Button>} />
      ) : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="fav-schools-grid">{schools.map((s) => <SchoolCard key={s.school_id} school={s} />)}</div>)}
      {tab === "following" && (following === null ? <Loader /> : following.length === 0 ? (
        <EmptyState icon={Bell} title="Vous ne suivez aucune école" description="Suivez une école pour être notifié de ses nouvelles offres." />
      ) : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="following-schools-grid">{following.map((s) => <SchoolCard key={s.school_id} school={s} />)}</div>)}
    </div>
  );
}
