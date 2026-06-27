"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { leaderboardApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { LeaderboardEntry, LeaderboardPeriod, MapType } from "@/types";

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "ALL_TIME", label: "All-Time" },
  { value: "THIS_WEEK", label: "This Week" },
  { value: "TODAY", label: "Today" },
  { value: "FRIENDS", label: "Following" },
];

const MAP_TYPES: { value: MapType; label: string }[] = [
  { value: "WORLD", label: "🌍 World" },
  { value: "WORLD_CAPITALS", label: "🏛️ World Capitals" },
  { value: "AFRICA", label: "🌍 Africa" },
  { value: "ASIA", label: "🌏 Asia" },
  { value: "EUROPE", label: "🌍 Europe" },
  { value: "AMERICAS", label: "🌎 Americas" },
  { value: "OCEANIA", label: "🌏 Oceania" },
  { value: "COUNTRY", label: "🇮🇳 India" },
  { value: "INDIA_CAPITALS", label: "🏛️ India Capitals" },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<LeaderboardPeriod>("ALL_TIME");
  const [mapType, setMapType] = useState<MapType>("WORLD");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, mapType]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      let data: LeaderboardEntry[];
      if (period === "FRIENDS") {
        data = await leaderboardApi.getFollowing(mapType);
      } else {
        data = await leaderboardApi.getGlobal(period, mapType);
      }
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Top geography experts worldwide.
        </p>
      </motion.div>

      {/* Period tabs */}
      <Tabs
        defaultValue="ALL_TIME"
        value={period}
        onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}
        className="mb-4"
      >
        <TabsList className="flex-wrap h-auto gap-1">
          {PERIODS.map((p) => (
            <TabsTrigger key={p.value} value={p.value}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Map type sub-tabs */}
      <Tabs
        defaultValue="WORLD"
        value={mapType}
        onValueChange={(v) => setMapType(v as MapType)}
        className="mb-6"
      >
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50">
          {MAP_TYPES.map((m) => (
            <TabsTrigger key={m.value} value={m.value} className="text-xs">
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base text-muted-foreground font-medium">
            {PERIODS.find((p) => p.value === period)?.label} ·{" "}
            {MAP_TYPES.find((m) => m.value === mapType)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LeaderboardTable entries={entries} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
