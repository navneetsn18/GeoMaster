"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Timer, Zap, Clock, Infinity, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TIMER_OPTIONS, type TimerMode } from "@/lib/game-store";
import { cn } from "@/lib/utils";

const ICONS: Record<TimerMode, React.ReactNode> = {
  rapid: <Zap className="w-5 h-5" />,
  mid: <Clock className="w-5 h-5" />,
  advanced: <Timer className="w-5 h-5" />,
  none: <Infinity className="w-5 h-5" />,
};

const MULTIPLIER_LABEL: Record<TimerMode, string> = {
  rapid: "+50% score",
  mid: "Base score",
  advanced: "−30% score",
  none: "−50% score",
};

interface GameSetupProps {
  modeName: string;
  onStart: (timerMode: TimerMode) => void;
}

export function GameSetup({ modeName, onStart }: GameSetupProps) {
  const [selected, setSelected] = useState<TimerMode>("mid");

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{modeName}</h1>
          <p className="text-muted-foreground">Choose your timer</p>
        </div>

        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 mb-8">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => setSelected(opt.mode)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left",
                selected === opt.mode
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-border/80 hover:bg-muted/40"
              )}
            >
              <div className={cn("flex items-center gap-2 font-semibold", opt.color)}>
                {ICONS[opt.mode]}
                <span>{opt.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">{opt.description}</span>
              <span className={cn("text-xs font-medium", opt.color)}>
                {MULTIPLIER_LABEL[opt.mode]}
              </span>
            </button>
          ))}
        </div>

        <Button
          size="lg"
          className="w-full gap-2 text-base"
          onClick={() => onStart(selected)}
        >
          <Play className="w-4 h-4" />
          Start Game
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Rapid games earn bonus points · Untimed games score at 50%
        </p>
      </motion.div>
    </div>
  );
}
