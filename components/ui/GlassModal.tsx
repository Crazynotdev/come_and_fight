"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Modale pour desktop. Sur mobile, préférer GlassSheet (bottom sheet) pour
 * les mêmes interactions — GlassSheet bascule déjà en modal sur desktop.
 */
export function GlassModal({ open, onClose, children }: GlassModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-glass border border-glass-border bg-base-graphite/80 p-6 shadow-glass backdrop-blur-glass"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
