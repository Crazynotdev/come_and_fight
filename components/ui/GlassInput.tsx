import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes } from "react";

export function GlassInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-glass-border bg-glass-surface px-4 py-3 text-sm text-white placeholder:text-white/40 backdrop-blur-glass outline-none transition-colors focus:border-accent-cyan/60",
        className
      )}
      {...props}
    />
  );
}
