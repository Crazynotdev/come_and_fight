"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassButton } from "@/components/ui/GlassButton";

export function LogoutButton() {
  const router = useRouter();
  return (
    <GlassButton
      className="w-full"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      <LogOut size={16} /> Se déconnecter
    </GlassButton>
  );
}
