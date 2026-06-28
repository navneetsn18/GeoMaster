"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/play/")) return null;

  return (
    <footer className="w-full py-4 text-center text-xs text-muted-foreground border-t border-border/40 bg-background/60">
      Made with ❤️ by @navneetsn18
    </footer>
  );
}
