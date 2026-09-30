import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "ghost";
}

const variants = {
  // Accent cyan réservé aux actions principales (Jouer, Confirmer).
  primary:
    "bg-gradient-to-r from-accent-orange to-[#FF9A4D] text-base-void font-semibold shadow-glow hover:brightness-110 active:brightness-95",
  secondary:
    "bg-accent-cyan text-base-void font-semibold hover:brightness-110 active:brightness-95",
  glass:
    "bg-glass-surface border border-glass-border text-white backdrop-blur-glass hover:bg-white/[0.07]",
  ghost: "text-white/70 hover:text-white",
};

export function GlassButton({
  className,
  variant = "glass",
  children,
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm transition-all duration-200 ease-out active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
