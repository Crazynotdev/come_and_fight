"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { UserPlus, Check, X, MessageCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useOnlineIds } from "@/lib/presence/PresenceContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";

interface Row { id: string; status: "PENDING" | "ACCEPTED" | "DECLINED"; user_id: string; friend_id: string }
interface ProfileLite { id: string; username: string; avatar_url: string | null; player_id: string }

export function FriendsClient({ meId }: { meId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const onlineIds = useOnlineIds();
  const supabase = createClient();

  async function load() {
    const { data } = await supabase.from("friendships").select("id, status, user_id, friend_id");
    const list = (data ?? []) as Row[];
    setRows(list);
    const ids = Array.from(new Set(list.flatMap((r) => [r.user_id, r.friend_id]))).filter((id) => id !== meId);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, avatar_url, player_id").in("id", ids);
      const map: Record<string, ProfileLite> = {};
      (profs ?? []).forEach((p) => (map[p.id] = p as ProfileLite));
      setProfiles(map);
    }
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("friendships-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendRequest(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const handle = query.trim();
    if (!handle) return;
    const { data: target } = await supabase
      .from("profiles").select("id, username")
      .or(`username.eq.${handle},player_id.eq.${handle.toUpperCase()}`)
      .maybeSingle();
    if (!target) return setMsg("Joueur introuvable (pseudo ou ID exact).");
    if (target.id === meId) return setMsg("Tu ne peux pas t'ajouter toi-même.");
    const { error } = await supabase.from("friendships").insert({ user_id: meId, friend_id: target.id, status: "PENDING" });
    setMsg(error ? (error.message.includes("duplicate") ? "Déjà en relation avec ce joueur." : error.message) : `Demande envoyée à ${target.username}.`);
    setQuery("");
    load();
  }

  async function respond(id: string, status: "ACCEPTED" | "DECLINED") {
    await supabase.from("friendships").update({ status }).eq("id", id);
    load();
  }
  async function remove(id: string) {
    await supabase.from("friendships").delete().eq("id", id);
    load();
  }

  const incoming = rows.filter((r) => r.status === "PENDING" && r.friend_id === meId);
  const outgoing = rows.filter((r) => r.status === "PENDING" && r.user_id === meId);
  const accepted = rows.filter((r) => r.status === "ACCEPTED");

  return (
    <div className="space-y-5">
      <GlassCard className="space-y-3 p-5">
        <p className="text-sm font-medium text-white/70">Ajouter un ami</p>
        <form onSubmit={sendRequest} className="flex gap-2">
          <GlassInput placeholder="Pseudo ou ID joueur (CF-XXXXX)" value={query} onChange={(e) => setQuery(e.target.value)} />
          <GlassButton type="submit" variant="primary"><UserPlus size={16} /></GlassButton>
        </form>
        {msg && <p className="text-xs text-white/50">{msg}</p>}
      </GlassCard>

      {incoming.length > 0 && (
        <GlassCard className="divide-y divide-glass-border">
          {incoming.map((r) => {
            const p = profiles[r.user_id];
            return (
              <div key={r.id} className="flex items-center gap-3 p-4">
                <Avatar username={p?.username ?? "?"} src={p?.avatar_url} size="sm" />
                <span className="flex-1 text-sm">{p?.username} veut t'ajouter</span>
                <button onClick={() => respond(r.id, "ACCEPTED")} className="text-accent-cyan"><Check size={18} /></button>
                <button onClick={() => respond(r.id, "DECLINED")} className="text-accent-orange"><X size={18} /></button>
              </div>
            );
          })}
        </GlassCard>
      )}

      {accepted.length === 0 && incoming.length === 0 ? (
        <EmptyState Icon={UserPlus} title="Aucun ami pour l'instant" text="Ajoute un joueur par son pseudo ou son ID." />
      ) : (
        <GlassCard className="divide-y divide-glass-border">
          {accepted.map((r) => {
            const otherId = r.user_id === meId ? r.friend_id : r.user_id;
            const p = profiles[otherId];
            const online = onlineIds.has(otherId);
            return (
              <div key={r.id} className="flex items-center gap-3 p-4">
                <div className="relative">
                  <Avatar username={p?.username ?? "?"} src={p?.avatar_url} size="sm" />
                  {online && <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-base-void bg-accent-cyan" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{p?.username}</p>
                  <p className="text-xs text-white/40">{online ? "En ligne" : "Hors ligne"}</p>
                </div>
                <Link href={`/messages/${otherId}`} className="text-white/60"><MessageCircle size={18} /></Link>
                <button onClick={() => remove(r.id)} className="text-white/30"><Trash2 size={16} /></button>
              </div>
            );
          })}
        </GlassCard>
      )}

      {outgoing.length > 0 && (
        <p className="text-center text-xs text-white/30">{outgoing.length} demande(s) envoyée(s) en attente.</p>
      )}
    </div>
  );
}
