"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { Wordmark } from "@/components/brand/Logo";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <GlassCard className="w-full max-w-sm p-7">
      <div className="mb-5 flex justify-center"><Wordmark pro /></div>
      <h1 className="text-center text-2xl font-semibold tracking-tight">Nouveau mot de passe</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <GlassInput type="password" placeholder="Nouveau mot de passe" value={password}
          onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" />
        {error && <p role="alert" className="text-sm text-accent-orange">{error}</p>}
        <GlassButton type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "Mise à jour…" : "Valider"}
        </GlassButton>
      </form>
    </GlassCard>
  );
}
