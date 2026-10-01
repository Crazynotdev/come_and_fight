import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point de passage obligé pour TOUT lien Supabase (confirmation d'inscription,
 * connexion sociale, réinitialisation de mot de passe) : échange le `code`
 * contre une vraie session (cookies), puis redirige vers `next`.
 *
 * Sans cette route, le code restait dans l'URL sans jamais être échangé —
 * l'utilisateur atterrissait sur une page qui ne crée pas de client Supabase
 * (donc rien ne consommait le code), et semblait "non connecté" malgré un
 * lien valide.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
