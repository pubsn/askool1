import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import FileUpload from "@/components/FileUpload";
import api, { API_ROOT } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const del = async () => { try { await api.delete("/account"); toast.success("Compte supprimé"); await logout(); navigate("/"); } catch { toast.error("Erreur"); } };
  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Gérez votre compte et vos préférences." />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Photo de profil</h2>
          <div className="flex items-center gap-4">
            {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" data-testid="avatar-preview" className="h-16 w-16 rounded-full object-cover" /> : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">Photo</span>}
            <FileUpload category="photo" visibility="public" accept="image/*" testId="upload-avatar" onUploaded={async (file) => { try { await api.put("/users/me/avatar", { avatar_url: `${API_ROOT}/files/${file.file_id}` }); await refreshUser(); toast.success("Photo de profil mise à jour"); } catch { toast.error("Erreur"); } }}>Téléverser une photo</FileUpload>
          </div>
        </div>
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
