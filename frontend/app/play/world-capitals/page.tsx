"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { WorldMap } from "@/components/game/world-map";
import { GameHeader } from "@/components/game/game-header";
import { CountryPrompt } from "@/components/game/country-prompt";
import { ScoreModal } from "@/components/game/score-modal";
import { Button } from "@/components/ui/button";

import { useGameStore, type TimerMode } from "@/lib/game-store";
import { GameSetup } from "@/components/game/game-setup";
import { gameApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { soundManager } from "@/components/game/sound-manager";
import { getFlagUrl } from "@/lib/utils";
import type { Country } from "@/types";

export default function WorldCapitalsPage() {
  const router = useRouter();
  const [setupDone, setSetupDone] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isGuessing, setIsGuessing] = useState(false);

  const {
    sessionId,
    countries,
    currentCountryIndex,
    countryStartTime,
    isStarted,
    isPaused,
    isComplete,
    score,
    bestStreak,
    guessedCorrectly,
    startGame,
    submitGuess,
    markWrongFlash,
    clearWrongFlash,
    nextCountry,
    completeGame,
    pauseGame,
    resumeGame,
    resetGame,
  } = useGameStore();

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    soundManager.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetupStart = async (timerMode: TimerMode) => {
    setSetupDone(true);
    setIsInitializing(true);
    setInitError(null);
    try {
      const session = await gameApi.startSession("WORLD_CAPITALS");
      const enriched: Country[] = session.countries.map((c) => ({
        ...c,
        flagUrl: c.flagUrl || getFlagUrl(c.code),
      }));
      startGame({ ...session, countries: enriched }, timerMode);
      setTimeout(() => soundManager.playBeep(), 300);
    } catch {
      const msg = "Could not start game session.";
      setInitError(msg);
      toast.error(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCountryClick = useCallback(
    async (clickedAlpha2: string) => {
      if (!sessionId || isGuessing || isPaused || isComplete) return;
      const currentCountry = countries[currentCountryIndex];
      if (!currentCountry) return;
      if (guessedCorrectly.has(clickedAlpha2)) return;

      const isCorrect = clickedAlpha2.toLowerCase() === currentCountry.code.toLowerCase();
      const timeTaken = countryStartTime ? Date.now() - countryStartTime : 0;
      setIsGuessing(true);

      try {
        const result = await gameApi.submitGuess(sessionId, {
          countryCode: currentCountry.code,
          isCorrect,
          timeTakenMs: timeTaken,
        });
        submitGuess(clickedAlpha2, result);

        if (isCorrect) {
          soundManager.playCorrect();
        } else {
          soundManager.playWrong();
          markWrongFlash(clickedAlpha2);
          setTimeout(() => clearWrongFlash(clickedAlpha2), 1500);
        }

        setTimeout(async () => {
          const isLast = currentCountryIndex + 1 >= countries.length;
          if (isLast) {
            try {
              const finalResult = await gameApi.completeSession(sessionId);
              completeGame(finalResult);
            } catch {
              completeGame({
                sessionId,
                score: result.totalScore,
                accuracy: (guessedCorrectly.size / countries.length) * 100,
                correctCount: guessedCorrectly.size,
                totalCount: countries.length,
                bestStreak: result.currentStreak,
                timeTaken: 0,
                newPersonalBest: false,
              });
            }
          } else {
            nextCountry();
            soundManager.playBeep();
          }
          setIsGuessing(false);
        }, 800);
      } catch {
        toast.error("Could not submit guess — check your connection.");
        setIsGuessing(false);
      }
    },
    [
      sessionId, isGuessing, isPaused, isComplete,
      countries, currentCountryIndex, countryStartTime,
      guessedCorrectly, submitGuess, markWrongFlash,
      clearWrongFlash, nextCountry, completeGame,
    ]
  );

  const handleEndGame = async () => {
    if (!sessionId || isComplete) return;
    try {
      const finalResult = await gameApi.completeSession(sessionId);
      completeGame(finalResult);
    } catch {
      completeGame({
        sessionId: sessionId ?? "",
        score,
        accuracy: countries.length > 0 ? (guessedCorrectly.size / countries.length) * 100 : 0,
        correctCount: guessedCorrectly.size,
        totalCount: countries.length,
        bestStreak,
        timeTaken: 0,
        newPersonalBest: false,
      });
    }
  };

  if (!setupDone) {
    return <GameSetup modeName="World — Capitals" onStart={handleSetupStart} />;
  }

  if (isInitializing) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading World Capitals…</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to start game</h2>
        <div className="flex gap-3">
          <Button onClick={() => { setSetupDone(false); resetGame(); }}>Try Again</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentCountry = countries[currentCountryIndex];
  const totalRemaining = countries.length - currentCountryIndex;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <GameHeader onPause={() => (isPaused ? resumeGame() : pauseGame())} onEndGame={handleEndGame} />

      <div className="flex-1 relative overflow-hidden bg-[#0d1526]">
        <WorldMap
          onCountryClick={handleCountryClick}
          disabled={isGuessing || isPaused || isComplete}
        />

        <AnimatePresence>
          {currentCountry && !isComplete && (
            <motion.div
              key="prompt-overlay"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
            >
              <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl px-6 py-3">
                <CountryPrompt
                  country={currentCountry}
                  totalRemaining={totalRemaining}
                  totalCountries={countries.length}
                  promptLabel="Whose capital is:"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isStarted && !isComplete && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-muted-foreground pointer-events-none">
            Click the country on the map • Scroll to zoom
          </div>
        )}

        <AnimatePresence>
          {isGuessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
            >
              <div className="bg-background/90 backdrop-blur-sm border border-primary/40 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">Checking…</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center gap-4"
            >
              <h2 className="text-3xl font-bold">Paused</h2>
              <Button size="lg" onClick={resumeGame}>Resume Game</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScoreModal open={isComplete} onPlayAgain={() => { resetGame(); setSetupDone(false); }} />
    </div>
  );
}
