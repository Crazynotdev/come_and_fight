"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Bottom sheet pour mobile (choisir une mise, recharger, retirer, options de
 * partie...). Sur desktop (md:), le même composant se recentre et se
 * comporte comme une modale — pas besoin d'un composant séparé.
 */
export function GlassSheet({ open, onClose, title, children }: GlassSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-t-glass border border-glass-border bg-base-graphite/90 p-6 pb-8 shadow-glass backdrop-blur-glass md:rounded-glass md:pb-6"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 md:hidden" />
            {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
