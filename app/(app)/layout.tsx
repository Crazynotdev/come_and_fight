import { AppShell } from "@/components/layout/AppShell";
import { getCurrentPlayer } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await getCurrentPlayer();
  return <AppShell userId={userId} username={profile?.username ?? "Joueur"}>{children}</AppShell>;
}
