"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { userApi } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { formatDate, formatAccuracy, formatScore } from "@/lib/utils";
import { ShareGameButton } from "@/components/game/share-card";
import { ChevronDown, ChevronUp, Clock, History } from "lucide-react";
import type { RecentGame, GuessItem } from "@/types";

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

function GuessDetails({ sessionId }: { sessionId: string }) {
  const [guesses, setGuesses] = useState<GuessItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi
      .getSessionGuesses(sessionId)
      .then(setGuesses)
      .catch(() => setGuesses([]))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <tr>
        <td colSpan={5} className="px-4 pb-3 pt-0">
          <p className="text-xs text-muted-foreground py-1">Loading answers…</p>
        </td>
      </tr>
    );
  }
  if (!guesses?.length) return null;

  return (
    <tr>
      <td colSpan={5} className="px-4 pb-3 pt-0">
        <div className="border border-border/30 rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">#</th>
                <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Code</th>
                <th className="text-center px-3 py-1.5 text-muted-foreground font-medium">Result</th>
                <th className="text-right px-3 py-1.5 text-muted-foreground font-medium">Time</th>
                <th className="text-right px-3 py-1.5 text-muted-foreground font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {guesses.map((g, i) => (
                <tr key={g.id} className="border-b border-border/20 last:border-b-0 hover:bg-muted/10">
                  <td className="px-3 py-1 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-1 font-mono uppercase tracking-wide">{g.countryCode}</td>
                  <td className="px-3 py-1 text-center">
                    {g.correct
                      ? <span className="text-green-400 font-bold">✓</span>
                      : <span className="text-red-400 font-bold">✗</span>}
                  </td>
                  <td className="px-3 py-1 text-right text-muted-foreground">
                    <span className="inline-flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {(g.timeTakenMs / 1000).toFixed(1)}s
                    </span>
                  </td>
                  <td className="px-3 py-1 text-right font-semibold text-primary">+{g.pointsEarned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

function GameRow({ game, username, userId, avatarUrl }: {
  game: RecentGame;
  username?: string;
  userId?: string;
  avatarUrl?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-muted/40 transition-colors">
        <td className="py-3 px-4">
          <Badge variant="secondary" className="font-normal">
            {MAP_TYPE_LABELS[game.mapType] ?? game.mapType}
          </Badge>
        </td>
        <td className="py-3 px-4 text-right font-semibold text-primary">
          {formatScore(game.score)}
        </td>
        <td className="py-3 px-4 text-right">
          <span className={
            game.accuracy >= 70 ? "text-green-400"
              : game.accuracy >= 40 ? "text-yellow-400"
              : "text-red-400"
          }>
            {formatAccuracy(game.accuracy)}
          </span>
        </td>
        <td className="py-3 px-4 text-right text-muted-foreground hidden sm:table-cell">
          {formatDate(game.playedAt)}
        </td>
        <td className="py-3 px-2 text-right">
          <div className="flex items-center justify-end gap-1">
            {username && (
              <ShareGameButton
                game={game}
                username={username}
                userId={userId ?? ""}
                avatarUrl={avatarUrl}
              />
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
              title={expanded ? "Hide answer times" : "View answer times"}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && <GuessDetails sessionId={game.sessionId} />}
    </>
  );
}

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

  const user = getStoredUser();

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
              <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
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
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Mode</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Score</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Accuracy</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="py-3 px-2 w-16" />
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <GameRow
                    key={game.sessionId}
                    game={game}
                    username={user?.username}
                    userId={user?.id}
                    avatarUrl={user?.avatarUrl ?? undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
