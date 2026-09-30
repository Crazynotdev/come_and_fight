import { PageHeader } from "@/components/ui/PageHeader";
import { UsernameForm } from "@/components/settings/SettingsForm";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentPlayer } from "@/lib/server/session";

export default async function SettingsPage() {
  const { profile } = await getCurrentPlayer();
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pt-6 md:pt-10">
      <PageHeader title="Paramètres" />
      <UsernameForm initialUsername={profile?.username ?? ""} />
      <LogoutButton />
    </div>
  );
}
