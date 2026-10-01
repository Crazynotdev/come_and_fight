"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Handshake, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";

interface Result { winner_id: string | null; result_type: string; pot: number; commission: number; payout: number }

const reasonLabel: Record<string, string> = {
  WIN: "par victoire", DRAW: "égalité", ABANDON: "par abandon", TIMEOUT: "par forfait (temps écoulé)",
};

/** Écran de fin de partie — résultat réel lu dans `game_results`, jamais un placeholder statique. */
export function GameResultScreen({ sessionId, meId, lobbyHref }: { sessionId: string; meId: string; lobbyHref: string }) {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    createClient().from("game_results").select("winner_id, result_type, pot, commission, payout")
      .eq("session_id", sessionId).maybeSingle()
      .then(({ data }) => { if (!cancelled) setResult(data as Result | null); });
    return () => { cancelled = true; };
  }, [sessionId]);

  if (!result) {
    return <GlassCard className="p-8 text-center text-sm text-white/50">Calcul du résultat…</GlassCard>;
  }

  const isDraw = result.result_type === "DRAW";
  const won = result.winner_id === meId;
  const Icon = isDraw ? Handshake : won ? Trophy : Flag;
  const tone = isDraw ? "text-white/70" : won ? "text-accent-cyan" : "text-white/50";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
      <GlassCard glow={won} className="relative overflow-hidden space-y-5 p-8 text-center">
        {won && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-cyan/25 blur-3xl"
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}
          />
        )}
        <motion.div
          initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.1 }}
          className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.06] ${tone}`}
        >
          <Icon size={28} />
        </motion.div>

        <div className="relative">
          <p className="text-2xl font-semibold tracking-tight">
            {isDraw ? "Égalité" : won ? "Victoire !" : "Défaite"}
          </p>
          <p className="mt-1 text-xs text-white/40">{reasonLabel[result.result_type] ?? result.result_type}</p>
        </div>

        {result.pot > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative space-y-1">
            {isDraw ? (
              <p className="text-sm text-white/60">Mise remboursée</p>
            ) : won ? (
              <p className="text-3xl font-semibold text-accent-cyan">+{result.payout.toLocaleString("fr-FR")} <span className="text-base text-white/40">coins</span></p>
            ) : (
              <p className="text-sm text-white/40">Mise perdue</p>
            )}
            {won && result.commission > 0 && (
              <p className="text-[11px] text-white/30">Pot {result.pot.toLocaleString("fr-FR")} − commission {result.commission.toLocaleString("fr-FR")}</p>
            )}
          </motion.div>
        )}

        <GlassButton variant="primary" className="relative mt-2 w-full" onClick={() => router.push(lobbyHref)}>
          Nouvelle partie
        </GlassButton>
      </GlassCard>
    </motion.div>
  );
}
