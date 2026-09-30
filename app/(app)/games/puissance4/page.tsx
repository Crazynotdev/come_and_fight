import { PageHeader } from "@/components/ui/PageHeader";
import { GameLobby } from "@/components/games/shared/GameLobby";
import { getCurrentPlayer } from "@/lib/server/session";

export default async function Puissance4LobbyPage() {
  const { supabase } = await getCurrentPlayer();
  const { data: game } = await supabase.from("games").select("min_stake, allow_free_play").eq("slug", "puissance4").single();

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 pt-6 md:pt-10">
      <PageHeader title="Puissance 4" subtitle="Partie rapide, privée, gratuite, ou rejoins avec un code." />
      <GameLobby gameSlug="puissance4" routeBase="/games/puissance4" minStake={game?.min_stake ?? 100} allowFreePlay={game?.allow_free_play ?? true} />
    </div>
  );
}
