"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { SocialAuth } from "./SocialAuth";
import { Wordmark } from "@/components/brand/Logo";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const signup = mode === "signup";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setLoading(true);
    const supabase = createClient();

    if (signup) {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
      });
      setLoading(false);
      if (error) return setError(error.message);
      if (!data.session) return setInfo("Compte créé. Vérifie ta boîte mail pour confirmer ton adresse.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError("Email ou mot de passe incorrect.");
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <GlassCard className="w-full max-w-sm p-7">
      <div className="mb-5 flex justify-center"><Wordmark pro /></div>
      <h1 className="text-center text-2xl font-semibold tracking-tight">{signup ? "Bienvenue !" : "Connexion"}</h1>
      <p className="mt-1 text-center text-xs text-white/40">{signup ? "Rejoins la communauté des joueurs et commence l'aventure." : "Accède à ton compte."}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        {signup && (
          <GlassInput placeholder="Pseudo" value={username} onChange={(e) => setUsername(e.target.value)}
            required minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]+" title="Lettres, chiffres et _ uniquement" autoComplete="username" />
        )}
        <GlassInput type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        {!signup && (
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-white/40 hover:text-white/60">Mot de passe oublié ?</Link>
          </div>
        )}
        <GlassInput type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)}
          required minLength={8} autoComplete={signup ? "new-password" : "current-password"} />
        {error && <p role="alert" className="text-sm text-accent-orange">{error}</p>}
        {info && <p className="text-sm text-accent-cyan">{info}</p>}
        <GlassButton type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "Patiente…" : signup ? "Créer mon compte" : "Se connecter"}
        </GlassButton>
      </form>
      <SocialAuth />
      <p className="mt-5 text-center text-sm text-white/50">
        {signup ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
        <Link href={signup ? "/login" : "/signup"} className="text-accent-cyan">{signup ? "Se connecter" : "Créer un compte"}</Link>
      </p>
    </GlassCard>
  );
}
