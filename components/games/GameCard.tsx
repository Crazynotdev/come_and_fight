import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { GameArt } from "./GameArt";

export interface GameCardProps {
  slug: string;
  name: string;
  players: string;
  minStake: number;
  available: boolean;
}

export function GameCard({ slug, name, players, minStake, available }: GameCardProps) {
  const body = (
    <GlassCard
      glow={available}
      className={`group overflow-hidden transition-transform duration-200 ${available ? "active:scale-[0.98] md:hover:-translate-y-0.5" : "opacity-60"}`}
    >
      <div className="h-32 bg-gradient-to-br from-white/[0.06] to-transparent p-5">
        <GameArt slug={slug} />
      </div>
      <div className="flex items-center justify-between gap-3 p-5 pt-4">
        <div>
          <h3 className="font-semibold tracking-tight">{name}</h3>
          <p className="mt-0.5 text-xs text-white/50">{players} · dès {minStake.toLocaleString("fr-FR")} coins</p>
        </div>
        {available ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-cyan text-base-void transition-transform group-hover:translate-x-0.5">
            <ArrowRight size={16} strokeWidth={2.25} />
          </span>
        ) : (
          <Badge><Lock size={12} className="mr-1" />Bientôt</Badge>
        )}
      </div>
    </GlassCard>
  );
  return available ? <Link href={`/games/${slug}`}>{body}</Link> : body;
}
