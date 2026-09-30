import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Anti-spam/anti brute-force en base (table `rate_limit_hits`, migration
 * 0012), donc fiable en serverless multi-instance (Vercel) — une Map en
 * mémoire ne suffit pas, car deux requêtes peuvent atterrir sur deux
 * conteneurs différents qui ne partagent rien.
 *
 * Fail-open volontaire : si la vérification elle-même échoue (panne
 * réseau/DB), on n'aggrave pas une panne d'infra en bloquant tout le monde —
 * le vrai garde-fou reste la validation métier (verrou optimiste, règles du
 * jeu, idempotence financière), le rate-limit n'est qu'une couche en plus.
 */
export async function tooFast(admin: SupabaseClient, key: string, minIntervalMs: number): Promise<boolean> {
  const { data, error } = await admin.rpc("check_rate_limit", { p_key: key, p_min_interval_ms: minIntervalMs });
  if (error) {
    console.error("rate_limit_check_error", error);
    return false;
  }
  return !!data;
}
