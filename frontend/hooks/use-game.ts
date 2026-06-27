"use client";

import { useState, useCallback } from "react";
import { gameApi } from "@/lib/api";
import { useGameStore } from "@/lib/game-store";
import { soundManager } from "@/components/game/sound-manager";
import type { MapType, GuessPayload } from "@/types";
import { toast } from "sonner";

interface UseGameReturn {
  isLoading: boolean;
  error: string | null;
  startGame: (mapType: MapType, regionCode?: string) => Promise<void>;
  handleGuess: (targetCode: string, clickedCode: string) => Promise<void>;
}

export function useGame(): UseGameReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    sessionId,
    countries,
    currentCountryIndex,
    countryStartTime,
    startGame: storeStartGame,
    submitGuess: storeSubmitGuess,
    markWrongFlash,
    clearWrongFlash,
    nextCountry,
    completeGame,
  } = useGameStore();

  const startGame = useCallback(
    async (mapType: MapType, regionCode?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const session = await gameApi.startSession(mapType, regionCode);
        storeStartGame(session);
        soundManager.init();
      } catch (err) {
        const msg = "Failed to start game session. Is the backend running?";
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [storeStartGame]
  );

  const handleGuess = useCallback(
    async (targetCode: string, clickedCode: string) => {
      if (!sessionId) return;

      const timeTaken = countryStartTime ? Date.now() - countryStartTime : 0;
      const isCorrect =
        clickedCode.toLowerCase() === targetCode.toLowerCase();

      const payload: GuessPayload = {
        countryCode: targetCode,
        isCorrect,
        timeTakenMs: timeTaken,
      };

      try {
        const result = await gameApi.submitGuess(sessionId, payload);
        storeSubmitGuess(clickedCode, result);

        if (isCorrect) {
          soundManager.playCorrect();
        } else {
          soundManager.playWrong();
          markWrongFlash(clickedCode);
          setTimeout(() => clearWrongFlash(clickedCode), 1500);
        }

        // Advance after short delay
        setTimeout(async () => {
          const isLast = currentCountryIndex + 1 >= countries.length;
          if (isLast) {
            try {
              const finalResult = await gameApi.completeSession(sessionId);
              completeGame(finalResult);
            } catch {
              toast.error("Failed to save session result.");
            }
          } else {
            nextCountry();
            soundManager.playBeep();
          }
        }, 800);
      } catch {
        toast.error("Guess submission failed. Check your connection.");
      }
    },
    [
      sessionId,
      countryStartTime,
      currentCountryIndex,
      countries.length,
      storeSubmitGuess,
      markWrongFlash,
      clearWrongFlash,
      nextCountry,
      completeGame,
    ]
  );

  return { isLoading, error, startGame, handleGuess };
}
