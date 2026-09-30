import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PasswordForm } from "@/components/settings/SettingsForm";
import { GlassCard } from "@/components/ui/GlassCard";

const tips = [
  "Utilise un mot de passe unique, que tu n'utilises sur aucun autre site.",
  "Ne partage jamais ton mot de passe, même avec le support COME-AND-FIGHT.",
  "Vérifie que l'adresse est bien celle de COME-AND-FIGHT avant de te connecter.",
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pt-6 md:pt-10">
      <PageHeader title="Sécurité" subtitle="Protège ton compte et ton wallet." />
      <PasswordForm />
      <GlassCard className="space-y-3 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-white/70">
          <ShieldCheck size={16} className="text-accent-cyan" /> Bonnes pratiques
        </div>
        <ul className="space-y-2 text-sm text-white/50">
          {tips.map((t) => <li key={t}>• {t}</li>)}
        </ul>
      </GlassCard>
    </div>
  );
}
