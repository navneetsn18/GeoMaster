"use client";

import { Trophy, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatScore, formatAccuracy, formatDate, getRankBadgeColor } from "@/lib/utils";
import { getStoredUser } from "@/lib/auth";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <span className="text-xl" title="1st place">🥇</span>;
  if (rank === 2)
    return <span className="text-xl" title="2nd place">🥈</span>;
  if (rank === 3)
    return <span className="text-xl" title="3rd place">🥉</span>;
  return (
    <span
      className={cn(
        "inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold",
        getRankBadgeColor(rank)
      )}
    >
      {rank}
    </span>
  );
}

export function LeaderboardTable({
  entries,
  isLoading,
}: LeaderboardTableProps) {
  const me = getStoredUser();

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-md bg-muted animate-pulse"
            style={{ opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Trophy className="w-8 h-8 mx-auto mb-3 opacity-30" />
        <p>No scores yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-3 px-4 font-medium text-muted-foreground w-12">
              Rank
            </th>
            <th className="py-3 px-4 font-medium text-muted-foreground">
              Player
            </th>
            <th className="py-3 px-4 font-medium text-muted-foreground text-right">
              Score
            </th>
            <th className="py-3 px-4 font-medium text-muted-foreground text-right hidden sm:table-cell">
              Accuracy
            </th>
            <th className="py-3 px-4 font-medium text-muted-foreground text-right hidden md:table-cell">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isMe = me?.id === entry.userId || me?.username === entry.username;
            return (
              <tr
                key={`${entry.rank}-${entry.userId}`}
                className={cn(
                  "border-b border-border/50 transition-colors",
                  isMe
                    ? "bg-primary/10 hover:bg-primary/15"
                    : "hover:bg-muted/40"
                )}
              >
                <td className="py-3 px-4">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        isMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {entry.username[0].toUpperCase()}
                    </div>
                    <span className={cn("font-medium", isMe && "text-primary")}>
                      {entry.username}
                    </span>
                    {isMe && (
                      <Badge variant="default" className="text-xs px-1.5 py-0.5">
                        You
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-bold text-primary">
                  {formatScore(entry.score)}
                </td>
                <td className="py-3 px-4 text-right hidden sm:table-cell">
                  <span
                    className={
                      entry.accuracy >= 70
                        ? "text-green-400"
                        : entry.accuracy >= 40
                        ? "text-yellow-400"
                        : "text-red-400"
                    }
                  >
                    {formatAccuracy(entry.accuracy)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-muted-foreground hidden md:table-cell">
                  {formatDate(entry.date)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
