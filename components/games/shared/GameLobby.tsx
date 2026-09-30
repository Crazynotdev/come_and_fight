"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Plus, Hash, Gift } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { cn } from "@/lib/utils/cn";

const stakes = [100, 500, 1000, 5000];

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "une erreur est survenue");
  return data;
}

/** Lobby générique (mise, partie rapide, privée, gratuite, rejoindre par code) — réutilisable pour tout jeu du registre. */
export function GameLobby({ gameSlug, routeBase, minStake, allowFreePlay = true }: {
  gameSlug: string; routeBase: string; minStake: number; allowFreePlay?: boolean;
}) {
  const router = useRouter();
  const [stake, setStake] = useState(Math.max(minStake, stakes[0]));
  const [free, setFree] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(action: "quick" | "create" | "join") {
    setLoading(action); setError(null);
    try {
      if (action === "quick") {
        const { session } = await postJson("/api/sessions/quick-match", { gameSlug, stake: free ? 0 : stake });
        router.push(`${routeBase}/${session.id}`);
      } else if (action === "create") {
        const { session } = await postJson("/api/sessions/create", { gameSlug, stake: free ? 0 : stake });
        router.push(`${routeBase}/${session.id}`);
      } else {
        const { session } = await postJson("/api/sessions/join", { code });
        router.push(`${routeBase}/${session.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "erreur");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <GlassCard className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/70">Choisis ta mise</p>
          {allowFreePlay && (
            <button
              onClick={() => setFree((v) => !v)}
              className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                free ? "border-accent-cyan bg-accent-cyan/10 text-accent-cyan" : "border-glass-border text-white/50")}
            >
              <Gift size={13} /> Partie gratuite
            </button>
          )}
        </div>
        <div className={cn("grid grid-cols-4 gap-2", free && "pointer-events-none opacity-30")}>
          {stakes.filter((s) => s >= minStake).map((s) => (
            <button key={s} onClick={() => setStake(s)}
              className={cn("rounded-xl border py-2.5 text-sm font-medium transition-colors",
                !free && stake === s ? "border-accent-cyan bg-accent-cyan/10 text-accent-cyan" : "border-glass-border bg-glass-surface text-white/70")}>
              {s.toLocaleString("fr-FR")}
            </button>
          ))}
        </div>
        <GlassButton variant="primary" className="w-full" disabled={!!loading} onClick={() => go("quick")}>
          <Zap size={16} />{loading === "quick" ? "Recherche…" : "Partie rapide"}
        </GlassButton>
        <GlassButton className="w-full" disabled={!!loading} onClick={() => go("create")}>
          <Plus size={16} />{loading === "create" ? "Création…" : "Créer une partie privée"}
        </GlassButton>
      </GlassCard>

      <GlassCard className="space-y-3 p-5">
        <p className="text-sm font-medium text-white/70">Rejoindre avec un code</p>
        <div className="flex gap-2">
          <GlassInput placeholder="CF-XXXXXXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <GlassButton disabled={!!loading || !code} onClick={() => go("join")}>
            <Hash size={16} />{loading === "join" ? "…" : "Rejoindre"}
          </GlassButton>
        </div>
      </GlassCard>

      {error && <p className="text-center text-sm text-accent-orange">{error}</p>}
    </div>
  );
}
