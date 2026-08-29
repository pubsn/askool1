import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { label: "Accueil", to: "/" },
  { label: "Trouver un éducateur", to: "/educateurs" },
  { label: "Trouver un emploi", to: "/emplois" },
  { label: "Pour les écoles", to: "/pour-les-ecoles" },
  { label: "Comment ça marche", to: "/comment-ca-marche" },
  { label: "Tarifs", to: "/tarifs" },
  { label: "À propos", to: "/a-propos" },
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
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-askool-cream">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-6 xl:flex">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} data-testid={`nav-${n.to}`}
                className={`text-sm font-medium transition-colors hover:text-askool-blue ${location.pathname === n.to ? "text-askool-blue" : "text-gray-600"}`}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Button data-testid="header-dashboard-btn" onClick={() => navigate("/dashboard")}
                className="rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover">Mon espace</Button>
            ) : (
              <>
                <Button data-testid="header-login-btn" variant="ghost" onClick={() => navigate("/connexion")}
                  className="rounded-xl">Se connecter</Button>
                <Button data-testid="header-register-btn" onClick={() => navigate("/inscription")}
                  className="rounded-xl bg-askool-orange font-semibold text-black hover:bg-askool-orangehover">Créer un compte</Button>
              </>
            )}
          </div>
          <button data-testid="mobile-menu-btn" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="border-t border-gray-100 bg-white px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-askool-bluelight">{n.label}</Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2">
              {user ? (
                <Button onClick={() => navigate("/dashboard")} className="rounded-xl bg-askool-blue text-white">Mon espace</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate("/connexion")} className="rounded-xl">Se connecter</Button>
                  <Button onClick={() => navigate("/inscription")} className="rounded-xl bg-askool-orange font-semibold text-black">Créer un compte</Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                La plateforme qui connecte les talents éducatifs aux écoles et aux apprenants au Sénégal.
              </p>
            </div>
            <FooterCol title="Plateforme" links={[["Trouver un éducateur", "/educateurs"], ["Trouver un emploi", "/emplois"], ["Pour les écoles", "/pour-les-ecoles"], ["Tarifs", "/tarifs"]]} />
            <FooterCol title="Ressources" links={[["Comment ça marche", "/comment-ca-marche"], ["À propos", "/a-propos"], ["FAQ", "/faq"], ["Contact", "/contact"]]} />
            <FooterCol title="Légal" links={[["Conditions générales", "/cgu"], ["Confidentialité", "/confidentialite"], ["Cookies", "/cookies"]]} />
          </div>
          <div className="mt-10 border-t border-gray-100 pt-6 text-sm text-muted-foreground">
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
      <h4 className="mb-3 font-display text-sm font-semibold text-gray-900">{title}</h4>
      <ul className="space-y-2">
        {links.map(([label, to]) => (
          <li key={to}><Link to={to} className="text-sm text-muted-foreground hover:text-askool-blue">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
