"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Avatar } from "@/components/ui/Avatar";
import { useGameSession, type SessionRow, type PlayerRow } from "@/lib/hooks/useGameSession";
import type { Side } from "@/lib/games/shared";
import { MessageCircle } from "lucide-react";
import { ChatThread } from "@/components/chat/ChatThread";
import { GameResultScreen } from "@/components/games/shared/GameResultScreen";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { LogOut, TimerOff } from "lucide-react";
import { motion } from "framer-motion";
import { useGameClock } from "@/lib/hooks/useGameClock";

interface PlayerInfo { user_id: string; username: string }
const ROWS = 6, COLS = 7;

export function Puissance4Board({
  sessionId, initialSession, initialPlayers, meUserId, playerInfo,
}: {
  sessionId: string; initialSession: SessionRow; initialPlayers: PlayerRow[];
  meUserId: string; playerInfo: PlayerInfo[];
}) {
  const router = useRouter();
  const { session, players } = useGameSession(sessionId, initialSession, initialPlayers);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const me = players.find((p) => p.user_id === meUserId);
  const mySide: Side | null = me ? (me.seat === 1 ? 1 : -1) : null;
  const board = session.board_state;
  const myTurn = mySide !== null && session.turn === mySide && session.status === "IN_PROGRESS";
  const { remaining, expired } = useGameClock(session.turn_started_at, 60, session.status === "IN_PROGRESS");

  function landingRow(col: number): number {
    if (!board) return -1;
    for (let r = ROWS - 1; r >= 0; r--) if (board[r][col] === 0) return r;
    return -1;
  }

  async function drop(col: number) {
    if (!myTurn || busy) return;
    const row = landingRow(col);
    if (row === -1) return;
    setBusy(true); setError(null);
    const res = await fetch(`/api/sessions/${sessionId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromRow: row, fromCol: col, toRow: row, toCol: col }),
    });
    setBusy(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "erreur" }));
      setError(error);
    }
  }

  async function claimTimeout() {
    setClaiming(true); setError(null);
    const res = await fetch(`/api/sessions/${sessionId}/timeout`, { method: "POST" });
    setClaiming(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "erreur" }));
      setError(error);
    }
  }

  async function abandon() {
    const msg = session.status === "WAITING"
      ? "Annuler cette partie ? Ta mise sera remboursée."
      : "Abandonner cette partie ? Ta mise sera perdue.";
    if (!confirm(msg)) return;
    await fetch(`/api/sessions/${sessionId}/abandon`, { method: "POST" });
    router.push("/games/puissance4");
    router.refresh();
  }

  if (session.status === "WAITING") {
    return (
      <GlassCard glow className="space-y-4 p-8 text-center">
        <p className="text-sm text-white/50">En attente d'un adversaire…</p>
        <p className="text-3xl font-semibold tracking-[0.2em] text-accent-cyan">{session.code}</p>
        <p className="text-xs text-white/40">Partage ce code pour que quelqu'un rejoigne ta partie.</p>
        <GlassButton onClick={abandon}><LogOut size={15} />Annuler la partie</GlassButton>
      </GlassCard>
    );
  }

  if (!board) {
    return <GlassCard className="p-8 text-center text-sm text-white/50">Chargement de la partie…</GlassCard>;
  }

  if (session.status === "FINISHED") {
    return <GameResultScreen sessionId={sessionId} meId={meUserId} lobbyHref="/games/puissance4" />;
  }

  const p1 = playerInfo.find((p) => players.find((pl) => pl.seat === 1)?.user_id === p.user_id);
  const p2 = playerInfo.find((p) => players.find((pl) => pl.seat === 2)?.user_id === p.user_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PlayerBadge username={p2?.username ?? "…"} active={session.turn === -1} />
        <span className="text-xs text-white/40">Mise {session.stake.toLocaleString("fr-FR")} coins</span>
        <PlayerBadge username={p1?.username ?? "…"} active={session.turn === 1} mirrored />
      </div>

      {session.status === "IN_PROGRESS" && (
        <div className="flex items-center justify-center gap-3 text-xs text-white/50">
          <span className={!myTurn && expired ? "text-accent-orange" : ""}>
            {myTurn ? "À toi de jouer" : "Tour adverse"} · {remaining}s
          </span>
          {!myTurn && expired && (
            <button onClick={claimTimeout} disabled={claiming} className="flex items-center gap-1 text-accent-orange underline">
              <TimerOff size={13} />{claiming ? "…" : "Réclamer le forfait"}
            </button>
          )}
        </div>
      )}

      <GlassCard className="mx-auto w-full max-w-md overflow-hidden p-1.5">
        <div
          className="grid gap-1 rounded-2xl bg-white/[0.03] p-1.5"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          onMouseLeave={() => setHoverCol(null)}
        >
          {Array.from({ length: ROWS * COLS }).map((_, i) => {
            const row = Math.floor(i / COLS), col = i % COLS;
            const cell = board[row][col];
            const preview = myTurn && hoverCol === col && cell === 0 && landingRow(col) === row;
            return (
              <button
                key={i}
                onMouseEnter={() => setHoverCol(col)}
                onClick={() => drop(col)}
                disabled={!myTurn}
                className="relative flex aspect-square items-center justify-center rounded-full bg-white/[0.05]"
              >
                {cell !== 0 && (
                  <motion.span
                    initial={{ scale: 0, y: -16 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 20 }}
                    className={`h-[80%] w-[80%] rounded-full border-2 shadow-md ${
                    cell > 0 ? "border-accent-cyan/60 bg-gradient-to-br from-accent-cyan/50 to-accent-cyan/10"
                              : "border-accent-orange/60 bg-gradient-to-br from-accent-orange/50 to-accent-orange/10"
                  }`} />
                )}
                {preview && <span className="absolute inset-2 rounded-full ring-2 ring-accent-cyan/50" />}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {error && <p className="text-center text-sm text-accent-orange">{error}</p>}

      <div className="flex justify-center gap-3">
        <GlassButton onClick={() => setChatOpen(true)}><MessageCircle size={15} />Chat</GlassButton>
        <GlassButton onClick={abandon}><LogOut size={15} />Abandonner</GlassButton>
      </div>

      <GlassSheet open={chatOpen} onClose={() => setChatOpen(false)} title="Chat de partie">
        <div className="h-[50vh]">
          <ChatThread meId={meUserId} sessionId={sessionId} />
        </div>
      </GlassSheet>
    </div>
  );
}

function PlayerBadge({ username, active, mirrored }: { username: string; active: boolean; mirrored?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${mirrored ? "flex-row-reverse" : ""}`}>
      <Avatar username={username} size="sm" />
      <span className={`text-sm ${active ? "font-semibold text-white" : "text-white/50"}`}>{username}</span>
      {active && <span className="h-2 w-2 rounded-full bg-accent-cyan shadow-glow" />}
    </div>
  );
}
