import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const del = async () => { try { await api.delete("/account"); toast.success("Compte supprimé"); await logout(); navigate("/"); } catch { toast.error("Erreur"); } };
  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Gérez votre compte et vos préférences." />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Informations du compte</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Nom</Label><Input value={user?.name || ""} disabled className="mt-1 rounded-lg bg-gray-50" /></div>
            <div><Label>Email</Label><Input value={user?.email || ""} disabled className="mt-1 rounded-lg bg-gray-50" /></div>
            <div><Label>Rôle</Label><Input value={user?.role || ""} disabled className="mt-1 rounded-lg bg-gray-50" /></div>
            <div><Label>Email vérifié</Label><Input value={user?.email_verified ? "Oui ✓" : "Non"} disabled className="mt-1 rounded-lg bg-gray-50" /></div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-2 font-display text-lg font-semibold text-gray-900">Confidentialité & consentement</h2>
          <p className="text-sm text-muted-foreground">Vos données personnelles sont protégées. Vos documents sensibles ne sont jamais rendus publics.</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
          <h2 className="mb-2 font-display text-lg font-semibold text-red-700">Zone dangereuse</h2>
          <p className="mb-4 text-sm text-red-600">La suppression de votre compte est définitive.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button data-testid="delete-account-btn" variant="destructive" className="rounded-xl">Supprimer mon compte</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Toutes vos données seront supprimées.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction data-testid="confirm-delete-btn" onClick={del} className="bg-red-600">Supprimer définitivement</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
