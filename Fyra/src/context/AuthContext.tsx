/// file: AuthContext.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Auth context: current user from localStorage, used for API calls and nav.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'fyra_user';

export type User = {
  email: string;
  name: string;
  isMatched?: boolean;
  profileSetupComplete?: boolean;
};

type AuthContextValue = {
  user: User | null;
  setUser: (u: User | null) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? (JSON.parse(s) as User) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
  }, []);

  const signOut = useCallback(() => {
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
