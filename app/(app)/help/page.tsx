import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";

const faq = [
  { q: "Comment miser sur une partie ?", a: "Choisis un jeu, une mise, puis lance une partie rapide, privée, ou rejoins avec un code. Ta mise est réservée dès que la partie démarre." },
  { q: "Comment jouer sans miser d'argent ?", a: "Active « Partie gratuite » dans le lobby du jeu : aucune mise n'est réservée, tu joues juste pour t'entraîner." },
  { q: "Comment fonctionne la commission ?", a: "À la fin d'une partie avec mise, une commission (visible avant de jouer) est prélevée sur le pot ; le reste va au gagnant. En cas d'égalité, chacun récupère sa mise." },
  { q: "Que se passe-t-il si mon adversaire abandonne ou ne joue pas ?", a: "S'il abandonne, tu gagnes la partie. S'il dépasse le temps imparti pour jouer, tu peux réclamer le forfait directement depuis le plateau." },
  { q: "Comment recharger mon wallet ?", a: "Le paiement réel arrive prochainement. En attendant, les parties gratuites permettent de jouer sans wallet." },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pt-6 md:pt-10">
      <PageHeader title="Aide" subtitle="Questions fréquentes." />
      <GlassCard className="divide-y divide-glass-border">
        {faq.map(({ q, a }) => (
          <div key={q} className="p-5">
            <p className="text-sm font-medium">{q}</p>
            <p className="mt-1.5 text-sm text-white/50">{a}</p>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
