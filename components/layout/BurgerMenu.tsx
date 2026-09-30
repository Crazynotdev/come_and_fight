"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  Menu, X, Home, Gamepad2, Swords, Trophy, Wallet, History,
  Bell, User, Settings, LifeBuoy, ShieldCheck, Info,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Accueil", Icon: Home },
  { href: "/games", label: "Jeux", Icon: Gamepad2 },
  { href: "/sessions", label: "Parties", Icon: Swords },
  { href: "/leaderboard", label: "Classement", Icon: Trophy },
  { href: "/wallet", label: "Wallet", Icon: Wallet },
  { href: "/history", label: "Historique", Icon: History },
  { href: "/notifications", label: "Notifications", Icon: Bell },
  { href: "/profile", label: "Profil", Icon: User },
  { href: "/settings", label: "Paramètres", Icon: Settings },
  { href: "/help", label: "Aide", Icon: LifeBuoy },
  { href: "/security", label: "Sécurité", Icon: ShieldCheck },
  { href: "/about", label: "À propos", Icon: Info },
];

export function BurgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className="relative z-50 flex h-9 w-9 items-center justify-center md:hidden"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-base-void/95 backdrop-blur-glass"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <nav className="flex h-full flex-col justify-center gap-1 overflow-y-auto px-8 py-16">
              {links.map(({ href, label, Icon }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.25, ease: "easeOut" }}
                >
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-4 py-2.5 text-xl font-medium text-white/90"
                  >
                    <Icon size={20} className="text-white/40" />
                    {label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
