"use client";

import { useEffect, useState } from "react";

/**
 * Horloge purement indicative côté client (UX : afficher le temps restant,
 * proposer le bouton de forfait). Le vrai verdict est toujours revérifié
 * côté serveur par `claim_timeout_forfeit` — cette horloge ne "décide" de
 * rien, elle ne fait qu'accélérer/désactiver l'affichage du bouton.
 */
export function useGameClock(turnStartedAt: string | null, timeoutSeconds: number, active: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!turnStartedAt || !active) return { remaining: timeoutSeconds, expired: false };
  const elapsed = Math.floor((now - new Date(turnStartedAt).getTime()) / 1000);
  const remaining = Math.max(timeoutSeconds - elapsed, 0);
  return { remaining, expired: remaining <= 0 };
}
