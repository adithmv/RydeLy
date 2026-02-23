//@refresh reset
import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface AppState {
  isLoggedIn: boolean;
  isAdmin: boolean;
  callCount: number;
  selectedTown: string;
  selectedStand: string;
}

interface AppContextType extends AppState {
  login: () => void;
  logout: () => void;
  loginAsAdmin: () => void;
  incrementCallCount: () => boolean;
  setSelectedTown: (town: string) => void;
  setSelectedStand: (stand: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    isLoggedIn: false,
    isAdmin: false,
    callCount: 0,
    selectedTown: '',
    selectedStand: '',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setState(s => ({ ...s, callCount: 0 }));
    }, 3600000);
    return () => clearInterval(interval);
  }, []);

  const login = useCallback(() => setState(s => ({ ...s, isLoggedIn: true, isAdmin: false })), []);
  const logout = useCallback(() => setState(s => ({ ...s, isLoggedIn: false, isAdmin: false })), []);
  const loginAsAdmin = useCallback(() => setState(s => ({ ...s, isLoggedIn: true, isAdmin: true })), []);

  const incrementCallCount = useCallback(() => {
    if (state.callCount >= 5) return false;
    setState(s => ({ ...s, callCount: s.callCount + 1 }));
    return true;
  }, [state.callCount]);

  const setSelectedTown = useCallback((town: string) => setState(s => ({ ...s, selectedTown: town, selectedStand: '' })), []);
  const setSelectedStand = useCallback((stand: string) => setState(s => ({ ...s, selectedStand: stand })), []);

  return (
    <AppContext.Provider value={{ ...state, login, logout, loginAsAdmin, incrementCallCount, setSelectedTown, setSelectedStand }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}