"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";

/**
 * Upload réel vers Supabase Storage (bucket `avatars`, public en lecture,
 * écriture limitée à son propre dossier — migration 0017). Le fichier
 * remplace l'ancien (même chemin stable `userId/avatar`), et l'URL publique
 * est écrite dans `profiles.avatar_url` juste après.
 */
export function AvatarUpload({ userId, username, initialUrl }: { userId: string; username: string; initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return setError("Image trop lourde (2 Mo max).");

    setUploading(true); setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { setUploading(false); return setError(uploadError.message); }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    // Cache-bust : même chemin à chaque upload, sinon le navigateur garde l'ancienne image en cache.
    const newUrl = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: dbError } = await supabase.from("profiles").update({ avatar_url: newUrl }).eq("id", userId);
    setUploading(false);
    if (dbError) return setError(dbError.message);
    setUrl(newUrl);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative"
        aria-label="Changer la photo de profil"
      >
        <Avatar username={username} src={url} size="lg" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white/0 transition-colors group-hover:bg-black/40 group-hover:text-white/90">
          <Camera size={20} />
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} className="hidden" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="text-xs text-accent-cyan">
        {uploading ? "Envoi…" : "Changer la photo"}
      </button>
      {error && <p className="text-xs text-accent-orange">{error}</p>}
    </div>
  );
}
