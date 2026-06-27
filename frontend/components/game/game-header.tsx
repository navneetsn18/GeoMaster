"use client";

import { useEffect, useState } from "react";
import { Pause, Play, Flame, Target, Volume2, VolumeX, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/game-store";
import { soundManager } from "@/components/game/sound-manager";
import { cn, formatScore, getStreakColor } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface GameHeaderProps {
  onPause: () => void;
  onEndGame?: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GameHeader({ onPause, onEndGame }: GameHeaderProps) {
  const { score, streak, countries, currentCountryIndex, isPaused, isComplete, guessedCorrectly, timeRemainingSeconds, timerMode, tickTimer } =
    useGameStore();

  const [muted, setMuted] = useState(soundManager.muted);

  // Tick timer every second (only when timer is active)
  useEffect(() => {
    if (isComplete || timeRemainingSeconds === null) return;
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [isComplete, timeRemainingSeconds, tickTimer]);

  // Auto-end when timer hits 0
  useEffect(() => {
    if (timeRemainingSeconds === 0 && !isComplete && onEndGame) {
      onEndGame();
    }
  }, [timeRemainingSeconds, isComplete, onEndGame]);

  const handleMute = () => {
    const next = soundManager.toggleMute();
    setMuted(next);
  };

  const correctCount = guessedCorrectly.size;
  const totalCount = countries.length;
  const timeWarning = timeRemainingSeconds !== null && timeRemainingSeconds <= 60 && timeRemainingSeconds > 0;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-background/80 backdrop-blur-sm gap-2 flex-wrap">
      {/* Score + streak */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Score</p>
          <AnimatePresence mode="popLayout">
            <motion.p
              key={score}
              initial={{ scale: 1.3, color: "#22c55e" }}
              animate={{ scale: 1, color: "currentColor" }}
              transition={{ duration: 0.3 }}
              className="text-xl font-bold tabular-nums"
            >
              {formatScore(score)}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
          <Flame className={cn("w-4 h-4 transition-colors", streak >= 5 ? "text-orange-400" : "text-muted-foreground")} />
          <span className={cn("font-bold text-sm tabular-nums", streak >= 5 ? getStreakColor(streak) : "text-foreground")}>
            {streak}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">streak</span>
        </div>
      </div>

      {/* Center: progress + timer */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Target className="w-4 h-4 text-primary" />
            <span>
              <span className="text-green-400 font-bold">{correctCount}</span>
              <span className="text-muted-foreground"> / {totalCount}</span>
            </span>
          </div>

          {/* Timer */}
          {timeRemainingSeconds === null ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium bg-muted text-muted-foreground">
              ∞
            </div>
          ) : (
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-mono font-bold tabular-nums",
              timeWarning ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-muted text-foreground"
            )}>
              {formatTime(timeRemainingSeconds)}
            </div>
          )}
        </div>

        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: totalCount > 0 ? `${(correctCount / totalCount) * 100}%` : "0%" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMute}
          title={muted ? "Unmute" : "Mute"}
          className="text-muted-foreground hover:text-foreground"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>

        {onEndGame && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEndGame}
            className="gap-1.5 text-xs"
            title="End game early"
          >
            <Flag className="w-3.5 h-3.5" />
            End
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={onPause} className="gap-1.5">
          {isPaused ? (
            <><Play className="w-3.5 h-3.5" />Resume</>
          ) : (
            <><Pause className="w-3.5 h-3.5" />Pause</>
          )}
        </Button>
      </div>
    </div>
  );
}
