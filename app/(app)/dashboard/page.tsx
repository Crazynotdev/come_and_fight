import Link from "next/link";
import { Plus, Play, Swords } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameArt } from "@/components/games/GameArt";
import { getCurrentPlayer } from "@/lib/server/session";

export default async function DashboardPage() {
  const { profile, wallet } = await getCurrentPlayer();

  return (
    <div className="mx-auto max-w-2xl space-y-7 px-4 pt-6 md:pt-10">
      <div>
        <p className="text-sm text-white/50">Bonjour</p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{profile?.username}</h1>
      </div>

      <GlassCard glow className="relative overflow-hidden p-6">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-accent-cyan/15 blur-3xl" />
        <p className="text-sm text-white/50">Solde disponible</p>
        <p className="mt-1 text-[44px] font-semibold leading-none tracking-tight tabular-nums">
          {wallet.balance_available.toLocaleString("fr-FR")} <span className="text-base font-medium text-white/40">COINS</span>
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/wallet"><GlassButton variant="primary" className="w-full"><Plus size={16} strokeWidth={2.5} />Recharger</GlassButton></Link>
          <Link href="/games"><GlassButton className="w-full"><Play size={16} />Jouer</GlassButton></Link>
        </div>
      </GlassCard>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/70">Jeux populaires</h2>
        <Link href="/games/dames">
          <GlassCard className="flex items-center gap-4 p-4 transition-transform active:scale-[0.98]">
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-white/[0.04] p-1.5"><GameArt slug="dames" /></div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Dames</p>
              <p className="text-xs text-white/50">2 joueurs · dès 100 coins</p>
            </div>
            <Badge tone="cyan">Disponible</Badge>
          </GlassCard>
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/70">Parties récentes</h2>
        <EmptyState Icon={Swords} title="Aucune partie pour l'instant" text="Lance ton premier duel depuis la page Jeux." />
      </section>
    </div>
  );
}
