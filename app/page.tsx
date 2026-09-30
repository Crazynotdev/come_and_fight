import Link from "next/link";
import { Gamepad2, ShieldCheck, Wallet, Users, Zap, ArrowRight } from "lucide-react";
import { AmbientBackground } from "@/components/marketing/AmbientBackground";
import { Wordmark } from "@/components/brand/Logo";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";

const features = [
  { Icon: Gamepad2, title: "Des jeux de stratégie", text: "Dames, Puissance 4, Échecs et plus encore. Ici, c'est ton niveau qui décide." },
  { Icon: Users, title: "Duels en temps réel", text: "Trouve un adversaire en quelques secondes ou invite un ami avec un code de partie." },
  { Icon: Wallet, title: "Un wallet clair", text: "Recharge, mise, retire. Chaque mouvement est tracé dans ton historique." },
  { Icon: ShieldCheck, title: "Résultats officiels", text: "Le serveur valide chaque coup et chaque gain. Aucun joueur ne peut tricher sur le résultat." },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <AmbientBackground />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Wordmark pro />
        <Link href="/login" className="rounded-full border border-glass-border bg-glass-surface px-4 py-2 text-sm backdrop-blur-glass">
          Se connecter
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        <section className="flex min-h-[78vh] flex-col justify-center py-12 md:max-w-3xl">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-glass-border bg-glass-surface px-3 py-1.5 text-xs text-white/70 backdrop-blur-glass">
            <Zap size={14} className="text-accent-orange" />
            Jeux compétitifs multijoueurs, made in Gabon
          </div>
          <h1 className="text-[44px] font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Joue. Affronte.
            <br />
            <span className="bg-gradient-to-r from-accent-orange to-accent-cyan bg-clip-text text-transparent">Gagne. Recommence.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60 md:text-lg">
            Affronte des joueurs en duel, mise tes coins et repars avec tes gains. Simple, rapide, pensé pour ton téléphone.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup">
              <GlassButton variant="primary" className="w-full sm:w-auto">
                Créer un compte <ArrowRight size={16} />
              </GlassButton>
            </Link>
            <Link href="/games">
              <GlassButton variant="glass" className="w-full sm:w-auto">Découvrir les jeux</GlassButton>
            </Link>
          </div>
        </section>

        <section className="grid gap-3 pb-20 sm:grid-cols-2">
          {features.map(({ Icon, title, text }) => (
            <GlassCard key={title} className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <h2 className="font-medium">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{text}</p>
            </GlassCard>
          ))}
        </section>
      </main>

      <footer className="border-t border-glass-border py-8 text-center text-xs text-white/40">
        COME-AND-FIGHT by CRAZY-TECH
      </footer>
    </div>
  );
}
