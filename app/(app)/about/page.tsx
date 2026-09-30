import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Wordmark } from "@/components/brand/Logo";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pt-6 md:pt-10">
      <PageHeader title="À propos" />
      <GlassCard className="space-y-4 p-6">
        <Wordmark pro />
        <p className="text-sm leading-relaxed text-white/60">
          COME-AND-FIGHT est une plateforme de jeux multijoueurs compétitifs conçue par CRAZY-TECH,
          pensée pour le marché gabonais. Défie d'autres joueurs en duel, mise des coins, et repars
          avec tes gains — le tout validé par un serveur qui ne fait confiance à aucun résultat envoyé
          par un client.
        </p>
        <p className="text-xs text-white/30">COME-AND-FIGHT by CRAZY-TECH</p>
      </GlassCard>
    </div>
  );
}
