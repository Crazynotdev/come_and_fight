import type { LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";

export function EmptyState({ Icon, title, text }: { Icon: LucideIcon; title: string; text: string }) {
  return (
    <GlassCard className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-white/60">
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <p className="font-medium">{title}</p>
      <p className="max-w-xs text-sm text-white/50">{text}</p>
    </GlassCard>
  );
}
