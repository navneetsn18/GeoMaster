"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Trophy, Target, Flame, RotateCcw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useGameStore } from "@/lib/game-store";
import { formatScore, formatAccuracy, formatDuration } from "@/lib/utils";
import { ShareScoreButton } from "@/components/game/share-card";

interface ScoreModalProps {
  open: boolean;
  onPlayAgain: () => void;
}

export function ScoreModal({ open, onPlayAgain }: ScoreModalProps) {
  const { sessionResult, bestStreak, score, mapType, resetGame } = useGameStore();
  const router = useRouter();

  const navigateTo = (path: string) => {
    resetGame(); // clear isComplete so modal doesn't reopen on remount
    router.push(path);
  };

  if (!sessionResult) return null;

  const stats = [
    {
      icon: Trophy,
      label: "Final Score",
      value: formatScore(sessionResult.score),
      color: "text-yellow-400",
    },
    {
      icon: Target,
      label: "Accuracy",
      value: formatAccuracy(sessionResult.accuracy),
      color:
        sessionResult.accuracy >= 70
          ? "text-green-400"
          : sessionResult.accuracy >= 40
          ? "text-yellow-400"
          : "text-red-400",
    },
    {
      icon: Flame,
      label: "Best Streak",
      value: `${sessionResult.bestStreak}x`,
      color: "text-orange-400",
    },
  ];

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm w-[calc(100vw-2rem)] mx-4">
        <DialogHeader>
          <div className="text-center mb-2">
            {sessionResult.newPersonalBest ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-5xl mb-2"
              >
                🏆
              </motion.div>
            ) : (
              <div className="text-5xl mb-2">🌍</div>
            )}
            <DialogTitle className="text-2xl">
              {sessionResult.newPersonalBest
                ? "New Personal Best!"
                : "Game Over!"}
            </DialogTitle>
            <DialogDescription className="mt-1">
              You identified {sessionResult.correctCount} of{" "}
              {sessionResult.totalCount} countries
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 my-4">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl bg-muted"
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground text-center">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Accuracy bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Accuracy</span>
            <span>{formatAccuracy(sessionResult.accuracy)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sessionResult.accuracy}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <ShareScoreButton className="w-full" />
          <Button className="w-full" onClick={onPlayAgain} size="lg">
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigateTo("/leaderboard")}>
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigateTo("/dashboard")}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
