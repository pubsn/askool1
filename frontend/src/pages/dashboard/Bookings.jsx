import React, { useEffect, useState } from "react";
import { PageHeader, Loader, EmptyState, Stars } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const COLORS = { "En attente": "bg-amber-100 text-amber-700", "Confirmé": "bg-emerald-100 text-emerald-700", "Terminé": "bg-gray-100 text-gray-700", "Annulé": "bg-red-100 text-red-700" };

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const load = () => api.get("/bookings/mine").then(({ data }) => setRows(data.results)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => { try { await api.put(`/bookings/${id}/status`, { status }); toast.success("Mis à jour"); load(); } catch { toast.error("Erreur"); } };
  const submitReview = async (b) => { try { await api.post("/reviews", { educator_user_id: b.educator_user_id, booking_id: b.booking_id, ...review }); toast.success("Avis publié !"); } catch { toast.error("Erreur"); } };

  if (rows === null) return <Loader />;
  return (
    <div>
      <PageHeader title="Mes réservations" subtitle="Gérez vos cours particuliers." />
      {rows.length === 0 ? (
        <EmptyState icon={Calendar} title="Aucune réservation" description="Réservez un cours avec un éducateur." action={<Button onClick={() => navigate("/educateurs")} className="rounded-xl bg-askool-blue text-white">Trouver un éducateur</Button>} />
      ) : (
        <div className="space-y-3">
          {rows.map((b) => {
            const isEducator = user?.user_id === b.educator_user_id;
            return (
              <div key={b.booking_id} data-testid={`booking-${b.booking_id}`} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display font-semibold text-gray-900">{b.subject || "Cours particulier"}</h3>
                  <p className="text-sm text-muted-foreground">{isEducator ? `Avec ${b.client_name}` : `Avec ${b.educator_name}`} · {b.date} à {b.time} · {b.mode}</p>
                  <p className="text-sm font-medium text-gray-700">{(b.price || 0).toLocaleString()} FCFA</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${COLORS[b.status]}`}>{b.status}</span>
                  {isEducator && b.status === "En attente" && <Button size="sm" onClick={() => setStatus(b.booking_id, "Confirmé")} className="rounded-lg bg-emerald-600 text-white">Confirmer</Button>}
                  {b.status === "Confirmé" && <Button size="sm" variant="outline" onClick={() => setStatus(b.booking_id, "Terminé")} className="rounded-lg">Marquer terminé</Button>}
                  {!isEducator && b.status === "Terminé" && (
                    <Dialog>
                      <DialogTrigger asChild><Button size="sm" className="rounded-lg bg-askool-orange font-semibold text-black">Laisser un avis</Button></DialogTrigger>
                      <DialogContent><DialogHeader><DialogTitle>Évaluer {b.educator_name}</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2"><span className="text-sm">Note :</span>{[1,2,3,4,5].map((n) => <button key={n} onClick={() => setReview({ ...review, rating: n })} className={n <= review.rating ? "text-askool-orange" : "text-gray-300"}>★</button>)}</div>
                          <Textarea data-testid="review-comment" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} placeholder="Votre commentaire…" className="rounded-lg" />
                          <Button data-testid="submit-review-btn" onClick={() => submitReview(b)} className="rounded-xl bg-askool-blue text-white">Publier l'avis</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
