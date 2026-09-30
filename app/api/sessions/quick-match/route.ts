import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/supabase-admin";
import { requireUser, createSessionSchema, errorResponse } from "@/lib/games/http";
import { getEngine } from "@/lib/games/registry";
import { tooFast } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const admin = createAdminClient();
  if (await tooFast(admin, `quick-match:${user.id}`, 800)) {
    return errorResponse("trop de tentatives, patiente un instant", 429);
  }

  const parsed = createSessionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return errorResponse("payload invalide");

  const { gameSlug, stake } = parsed.data;
  const engine = getEngine(gameSlug);

  const { data: game } = await admin.from("games").select("id").eq("slug", gameSlug).single();
  if (!game) return errorResponse("jeu inconnu");

  const { data: candidate } = await admin
    .from("game_sessions")
    .select("code")
    .eq("game_id", game.id)
    .eq("status", "WAITING")
    .eq("stake", stake)
    .neq("created_by", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (candidate) {
    const { data: session, error } = await admin.rpc("join_game_session", {
      p_user_id: user.id,
      p_code: candidate.code,
    });
    if (!error) {
      if (session.status === "IN_PROGRESS" && !session.board_state) {
        const { data: updated } = await admin
          .from("game_sessions")
          .update({ board_state: engine.initialBoard(), turn: 1, turn_started_at: new Date().toISOString() })
          .eq("id", session.id)
          .select()
          .single();
        return NextResponse.json({ session: updated ?? session, matched: true });
      }
      return NextResponse.json({ session, matched: true });
    }
    // La partie a pu être prise par quelqu'un d'autre entre-temps : on retombe sur la création.
  }

  const { data: created, error: createError } = await admin.rpc("create_game_session", {
    p_user_id: user.id,
    p_game_slug: gameSlug,
    p_stake: stake,
  });
  if (createError) return errorResponse(createError.message, 400);
  return NextResponse.json({ session: created, matched: false });
}
