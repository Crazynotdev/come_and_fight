import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

/**
 * Surface Glass de base : transparence + blur + bordure lumineuse subtile.
 * `glow` ajoute un halo cyan discret (à réserver aux éléments qu'on veut
 * mettre en avant — carte de jeu sélectionnée, action principale).
 */
export function GlassCard({ className, glow, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-glass border border-glass-border bg-glass-surface backdrop-blur-glass shadow-glass",
        glow && "shadow-glow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
