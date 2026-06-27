"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Image from "next/image";
import { Flame, Target, Volume2, VolumeX, Flag, Volume1 } from "lucide-react";
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
  promptLabel?: string;
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

  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const spokenCodeRef = useRef<string | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Pick best available TTS voice — avoid robotic Microsoft voices
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find(v => v.name === "Samantha") ||
        voices.find(v => v.name === "Karen") ||
        voices.find(v => v.name === "Daniel") ||
        voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) ||
        voices.find(v => v.lang === "en-US" && !v.name.includes("Microsoft")) ||
        voices.find(v => v.lang.startsWith("en-") && !v.name.includes("Microsoft")) ||
        voices.find(v => v.lang.startsWith("en")) ||
        null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
  }, []);

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
    if (voiceRef.current) utt.voice = voiceRef.current;
    utt.rate = 0.9;
    utt.pitch = 1.05;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);

  useEffect(() => {
    if (!currentCountry || isPaused || isComplete) return;
    if (spokenCodeRef.current === currentCountry.code) return;
    spokenCodeRef.current = currentCountry.code;
    if (ttsEnabled) speak(currentCountry.name);
  }, [currentCountry?.code, isPaused, isComplete, ttsEnabled, speak]);

  const handleTtsToggle = () => {
    if (isSpeaking) window.speechSynthesis?.cancel();
    setTtsEnabled(v => !v);
  };

  const correctCount = guessedCorrectly.size;
  const totalCount = countries.length;
  const timeWarning = timeRemainingSeconds !== null && timeRemainingSeconds <= 60 && timeRemainingSeconds > 0;

  const TimerDisplay = ({ small = false }: { small?: boolean }) => (
    timeRemainingSeconds === null ? (
      <div className={cn("px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono", small ? "text-xs" : "text-sm font-medium")}>∞</div>
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

      {/* ── PROMPT ROW ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {currentCountry && !isComplete && (
          <motion.div
            key={currentCountry.code}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center border-b border-border/30 px-3 sm:px-4 py-2"
          >
            {/* Left: timer — same width as right side for true centering */}
            <div className="w-20 sm:w-24 shrink-0 flex items-center">
              <TimerDisplay small />
            </div>

            {/* Center: label + count above, flag + name below */}
            <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-semibold leading-none">
                  {promptLabel}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground/60 font-medium leading-none">
                  {correctCount + 1}/{totalCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {currentCountry.flagUrl && (
                  <div className="relative w-7 h-5 sm:w-8 sm:h-6 rounded overflow-hidden border border-border/40 shrink-0">
                    <Image src={currentCountry.flagUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                )}
                <span className="text-base sm:text-2xl font-extrabold tracking-tight truncate max-w-[200px] sm:max-w-sm">
                  {currentCountry.name}
                </span>
              </div>
            </div>

            {/* Right: TTS controls — same width as timer side */}
            <div className="w-20 sm:w-24 shrink-0 flex items-center justify-end gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className={cn("w-7 h-7", isSpeaking ? "text-cyan-400" : "text-muted-foreground hover:text-foreground")}
                onClick={() => currentCountry && speak(currentCountry.name)}
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

      {/* ── MOBILE controls row ─────────────────────────────────────────────── */}
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
            {onEndGame && (
              <Button variant="ghost" size="icon" onClick={onEndGame} className="w-7 h-7 text-red-400">
                <Flag className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
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

      {/* ── DESKTOP controls row ─────────────────────────────────────────────── */}
      <div className="hidden sm:flex items-center justify-between px-4 py-1.5 gap-2">
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

        {/* Progress (center) */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span><span className="text-green-400 font-bold">{correctCount}</span><span className="text-muted-foreground"> / {totalCount}</span></span>
          </div>
          <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full" initial={{ width: 0 }}
              animate={{ width: totalCount > 0 ? `${(correctCount / totalCount) * 100}%` : "0%" }} transition={{ duration: 0.4, ease: "easeOut" }} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onEndGame && (
            <Button variant="outline" size="sm" onClick={onEndGame} className="gap-1 text-xs">
              <Flag className="w-3.5 h-3.5" />End
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
