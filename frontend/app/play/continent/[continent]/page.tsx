"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { WorldMap } from "@/components/game/world-map";
import { GameHeader } from "@/components/game/game-header";
import { ScoreModal } from "@/components/game/score-modal";
import { SkipButton } from "@/components/game/skip-button";
import { Button } from "@/components/ui/button";

import { useGameStore, type TimerMode } from "@/lib/game-store";
import { GameSetup } from "@/components/game/game-setup";
import { gameApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { soundManager } from "@/components/game/sound-manager";
import { getFlagUrl } from "@/lib/utils";
import type { Country, MapType } from "@/types";

const CONTINENT_MAP: Record<string, MapType> = {
  africa: "AFRICA",
  asia: "ASIA",
  europe: "EUROPE",
  americas: "AMERICAS",
  oceania: "OCEANIA",
};

export default function ContinentGamePage() {
  const { continent } = useParams<{ continent: string }>();
  const router = useRouter();
  const mapType = CONTINENT_MAP[continent?.toLowerCase() ?? ""] ?? "WORLD";

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
    setSetupDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continent]);

  const handleSetupStart = async (timerMode: TimerMode) => {
    setSetupDone(true);
    setIsInitializing(true);
    setInitError(null);
    try {
      const session = await gameApi.startSession(mapType);
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

  const initSession = () => { setSetupDone(false); resetGame(); };

  const handleCountryClick = useCallback(
    async (clickedAlpha2: string) => {
      if (!sessionId || isGuessing || isPaused || isComplete) return;
      const currentCountry = countries[currentCountryIndex];
      if (!currentCountry) return;
      if (guessedCorrectly.has(clickedAlpha2)) return;

      const isCorrect =
        clickedAlpha2.toLowerCase() === currentCountry.code.toLowerCase();
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

  if (!setupDone) {
    const label = continent ? continent.charAt(0).toUpperCase() + continent.slice(1) : "Continent";
    return <GameSetup modeName={`${label} — Countries`} onStart={handleSetupStart} />;
  }

  if (isInitializing) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading {continent} game…</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">{initError}</p>
        <div className="flex gap-3">
          <Button onClick={initSession}>Retry</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentCountry = countries[currentCountryIndex];

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <GameHeader
        onPause={() => (isPaused ? resumeGame() : pauseGame())}
        currentCountry={currentCountry ?? undefined}
        onEndGame={async () => {
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
        }}
      />

      {/* Map — fills all remaining height */}
      <div className="flex-1 relative overflow-hidden bg-[#0d1526]">
        <WorldMap
          onCountryClick={handleCountryClick}
          disabled={isGuessing || isPaused || isComplete}
          filterCodes={new Set(countries.map((c) => c.code.toLowerCase()))}
        />
        <SkipButton onSkip={handleSkip} disabled={isGuessing || isPaused || isComplete} />

        {!isComplete && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-muted-foreground pointer-events-none">
            Click the country on the map • Scroll to zoom
          </div>
        )}

        {/* Guess processing indicator */}
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

        {/* Pause overlay */}
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
