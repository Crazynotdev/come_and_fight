import { cn } from "@/lib/utils/cn";

/** Couronne géométrique — identité originale COME-AND-FIGHT (pas d'emoji, SVG pur). */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3DE1FF" />
          <stop offset="1" stopColor="#FF7A2E" />
        </linearGradient>
      </defs>
      <path
        d="M6 30 L4 14 L13 20 L20 8 L27 20 L36 14 L34 30 Z"
        fill="none" stroke="url(#logo-g)" strokeWidth="2.75" strokeLinejoin="round" strokeLinecap="round"
      />
      <circle cx="20" cy="33" r="1.6" fill="url(#logo-g)" />
    </svg>
  );
}

export function Wordmark({ pro = false, className }: { pro?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight", className)}>
      <Logo />
      COME<span className="text-accent-cyan">-AND-</span>FIGHT
      {pro && (
        <span className="rounded-md bg-accent-orange px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-base-void">
          PRO
        </span>
      )}
    </span>
  );
}
