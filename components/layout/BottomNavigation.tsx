"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Gamepad2, Wallet, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/dashboard", label: "Accueil", Icon: Home },
  { href: "/games", label: "Jeux", Icon: Gamepad2 },
  { href: "/wallet", label: "Wallet", Icon: Wallet },
  { href: "/history", label: "Stats", Icon: BarChart3 },
  { href: "/profile", label: "Profil", Icon: User },
];

export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-glass-border bg-base-void/70 backdrop-blur-glass md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex items-stretch justify-between px-2 py-2">
        {items.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link href={href} className="relative flex flex-col items-center gap-1 py-1 text-[10px] text-white/50">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full">
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-active"
                      className="absolute inset-0 rounded-full bg-accent-cyan shadow-glow"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={18} strokeWidth={active ? 2.25 : 1.75} className={cn("relative", active ? "text-base-void" : "text-white/50")} />
                </span>
                <span className={cn(active && "text-white")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
