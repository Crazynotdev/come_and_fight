import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "cyan" | "orange";
}

const tones = {
  neutral: "bg-white/[0.06] text-white/70",
  cyan: "bg-accent-cyan/10 text-accent-cyan",
  orange: "bg-accent-orange/10 text-accent-orange",
};

export function Badge({ className, tone = "neutral", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
