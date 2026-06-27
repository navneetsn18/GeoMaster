export interface User {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
  avatarUrl?: string;
  role?: "USER" | "ADMIN";
}

export interface Country {
  code: string; // ISO 3166-1 alpha-2 lowercase (e.g. "us")
  numericCode?: string; // ISO 3166-1 numeric (e.g. "840") for topojson
  name: string;
  flagUrl: string;
  continent?: string;
}

export interface GameSession {
  sessionId: string;
  mapType: MapType;
  regionCode?: string;
  countries: Country[];
  startedAt?: string;
  totalCountries: number;
}

export type MapType =
  | "WORLD"
  | "AFRICA"
  | "ASIA"
  | "EUROPE"
  | "AMERICAS"
  | "OCEANIA"
  | "INDIA_STATES"
  | "WORLD_CAPITALS"
  | "INDIA_CAPITALS";

export interface GuessPayload {
  countryCode: string; // alpha-2
  isCorrect: boolean;
  timeTakenMs: number;
}

export interface GuessResult {
  correct: boolean;
  points: number;
  streakBonus: number;
  totalScore: number;
  currentStreak: number;
}

export interface SessionCompleteResult {
  sessionId: string;
  score: number;
  accuracy: number;
  correctCount: number;
  totalCount: number;
  bestStreak: number;
  timeTaken: number; // total seconds
  newPersonalBest: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  accuracy: number; // 0–100
  date: string;
  mapType?: MapType;
  avatarUrl?: string;
}

export interface UserStats {
  totalGames: number;
  avgAccuracy: number;
  bestScore: number;
  bestStreak: number;
  gamesThisWeek?: number;
  favoriteMode?: MapType;
}

export interface GameModeStats {
  mapType: MapType;
  gamesPlayed: number;
  bestScore: number;
  avgAccuracy: number;
  bestStreak: number;
}

export interface RecentGame {
  sessionId: string;
  mapType: MapType;
  score: number;
  accuracy: number;
  correctCount: number;
  totalCount: number;
  playedAt: string;
}

export interface Following {
  id: string;
  username: string;
  avatarUrl?: string;
  totalGames?: number;
  bestScore?: number;
  avgAccuracy?: number;
  bestStreak?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type LeaderboardPeriod = "ALL_TIME" | "THIS_WEEK" | "TODAY" | "FRIENDS";

export interface GameMode {
  id: MapType;
  label: string;
  emoji: string;
  description: string;
  totalCountries: number;
  href?: string; // custom route override
}

export const GAME_MODES: GameMode[] = [
  {
    id: "WORLD",
    label: "World",
    emoji: "🌍",
    description: "All 195 countries",
    totalCountries: 195,
  },
  {
    id: "AFRICA",
    label: "Africa",
    emoji: "🌍",
    description: "54 countries",
    totalCountries: 54,
  },
  {
    id: "ASIA",
    label: "Asia",
    emoji: "🌏",
    description: "48 countries",
    totalCountries: 48,
  },
  {
    id: "EUROPE",
    label: "Europe",
    emoji: "🌍",
    description: "44 countries",
    totalCountries: 44,
  },
  {
    id: "AMERICAS",
    label: "Americas",
    emoji: "🌎",
    description: "35 countries",
    totalCountries: 35,
  },
  {
    id: "OCEANIA",
    label: "Oceania",
    emoji: "🌏",
    description: "14 countries",
    totalCountries: 14,
  },
  {
    id: "INDIA_STATES",
    label: "India States",
    emoji: "🇮🇳",
    description: "28 states + 8 UTs",
    totalCountries: 36,
    href: "/play/india",
  },
  {
    id: "WORLD_CAPITALS",
    label: "World Capitals",
    emoji: "🏛️",
    description: "Capital cities of 195 countries",
    totalCountries: 195,
    href: "/play/world-capitals",
  },
  {
    id: "INDIA_CAPITALS",
    label: "India Capitals",
    emoji: "🇮🇳",
    description: "Capitals of 36 states & UTs",
    totalCountries: 36,
    href: "/play/india-capitals",
  },
];
