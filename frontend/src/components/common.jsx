import React from "react";
import { Star, ShieldCheck, Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value = 0, size = 16, className = "" }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Note ${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size}
          className={i <= Math.round(value) ? "fill-askool-orange text-askool-orange" : "text-gray-300"} />
      ))}
    </span>
  );
}

export function VerifiedBadge({ className = "" }) {
  return (
    <span data-testid="verified-badge"
      className={cn("inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600", className)}>
      <ShieldCheck size={13} /> Profil vérifié
    </span>
  );
}

export function MatchBadge({ score, className = "" }) {
  return (
    <span data-testid="match-badge"
      className={cn("inline-flex items-center rounded-full bg-askool-blue/10 px-3 py-1 text-sm font-bold text-askool-blue", className)}>
      {score}% compatible
    </span>
  );
}

export function PremiumBadge() {
  return (
    <span className="inline-flex items-center rounded-md bg-gradient-to-r from-askool-orange to-askool-orangehover px-2 py-1 text-xs font-bold uppercase text-black">
      Premium
    </span>
  );
}

export function Loader({ label = "Chargement…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground" data-testid="loader">
      <Loader2 className="animate-spin" size={20} /> {label}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, testId }) {
  return (
    <div data-testid={testId || "empty-state"} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-askool-bluelight text-askool-blue">
        <Icon size={26} />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mb-5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, accent = "blue", testId }) {
  const colors = {
    blue: "bg-askool-bluelight text-askool-blue",
    orange: "bg-askool-orangelight text-askool-orangehover",
    green: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div data-testid={testId} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", colors[accent])}><Icon size={18} /></span>}
      </div>
      <div className="mt-3 font-display text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tag({ children }) {
  return <span className="inline-block rounded-full bg-askool-bluelight px-2.5 py-0.5 text-xs font-medium text-askool-blue">{children}</span>;
}
