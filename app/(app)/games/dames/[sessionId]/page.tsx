import { notFound } from "next/navigation";
import { getCurrentPlayer } from "@/lib/server/session";
import { DamesBoard } from "@/components/games/dames/DamesBoard";
import type { SessionRow, PlayerRow } from "@/lib/hooks/useGameSession";

export default async function DamesSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const { supabase, userId } = await getCurrentPlayer();

  const { data: session } = await supabase.from("game_sessions").select("*").eq("id", sessionId).single();
  if (!session) notFound();

  const { data: players } = await supabase
    .from("game_players")
    .select("user_id, seat, status")
    .eq("session_id", sessionId);

  const userIds = (players ?? []).map((p) => p.user_id);
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds);
  const playerInfo = (profiles ?? []).map((p) => ({ user_id: p.id, username: p.username }));

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pt-6 md:pt-10">
      <DamesBoard
        sessionId={sessionId}
        initialSession={session as SessionRow}
        initialPlayers={(players ?? []) as PlayerRow[]}
        meUserId={userId}
        playerInfo={playerInfo}
      />
    </div>
  );
}
