import React, { useEffect, useState } from "react";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function Notifications() {
  const [rows, setRows] = useState(null);
  const load = () => api.get("/notifications").then(({ data }) => setRows(data.results)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const markAll = async () => { await api.put("/notifications/read"); load(); };
  if (rows === null) return <Loader />;
  return (
    <div>
      <PageHeader title="Notifications" subtitle="Restez informé de votre activité." action={rows.some((r) => !r.read) && <Button data-testid="mark-read-btn" variant="outline" onClick={markAll} className="rounded-xl">Tout marquer comme lu</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon={Bell} title="Aucune notification" description="Vous serez notifié des candidatures, messages et réservations." />
      ) : (
        <div className="space-y-2">
          {rows.map((n) => (
            <div key={n.notification_id} data-testid={`notif-${n.notification_id}`} className={cn("flex items-start gap-3 rounded-2xl border p-4 shadow-sm", n.read ? "border-gray-100 bg-white" : "border-askool-blue/20 bg-askool-bluelight")}>
              <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-askool-blue text-white"><Bell size={16} /></span>
              <div className="flex-1"><h3 className="font-medium text-gray-900">{n.title}</h3><p className="text-sm text-muted-foreground">{n.body}</p><span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString("fr-FR")}</span></div>
              {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-askool-orange" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
