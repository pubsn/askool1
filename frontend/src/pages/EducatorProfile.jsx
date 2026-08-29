import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Calendar, MessageSquare, Heart, Share2, GraduationCap, Briefcase, Languages, Award, Clock } from "lucide-react";
import { toast } from "sonner";
import PublicLayout from "@/components/layout/PublicLayout";
import { Stars, VerifiedBadge, PremiumBadge, Tag, Loader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function SkillRow({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <div className="mt-1 flex flex-wrap gap-1.5">{items.map((s) => <Tag key={s}>{s}</Tag>)}</div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-gray-900"><Icon size={18} className="text-askool-blue" /> {title}</h2>
      {children}
    </div>
  );
}

export default function EducatorProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [booking, setBooking] = useState({ date: "", time: "", subject: "", note: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => { api.get(`/educators/${userId}`).then(({ data }) => setData(data)).catch(() => setData(false)); }, [userId]);

  if (data === null) return <PublicLayout><Loader /></PublicLayout>;
  if (data === false) return <PublicLayout><div className="mx-auto max-w-md py-24 text-center"><p>Profil introuvable.</p></div></PublicLayout>;

  const p = data.profile;
  const requireAuth = () => { if (!user) { toast.error("Connectez-vous pour continuer."); navigate("/connexion"); return false; } return true; };

  const book = async () => {
    if (!requireAuth()) return;
    try { await api.post("/bookings", { educator_user_id: userId, ...booking }); toast.success("Demande de cours envoyée !"); }
    catch (e) { toast.error("Erreur lors de la réservation."); }
  };
  const contact = async () => {
    if (!requireAuth()) return;
    try { await api.post("/messages", { recipient_user_id: userId, content: msg }); toast.success("Message envoyé !"); setMsg(""); navigate("/dashboard/messages"); }
    catch { toast.error("Erreur."); }
  };
  const fav = async () => { if (!requireAuth()) return; try { const { data } = await api.post("/favorites", { target_type: "educator", target_id: userId }); toast.success(data.favorited ? "Ajouté aux favoris" : "Retiré des favoris"); } catch {} };
  const share = () => { navigator.clipboard?.writeText(window.location.href); toast.success("Lien copié !"); };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* header */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row">
            <img src={p.photo || p.avatar_url} alt={p.name} className="h-32 w-32 rounded-2xl object-cover" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-gray-900 sm:text-3xl">{p.name}</h1>
                {p.is_premium && <PremiumBadge />}
                {p.is_verified && <VerifiedBadge />}
              </div>
              <p className="mt-1 text-askool-blue">{p.profession}</p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={14} /> {p.location}</span>
                <span className="flex items-center gap-1"><Briefcase size={14} /> {p.experience_years} ans d'expérience</span>
                <span className="flex items-center gap-1"><Stars value={p.rating} size={14} /> {p.rating} ({p.reviews_count} avis)</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Dialog>
                  <DialogTrigger asChild><Button data-testid="contact-btn" className="rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover"><MessageSquare size={16} /> Contacter</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Contacter {p.name}</DialogTitle></DialogHeader>
                    <Textarea data-testid="contact-textarea" value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Votre message…" className="rounded-lg" />
                    <Button data-testid="send-message-btn" onClick={contact} disabled={!msg} className="rounded-xl bg-askool-blue text-white">Envoyer</Button>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild><Button data-testid="book-btn" className="rounded-xl bg-askool-orange font-semibold text-black hover:bg-askool-orangehover"><Calendar size={16} /> Demander un cours</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Réserver un cours avec {p.name}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Date</Label><Input data-testid="booking-date" type="date" value={booking.date} onChange={(e) => setBooking({ ...booking, date: e.target.value })} className="mt-1 rounded-lg" /></div>
                      <div><Label>Heure</Label><Input data-testid="booking-time" type="time" value={booking.time} onChange={(e) => setBooking({ ...booking, time: e.target.value })} className="mt-1 rounded-lg" /></div>
                      <div><Label>Matière</Label><Input data-testid="booking-subject" value={booking.subject} onChange={(e) => setBooking({ ...booking, subject: e.target.value })} className="mt-1 rounded-lg" placeholder="Ex: Mathématiques" /></div>
                      <div><Label>Note</Label><Textarea data-testid="booking-note" value={booking.note} onChange={(e) => setBooking({ ...booking, note: e.target.value })} className="mt-1 rounded-lg" /></div>
                      <p className="text-sm text-muted-foreground">Tarif : <b>{(p.hourly_rate || 0).toLocaleString()} FCFA/h</b> · Paiement Mobile Money bientôt disponible.</p>
                      <Button data-testid="confirm-booking-btn" onClick={book} disabled={!booking.date || !booking.time} className="w-full rounded-xl bg-askool-orange font-semibold text-black">Confirmer la demande</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button data-testid="fav-btn" variant="outline" onClick={fav} className="rounded-xl"><Heart size={16} /></Button>
                <Button data-testid="share-btn" variant="outline" onClick={share} className="rounded-xl"><Share2 size={16} /></Button>
              </div>
            </div>
            <div className="rounded-2xl bg-askool-bluelight p-5 text-center sm:w-40">
              <div className="text-xs text-muted-foreground">Tarif indicatif</div>
              <div className="font-display text-2xl font-bold text-askool-blue">{(p.hourly_rate || 0).toLocaleString()} F</div>
              <div className="text-xs text-muted-foreground">par heure</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Section icon={GraduationCap} title="Présentation"><p className="text-gray-700">{p.bio}</p></Section>
            <Section icon={Award} title="Compétences">
              <div className="space-y-3">
                <SkillRow label="Matières" items={p.subjects} />
                <SkillRow label="Niveaux" items={p.levels} />
                <SkillRow label="Langues" items={p.languages} />
                <SkillRow label="Spécialités" items={p.specialties} />
              </div>
            </Section>
            <Section icon={Briefcase} title="Services proposés">
              <div className="grid gap-2 sm:grid-cols-2">{p.services?.map((s) => <div key={s} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">✓ {s}</div>)}</div>
            </Section>
            <Section icon={Award} title="Formation & Expérience">
              <ul className="space-y-2">
                {p.diplomas?.map((d, i) => <li key={i} className="text-sm text-gray-700">🎓 {d.title} — {d.school} ({d.year})</li>)}
                {p.experiences?.map((e, i) => <li key={i} className="text-sm text-gray-700">💼 {e.role} — {e.place} ({e.years} ans)</li>)}
              </ul>
            </Section>
            <Section icon={Award} title={`Avis (${data.reviews?.length || 0})`}>
              {data.reviews?.length ? (
                <div className="space-y-4">
                  {data.reviews.map((r) => (
                    <div key={r.review_id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{r.author_name}</span>
                        <span className="flex items-center gap-2"><Stars value={r.rating} size={13} />{r.verified && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-600">Avis vérifié</span>}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>}
            </Section>
          </div>

          <div className="space-y-6">
            <Section icon={Clock} title="Disponibilité">
              <div className="space-y-2 text-sm text-gray-700">
                <div><span className="text-xs font-semibold text-gray-500">Jours</span><div className="mt-1 flex flex-wrap gap-1.5">{(p.availability?.days || []).map((d) => <Tag key={d}>{d}</Tag>)}</div></div>
                <div className="flex items-center gap-1"><Clock size={13} className="text-gray-400" /> {p.availability?.hours}</div>
                <div className="flex items-center gap-1"><MapPin size={13} className="text-gray-400" /> Zones : {(p.availability?.zones || []).join(", ")}</div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
