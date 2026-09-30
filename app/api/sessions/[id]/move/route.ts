import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/supabase-admin";
import { requireUser, moveSchema, errorResponse } from "@/lib/games/http";
import { getEngine } from "@/lib/games/registry";
import type { Board, Side } from "@/lib/games/shared";
import { tooFast } from "@/lib/server/rateLimit";

/**
 * Route générique, valable pour n'importe quel jeu du registre
 * (lib/games/registry.ts) — voir docs/ADDING_A_GAME.md.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const { user, response } = await requireUser();
  if (!user) return response;

  const admin = createAdminClient();
  if (await tooFast(admin, `move:${sessionId}:${user.id}`, 250)) {
    return errorResponse("trop de requêtes, ralentis", 429);
  }

  const parsed = moveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return errorResponse("payload invalide");
  const { fromRow, fromCol, toRow, toCol } = parsed.data;

  const { data: session } = await admin.from("game_sessions").select("*").eq("id", sessionId).single();
  if (!session) return errorResponse("partie introuvable", 404);
  if (session.status !== "IN_PROGRESS") return errorResponse("cette partie n'est pas en cours");

  const { data: game } = await admin.from("games").select("slug").eq("id", session.game_id).single();
  const engine = getEngine(game?.slug ?? "dames");

  const { data: players } = await admin
    .from("game_players")
    .select("user_id, seat")
    .eq("session_id", sessionId);
  const me = players?.find((p) => p.user_id === user.id);
  if (!me) return errorResponse("tu ne fais pas partie de cette partie", 403);

  const side: Side = me.seat === 1 ? 1 : -1;
  if (session.turn !== side) return errorResponse("ce n'est pas ton tour");

  const forced = session.forced_row != null ? { row: session.forced_row, col: session.forced_col } : null;
  if (forced && (forced.row !== fromRow || forced.col !== fromCol)) {
    return errorResponse("tu dois continuer la rafle avec la même pièce");
  }

  const board = session.board_state as Board;
  const legal = engine.legalStepsForSide(board, side, forced);
  const match = legal.find(
    (s) => s.from.row === fromRow && s.from.col === fromCol && s.to.row === toRow && s.to.col === toCol
  );
  if (!match) return errorResponse("coup illégal");

  const result = engine.applyStep(board, match, side);
  const nextTurn: Side = result.continueFrom ? side : side === 1 ? -1 : 1;
  const nextForced = result.continueFrom;

  const { data: updatedSession, error: updateError } = await admin
    .from("game_sessions")
    .update({
      board_state: result.board,
      turn: nextTurn,
      forced_row: nextForced ? nextForced.row : null,
      forced_col: nextForced ? nextForced.col : null,
      version: session.version + 1,
      turn_started_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("version", session.version)
    .select()
    .single();

  if (updateError || !updatedSession) {
    return errorResponse("un autre coup vient d'être joué, réessaie", 409);
  }

  const { count } = await admin
    .from("game_moves")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  await admin.from("game_moves").insert({
    session_id: sessionId,
    user_id: user.id,
    move_number: (count ?? 0) + 1,
    move_data: { from: match.from, to: match.to, captured: match.captured ?? null, promoted: result.promoted },
  });

  if (!nextForced) {
    const info = engine.isGameOver(result.board, side, nextTurn);
    if (info.over) {
      const winnerUserId = info.draw ? null : players?.find((p) => p.seat === (side === 1 ? 1 : 2))?.user_id ?? null;
      const { data: gameResult } = await admin.rpc("settle_game_session", {
        p_session_id: sessionId,
        p_winner_id: winnerUserId,
        p_result_type: info.draw ? "DRAW" : "WIN",
      });
      return NextResponse.json({ session: updatedSession, gameOver: true, result: gameResult });
    }
  }

  return NextResponse.json({ session: updatedSession, gameOver: false });
}
