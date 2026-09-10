import { createContext, useContext } from "react";
interface AppContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  callCount: number;
  selectedTown: string;
  selectedStand: string;
  login: (driver?: boolean) => void;
  logout: () => void;
  loginAsAdmin: () => void;
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
