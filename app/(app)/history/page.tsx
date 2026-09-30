import { getCurrentPlayer } from "@/lib/server/session";
import { HistoryClient } from "@/components/history/HistoryClient";
import type { Tx } from "@/components/wallet/TransactionList";

export default async function HistoryPage() {
  const { supabase, userId } = await getCurrentPlayer();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return <HistoryClient items={(data ?? []) as Tx[]} />;
}
