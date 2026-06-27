"use client";

import { useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";
import {
  getToken,
  storeToken,
  storeUser,
  getStoredUser,
  removeToken,
} from "@/lib/auth";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  refetch: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Optimistically show stored user first
    const cached = getStoredUser();
    if (cached) setUser(cached);

    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      storeUser(freshUser);
    } catch {
      // Token invalid — clear it
      removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const login = async (email: string, password: string) => {
    const { token, user: authUser } = await authApi.login(email, password);
    storeToken(token);
    storeUser(authUser);
    setUser(authUser);
  };

  const signup = async (
    username: string,
    email: string,
    password: string
  ) => {
    const { token, user: authUser } = await authApi.signup(
      username,
      email,
      password
    );
    storeToken(token);
    storeUser(authUser);
    setUser(authUser);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refetch,
  };
}
