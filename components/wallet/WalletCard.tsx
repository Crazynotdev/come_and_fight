"use client";

import { useState } from "react";
import { Plus, ArrowUpRight, Lock, Smartphone, Landmark, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { GlassInput } from "@/components/ui/GlassInput";
import { cn } from "@/lib/utils/cn";

interface Props { available: number; reserved: number }
const fmt = (n: number) => n.toLocaleString("fr-FR");
const quickAmounts = [1000, 2000, 5000, 10000];
const methods = [
  { id: "mobile_money", label: "Mobile Money", sub: "Orange Money, Moov, Airtel…", Icon: Smartphone },
  { id: "bank_transfer", label: "Virement bancaire", sub: "Compte local", Icon: Landmark },
];

export function WalletCard({ available, reserved }: Props) {
  const [sheet, setSheet] = useState<"deposit" | "withdraw" | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [method, setMethod] = useState(methods[0].id);

  return (
    <>
      <GlassCard glow className="relative overflow-hidden p-6">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-accent-orange/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-accent-cyan/10 blur-2xl" />
        <p className="text-sm text-white/50">Solde disponible</p>
        <p className="mt-1 text-[44px] font-semibold leading-none tracking-tight tabular-nums">
          {fmt(available)} <span className="text-base font-medium text-white/40">COINS</span>
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-white/50">
          <Lock size={13} /> {fmt(reserved)} réservés · total {fmt(available + reserved)}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <GlassButton variant="primary" onClick={() => setSheet("deposit")}><Plus size={16} strokeWidth={2.5} />Recharger</GlassButton>
          <GlassButton onClick={() => setSheet("withdraw")}><ArrowUpRight size={16} />Retirer</GlassButton>
        </div>
      </GlassCard>

      <GlassSheet open={sheet === "deposit"} onClose={() => setSheet(null)} title="Recharger">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((a) => (
              <button key={a} onClick={() => setAmount(a)}
                className={cn("rounded-xl border py-2.5 text-sm font-medium transition-colors",
                  amount === a ? "border-accent-cyan bg-accent-cyan/10 text-accent-cyan" : "border-glass-border bg-glass-surface text-white/70")}>
                {a.toLocaleString("fr-FR")}
              </button>
            ))}
          </div>
          <GlassInput inputMode="numeric" placeholder="Ou saisis un montant" value={amount ?? ""} onChange={(e) => setAmount(Number(e.target.value) || null)} />
          <GlassButton variant="primary" className="w-full" disabled>Continuer</GlassButton>
          <p className="text-center text-xs text-white/40">Le moyen de paiement sera activé prochainement.</p>
        </div>
      </GlassSheet>

      <GlassSheet open={sheet === "withdraw"} onClose={() => setSheet(null)} title="Retirer des fonds">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((a) => (
              <button key={a} onClick={() => setAmount(a)}
                className={cn("rounded-xl border py-2.5 text-sm font-medium transition-colors",
                  amount === a ? "border-accent-cyan bg-accent-cyan/10 text-accent-cyan" : "border-glass-border bg-glass-surface text-white/70")}>
                {a.toLocaleString("fr-FR")}
              </button>
            ))}
          </div>
          <GlassInput inputMode="numeric" placeholder="Montant" value={amount ?? ""} onChange={(e) => setAmount(Number(e.target.value) || null)} />
          <p className="text-xs font-medium text-white/60">Méthode de retrait</p>
          <div className="space-y-2">
            {methods.map(({ id, label, sub, Icon }) => (
              <button key={id} onClick={() => setMethod(id)}
                className={cn("flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                  method === id ? "border-accent-cyan/50 bg-accent-cyan/5" : "border-glass-border bg-glass-surface")}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70"><Icon size={16} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block truncate text-xs text-white/40">{sub}</span>
                </span>
                {method === id && <Check size={16} className="text-accent-cyan" />}
              </button>
            ))}
          </div>
          <GlassButton variant="primary" className="w-full" disabled>Valider</GlassButton>
          <p className="text-center text-xs text-white/40">Les retraits seront activés avec le moyen de paiement.</p>
        </div>
      </GlassSheet>
    </>
  );
}
