import { z } from "zod";

/**
 * Payload envoyé par DarePay sur POST /api/darepay/callback.
 * Champs exactement ceux de la doc officielle ("Recevoir le callback") —
 * ne pas en ajouter/inventer.
 */
export const darepayCallbackSchema = z.object({
  payment_id: z.number(),
  reference: z.string().min(1),
  transaction_id: z.string().min(1),
  status: z.enum(["SUCCESS", "FAILED"]),
  amount: z.string(), // DarePay envoie l'amount en string (ex: "10000.00")
  currency: z.string(),
  failure_reason: z.string().nullable(),
});

export type DarePayCallbackPayload = z.infer<typeof darepayCallbackSchema>;

/**
 * Convertit le montant DarePay ("10000.00") en entier de coins.
 * Hypothèse actuelle : 1 unité de currency (ex: 1 XAF) = 1 coin.
 * À confirmer/ajuster si un taux de conversion différent est voulu.
 */
export function darepayAmountToCoins(amount: string): number {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Montant DarePay invalide : ${amount}`);
  }
  return Math.round(value);
}
