import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const [callCount, setCallCount] = useState(0);
  const [selectedTown, setSelectedTown] = useState("");
  const [selectedStand, setSelectedStand] = useState("");

  // Reset call count every hour
  useEffect(() => {
    const interval = setInterval(() => setCallCount(0), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // login(true)  → driver login
  // login(false) → commuter login (default)
  const login = (driver = false) => {
    setIsLoggedIn(true);
    setIsAdmin(false);
    setIsDriver(driver);
  };

  const loginAsAdmin = () => {
    setIsLoggedIn(true);
    setIsAdmin(true);
    setIsDriver(false);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsDriver(false);
    setCallCount(0);
    setSelectedTown("");
    setSelectedStand("");
  };

  // Returns true if call allowed, false if rate limit hit
  const incrementCallCount = (): boolean => {
    if (callCount >= 5) return false;
    setCallCount((c) => c + 1);
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        isAdmin,
        isDriver,
        callCount,
        selectedTown,
        selectedStand,
        login,
        logout,
        loginAsAdmin,
        incrementCallCount,
        setSelectedTown,
        setSelectedStand,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}