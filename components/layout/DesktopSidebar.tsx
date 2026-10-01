"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Wallet, Swords, BarChart3, History, User, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Wordmark } from "@/components/brand/Logo";

const items = [
  { href: "/dashboard", label: "Accueil", Icon: Home },
  { href: "/games", label: "Jeux", Icon: Gamepad2 },
  { href: "/wallet", label: "Wallet", Icon: Wallet },
  { href: "/friends", label: "Amis", Icon: Users },
  { href: "/sessions", label: "Parties", Icon: Swords },
  { href: "/stats", label: "Statistiques", Icon: BarChart3 },
  { href: "/history", label: "Historique", Icon: History },
  { href: "/profile", label: "Profil", Icon: User },
  { href: "/settings", label: "Paramètres", Icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-glass-border bg-base-void/60 p-4 backdrop-blur-glass md:flex">
      <div className="mb-8 px-2 pt-2">
        <Wordmark pro />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active ? "bg-white/[0.07] text-white" : "text-white/60 hover:text-white"
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 1.75} className={active ? "text-accent-cyan" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
