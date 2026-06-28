"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/play/")) return null;

  return (
    <footer className="w-full py-3 text-center text-xs text-muted-foreground/50 border-t border-border/30">
      Made with ❤️ by GeoMaster
    </footer>
  );
}
