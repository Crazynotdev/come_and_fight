"use client";

import { useMemo, useState } from "react";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { TransactionList, type Tx, type TxType } from "@/components/wallet/TransactionList";
import { PageHeader } from "@/components/ui/PageHeader";

const tabs: { id: "all" | TxType; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "DEPOSIT", label: "Dépôts" },
  { id: "GAME_ENTRY", label: "Mises" },
  { id: "WIN", label: "Gains" },
];

export function HistoryClient({ items }: { items: Tx[] }) {
  const [tab, setTab] = useState<"all" | TxType>("all");
  const filtered = useMemo(() => (tab === "all" ? items : items.filter((i) => i.type === tab)), [items, tab]);

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pt-6 md:pt-10">
      <PageHeader title="Historique" subtitle="Toutes tes transactions et parties." />
      <FilterTabs tabs={tabs} active={tab} onChange={setTab} />
      <TransactionList items={filtered} />
    </div>
  );
}
