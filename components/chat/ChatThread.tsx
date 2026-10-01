"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";

interface Msg { id: string; sender_id: string; body: string; created_at: string }

/**
 * Chat générique, réutilisable pour une partie (sessionId) ou une
 * conversation directe (recipientId) — exactement un des deux doit être
 * fourni, cohérent avec la contrainte en base (messages.ts, migration 0015).
 */
export function ChatThread({ meId, sessionId, recipientId }: { meId: string; sessionId?: string; recipientId?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let query = supabase.from("messages").select("id, sender_id, body, created_at").order("created_at", { ascending: true }).limit(200);
      query = sessionId ? query.eq("session_id", sessionId) : query.or(`and(sender_id.eq.${meId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${meId})`);
      const { data } = await query;
      if (!cancelled) setMessages((data ?? []) as Msg[]);
    }
    load();

    const channel = supabase
      .channel(`chat:${sessionId ?? [meId, recipientId].sort().join(":")}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg & { session_id: string | null; recipient_id: string | null };
        const belongs = sessionId ? m.session_id === sessionId
          : (m.sender_id === meId && m.recipient_id === recipientId) || (m.sender_id === recipientId && m.recipient_id === meId);
        if (belongs) setMessages((prev) => [...prev, m]);
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, recipientId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setBody("");
    await supabase.from("messages").insert(
      sessionId ? { sender_id: meId, session_id: sessionId, body: text } : { sender_id: meId, recipient_id: recipientId, body: text }
    );
    setSending(false);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === meId ? "justify-end" : "justify-start"}`}>
            <span className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
              m.sender_id === meId ? "bg-accent-cyan text-base-void" : "bg-white/[0.06] text-white"
            }`}>
              {m.body}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-glass-border p-3">
        <GlassInput
          placeholder="Message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          maxLength={500}
        />
        <GlassButton variant="primary" onClick={send} disabled={sending || !body.trim()}><Send size={16} /></GlassButton>
      </div>
    </div>
  );
}
