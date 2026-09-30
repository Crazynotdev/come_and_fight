import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/supabase-admin";
import { darepayCallbackSchema, darepayAmountToCoins } from "@/lib/darepay/schema";

/**
 * POST /api/darepay/callback
 *
 * Contrat exact imposé par la doc DarePay ("Recevoir le callback") :
 * - Toujours répondre HTTP 200 avec { received: true, reference, transaction_id }
 *   en renvoyant reference/transaction_id TELS QUE REÇUS (pas retapés/trimés) —
 *   sinon DarePay considère le callback comme non confirmé et le renvoie
 *   (jusqu'à 3 tentatives).
 * - Idempotence obligatoire : un même callback peut arriver 2 ou 3 fois,
 *   l'opération métier (créditer le wallet) ne doit s'exécuter qu'une fois.
 *   Ici, garanti par une UPDATE atomique "WHERE status = 'PENDING'" (le
 *   paiement ne peut basculer de PENDING qu'une seule fois) + par la
 *   contrainte unique (type, reference) côté ledger (apply_wallet_ledger_entry).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = darepayCallbackSchema.safeParse(body);
  if (!parsed.success) {
    // Payload qui ne correspond pas au contrat documenté : on ne fabrique
    // pas de confirmation pour des données qu'on ne peut pas garantir.
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { payment_id, reference, transaction_id, status, amount, currency, failure_reason } =
    parsed.data;

  const admin = createAdminClient();

  // Journalisation de l'événement brut, quoi qu'il arrive (audit + rejeu
  // manuel possible). provider_event_id = transaction_id -> un doublon
  // exact ne recrée pas de ligne (mais on ne s'appuie pas là-dessus pour
  // l'idempotence métier, seulement pour la traçabilité).
  await admin.from("payment_events").insert({
    provider_event_id: transaction_id,
    event_type: `payment.${status.toLowerCase()}`,
    raw_payload: parsed.data,
  });

  // Mise à jour atomique : seul un paiement encore PENDING peut changer
  // d'état. Un callback rejoué (2e/3e tentative DarePay) ne repasse donc
  // jamais par le crédit du wallet.
  const { data: updatedPayments, error: updateError } = await admin
    .from("payments")
    .update({
      status,
      provider_reference: transaction_id,
      provider_payment_id: payment_id,
      failure_reason,
      updated_at: new Date().toISOString(),
    })
    .eq("merchant_reference", reference)
    .eq("status", "PENDING")
    .select("id, user_id, merchant_reference");

  if (updateError) {
    // Erreur interne : on ne confirme pas, DarePay retentera (comportement
    // souhaité — mieux vaut un renvoi qu'un paiement silencieusement perdu).
    console.error("darepay_callback_update_error", updateError);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  const payment = updatedPayments?.[0];

  if (payment && status === "SUCCESS") {
    await admin.rpc("apply_wallet_ledger_entry", {
      p_user_id: payment.user_id,
      p_type: "DEPOSIT",
      p_amount: darepayAmountToCoins(amount),
      p_reference: `payment:${payment.merchant_reference}`,
      p_metadata: { currency, provider: "darepay", transaction_id },
    });
  }
  // Si `payment` est undefined : soit le paiement n'existe pas (reference
  // inconnue), soit il n'était déjà plus PENDING (callback déjà traité).
  // Dans les deux cas on confirme quand même la réception ci-dessous —
  // c'est ce que la doc DarePay exige pour arrêter les renvois.

  return NextResponse.json(
    { received: true, reference, transaction_id },
    { status: 200 }
  );
}
