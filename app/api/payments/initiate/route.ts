import { NextResponse } from "next/server";

/**
 * POST /api/payments/initiate
 *
 * DÉLIBÉRÉMENT NON IMPLÉMENTÉ.
 *
 * Cette route doit :
 *   1. authentifier l'utilisateur (session Supabase) ;
 *   2. créer une ligne `payments` (status PENDING, merchant_reference générée) ;
 *   3. appeler l'API DarePay pour initier le paiement et récupérer l'URL/le
 *      moyen de paiement à présenter à l'utilisateur.
 *
 * L'étape 3 nécessite la documentation DarePay "Référence API" (endpoint
 * de création de paiement, authentification, paramètres exacts, formats
 * de réponse) — non fournie pour l'instant. Seule la doc "callback" a été
 * transmise. Conformément à la contrainte du projet, on n'invente pas cet
 * appel : merci de coller le contenu de la page "Référence API" pour que
 * cette route soit complétée avec l'appel réel.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "not_implemented",
      message:
        "Initiation de paiement DarePay non codée : doc 'Référence API' manquante (endpoint de création de paiement).",
    },
    { status: 501 }
  );
}
