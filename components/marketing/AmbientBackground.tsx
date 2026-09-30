/**
 * Fond "énergie" COME-AND-FIGHT : nappe sombre + streaks lumineux diagonaux
 * (cyan/orange) très lents + deux halos dérivants + grain. CSS pur.
 * prefers-reduced-motion : animations coupées globalement (voir globals.css).
 */
export function AmbientBackground({ dense = false }: { dense?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base-void">
      <div className="absolute inset-0 bg-[radial-gradient(130%_90%_at_50%_-10%,#0e1a33_0%,#05060a_60%)]" />

      <div className="blob-a absolute -left-[20vw] top-[-10vh] h-[60vh] w-[60vh] rounded-full bg-accent-cyan/20 blur-[70px] md:blur-[120px]" />
      <div className="blob-b absolute -right-[15vw] top-[35vh] h-[55vh] w-[55vh] rounded-full bg-accent-orange/[0.16] blur-[70px] md:blur-[120px]" />

      <div className="streak absolute -left-1/4 top-[8%] h-px w-[150%] rotate-[-18deg] bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent" />
      <div className="streak-slow absolute -left-1/4 top-[62%] h-px w-[150%] rotate-[-18deg] bg-gradient-to-r from-transparent via-accent-orange/30 to-transparent" />
      {dense && (
        <div className="streak absolute -left-1/4 top-[38%] h-px w-[150%] rotate-[-18deg] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}

      <div className="grain absolute inset-0" />
    </div>
  );
}
