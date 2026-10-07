import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Briefcase, GraduationCap, Clock } from "lucide-react";
import { Tag } from "@/components/common";
import { Button } from "@/components/ui/button";

export default function JobCard({ job }) {
  const navigate = useNavigate();
  return (
    <div data-testid={`job-card-${job.offer_id}`}
      className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-askool-orangelight px-2 py-0.5 text-xs font-semibold text-askool-orangehover">{job.contract_type}</span>
        <span className="text-xs text-muted-foreground">{job.school_name}</span>
      </div>
      <h3 className="font-display text-lg font-semibold text-gray-900">{job.title}</h3>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-askool-text">
        <span className="flex items-center gap-1"><Briefcase size={14} /> {job.subject || "Toutes matières"}</span>
        <span className="flex items-center gap-1"><GraduationCap size={14} /> {job.level || "Tous niveaux"}</span>
        <span className="flex items-center gap-1"><MapPin size={14} /> {job.region}</span>
        {job.created_at && <span className="flex items-center gap-1"><Clock size={14} /> {new Date(job.created_at).toLocaleDateString("fr-FR")}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(job.skills || []).slice(0, 3).map((s) => <Tag key={s}>{s}</Tag>)}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-askool-border pt-4">
        <div className="text-sm font-semibold text-askool-ink">{job.salary || "Salaire à discuter"}</div>
        <Button data-testid={`view-job-${job.offer_id}`} variant="outline"
          onClick={() => navigate(`/emplois/${job.offer_id}`)}
          className="rounded-xl border-askool-blue text-askool-blue hover:bg-askool-bluelight">
          Voir l'offre
        </Button>
      </div>
    </div>
  );
}
