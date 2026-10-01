"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { Wordmark } from "@/components/brand/Logo";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <GlassCard className="w-full max-w-sm p-7">
      <div className="mb-5 flex justify-center"><Wordmark pro /></div>
      <h1 className="text-center text-2xl font-semibold tracking-tight">Mot de passe oublié</h1>
      {sent ? (
        <p className="mt-4 text-center text-sm text-white/60">
          Si un compte existe pour <span className="text-white">{email}</span>, un lien de réinitialisation vient d'être envoyé.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <GlassInput type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          {error && <p role="alert" className="text-sm text-accent-orange">{error}</p>}
          <GlassButton type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Envoi…" : "Envoyer le lien"}
          </GlassButton>
        </form>
      )}
    </GlassCard>
  );
}
