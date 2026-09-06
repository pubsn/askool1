import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FileText, Inbox, Calendar, Star, Users, Briefcase, ShieldCheck, CreditCard, PlusCircle, Search, Building2, Heart, MessageSquare, Newspaper } from "lucide-react";
import { StatCard, PageHeader, Loader } from "@/components/common";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  if (role === "ADMIN") return <AdminHome navigate={navigate} />;
  if (role === "SCHOOL") return <SchoolHome navigate={navigate} user={user} />;
  if (role === "PARENT" || role === "ADULT_LEARNER") return <ParentHome navigate={navigate} user={user} role={role} />;
  return <EducatorHome navigate={navigate} user={user} />;
}

function EducatorHome({ navigate, user }) {
  const [prof, setProf] = useState(null);
  const [apps, setApps] = useState([]);
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    api.get("/educators/me").then(({ data }) => setProf(data.profile)).catch(() => {});
    api.get("/applications/mine").then(({ data }) => setApps(data.results)).catch(() => {});
    api.get("/bookings/mine").then(({ data }) => setBookings(data.results)).catch(() => {});
  }, []);
  return (
    <div>
      <PageHeader title={`Bonjour, ${user?.name?.split(" ")[0]} 👋`} subtitle="Voici un aperçu de votre activité." action={<Button data-testid="edit-profile-cta" onClick={() => navigate("/dashboard/profil")} className="rounded-xl bg-askool-orange font-semibold text-black hover:bg-askool-orangehover"><FileText size={16} /> Modifier mon profil</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Eye} label="Vues du profil" value={prof?.views || 0} testId="stat-views" />
        <StatCard icon={FileText} label="Candidatures envoyées" value={apps.length} accent="orange" testId="stat-apps" />
        <StatCard icon={Calendar} label="Cours à venir" value={bookings.filter((b) => b.status !== "Terminé").length} accent="green" testId="stat-bookings" />
        <StatCard icon={Star} label="Note moyenne" value={prof?.rating || 0} testId="stat-rating" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div data-testid="block-pro-opportunities" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-gray-900"><Briefcase size={18} className="text-askool-blue" /> Mes opportunités professionnelles</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionCard icon={Search} title="Trouver un emploi" onClick={() => navigate("/dashboard/emplois")} />
            <ActionCard icon={Building2} title="Trouver une école" onClick={() => navigate("/dashboard/ecoles")} />
            <ActionCard icon={FileText} title="Mes candidatures" onClick={() => navigate("/dashboard/candidatures")} />
            <ActionCard icon={Heart} title="Écoles favorites & suivies" onClick={() => navigate("/dashboard/favoris")} />
          </div>
        </div>
        <div data-testid="block-edu-services" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-gray-900"><Users size={18} className="text-askool-orangehover" /> Mes services éducatifs</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionCard icon={Inbox} title="Demandes reçues" onClick={() => navigate("/dashboard/opportunites")} />
            <ActionCard icon={Calendar} title="Cours & disponibilités" onClick={() => navigate("/dashboard/reservations")} />
            <ActionCard icon={Star} title="Avis" onClick={() => navigate("/dashboard/avis")} />
            <ActionCard icon={CreditCard} title="Passer Premium" onClick={() => navigate("/dashboard/abonnement")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SchoolHome({ navigate, user }) {
  const [ov, setOv] = useState({});
  useEffect(() => { api.get("/schools/me/overview").then(({ data }) => setOv(data)).catch(() => {}); }, []);
  return (
    <div>
      <PageHeader title={`Bonjour, ${user?.name} 🏫`} subtitle="Vue d'ensemble de votre établissement et de vos recrutements." action={<Button data-testid="publish-cta" onClick={() => navigate("/dashboard/publier")} className="rounded-xl bg-askool-orange font-semibold text-black hover:bg-askool-orangehover"><PlusCircle size={16} /> Publier une offre</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Eye} label="Vues du profil école" value={ov.profile_views || 0} testId="stat-profile-views" />
        <StatCard icon={Briefcase} label="Offres actives" value={ov.active_offers || 0} accent="orange" testId="stat-active-jobs" />
        <StatCard icon={Inbox} label="Candidatures reçues" value={ov.applications || 0} accent="green" testId="stat-received" />
        <StatCard icon={Users} label="Propositions de services" value={ov.proposals || 0} testId="stat-proposals" />
        <StatCard icon={Heart} label="Candidats favoris" value={ov.favorite_candidates || 0} accent="orange" testId="stat-fav-candidates" />
        <StatCard icon={MessageSquare} label="Messages non lus" value={ov.unread_messages || 0} accent="green" testId="stat-unread" />
      </div>
      {ov.verification_status && ov.verification_status !== "Vérifié" && <div data-testid="verif-banner" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><span><ShieldCheck size={14} className="mr-1 inline" /> Statut : {ov.verification_status}. Faites vérifier votre établissement pour renforcer la confiance des éducateurs.</span><Button size="sm" variant="outline" onClick={() => navigate("/dashboard/etablissement")} className="rounded-lg">Demander la vérification</Button></div>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard icon={Building2} title="Mon établissement" onClick={() => navigate("/dashboard/etablissement")} />
        <ActionCard icon={Newspaper} title="Publier une actualité" onClick={() => navigate("/dashboard/actualites")} />
        <ActionCard icon={FileText} title="Candidatures" onClick={() => navigate("/dashboard/candidatures")} />
        <ActionCard icon={Users} title="Propositions reçues" onClick={() => navigate("/dashboard/propositions")} />
        <ActionCard icon={Search} title="CVthèque" onClick={() => navigate("/dashboard/cvtheque")} />
      </div>
    </div>
  );
}

function ParentHome({ navigate, user, role }) {
  const [reqs, setReqs] = useState([]);
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    api.get("/tutoring-requests/mine").then(({ data }) => setReqs(data.results)).catch(() => {});
    api.get("/bookings/mine").then(({ data }) => setBookings(data.results)).catch(() => {});
  }, []);
  return (
    <div>
      <PageHeader title={`Bonjour, ${user?.name?.split(" ")[0]} 👋`} subtitle="Trouvez le tuteur idéal pour vos besoins." action={<Button data-testid="new-request-cta" onClick={() => navigate("/dashboard/demandes")} className="rounded-xl bg-askool-orange font-semibold text-black hover:bg-askool-orangehover"><PlusCircle size={16} /> Nouvelle demande</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Mes demandes" value={reqs.length} testId="stat-requests" />
        <StatCard icon={Calendar} label="Réservations" value={bookings.length} accent="orange" testId="stat-bookings2" />
        <StatCard icon={Calendar} label="Cours à venir" value={bookings.filter((b) => b.status === "Confirmé").length} accent="green" testId="stat-upcoming" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <ActionCard icon={Search} title="Trouver un tuteur" onClick={() => navigate("/dashboard/tuteurs")} />
        {role === "PARENT" && <ActionCard icon={Users} title="Mes élèves" onClick={() => navigate("/dashboard/eleves")} />}
        <ActionCard icon={FileText} title="Mes demandes" onClick={() => navigate("/dashboard/demandes")} />
      </div>
    </div>
  );
}

function AdminHome({ navigate }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {}); }, []);
  if (!stats) return <Loader />;
  const cards = [
    [Users, "Utilisateurs", stats.users_total], [Briefcase, "Écoles", stats.schools],
    [Users, "Éducateurs", stats.educators], [Users, "Parents/Apprenants", stats.parents],
    [FileText, "Offres", stats.jobs], [Inbox, "Candidatures", stats.applications],
    [FileText, "Demandes de cours", stats.tutoring_requests], [Calendar, "Réservations", stats.bookings],
    [Star, "Avis", stats.reviews], [ShieldCheck, "Vérif. en attente", stats.pending_verifications],
  ];
  return (
    <div>
      <PageHeader title="Vue générale" subtitle="Statistiques de la plateforme ASKOOL." action={<Button data-testid="admin-panel-btn" onClick={() => navigate("/dashboard/admin")} className="rounded-xl bg-askool-blue text-white"><ShieldCheck size={16} /> Administration</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([Icon, label, value], i) => <StatCard key={label} icon={Icon} label={label} value={value} accent={i % 3 === 0 ? "blue" : i % 3 === 1 ? "orange" : "green"} testId={`admin-stat-${i}`} />)}
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, onClick }) {
  return (
    <button onClick={onClick} data-testid={`action-${title}`} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-askool-bluelight text-askool-blue"><Icon size={20} /></span>
      <span className="font-display font-semibold text-gray-900">{title}</span>
    </button>
  );
}
