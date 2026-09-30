"use client";

import { useMemo, useState } from "react";
import { CreditCard, Gamepad2, Cog, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";

export interface Notif { id: string; type: string; title: string; body: string | null; read: boolean; created_at: string }
type Category = "all" | "PAYMENT" | "GAME" | "SYSTEM";

const categoryOf = (type: string): Category =>
  type.startsWith("payment") ? "PAYMENT" : type.startsWith("game") ? "GAME" : "SYSTEM";

const iconOf: Record<Category, LucideIcon> = { all: Bell, PAYMENT: CreditCard, GAME: Gamepad2, SYSTEM: Cog };

const tabs: { id: Category; label: string }[] = [
  { id: "all", label: "Tout" }, { id: "PAYMENT", label: "Paiements" },
  { id: "GAME", label: "Jeux" }, { id: "SYSTEM", label: "Système" },
];

export function NotificationsClient({ items }: { items: Notif[] }) {
  const [tab, setTab] = useState<Category>("all");
  const filtered = useMemo(
    () => (tab === "all" ? items : items.filter((n) => categoryOf(n.type) === tab)),
    [items, tab]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pt-6 md:pt-10">
      <PageHeader title="Notifications" />
      <FilterTabs tabs={tabs} active={tab} onChange={setTab} />
      {filtered.length === 0 ? (
        <EmptyState Icon={Bell} title="Rien de nouveau" text="Paiements, invitations et résultats s'afficheront ici." />
      ) : (
        <GlassCard className="divide-y divide-glass-border">
          {filtered.map((n) => {
            const Icon = iconOf[categoryOf(n.type)];
            return (
              <div key={n.id} className="flex gap-3 px-4 py-3.5">
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.read ? "bg-white/[0.05] text-white/40" : "bg-accent-cyan/10 text-accent-cyan"}`}>
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-white/50">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-white/30">{new Date(n.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-orange" />}
              </div>
            );
          })}
        </GlassCard>
      )}
    </div>
  );
}
