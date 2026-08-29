import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Loader, EmptyState, Tag } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Bell, Trash2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ZoneAlerts() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const load = () => api.get("/zone-alerts/mine").then(({ data }) => setRows(data.results)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const remove = async (id) => { try { await api.delete(`/zone-alerts/${id}`); toast.success("Alerte supprimée"); load(); } catch { toast.error("Erreur"); } };

  if (rows === null) return <Loader />;
  return (
    <div>
      <PageHeader title="Mes alertes de zone" subtitle="Soyez notifié dès qu'un éducateur correspondant rejoint votre secteur."
        action={<Button data-testid="goto-map-alert" onClick={() => navigate("/educateurs")} className="rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover"><Search size={16} /> Définir une zone</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon={Bell} title="Aucune alerte de zone" description="Depuis la carte des éducateurs, choisissez un point et un rayon, puis cliquez sur « M'alerter »."
          action={<Button onClick={() => navigate("/educateurs")} className="rounded-xl bg-askool-blue text-white">Ouvrir la carte</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((a) => (
            <div key={a.alert_id} data-testid={`zone-alert-${a.alert_id}`} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-askool-orangelight text-askool-orangehover"><Bell size={18} /></span>
                <button data-testid={`del-alert-${a.alert_id}`} onClick={() => remove(a.alert_id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
              <h3 className="mt-3 flex items-center gap-1 font-display font-semibold text-gray-900"><MapPin size={15} className="text-askool-blue" /> Rayon de {a.radius_km} km</h3>
              <p className="text-xs text-muted-foreground">{a.lat.toFixed(3)}, {a.lng.toFixed(3)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.subject ? <Tag>{a.subject}</Tag> : <Tag>Toutes matières</Tag>}
                {a.level && <Tag>{a.level}</Tag>}
              </div>
              <p className="mt-3 text-xs text-gray-400">{(a.notified || []).length} éducateur(s) déjà notifié(s)</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
