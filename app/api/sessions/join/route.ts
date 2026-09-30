import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/supabase-admin";
import { requireUser, joinSessionSchema, errorResponse } from "@/lib/games/http";
import { getEngine } from "@/lib/games/registry";
import { tooFast } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  // Anti brute-force sur les codes de partie : 1 tentative / 1.5s / utilisateur.
  const admin = createAdminClient();
  if (await tooFast(admin, `join:${user.id}`, 1500)) {
    return errorResponse("trop de tentatives, patiente un instant", 429);
  }

  const parsed = joinSessionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return errorResponse("payload invalide");

  const { data: session, error } = await admin.rpc("join_game_session", {
    p_user_id: user.id,
    p_code: parsed.data.code.trim().toUpperCase(),
  });
  if (error) return errorResponse(error.message, 400);

  if (session.status === "IN_PROGRESS" && !session.board_state) {
    const { data: game } = await admin.from("games").select("slug").eq("id", session.game_id).single();
    const engine = getEngine(game?.slug ?? "dames");
    const { data: updated } = await admin
      .from("game_sessions")
      .update({ board_state: engine.initialBoard(), turn: 1, turn_started_at: new Date().toISOString() })
      .eq("id", session.id)
      .select()
      .single();
    return NextResponse.json({ session: updated ?? session });
  }

  return NextResponse.json({ session });
}
