"use client";

import { createClient } from "@/lib/supabase/client";

// Icônes SVG officielles simplifiées (monochromes, s'adaptent au thème sombre).
const providers = [
  { id: "google" as const, label: "Google", path: "M21.6 12.23c0-.68-.06-1.36-.18-2H12v3.79h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.22c1.89-1.74 2.98-4.3 2.98-7.31Z M12 22c2.7 0 4.96-.9 6.62-2.44l-3.22-2.5c-.9.6-2.06.96-3.4.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.6A10 10 0 0 0 12 22Z M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.07a10 10 0 0 0 0 9l3.33-2.6Z M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.96 9.96 0 0 0 12 2 10 10 0 0 0 3.07 7.5l3.33 2.6c.8-2.36 3-4.12 5.6-4.12Z" },
  { id: "apple" as const, label: "Apple", path: "M16.4 2c.1 1.1-.34 2.2-1 3-.68.83-1.8 1.47-2.9 1.38-.13-1.06.4-2.2 1.03-2.94.7-.84 1.9-1.45 2.87-1.44ZM19.9 17.2c-.36.83-.78 1.6-1.28 2.32-.68 1-1.38 1.98-2.5 2-1.1.02-1.46-.65-2.72-.65-1.27 0-1.67.63-2.7.67-1.08.04-1.9-1.08-2.6-2.06-1.4-2-2.5-5.65-1.05-8.13.72-1.23 2-2.02 3.4-2.04 1.06-.02 2.05.7 2.7.7.63 0 1.85-.86 3.13-.74.53.02 2.03.22 3 1.63-.08.05-1.78 1.02-1.77 3.05.02 2.42 2.16 3.23 2.4 3.25Z" },
  { id: "facebook" as const, label: "Facebook", path: "M13.5 21v-7.5h2.5l.4-3H13.5V8.5c0-.87.24-1.46 1.5-1.46H16.5V4.35c-.26-.03-1.15-.1-2.19-.1-2.17 0-3.66 1.32-3.66 3.75v2.1H8.2v3H10.65V21h2.85Z" },
];

export function SocialAuth() {
  async function signInWith(provider: "google" | "apple" | "facebook") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
  }

  return (
    <div>
      <div className="my-5 flex items-center gap-3 text-xs text-white/30">
        <span className="h-px flex-1 bg-glass-border" />ou continuer avec<span className="h-px flex-1 bg-glass-border" />
      </div>
      <div className="flex justify-center gap-3">
        {providers.map(({ id, label, path }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            onClick={() => signInWith(id)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-glass-border bg-glass-surface text-white/70 backdrop-blur-glass transition-colors hover:text-white"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d={path} /></svg>
          </button>
        ))}
      </div>
    </div>
  );
}
