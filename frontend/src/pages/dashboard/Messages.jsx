import React, { useEffect, useRef, useState } from "react";
import { PageHeader, Loader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Messages() {
  const { user } = useAuth();
  const [convs, setConvs] = useState(null);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const loadConvs = () => api.get("/conversations").then(({ data }) => { setConvs(data.results); if (!active && data.results[0]) openConv(data.results[0]); }).catch(() => setConvs([]));
  useEffect(() => { loadConvs(); }, []);
  const openConv = async (c) => { setActive(c); const { data } = await api.get(`/conversations/${c.conversation_id}/messages`); setMessages(data.results); };
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !active) return;
    const { data } = await api.post("/messages", { recipient_user_id: active.other_user_id, content: text });
    setMessages((m) => [...m, data.message]); setText("");
  };

  if (convs === null) return <Loader />;
  return (
    <div>
      <PageHeader title="Messages" subtitle="Échangez en toute sécurité, sans partager vos coordonnées." />
      {convs.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Aucune conversation" description="Contactez un éducateur ou une école pour démarrer une conversation." />
      ) : (
        <div className="grid h-[600px] grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:grid-cols-3">
          <div className="border-r border-gray-100 overflow-y-auto md:col-span-1 hide-scrollbar">
            {convs.map((c) => (
              <button key={c.conversation_id} data-testid={`conv-${c.conversation_id}`} onClick={() => openConv(c)}
                className={cn("flex w-full items-center gap-3 border-b border-gray-50 p-4 text-left hover:bg-gray-50", active?.conversation_id === c.conversation_id && "bg-askool-bluelight")}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-askool-blue text-sm font-semibold text-white">{(c.other_name || "?").charAt(0)}</span>
                <div className="min-w-0"><div className="truncate font-medium text-gray-900">{c.other_name}</div><div className="truncate text-xs text-muted-foreground">{c.last_message}</div></div>
              </button>
            ))}
          </div>
          <div className="flex flex-col md:col-span-2">
            {active ? (
              <>
                <div className="border-b border-gray-100 p-4 font-display font-semibold text-gray-900">{active.other_name}</div>
                <div className="flex-1 space-y-2 overflow-y-auto p-4 hide-scrollbar">
                  {messages.map((m) => (
                    <div key={m.message_id} className={cn("max-w-[75%] rounded-2xl px-4 py-2 text-sm", m.sender_user_id === user.user_id ? "ml-auto bg-askool-blue text-white" : "bg-gray-100 text-gray-800")}>{m.content}</div>
                  ))}
                  <div ref={endRef} />
                </div>
                <div className="flex gap-2 border-t border-gray-100 p-3">
                  <Input data-testid="message-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Écrivez un message…" className="rounded-xl" />
                  <Button data-testid="send-btn" onClick={send} className="rounded-xl bg-askool-blue text-white"><Send size={16} /></Button>
                </div>
              </>
            ) : <div className="flex flex-1 items-center justify-center text-muted-foreground">Sélectionnez une conversation</div>}
          </div>
        </div>
      )}
    </div>
  );
}
