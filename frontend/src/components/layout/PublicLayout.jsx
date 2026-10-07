import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, GraduationCap, Building2, Briefcase, BookOpen, Award, Newspaper, Lightbulb, Info, LifeBuoy, Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const PRIMARY = [
  { label: "Accueil", to: "/" },
  { label: "Explorer", to: "/#explorer" },
  { label: "Comment ça marche", to: "/comment-ca-marche" },
];

const SECONDARY = [
  { label: "Écoles", to: "/ecoles", icon: Building2, d: "Trouvez et comparez les établissements" },
  { label: "Éducateurs", to: "/educateurs", icon: Users, d: "Profils d'enseignants et de tuteurs" },
  { label: "Offres d'emploi", to: "/emplois", icon: Briefcase, d: "Postes publiés par les écoles" },
  { label: "Cours particuliers", to: "/educateurs?service_type=Cours+particuliers", icon: BookOpen, d: "Soutien scolaire et cours à domicile" },
  { label: "Formations", to: "/ecoles?type=formation", icon: Award, d: "Centres et formations professionnelles" },
  { label: "Actualités", to: "/#actualites", icon: Newspaper, d: "Les publications et guides ASKOOL" },
  { label: "Conseils", to: "/#actualites", icon: Lightbulb, d: "Bonnes pratiques parents et éducateurs" },
  { label: "À propos", to: "/a-propos", icon: Info, d: "La mission et l'équipe ASKOOL" },
  { label: "Aide / Contact", to: "/contact", icon: LifeBuoy, d: "Questions, support et assistance" },
];

export function Logo({ light = false }) {
  return (
    <Link to="/" data-testid="logo-link" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-askool-blue text-white">
        <GraduationCap size={20} />
      </span>
      <span className={`font-display text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-askool-blue"}`}>
        ASKOOL
      </span>
    </Link>
  );
}

export default function PublicLayout({ children }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => { setMenu(false); setOpen(false); }, [location.pathname, location.hash]);

  const isActive = (to) => (to.startsWith("/#") ? false : location.pathname === to);

  return (
    <div className="flex min-h-screen flex-col bg-askool-surface">
      <header className="sticky top-0 z-40 border-b border-askool-border bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="shrink-0"><Logo /></div>
          <nav className="hidden items-center gap-1 lg:flex">
            {PRIMARY.map((n) => (
              <Link key={n.label} to={n.to} data-testid={`nav-${n.label}`}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-askool-bluelight hover:text-askool-blue ${isActive(n.to) ? "text-askool-blue" : "text-askool-text"}`}>
                {n.label}
              </Link>
            ))}
            <button data-testid="nav-menu-toggle" onClick={() => setMenu((v) => !v)} aria-expanded={menu}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-askool-bluelight hover:text-askool-blue ${menu ? "bg-askool-bluelight text-askool-blue" : "text-askool-text"}`}>
              Menu <ChevronDown size={15} className={`transition-transform duration-200 ${menu ? "rotate-180" : ""}`} />
            </button>
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Button data-testid="header-dashboard-btn" onClick={() => navigate("/dashboard")}
                className="rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover">Mon espace</Button>
            ) : (
              <>
                <Button data-testid="header-login-btn" variant="ghost" onClick={() => navigate("/connexion")}
                  className="rounded-xl text-askool-text hover:text-askool-blue">Connexion</Button>
                <Button data-testid="header-register-btn" onClick={() => navigate("/inscription")}
                  className="rounded-xl bg-askool-orange font-semibold text-white hover:bg-askool-orangehover">Créer un compte</Button>
              </>
            )}
          </div>
          <button data-testid="mobile-menu-btn" className="rounded-lg p-2 text-askool-blue lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {/* Desktop secondary menu panel */}
        {menu && (
          <div data-testid="nav-menu-panel" className="hidden border-t border-askool-border bg-white shadow-card lg:block">
            <div className="mx-auto grid max-w-7xl gap-2 px-8 py-6 sm:grid-cols-2 lg:grid-cols-3">
              {SECONDARY.map((s) => (
                <Link key={s.label} to={s.to} data-testid={`menu-${s.label}`}
                  className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-askool-bluelight">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-askool-bluelight text-askool-blue group-hover:bg-white"><s.icon size={18} /></span>
                  <span>
                    <span className="block text-sm font-semibold text-askool-ink">{s.label}</span>
                    <span className="block text-xs text-askool-subtle">{s.d}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mobile drawer */}
        {open && (
          <div data-testid="mobile-nav-panel" className="max-h-[80vh] overflow-y-auto border-t border-askool-border bg-white px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {PRIMARY.map((n) => (
                <Link key={n.label} to={n.to} onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-askool-ink hover:bg-askool-bluelight">{n.label}</Link>
              ))}
            </nav>
            <div className="mt-3 border-t border-askool-border pt-3">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest text-askool-subtle">Menu</div>
              <nav className="flex flex-col gap-1">
                {SECONDARY.map((s) => (
                  <Link key={s.label} to={s.to} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-askool-text hover:bg-askool-bluelight hover:text-askool-blue">
                    <s.icon size={16} className="text-askool-blue" /> {s.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {user ? (
                <Button onClick={() => navigate("/dashboard")} className="rounded-xl bg-askool-blue text-white">Mon espace</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate("/connexion")} className="rounded-xl border-askool-blue text-askool-blue">Connexion</Button>
                  <Button onClick={() => navigate("/inscription")} className="rounded-xl bg-askool-orange font-semibold text-white">Créer un compte</Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-askool-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-sm text-askool-text">
                La plateforme qui connecte les talents éducatifs aux écoles et aux apprenants au Sénégal.
              </p>
            </div>
            <FooterCol title="Plateforme" links={[["Écoles", "/ecoles"], ["Éducateurs", "/educateurs"], ["Offres d'emploi", "/emplois"], ["Formations", "/ecoles?type=formation"], ["Tarifs", "/tarifs"]]} />
            <FooterCol title="Ressources" links={[["Comment ça marche", "/comment-ca-marche"], ["Pour les écoles", "/pour-les-ecoles"], ["À propos", "/a-propos"], ["FAQ", "/faq"], ["Contact", "/contact"]]} />
            <FooterCol title="Légal" links={[["Conditions générales", "/cgu"], ["Confidentialité", "/confidentialite"], ["Cookies", "/cookies"]]} />
          </div>
          <div className="mt-10 border-t border-askool-border pt-6 text-sm text-askool-subtle">
            © {new Date().getFullYear()} ASKOOL — Dakar, Sénégal. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="mb-3 font-display text-sm font-semibold text-askool-ink">{title}</h4>
      <ul className="space-y-2">
        {links.map(([label, to]) => (
          <li key={to}><Link to={to} className="text-sm text-askool-text transition-colors hover:text-askool-blue">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
