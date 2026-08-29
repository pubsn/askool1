import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/layout/PublicLayout";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-askool-cream">
      <div className="hidden w-1/2 flex-col justify-between bg-askool-blue p-12 lg:flex">
        <Logo light />
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight text-white">Connectez les talents éducatifs aux écoles et aux apprenants.</h2>
          <p className="mt-4 max-w-md text-blue-100">Rejoignez la communauté ASKOOL et développez votre activité éducative au Sénégal.</p>
        </div>
        <p className="text-sm text-blue-200">© {new Date().getFullYear()} ASKOOL — Dakar, Sénégal</p>
      </div>
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="font-display text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function GoogleButton({ role }) {
  const go = () => {
    if (role) sessionStorage.setItem("askool_signup_role", role);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return (
    <button data-testid="google-auth-btn" onClick={go} type="button"
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5" />
      Continuer avec Google
    </button>
  );
}
