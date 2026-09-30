"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Board } from "@/lib/games/dames/engine";

export interface SessionRow {
  id: string; code: string; status: string; stake: number; pot: number;
  board_state: Board | null; turn: 1 | -1 | null;
  forced_row: number | null; forced_col: number | null; version: number;
  turn_started_at: string | null;
}
export interface PlayerRow { user_id: string; seat: number; status: string }

/** Abonnement Realtime : la session et ses joueurs se mettent à jour en direct pour les deux camps. */
export function useGameSession(sessionId: string, initialSession: SessionRow, initialPlayers: PlayerRow[]) {
  const [session, setSession] = useState(initialSession);
  const [players, setPlayers] = useState(initialPlayers);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` },
        (payload) => setSession(payload.new as SessionRow))
      .on("postgres_changes", { event: "*", schema: "public", table: "game_players", filter: `session_id=eq.${sessionId}` },
        async () => {
          const { data } = await supabase.from("game_players").select("user_id, seat, status").eq("session_id", sessionId);
          if (data) setPlayers(data as PlayerRow[]);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  return { session, players };
}
