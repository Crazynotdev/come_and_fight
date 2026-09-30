"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";

export function UsernameForm({ initialUsername }: { initialUsername: string }) {
  const [username, setUsername] = useState(initialUsername);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
    setLoading(false);
    setMsg(error
      ? { type: "err", text: error.message.includes("duplicate") ? "Ce pseudo est déjà pris." : error.message }
      : { type: "ok", text: "Pseudo mis à jour." });
  }

  return (
    <GlassCard className="space-y-3 p-5">
      <p className="text-sm font-medium text-white/70">Pseudo</p>
      <form onSubmit={onSubmit} className="flex gap-2">
        <GlassInput value={username} onChange={(e) => setUsername(e.target.value)}
          minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]+" required />
        <GlassButton type="submit" variant="primary" disabled={loading}>{loading ? "…" : "Enregistrer"}</GlassButton>
      </form>
      {msg && <p className={`text-xs ${msg.type === "ok" ? "text-accent-cyan" : "text-accent-orange"}`}>{msg.text}</p>}
    </GlassCard>
  );
}

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    setPassword("");
    setMsg(error ? { type: "err", text: error.message } : { type: "ok", text: "Mot de passe mis à jour." });
  }

  return (
    <GlassCard className="space-y-3 p-5">
      <p className="text-sm font-medium text-white/70">Changer le mot de passe</p>
      <form onSubmit={onSubmit} className="flex gap-2">
        <GlassInput type="password" placeholder="Nouveau mot de passe" value={password}
          onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" />
        <GlassButton type="submit" variant="primary" disabled={loading}>{loading ? "…" : "Mettre à jour"}</GlassButton>
      </form>
      {msg && <p className={`text-xs ${msg.type === "ok" ? "text-accent-cyan" : "text-accent-orange"}`}>{msg.text}</p>}
    </GlassCard>
  );
}
