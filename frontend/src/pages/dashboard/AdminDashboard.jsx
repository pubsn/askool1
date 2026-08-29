import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Loader, VerifiedBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import SecureFile from "@/components/SecureFile";
import { FileText } from "lucide-react";
import api from "@/lib/api";

export default function AdminDashboard() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [verifs, setVerifs] = useState([]);

  const loadUsers = () => api.get("/admin/users").then(({ data }) => setUsers(data.results)).catch(() => {});
  const loadVerifs = () => api.get("/admin/verifications").then(({ data }) => setVerifs(data.results)).catch(() => {});
  useEffect(() => { loadUsers(); loadVerifs(); }, []);

  const act = async (id, status) => { try { await api.put(`/admin/verifications/${id}`, { status }); toast.success(`Profil ${status.toLowerCase()}`); loadVerifs(); } catch { toast.error("Erreur"); } };

  return (
    <div>
      <PageHeader title="Administration" subtitle="Gérez les utilisateurs, vérifications et contenus de la plateforme." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 rounded-xl bg-askool-bluelight p-1">
          <TabsTrigger data-testid="admin-tab-users" value="users">Utilisateurs ({users.length})</TabsTrigger>
          <TabsTrigger data-testid="admin-tab-verifs" value="verifs">Vérifications ({verifs.filter((v) => v.status === "En cours de vérification").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <Table>
              <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead>Vérifié</TableHead><TableHead>Inscrit</TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id} data-testid={`admin-user-${u.user_id}`}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><span className="rounded-full bg-askool-bluelight px-2 py-0.5 text-xs font-medium text-askool-blue">{u.role}</span></TableCell>
                    <TableCell>{u.email_verified ? "✓" : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="verifs">
          {verifs.length === 0 ? <p className="text-muted-foreground">Aucune demande de vérification.</p> : (
            <div className="space-y-3">
              {verifs.map((v) => (
                <div key={v.verification_id} data-testid={`verif-${v.verification_id}`} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div><h3 className="font-medium text-gray-900">{v.user_name}</h3><p className="text-sm text-muted-foreground">{v.documents?.length || 0} document(s) · {v.status}</p>
                    {v.documents?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {v.documents.filter((d) => d.file_id).map((d, i) => (
                          (d.name || "").match(/\.(png|jpg|jpeg|webp)$/i)
                            ? <SecureFile key={i} fileId={d.file_id} contentType="image/png" filename={d.name} className="h-16 w-16 rounded-lg object-cover" />
                            : <span key={i} className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-700"><FileText size={13} /><SecureFile fileId={d.file_id} contentType="application/pdf" filename={d.name} /></span>
                        ))}
                      </div>
                    )}
                  </div>
                  {v.status === "En cours de vérification" ? (
                    <div className="flex gap-2">
                      <Button size="sm" data-testid={`approve-${v.verification_id}`} onClick={() => act(v.verification_id, "Vérifié")} className="rounded-lg bg-emerald-600 text-white">Approuver</Button>
                      <Button size="sm" data-testid={`reject-${v.verification_id}`} variant="outline" onClick={() => act(v.verification_id, "Rejeté")} className="rounded-lg text-red-600">Rejeter</Button>
                    </div>
                  ) : <span className={`rounded-full px-3 py-1 text-xs font-medium ${v.status === "Vérifié" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{v.status}</span>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
