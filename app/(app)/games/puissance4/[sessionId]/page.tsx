import { notFound } from "next/navigation";
import { getCurrentPlayer } from "@/lib/server/session";
import { Puissance4Board } from "@/components/games/puissance4/Puissance4Board";
import type { SessionRow, PlayerRow } from "@/lib/hooks/useGameSession";

export default async function Puissance4SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const { supabase, userId } = await getCurrentPlayer();

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError) {
    // On affiche l'erreur réelle au lieu d'un 404 générique qui masque la
    // cause (RLS, id invalide, session supprimée...).
    return (
      <div className="mx-auto max-w-md space-y-3 px-4 pt-10 text-center">
        <p className="text-sm font-medium text-accent-orange">Impossible de charger cette partie</p>
        <p className="text-xs text-white/40">{sessionError.message}</p>
      </div>
    );
  }
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
      <Puissance4Board
        sessionId={sessionId}
        initialSession={session as SessionRow}
        initialPlayers={(players ?? []) as PlayerRow[]}
        meUserId={userId}
        playerInfo={playerInfo}
      />
    </div>
  );
}
