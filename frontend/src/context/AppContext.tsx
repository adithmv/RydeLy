import { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'commuter' | 'driver' | 'admin' | null;

interface LoginData {
  uid: string;
  role: Role;
  name?: string;
  driverId?: string;
  isFirstLogin?: boolean;
}

interface AppContextType {
  isLoggedIn: boolean;
  role: Role;
  uid: string | null;
  name: string | null;
  driverId: string | null;
  isFirstLogin: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  isCommuter: boolean;
  login: (data: LoginData) => void;
  setName: (name: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [role, setRole]                 = useState<Role>(null);
  const [uid, setUid]                   = useState<string | null>(null);
  const [name, setNameState]            = useState<string | null>(null);
  const [driverId, setDriverId]         = useState<string | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const login = (data: LoginData) => {
    setIsLoggedIn(true);
    setRole(data.role);
    setUid(data.uid);
    setNameState(data.name || null);
    setDriverId(data.driverId || null);
    setIsFirstLogin(data.isFirstLogin || false);
  };

  const setName = (n: string) => {
    setNameState(n);
    setIsFirstLogin(false);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setRole(null);
    setUid(null);
    setNameState(null);
    setDriverId(null);
    setIsFirstLogin(false);
    fetch('/auth/logout', { method: 'POST' }).catch(() => {});
  };

  return (
    <AppContext.Provider value={{
      isLoggedIn, role, uid, name, driverId, isFirstLogin,
      isAdmin:    role === 'admin',
      isDriver:   role === 'driver',
      isCommuter: role === 'commuter',
      login, setName, logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}