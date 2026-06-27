import axios, { type AxiosInstance, type AxiosError } from "axios";
import { getToken, removeToken } from "./auth";
import type {
  AuthResponse,
  User,
  GameSession,
  GuessPayload,
  GuessResult,
  SessionCompleteResult,
  LeaderboardEntry,
  LeaderboardPeriod,
  MapType,
  UserStats,
  GameModeStats,
  RecentGame,
  Following,
} from "@/types";

// ─── Axios instance ────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  },

  signup: async (
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/register", {
      username,
      email,
      password,
    });
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },
};

// ─── Game ──────────────────────────────────────────────────────────────────────

export const gameApi = {
  startSession: async (
    mapType: MapType,
    regionCode?: string
  ): Promise<GameSession> => {
    const { data } = await api.post<GameSession>("/game/session/start", {
      mapType,
      regionCode,
    });
    return data;
  },

  submitGuess: async (
    sessionId: string,
    payload: GuessPayload
  ): Promise<GuessResult> => {
    const { data } = await api.post<GuessResult>(
      `/game/session/${sessionId}/guess`,
      payload
    );
    return data;
  },

  completeSession: async (
    sessionId: string
  ): Promise<SessionCompleteResult> => {
    const { data } = await api.post<SessionCompleteResult>(
      `/game/session/${sessionId}/complete`
    );
    return data;
  },
};

// ─── Leaderboard ───────────────────────────────────────────────────────────────

export const leaderboardApi = {
  getGlobal: async (
    period: LeaderboardPeriod,
    mapType?: MapType,
    limit = 50
  ): Promise<LeaderboardEntry[]> => {
    const { data } = await api.get<LeaderboardEntry[]>("/leaderboard", {
      params: { period, mapType, limit },
    });
    return data;
  },

  getFollowing: async (mapType?: MapType): Promise<LeaderboardEntry[]> => {
    const { data } = await api.get<LeaderboardEntry[]>(
      "/leaderboard/following",
      { params: { mapType } }
    );
    return data;
  },

  getByMode: async (mapType: MapType): Promise<LeaderboardEntry[]> => {
    const { data } = await api.get<LeaderboardEntry[]>(
      `/leaderboard/mode/${mapType}`
    );
    return data;
  },
};

// ─── User ──────────────────────────────────────────────────────────────────────

export const userApi = {
  // Returns profile + stats + avatarUrl
  getProfile: async (): Promise<User & { stats: UserStats; avatarUrl?: string }> => {
    const { data } = await api.get<User & { stats: UserStats; avatarUrl?: string }>("/user/profile");
    return data;
  },

  // Alias — profile endpoint includes stats
  getStats: async (): Promise<UserStats> => {
    const { data } = await api.get<{ stats: UserStats }>("/user/profile");
    return data.stats;
  },

  getModeStats: async (): Promise<GameModeStats[]> => {
    // ponytail: no mode-stats backend endpoint yet — return empty
    return [];
  },

  getHistory: async (limit = 10): Promise<RecentGame[]> => {
    const { data } = await api.get<{ content: RecentGame[] }>("/user/history", {
      params: { size: limit },
    });
    return data.content ?? [];
  },

  getFollowing: async (): Promise<Following[]> => {
    const { data } = await api.get<Following[]>("/user/following");
    return data;
  },

  follow: async (username: string): Promise<void> => {
    await api.post("/user/following", { username });
  },

  unfollow: async (username: string): Promise<void> => {
    await api.delete(`/user/following/${encodeURIComponent(username)}`);
  },

  getAdminContacts: async (): Promise<import("@/types").AdminContact[]> => {
    const { data } = await api.get<import("@/types").AdminContact[]>("/user/admin-contacts");
    return data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const form = new FormData();
    form.append("file", file);
    // Use axios directly (not the shared instance) so the default
    // Content-Type: application/json is not applied — browser sets the
    // correct multipart/form-data boundary automatically.
    const { default: axios } = await import("axios");
    const token = getToken();
    const base = (api.defaults.baseURL ?? "http://localhost:8080/api").replace(/\/$/, "");
    const { data } = await axios.post<{ avatarUrl: string }>(
      `${base}/user/avatar`,
      form,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  },
};

// ─── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalGames: number;
  completedGames: number;
  activeSessions: number;
  totalHoursPlayed: number;
  bannedUsers: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  gamesPlayed: number;
  avatarUrl?: string;
  banned: boolean;
  banReason?: string;
  bannedAt?: string;
  bestScore?: number;
  avgAccuracy?: number;
  bestStreak?: number;
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>("/admin/stats");
    return data;
  },
  getUsers: async (): Promise<AdminUser[]> => {
    const { data } = await api.get<AdminUser[]>("/admin/users");
    return data;
  },
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },
  deleteSession: async (id: string): Promise<void> => {
    await api.delete(`/admin/sessions/${id}`);
  },
  deleteUserSessions: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}/sessions`);
  },
  banUser: async (id: string, reason: string): Promise<AdminUser> => {
    const { data } = await api.post<AdminUser>(`/admin/users/${id}/ban`, { reason });
    return data;
  },
  unbanUser: async (id: string): Promise<void> => {
    await api.post(`/admin/users/${id}/unban`);
  },
  setRole: async (id: string, role: "USER" | "ADMIN"): Promise<void> => {
    await api.patch(`/admin/users/${id}/role`, { role });
  },
};

export const updateProfile = async (body: { username?: string; email?: string }) => {
  const { data } = await api.patch("/user/profile", body);
  return data;
};

export default api;
