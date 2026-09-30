"use client";

import { cn } from "@/lib/utils/cn";

export function FilterTabs<T extends string>({
  tabs, active, onChange,
}: { tabs: { id: T; label: string }[]; active: T; onChange: (id: T) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto rounded-full border border-glass-border bg-glass-surface p-1 backdrop-blur-glass">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            active === t.id ? "bg-accent-cyan text-base-void" : "text-white/50 hover:text-white"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
