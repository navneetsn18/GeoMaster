"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { userApi } from "@/lib/api";
import { formatDate, formatAccuracy, formatScore } from "@/lib/utils";
import type { RecentGame } from "@/types";
import { History } from "lucide-react";

const MAP_TYPE_LABELS: Record<string, string> = {
  WORLD: "🌍 World",
  AFRICA: "🌍 Africa",
  ASIA: "🌏 Asia",
  EUROPE: "🌍 Europe",
  AMERICAS: "🌎 Americas",
  OCEANIA: "🌏 Oceania",
  INDIA_STATES: "🇮🇳 India States",
  WORLD_CAPITALS: "🏛️ World Capitals",
  INDIA_CAPITALS: "🇮🇳 India Capitals",
};

export function RecentGames() {
  const [games, setGames] = useState<RecentGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    userApi
      .getHistory(5)
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="w-4 h-4 text-primary" />
          Recent Games
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-md bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No games played yet — click Play to start!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Mode
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    Accuracy
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr
                    key={game.sessionId}
                    className="border-b border-border/50 hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="font-normal">
                        {MAP_TYPE_LABELS[game.mapType] ?? game.mapType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">
                      {formatScore(game.score)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={
                          game.accuracy >= 70
                            ? "text-green-400"
                            : game.accuracy >= 40
                            ? "text-yellow-400"
                            : "text-red-400"
                        }
                      >
                        {formatAccuracy(game.accuracy)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground hidden sm:table-cell">
                      {formatDate(game.playedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
