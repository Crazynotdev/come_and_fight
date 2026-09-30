import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Client Supabase avec la clé secrète (service role) : bypass RLS.
 *
 * RÈGLE ABSOLUE :
 * - Jamais importé depuis un fichier "use client" ou depuis lib/supabase/*.
 * - Réservé aux Route Handlers serveur de confiance : callback DarePay,
 *   moteur de jeu (validation des coups / résultats), traitement des
 *   retraits, tâches admin. C'est ici, et seulement ici, que les écritures
 *   financières et les résultats de jeu sont exécutés.
 * - Le paquet "server-only" fait planter le build si ce fichier finit
 *   importé côté client.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
