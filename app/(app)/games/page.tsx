import { PageHeader } from "@/components/ui/PageHeader";
import { GameCard } from "@/components/games/GameCard";
import { getCurrentPlayer } from "@/lib/server/session";

const labels: Record<string, { name: string; players: string }> = {
  dames: { name: "Dames", players: "2 joueurs" },
  puissance4: { name: "Puissance 4", players: "2 joueurs" },
  morpion: { name: "Morpion", players: "2 joueurs" },
  dominos: { name: "Dominos", players: "2 à 4 joueurs" },
  ludo: { name: "Ludo", players: "2 à 4 joueurs" },
  echecs: { name: "Échecs", players: "2 joueurs" },
};

export default async function GamesPage() {
  const { supabase } = await getCurrentPlayer();
  const { data: games } = await supabase
    .from("games")
    .select("slug, min_stake, is_active")
    .order("min_stake", { ascending: true });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pt-6 md:pt-10">
      <PageHeader title="Jeux" subtitle="Choisis ton arène." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(games ?? []).map((g) => (
          <GameCard
            key={g.slug}
            slug={g.slug}
            name={labels[g.slug]?.name ?? g.slug}
            players={labels[g.slug]?.players ?? "2 joueurs"}
            minStake={g.min_stake}
            available={g.is_active}
          />
        ))}
      </div>
    </div>
  );
}
