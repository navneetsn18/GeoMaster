"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, User, Trophy, Map, LayoutDashboard, Menu, X, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { getStoredUser, removeToken } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/types";

const BASE_NAV_LINKS = [
  { href: "/dashboard", label: "Play", icon: Map },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

const ADMIN_LINK = { href: "/admin", label: "Admin", icon: ShieldAlert };

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const handleLogout = () => {
    removeToken();
    setUser(null);
    window.location.href = "/";
  };

  const navLinks = user?.role === "ADMIN"
    ? [...BASE_NAV_LINKS, ADMIN_LINK]
    : BASE_NAV_LINKS;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/30 bg-background/40 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">🌍</span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            GeoMaster
          </span>
        </Link>

        {/* Center nav — desktop */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm font-medium">
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                  <img
                    src={getAvatarUrl(user.id, user.avatarUrl)}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-foreground">{user.username}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 py-3 px-4 flex flex-col gap-1">
          {user ? (
            <>
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive(href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <div className="border-t border-border mt-2 pt-2">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <LayoutDashboard className="w-4 h-4" />
                  Logged in as <strong>{user.username}</strong>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2.5 w-full text-left rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground text-center"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
