import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Client Supabase pour les Client Components.
 * N'utilise QUE la clé publique (publishable). Ne jamais importer
 * SUPABASE_SECRET_KEY ici : ce fichier est envoyé au navigateur.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
