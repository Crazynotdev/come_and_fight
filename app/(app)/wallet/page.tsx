import { PageHeader } from "@/components/ui/PageHeader";
import { WalletCard } from "@/components/wallet/WalletCard";
import { TransactionList, type Tx } from "@/components/wallet/TransactionList";
import { getCurrentPlayer } from "@/lib/server/session";

export default async function WalletPage() {
  const { supabase, userId, wallet } = await getCurrentPlayer();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6 md:pt-10">
      <PageHeader title="Wallet" />
      <WalletCard available={wallet.balance_available} reserved={wallet.balance_reserved} />
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/70">Transactions</h2>
        <TransactionList items={(data ?? []) as Tx[]} />
      </section>
    </div>
  );
}
