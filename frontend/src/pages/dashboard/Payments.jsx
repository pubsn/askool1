import React, { useEffect, useState } from "react";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Receipt, Download } from "lucide-react";
import api from "@/lib/api";
import { downloadReceipt } from "@/lib/receipt";

const STATUS = { success: "bg-emerald-100 text-emerald-700", pending: "bg-amber-100 text-amber-700" };
const LABELS = { success: "Payé", pending: "En attente" };

export default function Payments() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get("/payments/mine").then(({ data }) => setRows(data.results)).catch(() => setRows([])); }, []);

  const dl = async (id) => { try { await downloadReceipt(id); } catch { toast.error("Reçu indisponible"); } };

  if (rows === null) return <Loader />;
  return (
    <div>
      <PageHeader title="Mes paiements" subtitle="Historique et reçus téléchargeables." />
      {rows.length === 0 ? (
        <EmptyState icon={Receipt} title="Aucun paiement" description="Vos paiements et reçus apparaîtront ici." />
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <div key={p.payment_id} data-testid={`payment-${p.payment_id}`} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display font-semibold text-gray-900">{p.label}</h3>
                <p className="text-sm text-muted-foreground">{p.provider} · {(p.confirmed_at || p.created_at || "").slice(0, 10)}</p>
                <p className="text-sm font-medium text-gray-700">{(p.amount || 0).toLocaleString()} {p.currency || "XOF"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS[p.status] || "bg-gray-100 text-gray-700"}`}>{LABELS[p.status] || p.status}</span>
                {p.status === "success" && (
                  <Button size="sm" variant="outline" data-testid={`download-receipt-${p.payment_id}`} onClick={() => dl(p.payment_id)} className="rounded-lg border-askool-blue text-askool-blue hover:bg-blue-50">
                    <Download size={14} className="mr-1.5" /> Reçu
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
