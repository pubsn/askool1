import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import EducatorCard from "@/components/EducatorCard";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import api from "@/lib/api";

export default function Favorites() {
  const navigate = useNavigate();
  const [educators, setEducators] = useState(null);
  useEffect(() => {
    api.get("/favorites").then(async ({ data }) => {
      const eduFavs = data.results.filter((f) => f.target_type === "educator");
      const list = await Promise.all(eduFavs.map((f) => api.get(`/educators/${f.target_id}`).then((r) => r.data.profile).catch(() => null)));
      setEducators(list.filter(Boolean));
    }).catch(() => setEducators([]));
  }, []);
  if (educators === null) return <Loader />;
  return (
    <div>
      <PageHeader title="Mes favoris" subtitle="Retrouvez les éducateurs que vous avez sauvegardés." />
      {educators.length === 0 ? (
        <EmptyState icon={Heart} title="Aucun favori" description="Ajoutez des éducateurs à vos favoris depuis leur profil." action={<Button onClick={() => navigate("/educateurs")} className="rounded-xl bg-askool-blue text-white">Explorer les éducateurs</Button>} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{educators.map((e) => <EducatorCard key={e.user_id} edu={e} />)}</div>
      )}
    </div>
  );
}
