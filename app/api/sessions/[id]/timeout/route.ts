import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/supabase-admin";
import { requireUser, errorResponse } from "@/lib/games/http";

/**
 * Un joueur réclame le forfait de son adversaire pour dépassement du temps
 * de jeu. Le serveur revérifie tout (délai réellement écoulé selon
 * `turn_started_at` + `games.turn_timeout_seconds`, identité du joueur dont
 * c'est vraiment le tour) — impossible de forcer un forfait en mentant côté
 * client, voir `claim_timeout_forfeit` (migration 0009).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const { user, response } = await requireUser();
  if (!user) return response;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_timeout_forfeit", {
    p_session_id: sessionId,
    p_claimant_id: user.id,
  });

  if (error) return errorResponse(error.message, 400);
  return NextResponse.json({ result: data });
}
