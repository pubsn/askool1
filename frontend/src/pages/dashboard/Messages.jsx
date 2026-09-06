import React, { useEffect, useRef, useState } from "react";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Paperclip, MoreVertical, Ban, Flag, ShieldOff, FileText, Loader2, Check, CheckCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SecureFile from "@/components/SecureFile";
import DocViewer from "@/components/DocViewer";

export default function Messages() {
  const { user } = useAuth();
  const [convs, setConvs] = useState(null);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const endRef = useRef(null);
  const fileRef = useRef(null);

  const loadConvs = async () => {
    const { data } = await api.get("/conversations").catch(() => ({ data: { results: [] } }));
    setConvs(data.results);
    if (data.results[0] && !active) openConv(data.results[0]);
  };
  useEffect(() => { loadConvs(); }, []);
  const openConv = async (c) => {
    const { data } = await api.get(`/conversations/${c.conversation_id}/messages`);
    setActive({ ...c, ...(data.conversation || {}) });
    setMessages(data.results);
  };
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // presence heartbeat
  useEffect(() => {
    const ping = () => api.post("/presence/ping").catch(() => {});
    ping();
    const t = setInterval(ping, 45000);
    return () => clearInterval(t);
  }, []);

  // refresh active conversation (read receipts + presence) + conv list
  useEffect(() => {
    if (!active) return;
    const t = setInterval(async () => {
      try {
        const { data } = await api.get(`/conversations/${active.conversation_id}/messages`);
        setMessages(data.results);
        setActive((a) => ({ ...a, ...(data.conversation || {}) }));
      } catch {}
      loadConvs();
    }, 12000);
    return () => clearInterval(t);
  }, [active?.conversation_id]);

  const lastSeenText = (iso) => {
    if (!iso) return "Hors ligne";
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 120) return "En ligne";
    if (diff < 3600) return `Vu il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Vu il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Vu il y a ${Math.floor(diff / 86400)} j`;
    return "Hors ligne";
  };

  const blocked = active?.is_blocked;
  const lastOwnId = [...messages].reverse().find((m) => m.sender_user_id === user.user_id)?.message_id;

  const send = async (attachment_file_id) => {
    if ((!text.trim() && !attachment_file_id) || !active) return;
    try {
      const { data } = await api.post("/messages", { recipient_user_id: active.other_user_id, content: text, attachment_file_id });
      setMessages((m) => [...m, data.message]);
      setText("");
    } catch (e) { toast.error(e.response?.data?.detail || "Erreur d'envoi"); }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads?category=attachment&visibility=private", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await send(data.file.file_id);
    } catch (err) { toast.error(err.response?.data?.detail || "Échec de la pièce jointe"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const toggleBlock = async () => {
    const url = `/conversations/${active.conversation_id}/${blocked ? "unblock" : "block"}`;
    const { data } = await api.post(url);
    toast.success(blocked ? "Conversation débloquée" : "Conversation bloquée");
    setActive((a) => ({ ...a, is_blocked: data.is_blocked, blocked_by_me: !blocked }));
    loadConvs();
  };

  const submitReport = async () => {
    try {
      await api.post("/reports", { target_user_id: active.other_user_id, conversation_id: active.conversation_id, reason: reportReason });
      toast.success("Signalement transmis à notre équipe");
      setReportOpen(false); setReportReason("");
    } catch { toast.error("Erreur"); }
  };

  if (convs === null) return <Loader />;
  return (
    <div>
      <PageHeader title="Messages" subtitle="Échangez en toute sécurité, sans partager vos coordonnées." />
      {convs.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Aucune conversation" description="Contactez un éducateur ou une école pour démarrer une conversation." />
      ) : (
        <div className="grid h-[600px] grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:grid-cols-3">
          <div className="hide-scrollbar overflow-y-auto border-r border-gray-100 md:col-span-1">
            {convs.map((c) => (
              <button key={c.conversation_id} data-testid={`conv-${c.conversation_id}`} onClick={() => openConv(c)}
                className={cn("relative flex w-full items-center gap-3 border-b border-gray-50 p-4 text-left hover:bg-gray-50", active?.conversation_id === c.conversation_id && "bg-askool-bluelight")}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-askool-blue text-sm font-semibold text-white">{(c.other_name || "?").charAt(0)}</span>
                  {c.other_online && <span data-testid={`online-dot-${c.conversation_id}`} className="absolute bottom-0 left-7 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
                <div className="min-w-0 flex-1"><div className="flex items-center gap-1 truncate font-medium text-gray-900">{c.other_name}{c.is_blocked && <Ban size={12} className="text-red-400" />}</div>{c.context && <div className="truncate text-[11px] font-medium text-askool-orangehover">{c.context}</div>}<div className="truncate text-xs text-muted-foreground">{c.last_message}</div></div>
              </button>
            ))}
          </div>
          <div className="flex flex-col md:col-span-2">
            {active ? (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-gray-900">{active.other_name}</span>
                    {active.context && <span data-testid="conversation-context" className="hidden rounded-md bg-askool-orangelight px-2 py-0.5 text-xs font-medium text-askool-orangehover sm:inline">{active.context}</span>}
                    <span data-testid="presence-status" className={cn("flex items-center gap-1 text-xs", active.other_online ? "text-emerald-600" : "text-muted-foreground")}>
                      {active.other_online && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                      {lastSeenText(active.other_last_seen)}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><button data-testid="conv-menu-btn" className="rounded-lg p-2 hover:bg-gray-100"><MoreVertical size={18} className="text-gray-500" /></button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem data-testid="block-btn" onClick={toggleBlock}>
                        {blocked ? <><ShieldOff size={15} className="mr-2" /> Débloquer</> : <><Ban size={15} className="mr-2" /> Bloquer</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem data-testid="report-btn" onClick={() => setReportOpen(true)} className="text-red-600"><Flag size={15} className="mr-2" /> Signaler</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="hide-scrollbar flex-1 space-y-2 overflow-y-auto p-4">
                  {messages.map((m) => {
                    const mine = m.sender_user_id === user.user_id;
                    return (
                      <div key={m.message_id} className={cn("max-w-[75%] rounded-2xl px-4 py-2 text-sm", mine ? "ml-auto bg-askool-blue text-white" : "bg-gray-100 text-gray-800")}>
                        {m.content && <div>{m.content}</div>}
                        {m.attachment && (
                          <div className={cn("mt-1", m.content && "border-t pt-2", mine ? "border-white/20" : "border-gray-200")}>
                            {(m.attachment.content_type || "").startsWith("image") ? (
                              <DocViewer fileId={m.attachment.file_id} filename={m.attachment.name} contentType={m.attachment.content_type}>
                                <SecureFile fileId={m.attachment.file_id} contentType={m.attachment.content_type} filename={m.attachment.name} className="max-h-40 rounded-lg object-cover" />
                              </DocViewer>
                            ) : (
                              <DocViewer fileId={m.attachment.file_id} filename={m.attachment.name} contentType={m.attachment.content_type}
                                triggerClassName={cn("flex items-center gap-2 rounded-lg px-2 py-1 text-sm underline", mine ? "text-white" : "text-askool-blue")}>
                                <FileText size={15} /> {m.attachment.name}
                              </DocViewer>
                            )}
                          </div>
                        )}
                        {mine && m.message_id === lastOwnId && (
                          <div data-testid="read-receipt" className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/70">
                            {m.read ? <><CheckCheck size={12} /> Vu</> : <><Check size={12} /> Envoyé</>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
                {blocked ? (
                  <div data-testid="blocked-banner" className="border-t border-gray-100 bg-red-50 p-4 text-center text-sm text-red-600">
                    {active.blocked_by_me ? "Vous avez bloqué cette conversation." : "Cette conversation est bloquée."} {active.blocked_by_me && <button onClick={toggleBlock} className="font-semibold underline">Débloquer</button>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border-t border-gray-100 p-3">
                    <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={onFile} data-testid="attach-input" />
                    <button data-testid="attach-btn" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50">
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                    </button>
                    <Input data-testid="message-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Écrivez un message…" className="rounded-xl" />
                    <Button data-testid="send-btn" onClick={() => send()} className="rounded-xl bg-askool-blue text-white"><Send size={16} /></Button>
                  </div>
                )}
              </>
            ) : <div className="flex flex-1 items-center justify-center text-muted-foreground">Sélectionnez une conversation</div>}
          </div>
        </div>
      )}

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent><DialogHeader><DialogTitle>Signaler {active?.other_name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Décrivez le problème. Notre équipe examinera votre signalement.</p>
          <Textarea data-testid="report-reason" value={reportReason} onChange={(e) => setReportReason(e.target.value)} rows={4} placeholder="Motif du signalement…" className="rounded-lg" />
          <Button data-testid="submit-report-btn" onClick={submitReport} disabled={reportReason.trim().length < 5} className="rounded-xl bg-red-600 text-white hover:bg-red-700">Envoyer le signalement</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
