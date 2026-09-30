import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COME-AND-FIGHT",
  description:
    "Plateforme de jeux multijoueurs compétitifs avec wallet et paiements réels — by CRAZY-TECH.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05060A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="font-display antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
