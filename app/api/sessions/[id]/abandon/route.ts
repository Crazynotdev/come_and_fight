import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/supabase-admin";
import { requireUser, errorResponse } from "@/lib/games/http";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const { user, response } = await requireUser();
  if (!user) return response;

  const admin = createAdminClient();
  const { data: session } = await admin.from("game_sessions").select("*").eq("id", sessionId).single();
  if (!session) return errorResponse("partie introuvable", 404);

  if (session.status === "WAITING") {
    const { data, error } = await admin.rpc("cancel_waiting_session", {
      p_session_id: sessionId,
      p_user_id: user.id,
    });
    if (error) return errorResponse(error.message, 400);
    return NextResponse.json({ session: data });
  }

  if (session.status === "IN_PROGRESS") {
    const { data: players } = await admin.from("game_players").select("user_id, seat").eq("session_id", sessionId);
    const me = players?.find((p) => p.user_id === user.id);
    if (!me) return errorResponse("tu ne fais pas partie de cette partie", 403);
    const opponent = players?.find((p) => p.user_id !== user.id);

    const { data: gameResult } = await admin.rpc("settle_game_session", {
      p_session_id: sessionId,
      p_winner_id: opponent?.user_id ?? null,
      p_result_type: "ABANDON",
    });
    return NextResponse.json({ result: gameResult });
  }

  return errorResponse("cette partie ne peut plus être annulée");
}
