"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

const PresenceCtx = createContext<Set<string>>(new Set());

/**
 * Présence en ligne réelle : chaque client connecté "track" sa propre
 * entrée sur un canal Supabase Realtime Presence partagé. L'ensemble des
 * clés présentes = les utilisateurs réellement connectés en ce moment
 * (pas une liste simulée). Monté une fois dans AppShell.
 */
export function PresenceProvider({ userId, username, children }: { userId: string; username: string; children: ReactNode }) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("online-players", { config: { presence: { key: userId } } });

    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineIds(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ username, online_at: new Date().toISOString() });
      });

    return () => { supabase.removeChannel(channel); };
  }, [userId, username]);

  return <PresenceCtx.Provider value={onlineIds}>{children}</PresenceCtx.Provider>;
}

export function useOnlineIds() {
  return useContext(PresenceCtx);
}
