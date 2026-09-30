import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/supabase-admin";
import { requireUser, createSessionSchema, errorResponse } from "@/lib/games/http";

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const parsed = createSessionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return errorResponse("payload invalide");

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_game_session", {
    p_user_id: user.id,
    p_game_slug: parsed.data.gameSlug,
    p_stake: parsed.data.stake,
  });

  if (error) return errorResponse(error.message, 400);
  return NextResponse.json({ session: data });
}
