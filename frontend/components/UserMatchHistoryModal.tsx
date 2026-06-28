"use client";

import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import { formatDate, formatAccuracy, formatScore } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flag, ChevronDown, ChevronUp, Clock } from "lucide-react";
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

interface Props {
  userId: string;
  username: string;
  onClose: () => void;
}

function GuessDetail({ sessionId }: { sessionId: string }) {
  const [guesses, setGuesses] = useState<GuessItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi
      .getSessionGuesses(sessionId)
      .then(setGuesses)
      .catch(() => setGuesses([]))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <p className="text-xs text-muted-foreground px-2 py-1">Loading…</p>;
  if (!guesses?.length) return <p className="text-xs text-muted-foreground px-2 py-1">No guesses found.</p>;

  return (
    <div className="mt-2 border border-border/40 rounded overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">#</th>
            <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Code</th>
            <th className="text-center px-3 py-1.5 font-medium text-muted-foreground">Result</th>
            <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Time</th>
            <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Pts</th>
          </tr>
        </thead>
        <tbody>
          {guesses.map((g, i) => (
            <tr key={g.id} className="border-b border-border/20 hover:bg-muted/20">
              <td className="px-3 py-1 text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-1 font-mono uppercase">{g.countryCode}</td>
              <td className="px-3 py-1 text-center">
                {g.correct
                  ? <span className="text-green-400 font-semibold">✓</span>
                  : <span className="text-red-400 font-semibold">✗</span>}
              </td>
              <td className="px-3 py-1 text-right text-muted-foreground flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" />
                {(g.timeTakenMs / 1000).toFixed(1)}s
              </td>
              <td className="px-3 py-1 text-right font-semibold text-primary">+{g.pointsEarned}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SessionRow({ game }: { game: RecentGame }) {
  const [expanded, setExpanded] = useState(false);
  const [flagged, setFlagged] = useState(game.myFlag ?? false);
  const [flagCount, setFlagCount] = useState(game.userFlagCount ?? 0);
  const [flagging, setFlagging] = useState(false);

  const handleFlag = async () => {
    setFlagging(true);
    try {
      if (flagged) {
        const res = await userApi.unflagUserSession(game.sessionId);
        setFlagged(false);
        setFlagCount(res.count);
      } else {
        const res = await userApi.flagUserSession(game.sessionId);
        setFlagged(true);
        setFlagCount(res.count);
      }
    } catch {
      // ignore
    } finally {
      setFlagging(false);
    }
  };

  return (
    <div className="border-b border-border/30 last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="secondary" className="font-normal text-xs">
              {MAP_TYPE_LABELS[game.mapType] ?? game.mapType}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDate(game.playedAt)}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold text-primary">{formatScore(game.score)}</span>
            <span className={
              game.accuracy >= 70 ? "text-green-400"
                : game.accuracy >= 40 ? "text-yellow-400"
                : "text-red-400"
            }>
              {formatAccuracy(game.accuracy)}
            </span>
            <span className="text-muted-foreground text-xs">
              {game.correctCount}/{game.totalCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {flagCount > 0 && (
            <span className="text-xs text-orange-400 font-semibold">{flagCount}🚩</span>
          )}
          <button
            onClick={handleFlag}
            disabled={flagging}
            title={flagged ? "Remove flag" : "Flag this match"}
            className={`p-1.5 rounded transition-colors ${
              flagged
                ? "text-orange-400 hover:text-orange-300 bg-orange-400/10"
                : "text-muted-foreground hover:text-orange-400"
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            title={expanded ? "Hide details" : "Show per-answer timing"}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-3">
          <GuessDetail sessionId={game.sessionId} />
        </div>
      )}
    </div>
  );
}

export function UserMatchHistoryModal({ userId, username, onClose }: Props) {
  const [sessions, setSessions] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi
      .getPublicHistory(userId)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">{username}'s Matches</h2>
            <p className="text-xs text-muted-foreground">Flag suspicious matches as indicators for admin</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No matches found.</div>
          ) : (
            sessions.map((g) => <SessionRow key={g.sessionId} game={g} />)
          )}
        </div>
      </div>
    </div>
  );
}
