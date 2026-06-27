import { create } from "zustand";
import type { Country, GameSession, GuessResult, SessionCompleteResult, MapType } from "@/types";

export type TimerMode = "rapid" | "mid" | "advanced" | "none";

export interface TimerOption {
  mode: TimerMode;
  label: string;
  durationSeconds: number | null; // null = no timer
  description: string;
  scoreMultiplier: number;
  color: string;
}

export const TIMER_OPTIONS: TimerOption[] = [
  {
    mode: "rapid",
    label: "Rapid",
    durationSeconds: 10 * 60,
    description: "10 minutes",
    scoreMultiplier: 1.5,
    color: "text-red-400",
  },
  {
    mode: "mid",
    label: "Standard",
    durationSeconds: 20 * 60,
    description: "20 minutes",
    scoreMultiplier: 1.0,
    color: "text-yellow-400",
  },
  {
    mode: "advanced",
    label: "Relaxed",
    durationSeconds: 30 * 60,
    description: "30 minutes",
    scoreMultiplier: 0.7,
    color: "text-green-400",
  },
  {
    mode: "none",
    label: "No Timer",
    durationSeconds: null,
    description: "Untimed",
    scoreMultiplier: 0.5,
    color: "text-blue-400",
  },
];

export interface GameState {
  sessionId: string | null;
  mapType: MapType | null;
  countries: Country[];

  currentCountryIndex: number;
  score: number;
  streak: number;
  bestStreak: number;
  guessedCorrectly: Set<string>;
  wrongGuesses: Set<string>;
  allAttempted: Set<string>;

  isStarted: boolean;
  isPaused: boolean;
  isComplete: boolean;
  sessionResult: SessionCompleteResult | null;

  countryStartTime: number | null;
  sessionStartTime: number | null;
  timeRemainingSeconds: number | null; // null = no timer
  timerMode: TimerMode;
}

export interface GameActions {
  startGame: (session: GameSession, timerMode?: TimerMode) => void;
  submitGuess: (clickedCode: string, result: GuessResult) => void;
  markWrongFlash: (code: string) => void;
  clearWrongFlash: (code: string) => void;
  nextCountry: () => void;
  completeGame: (result: SessionCompleteResult) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  tickTimer: () => void;
}

const initialState: GameState = {
  sessionId: null,
  mapType: null,
  countries: [],
  currentCountryIndex: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  guessedCorrectly: new Set(),
  wrongGuesses: new Set(),
  allAttempted: new Set(),
  isStarted: false,
  isPaused: false,
  isComplete: false,
  sessionResult: null,
  countryStartTime: null,
  sessionStartTime: null,
  timeRemainingSeconds: null,
  timerMode: "mid",
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  startGame: (session: GameSession, timerMode: TimerMode = "mid") => {
    const opt = TIMER_OPTIONS.find((o) => o.mode === timerMode)!;
    const now = Date.now();
    set({
      sessionId: session.sessionId,
      mapType: session.mapType,
      countries: session.countries,
      currentCountryIndex: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      guessedCorrectly: new Set(),
      wrongGuesses: new Set(),
      allAttempted: new Set(),
      isStarted: true,
      isPaused: false,
      isComplete: false,
      sessionResult: null,
      countryStartTime: now,
      sessionStartTime: now,
      timeRemainingSeconds: opt.durationSeconds,
      timerMode,
    });
  },

  tickTimer: () => {
    const { timeRemainingSeconds, isPaused, isComplete } = get();
    if (isPaused || isComplete || timeRemainingSeconds === null) return;
    set({ timeRemainingSeconds: Math.max(0, timeRemainingSeconds - 1) });
  },

  submitGuess: (clickedCode: string, result: GuessResult) => {
    const { guessedCorrectly, allAttempted } = get();
    const newCorrect = new Set(guessedCorrectly);
    const newAttempted = new Set(allAttempted);
    newAttempted.add(clickedCode);
    if (result.correct) newCorrect.add(clickedCode);
    set({
      score: result.totalScore,
      streak: result.currentStreak,
      bestStreak: Math.max(get().bestStreak, result.currentStreak),
      guessedCorrectly: newCorrect,
      allAttempted: newAttempted,
      countryStartTime: Date.now(),
    });
  },

  markWrongFlash: (code: string) => {
    const current = new Set(get().wrongGuesses);
    current.add(code);
    set({ wrongGuesses: current });
  },

  clearWrongFlash: (code: string) => {
    const current = new Set(get().wrongGuesses);
    current.delete(code);
    set({ wrongGuesses: current });
  },

  nextCountry: () => {
    const { currentCountryIndex, countries } = get();
    const next = currentCountryIndex + 1;
    if (next < countries.length) {
      set({ currentCountryIndex: next, countryStartTime: Date.now() });
    }
  },

  completeGame: (result: SessionCompleteResult) => {
    set({ isComplete: true, sessionResult: result });
  },

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  resetGame: () =>
    set({
      ...initialState,
      guessedCorrectly: new Set(),
      wrongGuesses: new Set(),
      allAttempted: new Set(),
    }),
}));
