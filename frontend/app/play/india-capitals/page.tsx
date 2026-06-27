"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { IndiaMap } from "@/components/game/india-map";
import { GameHeader } from "@/components/game/game-header";
import { ScoreModal } from "@/components/game/score-modal";
import { Button } from "@/components/ui/button";

import { useGameStore, type TimerMode } from "@/lib/game-store";
import { GameSetup } from "@/components/game/game-setup";
import { gameApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { soundManager } from "@/components/game/sound-manager";
import type { Country } from "@/types";

export default function IndiaCapitalsPage() {
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
    isComplete,
    isPaused,
    score,
    bestStreak,
    guessedCorrectly,
    wrongGuesses,
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
      const session = await gameApi.startSession("INDIA_CAPITALS");
      const enriched: Country[] = session.countries.map((c) => ({
        code: c.code,
        name: c.name,
        flagUrl: c.flagUrl,
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

  const handleStateClick = useCallback(
    async (clickedCode: string) => {
      if (!sessionId || isGuessing || isPaused || isComplete) return;
      const currentCountry = countries[currentCountryIndex];
      if (!currentCountry) return;
      if (guessedCorrectly.has(clickedCode)) return;

      const isCorrect = clickedCode.toLowerCase() === currentCountry.code.toLowerCase();
      const timeTaken = countryStartTime ? Date.now() - countryStartTime : 0;
      setIsGuessing(true);

      try {
        const result = await gameApi.submitGuess(sessionId, {
          countryCode: currentCountry.code,
          isCorrect,
          timeTakenMs: timeTaken,
        });
        submitGuess(clickedCode, result);

        if (isCorrect) {
          soundManager.playCorrect();
        } else {
          soundManager.playWrong();
          markWrongFlash(clickedCode);
          setTimeout(() => clearWrongFlash(clickedCode), 1500);
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
                accuracy: countries.length > 0 ? (guessedCorrectly.size / countries.length) * 100 : 0,
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
        toast.error("Guess submission failed.");
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

  const handleSkip = useCallback(async () => {
    if (!sessionId || isGuessing || isPaused || isComplete) return;
    const currentCountry = countries[currentCountryIndex];
    if (!currentCountry) return;
    setIsGuessing(true);
    soundManager.playWrong();
    try {
      const result = await gameApi.submitGuess(sessionId, { countryCode: currentCountry.code, isCorrect: false, timeTakenMs: countryStartTime ? Date.now() - countryStartTime : 0 });
      submitGuess("__skip__", result);
      setTimeout(async () => {
        if (currentCountryIndex + 1 >= countries.length) {
          try { completeGame(await gameApi.completeSession(sessionId)); } catch { completeGame({ sessionId, score: result.totalScore, accuracy: (guessedCorrectly.size / countries.length) * 100, correctCount: guessedCorrectly.size, totalCount: countries.length, bestStreak: result.currentStreak, timeTaken: 0, newPersonalBest: false }); }
        } else { nextCountry(); soundManager.playBeep(); }
        setIsGuessing(false);
      }, 300);
    } catch { setIsGuessing(false); }
  }, [sessionId, isGuessing, isPaused, isComplete, countries, currentCountryIndex, countryStartTime, guessedCorrectly, submitGuess, nextCountry, completeGame]);

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

  const currentCountry = countries[currentCountryIndex];


  if (!setupDone) {
    return <GameSetup modeName="India — Capitals" onStart={handleSetupStart} />;
  }

  if (isInitializing) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading India Capitals…</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-xl font-semibold">{initError}</p>
        <div className="flex gap-3">
          <Button onClick={() => { setSetupDone(false); resetGame(); }}>Retry</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Small UTs that are hard to click on the map
  const SMALL_UT_CODES = new Set(["in-an", "in-ch", "in-dd", "in-dh", "in-ld", "in-py"]);
  const smallUTs = countries.filter(c => SMALL_UT_CODES.has(c.code.toLowerCase()));

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <GameHeader
        onPause={() => (isPaused ? resumeGame() : pauseGame())}
        onEndGame={handleEndGame}
        onSkip={handleSkip}
        currentCountry={currentCountry ?? undefined}
        promptLabel="Whose capital is"
      />

      <div className="flex-1 relative overflow-hidden bg-[#0d1526]">
        <IndiaMap
          onStateClick={handleStateClick}
          disabled={isGuessing || isPaused || isComplete}
          guessedCorrectly={guessedCorrectly}
          wrongGuesses={wrongGuesses}
          targetCode={currentCountry?.code.toLowerCase()}
        />

        {/* Small territories panel */}
        {!isComplete && smallUTs.length > 0 && (
          <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider px-1">Small territories</span>
            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
              {smallUTs.map((ut) => {
                const code = ut.code.toLowerCase();
                const isCorrect = guessedCorrectly.has(code);
                const isWrong = wrongGuesses.has(code);
                return (
                  <button
                    key={code}
                    disabled={isGuessing || isPaused || isCorrect}
                    onClick={() => handleStateClick(code)}
                    className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                      isCorrect
                        ? "bg-green-700/60 border-green-500 text-green-200 cursor-default"
                        : isWrong
                        ? "bg-red-800/60 border-red-600 text-red-200 animate-pulse"
                        : "bg-background/70 border-border/60 text-foreground hover:bg-muted/80 cursor-pointer"
                    }`}
                  >
                    {ut.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isComplete && (
          <div className="absolute bottom-3 right-3 bg-background/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-muted-foreground pointer-events-none">
            Click state on map • Scroll to zoom
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
              <Button size="lg" onClick={resumeGame}>Resume</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScoreModal
        open={isComplete}
        onPlayAgain={() => { resetGame(); setSetupDone(false); }}
      />
    </div>
  );
}
