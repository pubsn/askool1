import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import DocViewer from "@/components/DocViewer";
import { FileText } from "lucide-react";
import api from "@/lib/api";

export default function AdminDashboard() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [verifs, setVerifs] = useState([]);
  const [reports, setReports] = useState([]);

  const loadUsers = () => api.get("/admin/users").then(({ data }) => setUsers(data.results)).catch(() => {});
  const loadVerifs = () => api.get("/admin/verifications").then(({ data }) => setVerifs(data.results)).catch(() => {});
  const loadReports = () => api.get("/admin/reports").then(({ data }) => setReports(data.results)).catch(() => {});
  useEffect(() => { loadUsers(); loadVerifs(); loadReports(); }, []);

  const act = async (id, status) => { try { await api.put(`/admin/verifications/${id}`, { status }); toast.success(`Profil ${status.toLowerCase()}`); loadVerifs(); } catch { toast.error("Erreur"); } };
  const closeReport = async (id) => { try { await api.put(`/admin/reports/${id}`, { status: "Traité" }); toast.success("Signalement traité"); loadReports(); } catch { toast.error("Erreur"); } };
  const pendingVerifs = verifs.filter((v) => v.status === "En cours de vérification").length;
  const openReports = reports.filter((r) => r.status === "Ouvert").length;

  return (
    <div>
      <PageHeader title="Administration" subtitle="Gérez les utilisateurs, vérifications, signalements et contenus." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 rounded-xl bg-askool-bluelight p-1">
          <TabsTrigger data-testid="admin-tab-users" value="users">Utilisateurs ({users.length})</TabsTrigger>
          <TabsTrigger data-testid="admin-tab-verifs" value="verifs">Vérifications ({pendingVerifs})</TabsTrigger>
          <TabsTrigger data-testid="admin-tab-reports" value="reports">Signalements ({openReports})</TabsTrigger>
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
                <div key={v.verification_id} data-testid={`verif-${v.verification_id}`} className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div>
                    <h3 className="font-medium text-gray-900">{v.user_name}</h3>
                    <p className="text-sm text-muted-foreground">{(v.documents || []).filter((d) => d.file_id).length} document(s) · {v.status}</p>
                    {(v.documents || []).filter((d) => d.file_id).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {v.documents.filter((d) => d.file_id).map((d, i) => (
                          /\.(png|jpg|jpeg|webp)$/i.test(d.name || "") ? (
                            <DocViewer key={i} fileId={d.file_id} filename={d.name} contentType="image/png" triggerClassName="rounded-lg overflow-hidden ring-1 ring-gray-200 hover:ring-askool-blue">
                              <div className="flex h-16 w-16 items-center justify-center bg-gray-100 text-xs text-gray-500">Aperçu</div>
                            </DocViewer>
                          ) : (
                            <DocViewer key={i} fileId={d.file_id} filename={d.name} contentType="application/pdf"
                              triggerClassName="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-700 hover:bg-gray-200">
                              <FileText size={14} /> {d.name || "Document"}
                            </DocViewer>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                  {v.status === "En cours de vérification" ? (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" data-testid={`approve-${v.verification_id}`} onClick={() => act(v.verification_id, "Vérifié")} className="rounded-lg bg-emerald-600 text-white">Approuver</Button>
                      <Button size="sm" data-testid={`reject-${v.verification_id}`} variant="outline" onClick={() => act(v.verification_id, "Rejeté")} className="rounded-lg text-red-600">Rejeter</Button>
                    </div>
                  ) : <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${v.status === "Vérifié" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{v.status}</span>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports">
          {reports.length === 0 ? <p className="text-muted-foreground">Aucun signalement.</p> : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.report_id} data-testid={`report-${r.report_id}`} className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div>
                    <h3 className="font-medium text-gray-900">{r.reporter_name} → {r.target_name || "Utilisateur"}</h3>
                    <p className="mt-1 text-sm text-gray-600">"{r.reason}"</p>
                    <span className="text-xs text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleString("fr-FR") : ""}</span>
                  </div>
                  {r.status === "Ouvert" ? (
                    <Button size="sm" data-testid={`close-report-${r.report_id}`} onClick={() => closeReport(r.report_id)} className="shrink-0 rounded-lg bg-askool-blue text-white">Marquer traité</Button>
                  ) : <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{r.status}</span>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
