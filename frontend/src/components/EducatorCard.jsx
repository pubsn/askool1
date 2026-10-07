import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Briefcase, Star, GraduationCap } from "lucide-react";
import { Stars, VerifiedBadge, Tag, PremiumBadge, MatchBadge } from "@/components/common";
import { Button } from "@/components/ui/button";

export default function EducatorCard({ edu }) {
  const navigate = useNavigate();
  return (
    <div data-testid={`educator-card-${edu.user_id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex gap-4 p-5">
        <img src={edu.photo || edu.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(edu.name)}
          alt={edu.name} loading="lazy"
          className="h-20 w-20 shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display text-lg font-semibold text-gray-900">{edu.name}</h3>
            {edu.is_premium && <PremiumBadge />}
          </div>
          <p className="truncate text-sm text-askool-blue">{edu.profession}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-askool-subtle">
            <MapPin size={12} /> {edu.location || edu.region}
          </div>
          {(edu.levels?.length > 0 || edu.experience_years > 0) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-askool-subtle">
              {edu.levels?.length > 0 && <span className="flex items-center gap-1"><GraduationCap size={12} /> {edu.levels.slice(0, 2).join(" · ")}</span>}
              {edu.experience_years > 0 && <span className="flex items-center gap-1"><Briefcase size={12} /> {edu.experience_years} ans d'expérience</span>}
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <Stars value={edu.rating} size={14} />
            <span className="text-xs text-muted-foreground">{edu.rating || 0} ({edu.reviews_count || 0})</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 px-5">
        {(edu.subjects || []).slice(0, 3).map((s) => <Tag key={s}>{s}</Tag>)}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 px-5">
        {edu.is_verified && <VerifiedBadge />}
        {typeof edu.match_score === "number" && <MatchBadge score={edu.match_score} />}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 p-5 pt-4">
        <div className="text-sm">
          <span className="font-display text-lg font-bold text-gray-900">{(edu.hourly_rate || 0).toLocaleString()} F</span>
          <span className="text-muted-foreground">/h</span>
        </div>
        <Button data-testid={`view-profile-${edu.user_id}`}
          onClick={() => navigate(`/educateurs/${edu.user_id}`)}
          className="rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover">
          Voir le profil
        </Button>
      </div>
      {edu.match_reasons?.length > 0 && (
        <p className="border-t border-gray-100 px-5 py-2 text-xs text-muted-foreground">
          Correspond à {edu.match_reasons.join(", ")}.
        </p>
      )}
    </div>
  );
}
