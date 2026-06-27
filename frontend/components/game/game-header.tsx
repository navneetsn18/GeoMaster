"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Image from "next/image";
import { Pause, Play, Flame, Target, Volume2, VolumeX, Flag, Volume1 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/game-store";
import { soundManager } from "@/components/game/sound-manager";
import { cn, formatScore, getStreakColor } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Country } from "@/types";

interface GameHeaderProps {
  onPause: () => void;
  onEndGame?: () => void;
  currentCountry?: Country;
  promptLabel?: string; // e.g. "Find this state" for India
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GameHeader({ onPause, onEndGame, currentCountry, promptLabel = "Find this country" }: GameHeaderProps) {
  const {
    score, streak, countries, isPaused, isComplete, guessedCorrectly,
    timeRemainingSeconds, tickTimer,
  } = useGameStore();

  const [sfxMuted, setSfxMuted] = useState(soundManager.muted);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const spokenCodeRef = useRef<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (isComplete || timeRemainingSeconds === null) return;
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [isComplete, timeRemainingSeconds, tickTimer]);

  useEffect(() => {
    if (timeRemainingSeconds === 0 && !isComplete && onEndGame) onEndGame();
  }, [timeRemainingSeconds, isComplete, onEndGame]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.88;
    utt.pitch = 1;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);

  // Auto-speak when country changes (once per country)
  useEffect(() => {
    if (!currentCountry || isPaused || isComplete) return;
    if (spokenCodeRef.current === currentCountry.code) return;
    spokenCodeRef.current = currentCountry.code;
    if (ttsEnabled) speak(currentCountry.name);
  }, [currentCountry?.code, isPaused, isComplete, ttsEnabled, speak]);

  const handleSfxMute = () => setSfxMuted(soundManager.toggleMute());
  const handleTtsToggle = () => {
    if (isSpeaking) window.speechSynthesis?.cancel();
    setTtsEnabled(v => !v);
  };
  const handleSpeakNow = () => {
    if (currentCountry) speak(currentCountry.name);
  };

  const correctCount = guessedCorrectly.size;
  const totalCount = countries.length;
  const timeWarning = timeRemainingSeconds !== null && timeRemainingSeconds <= 60 && timeRemainingSeconds > 0;

  const TimerBadge = ({ small = false }: { small?: boolean }) => (
    timeRemainingSeconds === null ? (
      <div className={cn("px-2 py-0.5 rounded-full bg-muted text-muted-foreground", small ? "text-xs" : "text-sm font-medium")}>∞</div>
    ) : (
      <div className={cn(
        "px-2 py-0.5 rounded-full font-mono font-bold tabular-nums",
        small ? "text-xs" : "text-sm",
        timeWarning ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-muted text-foreground"
      )}>
        {formatTime(timeRemainingSeconds)}
      </div>
    )
  );

  return (
    <div className="border-b border-border/60 bg-background/90 backdrop-blur-sm">

      {/* ── PROMPT ROW (country/state to find) ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        {currentCountry && !isComplete && (
          <motion.div
            key={currentCountry.code}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-between px-3 sm:px-4 pt-2 pb-1 border-b border-border/30"
          >
            {/* Label + flag + name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-semibold shrink-0 hidden sm:block">
                {promptLabel}
              </span>
              {currentCountry.flagUrl && (
                <div className="relative w-7 h-5 sm:w-8 sm:h-6 rounded overflow-hidden border border-border/40 shrink-0">
                  <Image
                    src={currentCountry.flagUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <span className="text-base sm:text-xl font-extrabold tracking-tight truncate">
                {currentCountry.name}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-semibold shrink-0 sm:hidden">
                {promptLabel}
              </span>
            </div>

            {/* TTS controls */}
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={cn("w-7 h-7", isSpeaking ? "text-cyan-400" : "text-muted-foreground hover:text-foreground")}
                onClick={handleSpeakNow}
                title="Speak name"
              >
                <Volume1 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("w-7 h-7", ttsEnabled ? "text-foreground" : "text-muted-foreground/40")}
                onClick={handleTtsToggle}
                title={ttsEnabled ? "Disable auto-speak" : "Enable auto-speak"}
              >
                {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE controls row (< sm) ──────────────────────────────────────── */}
      <div className="sm:hidden px-3 py-1.5 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AnimatePresence mode="popLayout">
              <motion.span key={score} initial={{ scale: 1.3, color: "#22c55e" }} animate={{ scale: 1, color: "currentColor" }} transition={{ duration: 0.3 }} className="text-base font-bold tabular-nums">
                {formatScore(score)}
              </motion.span>
            </AnimatePresence>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
              <Flame className={cn("w-3 h-3", streak >= 5 ? "text-orange-400" : "text-muted-foreground")} />
              <span className={cn("font-bold text-xs", streak >= 5 ? getStreakColor(streak) : "")}>{streak}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TimerBadge small />
            <Button variant="ghost" size="icon" onClick={handleSfxMute} className="w-7 h-7 text-muted-foreground">
              {sfxMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </Button>
            {onEndGame && (
              <Button variant="ghost" size="icon" onClick={onEndGame} className="w-7 h-7 text-red-400">
                <Flag className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onPause} className="h-7 px-2 text-xs gap-1">
              {isPaused ? <><Play className="w-3 h-3" />Go</> : <><Pause className="w-3 h-3" />Pause</>}
            </Button>
          </div>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            <span className="text-green-400 font-bold">{correctCount}</span>/{totalCount}
          </span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full" initial={{ width: 0 }}
              animate={{ width: totalCount > 0 ? `${(correctCount / totalCount) * 100}%` : "0%" }} transition={{ duration: 0.4, ease: "easeOut" }} />
          </div>
        </div>
      </div>

      {/* ── DESKTOP controls row (sm+) ──────────────────────────────────────── */}
      <div className="hidden sm:flex items-center justify-between px-4 py-1.5 gap-2">
        {/* Score + streak */}
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Score</p>
            <AnimatePresence mode="popLayout">
              <motion.p key={score} initial={{ scale: 1.3, color: "#22c55e" }} animate={{ scale: 1, color: "currentColor" }} transition={{ duration: 0.3 }} className="text-lg font-bold tabular-nums leading-none">
                {formatScore(score)}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted">
            <Flame className={cn("w-4 h-4 transition-colors", streak >= 5 ? "text-orange-400" : "text-muted-foreground")} />
            <span className={cn("font-bold text-sm tabular-nums", streak >= 5 ? getStreakColor(streak) : "text-foreground")}>{streak}</span>
            <span className="text-xs text-muted-foreground">streak</span>
          </div>
        </div>

        {/* Progress + timer (center) */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span><span className="text-green-400 font-bold">{correctCount}</span><span className="text-muted-foreground"> / {totalCount}</span></span>
            </div>
            <TimerBadge />
          </div>
          <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full" initial={{ width: 0 }}
              animate={{ width: totalCount > 0 ? `${(correctCount / totalCount) * 100}%` : "0%" }} transition={{ duration: 0.4, ease: "easeOut" }} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleSfxMute} title={sfxMuted ? "Unmute SFX" : "Mute SFX"} className="text-muted-foreground hover:text-foreground">
            {sfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          {onEndGame && (
            <Button variant="outline" size="sm" onClick={onEndGame} className="gap-1 text-xs">
              <Flag className="w-3.5 h-3.5" />End
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onPause} className="gap-1">
            {isPaused ? <><Play className="w-3.5 h-3.5" />Resume</> : <><Pause className="w-3.5 h-3.5" />Pause</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
