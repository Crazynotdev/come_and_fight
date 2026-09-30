import "server-only";
import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const createSessionSchema = z.object({
  gameSlug: z.string().min(1),
  stake: z.number().int().min(0), // 0 = partie gratuite (voir games.allow_free_play)
});

export const joinSessionSchema = z.object({
  code: z.string().min(1).max(16),
});

export const moveSchema = z.object({
  fromRow: z.number().int().min(0).max(9),
  fromCol: z.number().int().min(0).max(9),
  toRow: z.number().int().min(0).max(9),
  toCol: z.number().int().min(0).max(9),
});

/** Récupère l'utilisateur connecté ou renvoie une 401 prête à `return`. */
export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { user, response: null as NextResponse | null };
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
