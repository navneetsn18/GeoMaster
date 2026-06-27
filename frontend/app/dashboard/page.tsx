"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Target,
  Flame,
  Trophy,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentGames } from "@/components/dashboard/recent-games";
import { getStoredUser, getToken } from "@/lib/auth";
import { userApi } from "@/lib/api";
import { formatScore, formatAccuracy } from "@/lib/utils";
import type { UserStats, User } from "@/types";
import { GAME_MODES } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    const stored = getStoredUser();
    setUser(stored);

    userApi
      .getStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Games",
      value: statsLoading ? "…" : stats?.totalGames ?? 0,
      icon: Gamepad2,
      iconColor: "text-blue-400",
      delay: 0,
    },
    {
      label: "Avg Accuracy",
      value: statsLoading
        ? "…"
        : stats
        ? formatAccuracy(stats.avgAccuracy)
        : "—",
      icon: Target,
      iconColor: "text-green-400",
      delay: 0.05,
    },
    {
      label: "Best Score",
      value: statsLoading ? "…" : stats ? formatScore(stats.bestScore) : "—",
      icon: Trophy,
      iconColor: "text-yellow-400",
      delay: 0.1,
    },
    {
      label: "Best Streak",
      value: statsLoading ? "…" : stats?.bestStreak ?? 0,
      icon: Flame,
      iconColor: "text-orange-400",
      delay: 0.15,
    },
  ];

  return (
    <div className="container py-6 sm:py-8 px-4 space-y-6 sm:space-y-8 max-w-6xl">
      {/* Ban notice */}
      {user.banned && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/20 px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">🚫</span>
          <div>
            <p className="font-semibold text-red-400 text-sm">Account suspended — games disabled</p>
            <p className="text-xs text-red-300/70 mt-0.5">
              Visit your <a href="/profile" className="underline underline-offset-2 hover:text-red-300">profile page</a> to see admin contacts and submit an appeal.
            </p>
          </div>
        </div>
      )}

      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {user.username}
          </span>{" "}
          👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {user.banned ? "Your account is suspended. You cannot start new games." : "Choose a game mode to start playing."}
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatsCard key={s.label} {...s} />
        ))}
      </div>

      {/* Game mode grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          Choose a Game Mode
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {GAME_MODES.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className={`h-full transition-all duration-300 ${user.banned ? "opacity-50 cursor-not-allowed" : "group hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 cursor-pointer"}`}>
                <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{mode.emoji}</div>
                  <h3 className="font-bold text-sm sm:text-base">{mode.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3 sm:mb-4 hidden sm:block">
                    {mode.description}
                  </p>
                  <div className="mt-auto">
                    <Button
                      size="sm"
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant="outline"
                      disabled={!!user.banned}
                      asChild={!user.banned}
                    >
                      {user.banned ? (
                        <span><Play className="w-3 h-3 mr-1" />Play</span>
                      ) : (
                      <Link
                        href={
                          mode.href
                            ? mode.href
                            : mode.id === "WORLD"
                            ? "/play/world"
                            : `/play/continent/${mode.id.toLowerCase()}`
                        }
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Play
                      </Link>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent games */}
      <div>
        <RecentGames />
      </div>

      {/* Leaderboard CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <Trophy className="w-8 h-8 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Climb the Leaderboard</h3>
            <p className="text-sm text-muted-foreground">
              See how you rank against players worldwide.
            </p>
          </div>
        </div>
        <Button variant="outline" asChild className="shrink-0">
          <Link href="/leaderboard">View Leaderboard</Link>
        </Button>
      </motion.div>
    </div>
  );
}
