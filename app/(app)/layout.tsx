import { AppShell } from "@/components/layout/AppShell";
import { getCurrentPlayer } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getCurrentPlayer();
  return <AppShell username={profile?.username ?? "Joueur"}>{children}</AppShell>;
}
