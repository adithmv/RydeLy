import { createContext, useContext } from "react";
import type { Identity } from "@/lib/live";
interface AppContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  authLoading: boolean;
  user: Identity | null;
  callCount: number;
  selectedTown: string;
  selectedStand: string;
  login: (driver?: boolean) => Promise<void>;
  loginAsAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<Identity | null>;
  incrementCallCount: () => boolean;
  setSelectedTown: (town: string) => void;
  setSelectedStand: (stand: string) => void;
}
export const AppContext = createContext<AppContextType | null>(null);
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
