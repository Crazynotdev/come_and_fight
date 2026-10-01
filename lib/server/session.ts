import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Profil + wallet de l'utilisateur connecté (RLS : uniquement ses lignes). Redirige vers /login sinon. */
export async function getCurrentPlayer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: wallet }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("wallets").select("balance_available, balance_reserved").eq("user_id", user.id).single(),
  ]);

  return {
    supabase,
    userId: user.id,
    profile: profile as { username: string; player_id: string; avatar_url: string | null; games_played: number; wins: number; losses: number; created_at: string; xp: number; level: number; streak_count: number } | null,
    wallet: (wallet ?? { balance_available: 0, balance_reserved: 0 }) as { balance_available: number; balance_reserved: number },
  };
}
