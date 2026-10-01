import type { ReactNode } from "react";
import { MobileHeader } from "./MobileHeader";
import { BottomNavigation } from "./BottomNavigation";
import { DesktopSidebar } from "./DesktopSidebar";
import { AmbientBackground } from "@/components/marketing/AmbientBackground";
import { PresenceProvider } from "@/lib/presence/PresenceContext";

export function AppShell({ userId, username, children }: { userId: string; username: string; children: ReactNode }) {
  return (
    <PresenceProvider userId={userId} username={username}>
      <div className="min-h-screen">
        <AmbientBackground />
        <DesktopSidebar />
        <MobileHeader username={username} />
        <main className="pb-24 md:ml-64 md:pb-8">{children}</main>
        <BottomNavigation />
      </div>
    </PresenceProvider>
  );
}
