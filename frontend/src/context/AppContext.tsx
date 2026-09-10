import { AppContext } from "./app-state";
import { useState, useEffect, ReactNode } from "react";

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
