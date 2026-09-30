"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { BurgerMenu } from "./BurgerMenu";
import { Avatar } from "@/components/ui/Avatar";
import { Wordmark } from "@/components/brand/Logo";

export function MobileHeader({ username }: { username: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky inset-x-0 z-30 flex items-center justify-between border-b transition-all duration-300 md:hidden",
        scrolled
          ? "border-glass-border bg-base-void/80 py-2 backdrop-blur-glass"
          : "border-transparent bg-transparent py-4"
      )}
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex w-full items-center justify-between px-4">
        <BurgerMenu />
        <Wordmark />
        <Avatar username={username} size="sm" />
      </div>
    </header>
  );
}
