/** Illustrations SVG géométriques par jeu (originales, légères). */
export function GameArt({ slug }: { slug: string }) {
  const c = "#3DE1FF", o = "#FF7A2E";
  switch (slug) {
    case "dames":
      return (
        <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => {
            const x = i % 6, y = Math.floor(i / 6);
            return <rect key={i} x={x * 20} y={y * 20} width="20" height="20" fill={(x + y) % 2 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.02)"} />;
          })}
          <circle cx="30" cy="30" r="7" fill={c} /><circle cx="70" cy="50" r="7" fill={o} /><circle cx="90" cy="30" r="7" fill={c} opacity=".5" />
        </svg>
      );
    case "puissance4":
      return (
        <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden>
          {Array.from({ length: 21 }).map((_, i) => {
            const x = i % 7, y = Math.floor(i / 7);
            const fill = i === 15 || i === 9 ? c : i === 16 || i === 10 ? o : "rgba(255,255,255,0.08)";
            return <circle key={i} cx={10 + x * 16.6} cy={14 + y * 26} r="9" fill={fill} />;
          })}
        </svg>
      );
    case "morpion":
      return (
        <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden fill="none" strokeLinecap="round">
          <path d="M50 10v60M70 10v60M30 30h60M30 50h60" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
          <path d="M34 14l12 12M46 14L34 26" stroke={c} strokeWidth="4" /><circle cx="60" cy="40" r="7" stroke={o} strokeWidth="4" />
        </svg>
      );
    case "dominos":
      return (
        <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden>
          <rect x="22" y="18" width="34" height="44" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" />
          <rect x="64" y="18" width="34" height="44" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" />
          <circle cx="39" cy="32" r="3" fill={c} /><circle cx="39" cy="48" r="3" fill={c} /><circle cx="81" cy="40" r="3" fill={o} />
        </svg>
      );
    case "ludo":
      return (
        <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden>
          <rect x="32" y="8" width="56" height="64" rx="10" fill="rgba(255,255,255,0.05)" />
          <circle cx="48" cy="26" r="8" fill={c} /><circle cx="72" cy="26" r="8" fill={o} /><circle cx="48" cy="54" r="8" fill={o} opacity=".5" /><circle cx="72" cy="54" r="8" fill={c} opacity=".5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => {
            const x = i % 6, y = Math.floor(i / 6);
            return <rect key={i} x={x * 20} y={y * 20} width="20" height="20" fill={(x + y) % 2 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.02)"} />;
          })}
          <path d="M60 18l6 14h-12zM54 32h12v20H54zM48 52h24v8H48z" fill={c} opacity=".9" />
        </svg>
      );
  }
}
