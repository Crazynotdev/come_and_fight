import type { ReactNode } from "react";
import { MobileHeader } from "./MobileHeader";
import { BottomNavigation } from "./BottomNavigation";
import { DesktopSidebar } from "./DesktopSidebar";
import { AmbientBackground } from "@/components/marketing/AmbientBackground";

/**
 * Coquille commune aux pages authentifiées : header + bottom nav sur mobile,
 * sidebar sur desktop. `username` sera fourni par le profil réel une fois
 * l'Auth branchée (Phase suivante) — pour l'instant transmis par la page.
 */
export function AppShell({ username, children }: { username: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AmbientBackground />
      <DesktopSidebar />
      <MobileHeader username={username} />
      <main className="pb-24 md:ml-64 md:pb-8">{children}</main>
      <BottomNavigation />
    </div>
  );
}
