import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FileText, Inbox, Calendar, Star, TrendingUp, Users, Briefcase, ShieldCheck, CreditCard, PlusCircle, Search } from "lucide-react";
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
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <ActionCard icon={Briefcase} title="Opportunités" onClick={() => navigate("/dashboard/opportunites")} />
        <ActionCard icon={FileText} title="Mes candidatures" onClick={() => navigate("/dashboard/candidatures")} />
        <ActionCard icon={CreditCard} title="Passer Premium" onClick={() => navigate("/dashboard/abonnement")} />
      </div>
    </div>
  );
}

function SchoolHome({ navigate, user }) {
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  useEffect(() => {
    api.get("/jobs/mine").then(({ data }) => setJobs(data.results)).catch(() => {});
    api.get("/applications/received").then(({ data }) => setApps(data.results)).catch(() => {});
  }, []);
  return (
    <div>
      <PageHeader title={`Bonjour, ${user?.name} 🏫`} subtitle="Gérez vos recrutements en un coup d'œil." action={<Button data-testid="publish-cta" onClick={() => navigate("/dashboard/publier")} className="rounded-xl bg-askool-orange font-semibold text-black hover:bg-askool-orangehover"><PlusCircle size={16} /> Publier une offre</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Offres actives" value={jobs.filter((j) => j.status === "published").length} testId="stat-active-jobs" />
        <StatCard icon={Inbox} label="Candidatures reçues" value={apps.length} accent="orange" testId="stat-received" />
        <StatCard icon={Eye} label="Vues des offres" value={jobs.reduce((a, j) => a + (j.views || 0), 0)} accent="green" testId="stat-job-views" />
        <StatCard icon={ShieldCheck} label="Recrutements" value={apps.filter((a) => a.status === "Acceptée").length} testId="stat-hires" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <ActionCard icon={Search} title="Explorer la CVthèque" onClick={() => navigate("/dashboard/cvtheque")} />
        <ActionCard icon={FileText} title="Voir les candidatures" onClick={() => navigate("/dashboard/candidatures")} />
        <ActionCard icon={Briefcase} title="Mes offres" onClick={() => navigate("/dashboard/offres")} />
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
