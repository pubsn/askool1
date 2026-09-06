import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard, User, FileText, Calendar, Heart, MessageSquare, Star,
  CreditCard, Settings, PlusCircle, Briefcase, Users, Search, Building2,
  Bell, LogOut, GraduationCap, ShieldCheck, Home, HandHelping, Newspaper, ClipboardList,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/layout/PublicLayout";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const MENUS = {
  EDUCATOR: [
    { label: "Tableau de bord", to: "/dashboard", icon: LayoutDashboard },
    { label: "Mon profil", to: "/dashboard/profil", icon: User },
    { label: "Trouver un emploi", to: "/dashboard/emplois", icon: Search },
    { label: "Trouver une école", to: "/dashboard/ecoles", icon: Building2 },
    { label: "Opportunités", to: "/dashboard/opportunites", icon: Briefcase },
    { label: "Mes candidatures", to: "/dashboard/candidatures", icon: FileText },
    { label: "Mes propositions", to: "/dashboard/propositions", icon: HandHelping },
    { label: "Mes réservations", to: "/dashboard/reservations", icon: Calendar },
    { label: "Favoris", to: "/dashboard/favoris", icon: Heart },
    { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
    { label: "Avis", to: "/dashboard/avis", icon: Star },
    { label: "Abonnement", to: "/dashboard/abonnement", icon: CreditCard },
    { label: "Paramètres", to: "/dashboard/parametres", icon: Settings },
  ],
  SCHOOL: [
    { label: "Tableau de bord", to: "/dashboard", icon: LayoutDashboard },
    { label: "Mon établissement", to: "/dashboard/etablissement", icon: Building2 },
    { label: "Actualités", to: "/dashboard/actualites", icon: Newspaper },
    { label: "Inscriptions", to: "/dashboard/inscriptions", icon: ClipboardList },
    { label: "Publier une offre", to: "/dashboard/publier", icon: PlusCircle },
    { label: "Mes offres", to: "/dashboard/offres", icon: Briefcase },
    { label: "Candidatures", to: "/dashboard/candidatures", icon: FileText },
    { label: "Propositions reçues", to: "/dashboard/propositions", icon: HandHelping },
    { label: "CVthèque", to: "/dashboard/cvtheque", icon: Search },
    { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
    { label: "Abonnement", to: "/dashboard/abonnement", icon: CreditCard },
    { label: "Paramètres", to: "/dashboard/parametres", icon: Settings },
  ],
  PARENT: [
    { label: "Tableau de bord", to: "/dashboard", icon: LayoutDashboard },
    { label: "Mon profil", to: "/dashboard/parametres", icon: User },
    { label: "Mes enfants", to: "/dashboard/eleves", icon: Users },
    { label: "Trouver une école", to: "/dashboard/ecoles", icon: Building2 },
    { label: "Trouver un éducateur", to: "/dashboard/tuteurs", icon: Search },
    { label: "Mes écoles suivies", to: "/dashboard/favoris", icon: Heart },
    { label: "Mes demandes", to: "/dashboard/demandes", icon: FileText },
    { label: "Inscriptions", to: "/dashboard/inscriptions", icon: ClipboardList },
    { label: "Alertes de zone", to: "/dashboard/alertes", icon: Bell },
    { label: "Mes réservations", to: "/dashboard/reservations", icon: Calendar },
    { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
    { label: "Actualités", to: "/dashboard/fil", icon: Newspaper },
    { label: "Notifications", to: "/dashboard/notifications", icon: Bell },
  ],
  ADULT_LEARNER: [
    { label: "Mon profil", to: "/dashboard", icon: User },
    { label: "Trouver un éducateur", to: "/dashboard/tuteurs", icon: Search },
    { label: "Trouver une école", to: "/dashboard/ecoles", icon: Building2 },
    { label: "Mes cours", to: "/dashboard/reservations", icon: Calendar },
    { label: "Mes demandes", to: "/dashboard/demandes", icon: FileText },
    { label: "Inscriptions", to: "/dashboard/inscriptions", icon: ClipboardList },
    { label: "Mes favoris & écoles suivies", to: "/dashboard/favoris", icon: Heart },
    { label: "Mes recherches", to: "/dashboard/alertes", icon: Bell },
    { label: "Actualités", to: "/dashboard/fil", icon: Newspaper },
    { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
    { label: "Paramètres", to: "/dashboard/parametres", icon: Settings },
  ],
  ADMIN: [
    { label: "Vue générale", to: "/dashboard", icon: LayoutDashboard },
    { label: "Administration", to: "/dashboard/admin", icon: ShieldCheck },
    { label: "Paramètres", to: "/dashboard/parametres", icon: Settings },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  const menu = MENUS[user?.role] || MENUS.EDUCATOR;

  useEffect(() => {
    api.get("/notifications").then(({ data }) => setUnread(data.unread)).catch(() => {});
  }, [location.pathname]);

  const isActive = (to) => (to === "/dashboard" ? location.pathname === to : location.pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-askool-cream">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-100 bg-white lg:flex">
        <div className="flex h-16 items-center px-6"><Logo /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 hide-scrollbar">
          {menu.map((m) => (
            <Link key={m.to} to={m.to} data-testid={`side-nav-${m.to}`}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(m.to) ? "bg-askool-blue text-white" : "text-gray-600 hover:bg-askool-bluelight")}>
              <m.icon size={18} /> {m.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button data-testid="logout-btn" onClick={() => { logout(); navigate("/"); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-100 bg-white/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3 lg:hidden"><Logo /></div>
          <div className="hidden text-sm text-muted-foreground lg:block">Bonjour, <span className="font-semibold text-gray-900">{user?.name}</span></div>
          <div className="flex items-center gap-3">
            <Link to="/" data-testid="back-home" className="hidden text-sm text-gray-500 hover:text-askool-blue sm:flex sm:items-center sm:gap-1"><Home size={16} /> Accueil</Link>
            <Link to="/dashboard/notifications" data-testid="notif-bell" className="relative rounded-full p-2 hover:bg-gray-100">
              <Bell size={20} className="text-gray-600" />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-askool-orange px-1 text-[10px] font-bold text-black">{unread}</span>}
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-askool-blue text-sm font-semibold text-white">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8 animate-fade-in">
          <Outlet />
        </div>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-gray-100 bg-white py-2 lg:hidden">
        {menu.slice(0, 5).map((m) => (
          <Link key={m.to} to={m.to} data-testid={`bottom-nav-${m.to}`}
            className={cn("flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
              isActive(m.to) ? "text-askool-blue" : "text-gray-500")}>
            <m.icon size={20} /> {m.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
