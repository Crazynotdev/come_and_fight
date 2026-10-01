"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Avatar } from "@/components/ui/Avatar";
import { useGameSession, type SessionRow, type PlayerRow } from "@/lib/hooks/useGameSession";
import { legalStepsForSide, type Side } from "@/lib/games/dames/engine";
import { MessageCircle } from "lucide-react";
import { ChatThread } from "@/components/chat/ChatThread";
import { GameResultScreen } from "@/components/games/shared/GameResultScreen";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { LogOut, TimerOff, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useGameClock } from "@/lib/hooks/useGameClock";

interface PlayerInfo { user_id: string; username: string }

export function DamesBoard({
  sessionId, initialSession, initialPlayers, meUserId, playerInfo,
}: {
  sessionId: string; initialSession: SessionRow; initialPlayers: PlayerRow[];
  meUserId: string; playerInfo: PlayerInfo[];
}) {
  const router = useRouter();
  const { session, players } = useGameSession(sessionId, initialSession, initialPlayers);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const me = players.find((p) => p.user_id === meUserId);
  const mySide: Side | null = me ? (me.seat === 1 ? 1 : -1) : null;
  const board = session.board_state;
  const myTurn = mySide !== null && session.turn === mySide && session.status === "IN_PROGRESS";
  const { remaining, expired } = useGameClock(session.turn_started_at, 60, session.status === "IN_PROGRESS");
  const [claiming, setClaiming] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const legalFromSelected = useMemo(() => {
    if (!board || !selected || mySide === null) return [];
    const forced = session.forced_row != null ? { row: session.forced_row, col: session.forced_col! } : null;
    return legalStepsForSide(board, mySide, forced).filter(
      (s) => s.from.row === selected.row && s.from.col === selected.col
    );
  }, [board, selected, mySide, session.forced_row, session.forced_col]);

  const selectableFrom = useMemo(() => {
    if (!board || mySide === null || !myTurn) return new Set<string>();
    const forced = session.forced_row != null ? { row: session.forced_row, col: session.forced_col! } : null;
    const steps = legalStepsForSide(board, mySide, forced);
    return new Set(steps.map((s) => `${s.from.row}-${s.from.col}`));
  }, [board, mySide, myTurn, session.forced_row, session.forced_col]);

  async function play(toRow: number, toCol: number) {
    if (!selected || busy) return;
    setBusy(true); setError(null);
    const res = await fetch(`/api/sessions/${sessionId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromRow: selected.row, fromCol: selected.col, toRow, toCol }),
    });
    setBusy(false);
    setSelected(null);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "erreur" }));
      setError(error);
    }
  }

  function onCellClick(row: number, col: number) {
    if (!myTurn || !board) return;
    const key = `${row}-${col}`;
    if (selected && legalFromSelected.some((s) => s.to.row === row && s.to.col === col)) {
      play(row, col);
      return;
    }
    if (selectableFrom.has(key)) setSelected({ row, col });
    else setSelected(null);
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
    router.push("/games/dames");
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
    return <GameResultScreen sessionId={sessionId} meId={meUserId} lobbyHref="/games/dames" />;
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

      <GlassCard className="mx-auto aspect-square w-full max-w-md overflow-hidden p-1.5">
        <div className="grid h-full w-full grid-cols-10 grid-rows-10 overflow-hidden rounded-2xl">
          {board.map((rowArr, row) =>
            rowArr.map((cell, col) => {
              const dark = (row + col) % 2 === 1;
              const isSelected = selected?.row === row && selected?.col === col;
              const isTarget = !!selected && legalFromSelected.some((s) => s.to.row === row && s.to.col === col);
              const isSelectable = dark && selectableFrom.has(`${row}-${col}`);
              return (
                <button
                  key={`${row}-${col}`}
                  onClick={() => dark && onCellClick(row, col)}
                  className={`relative flex items-center justify-center ${dark ? "bg-[#1a1f2e]" : "bg-[#2a3142]"} ${isSelected ? "ring-2 ring-inset ring-accent-cyan" : ""}`}
                  disabled={!dark}
                >
                  {isTarget && <span className="absolute h-2.5 w-2.5 rounded-full bg-accent-cyan shadow-glow" />}
                  {isSelectable && !isTarget && <span className="absolute inset-1 rounded-full ring-1 ring-accent-cyan/40" />}
                  {cell !== 0 && (
                    <motion.span
                      layout
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 28 }}
                      className={`flex h-[74%] w-[74%] items-center justify-center rounded-full border-2 shadow-[0_2px_6px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.15)] ${
                        cell > 0
                          ? "border-accent-cyan/70 bg-gradient-to-br from-accent-cyan/60 via-accent-cyan/25 to-[#0a1520]"
                          : "border-accent-orange/70 bg-gradient-to-br from-accent-orange/60 via-accent-orange/25 to-[#1f0f05]"
                      }`}
                    >
                      {(cell === 2 || cell === -2) && (
                        <Crown size={14} strokeWidth={2.5} className={cell > 0 ? "text-accent-cyan" : "text-accent-orange"} fill="currentColor" />
                      )}
                    </motion.span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </GlassCard>

      {error && <p className="text-center text-sm text-accent-orange">{error}</p>}
      {session.forced_row != null && myTurn && (
        <p className="text-center text-xs text-accent-cyan">Rafle en cours — tu dois continuer avec la même pièce.</p>
      )}

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
