"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, fetchMe, getToken, setToken } from "@/lib/api";
import type { ApiUser } from "@/lib/types";
import type { Role } from "@/lib/roles";

type AuthContextValue = {
  user: ApiUser | null;
  role: Role | null;
  loading: boolean;
  setSession: (token: string, user: ApiUser) => void;
  setUser: (user: ApiUser) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setUser(await fetchMe());
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setSession = useCallback((token: string, nextUser: ApiUser) => {
    setToken(token);
    setUser(nextUser);
  }, []);

  const updateUser = useCallback((nextUser: ApiUser) => {
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/logout", { method: "POST" });
    } catch {
      // Token is cleared locally either way.
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      loading,
      setSession,
      setUser: updateUser,
      logout,
      refresh,
    }),
    [user, loading, setSession, updateUser, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
