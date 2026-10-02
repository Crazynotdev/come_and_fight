import { PageHeader } from "@/components/ui/PageHeader";
import { UsernameForm } from "@/components/settings/SettingsForm";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { getCurrentPlayer } from "@/lib/server/session";

export default async function SettingsPage() {
  const { userId, profile } = await getCurrentPlayer();
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pt-6 md:pt-10">
      <PageHeader title="Paramètres" />
      <GlassCard className="flex flex-col items-center gap-1 p-6">
        <AvatarUpload userId={userId} username={profile?.username ?? "?"} initialUrl={profile?.avatar_url ?? null} />
      </GlassCard>
      <UsernameForm initialUsername={profile?.username ?? ""} />
      <LogoutButton />
    </div>
  );
}
