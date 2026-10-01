import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentPlayer } from "@/lib/server/session";

export default async function LeaderboardPage() {
  const { supabase } = await getCurrentPlayer();
  const { data: players } = await supabase
    .from("profiles")
    .select("username, avatar_url, wins, games_played, xp, level")
    .gt("games_played", 0)
    .order("xp", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pt-6 md:pt-10">
      <PageHeader title="Classement" subtitle="Classé par XP." />
      {!players || players.length === 0 ? (
        <EmptyState Icon={Trophy} title="Classement bientôt disponible" text="Il se remplira dès que les premières parties seront jouées." />
      ) : (
        <GlassCard className="divide-y divide-glass-border">
          {players.map((p, i) => (
            <div key={p.username} className="flex items-center gap-3 px-4 py-3.5">
              <span className={`w-6 text-center text-sm font-semibold ${i < 3 ? "text-accent-cyan" : "text-white/30"}`}>{i + 1}</span>
              <Avatar username={p.username} src={p.avatar_url} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{p.username} <span className="text-white/40">· Niv. {p.level}</span></p>
                <p className="text-xs text-white/40">{p.games_played} parties · {p.wins} victoires</p>
              </div>
              <p className="text-sm font-semibold text-accent-cyan tabular-nums">{p.xp} XP</p>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}
