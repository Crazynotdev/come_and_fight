import { ArrowDownLeft, ArrowUpRight, Swords, Trophy, Percent, Undo2, Gift, Receipt } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";

export type TxType = "DEPOSIT" | "GAME_ENTRY" | "WIN" | "PLATFORM_FEE" | "REFUND" | "WITHDRAWAL" | "BONUS";
export interface Tx { id: string; type: TxType; amount: number; created_at: string }

const meta: Record<TxType, { label: string; Icon: LucideIcon }> = {
  DEPOSIT: { label: "Recharge", Icon: ArrowDownLeft },
  GAME_ENTRY: { label: "Mise", Icon: Swords },
  WIN: { label: "Gain", Icon: Trophy },
  PLATFORM_FEE: { label: "Commission", Icon: Percent },
  REFUND: { label: "Remboursement", Icon: Undo2 },
  WITHDRAWAL: { label: "Retrait", Icon: ArrowUpRight },
  BONUS: { label: "Bonus", Icon: Gift },
};

export function TransactionList({ items }: { items: Tx[] }) {
  if (items.length === 0) {
    return <EmptyState Icon={Receipt} title="Aucune transaction" text="Tes recharges, mises et gains apparaîtront ici." />;
  }
  return (
    <GlassCard className="divide-y divide-glass-border">
      {items.map((t) => {
        const { label, Icon } = meta[t.type];
        const positive = t.amount > 0;
        return (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/70">
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-white/40">{new Date(t.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
            <p className={`text-sm font-semibold tabular-nums ${positive ? "text-accent-cyan" : "text-white/80"}`}>
              {positive ? "+" : ""}{t.amount.toLocaleString("fr-FR")}
            </p>
          </div>
        );
      })}
    </GlassCard>
  );
}
