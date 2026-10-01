import { Trophy, Swords, Percent, Flame, Star } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentPlayer } from "@/lib/server/session";

export default async function ProfilePage() {
  const { profile } = await getCurrentPlayer();
  const played = profile?.games_played ?? 0;
  const wins = profile?.wins ?? 0;
  const rate = played > 0 ? Math.round((wins / played) * 100) : 0;
  const stats = [
    { label: "Parties", value: String(played), Icon: Swords },
    { label: "Victoires", value: String(wins), Icon: Trophy },
    { label: "Taux", value: `${rate}%`, Icon: Percent },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6 md:pt-10">
      <GlassCard className="flex flex-col items-center gap-3 p-8 text-center">
        <Avatar username={profile?.username ?? "?"} src={profile?.avatar_url} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{profile?.username}</h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Badge tone="cyan">{profile?.player_id}</Badge>
            <Badge tone="orange"><Star size={11} className="mr-1 inline" />Niveau {profile?.level ?? 1}</Badge>
          </div>
          <p className="mt-2 text-xs text-white/40">{profile?.xp ?? 0} XP {(profile?.streak_count ?? 0) > 0 && <span className="text-accent-orange"><Flame size={11} className="mx-1 inline" />{profile?.streak_count} jours de suite</span>}</p>
          {profile?.created_at && (
            <p className="mt-3 text-xs text-white/40">Membre depuis le {new Date(profile.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}</p>
          )}
        </div>
      </GlassCard>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, Icon }) => (
          <GlassCard key={label} className="flex flex-col items-center gap-1.5 p-4">
            <Icon size={18} className="text-white/40" strokeWidth={1.75} />
            <p className="text-xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-white/50">{label}</p>
          </GlassCard>
        ))}
      </div>
      <LogoutButton />
    </div>
  );
}
