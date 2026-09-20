import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppContext } from "./app-state";
import { getIdentity, type Identity } from "@/lib/live";
import { request } from "@/lib/http";
export function AppProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient();
  const [user, setUser] = useState<Identity | null>(null),
    [authLoading, setAuthLoading] = useState(true);
  const [callCount, setCallCount] = useState(0),
    [selectedTown, setSelectedTown] = useState(""),
    [selectedStand, setSelectedStand] = useState("");
  const refreshSession = useCallback(async () => {
    try {
      const identity = await getIdentity();
      setUser(identity);
      return identity;
    } catch {
      setUser(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);
  useEffect(() => {
    void refreshSession();
    const expired = () => {
      setUser(null);
      cache.clear();
    };
    window.addEventListener("rydely:session-expired", expired);
    return () => window.removeEventListener("rydely:session-expired", expired);
  }, [refreshSession, cache]);
  const login = async () => {
    await refreshSession();
  };
  const logout = async () => {
    await request("/auth/logout", { method: "POST" });
    setUser(null);
    cache.clear();
    setCallCount(0);
  };
  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        isLoggedIn: !!user,
        isAdmin: user?.role === "admin",
        isDriver: user?.role === "driver",
        login,
        loginAsAdmin: login,
        logout,
        refreshSession,
        callCount,
        selectedTown,
        selectedStand,
        setSelectedTown,
        setSelectedStand,
        incrementCallCount: () => {
          if (callCount >= 5) return false;
          setCallCount((c) => c + 1);
          return true;
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
