import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Building2, ShieldCheck, Heart, Bell, BellOff, MessageSquare, Globe, Phone, Mail, Facebook, Instagram, Linkedin, Navigation, GraduationCap, Users, Calendar, Languages, BookOpen, Trophy, School, HandHelping, Image as ImageIcon, Briefcase, Lock, ZoomIn, Newspaper, ClipboardList, HelpCircle, Star } from "lucide-react";
import { CAT_COLORS } from "@/pages/dashboard/SchoolNews";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import PublicLayout from "@/components/layout/PublicLayout";
import SchoolCard from "@/components/SchoolCard";
import { Loader, Tag } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const pin = L.divIcon({ className: "", html: '<div style="background:#2a4898;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>', iconSize: [28, 28], iconAnchor: [14, 28] });

function Section({ id, icon: Icon, title, children, testId }) {
  return (
    <section id={id} data-testid={testId} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-gray-900"><Icon size={18} className="text-askool-blue" /> {title}</h2>
      {children}
    </section>
  );
}
const Fact = ({ label, value }) => value ? <div className="rounded-lg bg-gray-50 px-4 py-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-sm font-medium text-gray-900">{value}</div></div> : null;
const List = ({ items }) => items?.length ? <div className="grid gap-2 sm:grid-cols-2">{items.map((s) => <div key={s} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">✓ {s}</div>)}</div> : <p className="text-sm text-muted-foreground">Non renseigné.</p>;

export default function SchoolPublicProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [zoom, setZoom] = useState(null);
  const [gcat, setGcat] = useState("Toutes");
  const [msg, setMsg] = useState("");
  const [openContact, setOpenContact] = useState(false);
  const [openProp, setOpenProp] = useState(false);
  const [prop, setProp] = useState({ service_type: "Enseignement", subject: "", level: "", availability: "", experience: "", message: "" });
  const [ptypes, setPtypes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [smeta, setSmeta] = useState({ contact_subjects: [] });
  const [subject, setSubject] = useState("Inscription");
  const [openEnroll, setOpenEnroll] = useState(false);
  const [students, setStudents] = useState([]);
  const [enr, setEnr] = useState({ student_id: "", child_name: "", level: "", school_year: "2026-2027", message: "", phone: "" });
  const [rev, setRev] = useState({ rating: 5, comment: "" });

  const load = () => api.get(`/schools/slug/${slug}`).then(({ data }) => { setData(data); api.get(`/schools/${data.school.school_id}/posts`).then((r) => setPosts(r.data.results)).catch(() => {}); }).catch(() => setData(false));
  useEffect(() => { load(); api.get("/schools/meta").then(({ data }) => { setPtypes(data.proposal_types); setSmeta(data); }).catch(() => {}); }, [slug]);
  useEffect(() => { if (user && (user.role === "PARENT" || user.role === "ADULT_LEARNER")) api.get("/students").then(({ data }) => setStudents(data.results)).catch(() => {}); }, [user]);
  useEffect(() => { if (data && ["#offres", "#actualites"].includes(window.location.hash)) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" }); }, [data]);

  if (data === null) return <PublicLayout><Loader /></PublicLayout>;
  if (data === false) return <PublicLayout><div className="py-24 text-center">Établissement introuvable.</div></PublicLayout>;
  const { school: s, contact, offers, similar } = data;
  const requireAuth = () => { if (!user) { toast.error("Connectez-vous pour continuer."); navigate("/connexion"); return false; } return true; };
  const isEdu = user?.role === "EDUCATOR" || user?.role === "ADMIN";
  const isParent = user?.role === "PARENT" || user?.role === "ADULT_LEARNER";
  const reviews = data.reviews || [];
  const toggleNotify = async () => { try { const { data: r } = await api.put(`/schools/${s.school_id}/follow/notify`, { notify: !data.follow_notify }); setData((d) => ({ ...d, follow_notify: r.notify })); toast.success(r.notify ? "Vous recevrez les actualités de cette école" : "Actualités désactivées pour cette école"); } catch { toast.error("Erreur"); } };
  const sendEnroll = async () => {
    if (!enr.level || !enr.school_year || (!enr.student_id && !enr.child_name)) return toast.error("Enfant, niveau et année scolaire requis.");
    try { await api.post("/enrollment-requests", { school_id: s.school_id, ...enr, student_id: enr.student_id || null }); toast.success("Demande d'inscription envoyée !"); setOpenEnroll(false); navigate("/dashboard/inscriptions"); }
    catch (e) { toast.error(e.response?.data?.detail || "Erreur."); }
  };
  const sendReview = async () => {
    if (!requireAuth()) return;
    try { await api.post("/schools/reviews", { school_id: s.school_id, ...rev }); toast.success("Merci pour votre avis !"); setRev({ rating: 5, comment: "" }); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Erreur."); }
  };
  const yt = (url) => { const m = (url || "").match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/); return m ? `https://www.youtube.com/embed/${m[1]}` : null; };

  const fav = async () => { if (!requireAuth()) return; const { data: r } = await api.post("/favorites", { target_type: "school", target_id: s.school_id }); toast.success(r.favorited ? "École ajoutée aux favoris" : "Retirée des favoris"); setData((d) => ({ ...d, is_favorite: r.favorited })); };
  const follow = async () => { if (!requireAuth()) return; const { data: r } = await api.post(`/schools/${s.school_id}/follow`); toast.success(r.following ? "Vous suivez cette école" : "Vous ne suivez plus cette école"); setData((d) => ({ ...d, is_following: r.following })); };
  const sendMsg = async () => {
    if (!requireAuth()) return;
    try { await api.post("/messages", { recipient_user_id: s.user_id, content: `[${subject}] ${msg}`, context: `${subject} — ${s.name}` }); toast.success("Message envoyé !"); setOpenContact(false); navigate("/dashboard/messages"); }
    catch (e) { toast.error(e.response?.data?.detail || "Erreur."); }
  };
  const sendProp = async () => {
    if (!requireAuth()) return;
    if (!prop.message.trim()) return toast.error("Écrivez un message.");
    try { await api.post("/proposals", { school_id: s.school_id, ...prop }); toast.success("Proposition envoyée à l'école !"); setOpenProp(false); navigate("/dashboard/propositions"); }
    catch (e) { toast.error(e.response?.data?.detail || "Erreur."); }
  };
  const cats = ["Toutes", ...new Set((s.gallery || []).map((g) => g.category).filter(Boolean))];
  const gallery = (s.gallery || []).filter((g) => gcat === "Toutes" || g.category === gcat);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`;
  const socials = s.socials || {};

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8" data-testid="school-public-profile">
        {/* Cover + header */}
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="relative h-48 bg-askool-blue sm:h-64">{s.cover && <img src={s.cover} alt="" data-testid="school-cover" className="h-full w-full object-cover" />}</div>
          <div className="relative px-6 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative z-10 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
                {s.logo ? <img src={s.logo} alt={s.name} className="h-full w-full object-cover" /> : <Building2 className="text-askool-blue" size={36} />}
              </div>
              <div className="flex-1 sm:pt-14">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-gray-900 sm:text-3xl" data-testid="school-name">{s.name}</h1>
                  {s.is_verified && <span data-testid="school-verified-badge" className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600"><ShieldCheck size={13} /> Établissement vérifié</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {s.school_type && <span className="flex items-center gap-1"><Building2 size={14} /> {s.school_type}</span>}
                  <span className="flex items-center gap-1"><MapPin size={14} /> {[s.city || s.location, s.region, "Sénégal"].filter(Boolean).join(", ")}</span>
                  {s.levels?.length > 0 && <span className="flex items-center gap-1"><GraduationCap size={14} /> {s.levels.join(" · ")}</span>}
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button data-testid="school-contact-btn" onClick={() => requireAuth() && setOpenContact(true)} className="rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover"><MessageSquare size={16} /> {isParent ? "Demander des informations" : "Contacter l'école"}</Button>
              {(!user || isEdu) && <Button data-testid="school-propose-btn" onClick={() => requireAuth() && setOpenProp(true)} className="rounded-xl bg-askool-orange font-semibold text-black hover:bg-askool-orangehover"><HandHelping size={16} /> Proposer mes services</Button>}
              <Button data-testid="school-fav-btn" variant="outline" onClick={fav} className={`rounded-xl ${data.is_favorite ? "border-red-300 text-red-500" : ""}`}><Heart size={16} className={data.is_favorite ? "fill-red-500" : ""} /> {data.is_favorite ? "Favori" : "Ajouter aux favoris"}</Button>
              <Button data-testid="school-follow-btn" variant="outline" onClick={follow} className={`rounded-xl ${data.is_following ? "border-askool-blue text-askool-blue" : ""}`}>{data.is_following ? <BellOff size={16} /> : <Bell size={16} />} {data.is_following ? "Suivi" : "Suivre"} · {s.followers_count}</Button>
              {data.is_following && <button data-testid="school-follow-notify" onClick={toggleNotify} className={`rounded-xl border px-3 py-2 text-xs font-medium ${data.follow_notify ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500"}`}>{data.follow_notify ? "✓ Actualités reçues" : "Recevoir les actualités"}</button>}
              {s.accept_enrollment_requests && (isParent || !user) && <Button data-testid="school-enroll-btn" onClick={() => requireAuth() && setOpenEnroll(true)} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"><ClipboardList size={16} /> Demander une inscription</Button>}
              {!isParent && <Button data-testid="school-offers-anchor" variant="ghost" onClick={() => document.getElementById("offres")?.scrollIntoView({ behavior: "smooth" })} className="rounded-xl"><Briefcase size={16} /> {s.offers_count} offre(s)</Button>}
              {(isParent || !user) && s.reviews_count > 0 && <span className="inline-flex items-center gap-1 self-center text-sm font-semibold text-gray-800"><Star size={14} className="fill-askool-orange text-askool-orange" /> {s.rating} ({s.reviews_count} avis)</span>}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Section icon={School} title="À propos de l'établissement" testId="section-about">
              <p className="whitespace-pre-line text-gray-700">{s.description || "Présentation non renseignée."}</p>
              {(s.history || s.mission || s.values || s.pedagogy) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {s.history && <div className="rounded-xl bg-askool-bluelight/60 p-4"><div className="text-xs font-semibold text-askool-blue">Histoire</div><p className="mt-1 text-sm text-gray-700">{s.history}</p></div>}
                  {s.mission && <div className="rounded-xl bg-askool-bluelight/60 p-4"><div className="text-xs font-semibold text-askool-blue">Mission</div><p className="mt-1 text-sm text-gray-700">{s.mission}</p></div>}
                  {s.values && <div className="rounded-xl bg-askool-orangelight/60 p-4"><div className="text-xs font-semibold text-askool-orangehover">Valeurs</div><p className="mt-1 text-sm text-gray-700">{s.values}</p></div>}
                  {s.pedagogy && <div className="rounded-xl bg-askool-orangelight/60 p-4"><div className="text-xs font-semibold text-askool-orangehover">Méthode pédagogique</div><p className="mt-1 text-sm text-gray-700">{s.pedagogy}</p></div>}
                </div>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Fact label="Nom officiel" value={s.name} /><Fact label="Nom commercial" value={s.commercial_name} /><Fact label="Statut" value={s.status} />
                <Fact label="Année de création" value={s.founded_year} /><Fact label="Élèves" value={s.students_count ? `≈ ${s.students_count}` : ""} /><Fact label="Enseignants" value={s.teachers_count} />
                <Fact label="Système éducatif" value={s.education_system} /><Fact label="Langues d'enseignement" value={s.languages?.join(", ")} /><Fact label="Niveaux" value={s.levels?.join(", ")} />
              </div>
            </Section>

            {(s.tuition_fee || s.registration_fee || s.schedule || s.admission_conditions || s.registration_periods || s.required_documents?.length > 0 || s.enrollment_open) && (
              <Section icon={ClipboardList} title="Informations pratiques" testId="section-practical">
                {s.enrollment_open && <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Inscriptions ouvertes{s.registration_periods ? ` · ${s.registration_periods}` : ""}</div>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Fact label="Frais d'inscription" value={s.registration_fee} /><Fact label="Frais de scolarité" value={s.tuition_fee || (s.registration_fee ? "Nous contacter" : "")} />
                  <Fact label="Modalités de paiement" value={s.payment_terms} /><Fact label="Horaires" value={s.schedule} />
                  <Fact label="Calendrier scolaire" value={s.school_calendar} /><Fact label="Conditions d'admission" value={s.admission_conditions} />
                  <Fact label="Âge minimum" value={s.min_age ? `${s.min_age} ans` : ""} /><Fact label="Places disponibles" value={s.available_seats} />
                  <Fact label="Périodes d'inscription" value={s.registration_periods} /><Fact label="Systèmes éducatifs" value={s.education_systems?.join(", ")} />
                </div>
                {s.required_documents?.length > 0 && <div className="mt-3"><span className="text-xs font-semibold text-gray-500">Documents nécessaires à l'inscription</span><ul className="mt-1 list-inside list-disc text-sm text-gray-700">{s.required_documents.map((d) => <li key={d}>{d}</li>)}</ul></div>}
              </Section>
            )}
            <Section icon={BookOpen} title="Enseignement" testId="section-teaching">
              <div className="space-y-3">
                {s.subjects?.length > 0 && <div><span className="text-xs font-semibold text-gray-500">Matières principales</span><div className="mt-1 flex flex-wrap gap-1.5">{s.subjects.map((x) => <Tag key={x}>{x}</Tag>)}</div></div>}
                {s.programs && <div><span className="text-xs font-semibold text-gray-500">Programmes</span><p className="text-sm text-gray-700">{s.programs}</p></div>}
                {s.methods && <div><span className="text-xs font-semibold text-gray-500">Méthodes pédagogiques</span><p className="text-sm text-gray-700">{s.methods}</p></div>}
              </div>
            </Section>
            <Section icon={Trophy} title="Vie scolaire"><List items={s.school_life} /></Section>
            <Section icon={Building2} title="Infrastructures"><List items={s.infrastructures} /></Section>
            <Section icon={HandHelping} title="Services"><List items={s.services} /></Section>

            {s.gallery?.length > 0 && (
              <Section icon={ImageIcon} title="Galerie" testId="section-gallery">
                <div className="mb-3 flex flex-wrap gap-2">{cats.map((c) => <button key={c} data-testid={`gallery-cat-${c}`} onClick={() => setGcat(c)} className={`rounded-full px-3 py-1 text-xs font-medium ${gcat === c ? "bg-askool-blue text-white" : "bg-gray-100 text-gray-600"}`}>{c}</button>)}</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((g, i) => (
                    <button key={i} data-testid={`gallery-item-${i}`} onClick={() => setZoom(g)} className="group relative aspect-[4/3] overflow-hidden rounded-xl">
                      <img src={g.url} alt={g.caption} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100"><ZoomIn /></span>
                      {g.caption && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left text-xs text-white">{g.caption}</span>}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {s.faq?.length > 0 && (
              <Section icon={HelpCircle} title="Questions fréquentes" testId="section-faq">
                <div className="divide-y divide-gray-100">{s.faq.map((q, i) => <details key={i} className="group py-3" data-testid={`faq-${i}`}><summary className="cursor-pointer list-none font-medium text-gray-900 marker:hidden">{q.q}</summary><p className="mt-2 text-sm text-gray-700">{q.a}</p></details>)}</div>
              </Section>
            )}
            <Section icon={Star} title={`Avis (${reviews.length})`} testId="section-reviews">
              {reviews.length > 0 ? (
                <><div className="mb-4 flex items-center gap-2"><span className="font-display text-3xl font-bold text-gray-900">{s.rating}</span><div><div className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} className={i <= Math.round(s.rating) ? "fill-askool-orange text-askool-orange" : "text-gray-300"} />)}</div><div className="text-xs text-muted-foreground">{reviews.length} avis</div></div></div>
                  <div className="space-y-3">{reviews.map((r) => <div key={r.review_id} data-testid={`review-${r.review_id}`} className="rounded-xl bg-gray-50 p-4"><div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium text-gray-900">{r.author_name}</span><span className="text-askool-orange">{"★".repeat(r.rating)}</span>{r.verified ? <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Avis vérifié</span> : <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">Retour d'utilisateur</span>}<span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span></div>{r.comment && <p className="mt-1 text-sm text-gray-700">{r.comment}</p>}</div>)}</div></>
              ) : <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>}
              {(isParent || isEdu) && (
                <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-4" data-testid="review-form">
                  <div className="mb-2 text-sm font-medium text-gray-800">Laisser un avis</div>
                  <div className="flex items-center gap-3"><select data-testid="review-rating" value={rev.rating} onChange={(e) => setRev({ ...rev, rating: Number(e.target.value) })} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select><Input data-testid="review-comment" value={rev.comment} onChange={(e) => setRev({ ...rev, comment: e.target.value })} placeholder="Votre expérience avec cet établissement…" className="rounded-lg" /><Button data-testid="review-send" onClick={sendReview} className="rounded-lg bg-askool-blue text-white">Publier</Button></div>
                  <p className="mt-2 text-xs text-muted-foreground">Les avis sont modérés. Un avis est « vérifié » lorsqu'il provient d'une famille ayant échangé avec l'école ou déposé une demande.</p>
                </div>
              )}
            </Section>
            {posts.length > 0 && (
              <Section id="actualites" icon={Newspaper} title={`Actualités (${posts.length})`} testId="section-news">
                <div className="space-y-3">
                  {posts.map((p) => (
                    <div key={p.post_id} data-testid={`public-news-${p.post_id}`} className="flex gap-4 rounded-xl border border-gray-100 p-4">
                      {p.image && <img src={p.image} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CAT_COLORS[p.category] || "bg-gray-100 text-gray-700"}`}>{p.category}</span><span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("fr-FR")}</span></div>
                        <h3 className="mt-1 font-display font-semibold text-gray-900">{p.title}</h3>
                        <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{p.content}</p>
                        {p.images?.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{p.images.map((u, i) => <button key={i} onClick={() => setZoom({ url: u, caption: p.title })}><img src={u} alt="" className="h-16 w-16 rounded-lg object-cover" /></button>)}</div>}
                        {yt(p.video_url) && <iframe title={p.title} src={yt(p.video_url)} className="mt-2 aspect-video w-full max-w-md rounded-lg" allowFullScreen />}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section id="offres" icon={Briefcase} title={`Offres d'emploi (${offers.length})`} testId="section-offers">
              {offers.length === 0 ? <p className="text-sm text-muted-foreground">Aucune offre publiée pour le moment. Vous pouvez tout de même proposer vos services.</p> : (
                <div className="space-y-3">
                  {offers.map((j) => (
                    <div key={j.offer_id} data-testid={`school-offer-${j.offer_id}`} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><h3 className="font-display font-semibold text-gray-900">{j.title}</h3><span className="rounded-md bg-askool-orangelight px-2 py-0.5 text-xs font-semibold text-askool-orangehover">{j.contract_type}</span></div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{j.subject}</span><span>{j.level}</span><span className="flex items-center gap-1"><MapPin size={12} /> {j.location || j.region}</span>
                          <span>{j.experience_required} an(s) d'exp.</span>{j.salary && <span className="font-medium text-gray-700">{j.salary}</span>}
                          <span className="flex items-center gap-1"><Calendar size={12} /> Publiée le {new Date(j.created_at).toLocaleDateString("fr-FR")}</span>{j.deadline && <span>Limite : {j.deadline}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" data-testid={`offer-view-${j.offer_id}`} onClick={() => navigate(`/emplois/${j.offer_id}`)} className="rounded-lg">Voir l'offre</Button>
                        <Button size="sm" data-testid={`offer-apply-${j.offer_id}`} onClick={() => navigate(`/emplois/${j.offer_id}?postuler=1`)} className="rounded-lg bg-askool-blue text-white">Postuler</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <div className="space-y-6">
            <Section icon={MapPin} title="Localisation" testId="section-location">
              <div className="space-y-1 text-sm text-gray-700">
                {s.region && <div><b>Région :</b> {s.region}</div>}{s.city && <div><b>Ville :</b> {s.city}</div>}{s.district && <div><b>Quartier :</b> {s.district}</div>}
                {s.location && <div><b>Adresse :</b> {s.location}</div>}{s.directions && <div className="text-muted-foreground">{s.directions}</div>}
                {s.hide_exact_location && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Lock size={12} /> Adresse exacte communiquée après contact.</div>}
              </div>
              {s.lat && s.lng && !s.hide_exact_location && (
                <div className="mt-3 h-48 overflow-hidden rounded-xl" data-testid="school-map">
                  <MapContainer center={[s.lat, s.lng]} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                    <Marker position={[s.lat, s.lng]} icon={pin} />
                  </MapContainer>
                </div>
              )}
              {!s.hide_exact_location && s.lat && <a data-testid="school-directions" href={mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-askool-blue hover:underline"><Navigation size={14} /> Voir l'itinéraire</a>}
            </Section>

            <Section icon={Phone} title="Contacter l'établissement" testId="section-contact">
              <div className="space-y-2 text-sm">
                {contact.contact_unlocked ? (
                  <>
                    {contact.phone && <div className="flex items-center gap-2 text-gray-700"><Phone size={14} className="text-askool-blue" /> {contact.phone}</div>}
                    {contact.whatsapp && <div className="flex items-center gap-2 text-gray-700"><MessageSquare size={14} className="text-emerald-600" /> WhatsApp : {contact.whatsapp}</div>}
                    {contact.email && <div className="flex items-center gap-2 text-gray-700"><Mail size={14} className="text-askool-blue" /> {contact.email}</div>}
                    {!contact.phone && !contact.email && <p className="text-muted-foreground">Coordonnées non renseignées.</p>}
                  </>
                ) : <p className="flex items-center gap-1 text-muted-foreground" data-testid="contact-locked"><Lock size={13} /> {contact.visibility === "private" ? "Coordonnées privées — utilisez la messagerie ASKOOL." : "Coordonnées visibles après un premier contact via la messagerie."}</p>}
                {contact.website && <a data-testid="school-website" href={contact.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-askool-blue hover:underline"><Globe size={14} /> Site officiel</a>}
                <div className="flex gap-2 pt-1">
                  {socials.facebook && <a href={socials.facebook} target="_blank" rel="noreferrer" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:text-askool-blue"><Facebook size={16} /></a>}
                  {socials.instagram && <a href={socials.instagram} target="_blank" rel="noreferrer" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:text-askool-blue"><Instagram size={16} /></a>}
                  {socials.linkedin && <a href={socials.linkedin} target="_blank" rel="noreferrer" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:text-askool-blue"><Linkedin size={16} /></a>}
                </div>
              </div>
              <Button data-testid="school-contact-btn-2" onClick={() => requireAuth() && setOpenContact(true)} className="mt-4 w-full rounded-xl bg-askool-blue text-white"><MessageSquare size={16} /> Contacter l'école</Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">La messagerie ASKOOL protège vos coordonnées.</p>
            </Section>

            {s.recruiting?.length > 0 && <Section icon={Users} title="Recrutement"><div className="flex flex-wrap gap-1.5">{s.recruiting.map((r) => <Tag key={r}>{r}</Tag>)}{s.contract_types?.map((c) => <span key={c} className="rounded-full bg-askool-orangelight px-2.5 py-0.5 text-xs font-medium text-askool-orangehover">{c}</span>)}</div></Section>}
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-10" data-testid="similar-schools">
            <h2 className="mb-4 font-display text-xl font-bold text-gray-900">Vous pourriez également être intéressé par</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{similar.map((x) => <SchoolCard key={x.school_id} school={x} />)}</div>
          </div>
        )}
      </div>

      <Dialog open={!!zoom} onOpenChange={() => setZoom(null)}>
        <DialogContent className="max-w-3xl p-2" data-testid="gallery-zoom">{zoom && <><img src={zoom.url} alt={zoom.caption} className="max-h-[75vh] w-full rounded-lg object-contain" /><p className="px-2 pb-1 text-center text-sm text-gray-600">{zoom.caption}</p></>}</DialogContent>
      </Dialog>
      <Dialog open={openContact} onOpenChange={setOpenContact}>
        <DialogContent data-testid="contact-school-dialog"><DialogHeader><DialogTitle>Contacter {s.name}</DialogTitle><DialogDescription>Votre message sera envoyé via la messagerie ASKOOL.</DialogDescription></DialogHeader>
          <div><Label>Sujet</Label><select data-testid="contact-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">{(smeta.contact_subjects || ["Autre"]).map((c) => <option key={c}>{c}</option>)}</select></div>
          <Textarea data-testid="contact-school-message" value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} placeholder="Bonjour, je souhaiterais…" className="rounded-lg" />
          <Button data-testid="contact-school-send" onClick={sendMsg} disabled={!msg.trim()} className="rounded-xl bg-askool-blue text-white">Envoyer</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={openProp} onOpenChange={setOpenProp}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="propose-dialog"><DialogHeader><DialogTitle>Proposer mes services à {s.name}</DialogTitle><DialogDescription>Même sans offre publiée, présentez ce que vous pouvez apporter à l'établissement.</DialogDescription></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Type de service</Label><select data-testid="prop-service-type" value={prop.service_type} onChange={(e) => setProp({ ...prop, service_type: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">{ptypes.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><Label>Matière</Label><Input data-testid="prop-subject" value={prop.subject} onChange={(e) => setProp({ ...prop, subject: e.target.value })} className="mt-1 rounded-lg" placeholder="Mathématiques" /></div>
            <div><Label>Niveau</Label><Input data-testid="prop-level" value={prop.level} onChange={(e) => setProp({ ...prop, level: e.target.value })} className="mt-1 rounded-lg" placeholder="Lycée" /></div>
            <div><Label>Disponibilité</Label><Input data-testid="prop-availability" value={prop.availability} onChange={(e) => setProp({ ...prop, availability: e.target.value })} className="mt-1 rounded-lg" placeholder="Dès septembre, temps plein" /></div>
            <div className="sm:col-span-2"><Label>Expérience</Label><Input data-testid="prop-experience" value={prop.experience} onChange={(e) => setProp({ ...prop, experience: e.target.value })} className="mt-1 rounded-lg" placeholder="5 ans en lycée privé" /></div>
            <div className="sm:col-span-2"><Label>Message</Label><Textarea data-testid="prop-message" value={prop.message} onChange={(e) => setProp({ ...prop, message: e.target.value })} rows={5} className="mt-1 rounded-lg" placeholder="Bonjour, je suis professeur de mathématiques avec 5 ans d'expérience. Je souhaiterais vous proposer mes services pour des cours, remplacements ou besoins futurs." /></div>
          </div>
          <p className="text-xs text-muted-foreground">Votre profil ASKOOL et votre CV sont joints automatiquement à la proposition.</p>
          <Button data-testid="prop-send" onClick={sendProp} className="rounded-xl bg-askool-orange font-semibold text-black">Envoyer ma proposition</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={openEnroll} onOpenChange={setOpenEnroll}>
        <DialogContent data-testid="enroll-dialog"><DialogHeader><DialogTitle>Demander une inscription — {s.name}</DialogTitle><DialogDescription>L'école recevra votre demande dans son espace et vous répondra via la messagerie.</DialogDescription></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Enfant concerné</Label>
              {students.length > 0 ? <select data-testid="enroll-student" value={enr.student_id} onChange={(e) => setEnr({ ...enr, student_id: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"><option value="">Choisir…</option>{students.map((st) => <option key={st.student_id} value={st.student_id}>{st.name} ({st.class_level})</option>)}</select>
                : <Input data-testid="enroll-child" value={enr.child_name} onChange={(e) => setEnr({ ...enr, child_name: e.target.value })} className="mt-1 rounded-lg" placeholder="Prénom de l'enfant" />}</div>
            <div><Label>Niveau souhaité</Label><Input data-testid="enroll-level" value={enr.level} onChange={(e) => setEnr({ ...enr, level: e.target.value })} className="mt-1 rounded-lg" placeholder="CM2, 6e…" /></div>
            <div><Label>Année scolaire</Label><Input data-testid="enroll-year" value={enr.school_year} onChange={(e) => setEnr({ ...enr, school_year: e.target.value })} className="mt-1 rounded-lg" /></div>
            <div className="sm:col-span-2"><Label>Téléphone (optionnel)</Label><Input data-testid="enroll-phone" value={enr.phone} onChange={(e) => setEnr({ ...enr, phone: e.target.value })} className="mt-1 rounded-lg" /></div>
            <div className="sm:col-span-2"><Label>Message</Label><Textarea data-testid="enroll-message" value={enr.message} onChange={(e) => setEnr({ ...enr, message: e.target.value })} rows={3} className="mt-1 rounded-lg" /></div>
          </div>
          <Button data-testid="enroll-send" onClick={sendEnroll} className="rounded-xl bg-emerald-600 text-white">Envoyer la demande</Button>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
