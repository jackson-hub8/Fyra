/// file: AuthContext.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Auth context: current user from localStorage, used for API calls and nav.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'fyra_user';

export type User = {
  email: string;
  name: string;
  isMatched?: boolean;
  profileSetupComplete?: boolean;
};

type MatchingDeckPreload = { userEmail: string; deck: string[] };

type AuthContextValue = {
  user: User | null;
  setUser: (u: User | null) => void;
  signOut: () => void;
  /** Fetches /api/matching/deck and caches for consumeMatchingDeckPreloadForEmail. No-op if cache already holds this user. */
  preloadMatchingDeck: (email: string) => Promise<void>;
  /** Returns cached deck for this user and clears cache; null if none. */
  consumeMatchingDeckPreloadForEmail: (email: string) => string[] | null;
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

  const matchingDeckPreloadRef = useRef<MatchingDeckPreload | null>(null);
  const preloadInflightRef = useRef<Map<string, Promise<void>>>(new Map());

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const setUser = useCallback((u: User | null) => {
    setUserState((prev) => {
      if (!u) {
        matchingDeckPreloadRef.current = null;
        preloadInflightRef.current.clear();
      } else if (prev && u.email.toLowerCase() !== prev.email.toLowerCase()) {
        matchingDeckPreloadRef.current = null;
        preloadInflightRef.current.clear();
      }
      return u;
    });
  }, []);

  const signOut = useCallback(() => {
    matchingDeckPreloadRef.current = null;
    preloadInflightRef.current.clear();
    setUserState(null);
  }, []);

  const preloadMatchingDeck = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (matchingDeckPreloadRef.current?.userEmail === normalized) {
      return;
    }
    const existing = preloadInflightRef.current.get(normalized);
    if (existing) {
      await existing;
      return;
    }
    const run = (async () => {
      try {
        const res = await fetch(`/api/matching/deck?email=${encodeURIComponent(normalized)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { deck?: string[] };
        const deck = Array.isArray(data.deck) ? data.deck : [];
        matchingDeckPreloadRef.current = { userEmail: normalized, deck };
      } finally {
        preloadInflightRef.current.delete(normalized);
      }
    })();
    preloadInflightRef.current.set(normalized, run);
    await run;
  }, []);

  const consumeMatchingDeckPreloadForEmail = useCallback((email: string): string[] | null => {
    const normalized = email.trim().toLowerCase();
    const p = matchingDeckPreloadRef.current;
    if (p?.userEmail === normalized) {
      matchingDeckPreloadRef.current = null;
      return p.deck;
    }
    return null;
  }, []);

  useEffect(() => {
    if (!user?.email || user.isMatched || !user.profileSetupComplete) {
      return;
    }
    void preloadMatchingDeck(user.email);
  }, [user?.email, user?.isMatched, user?.profileSetupComplete, preloadMatchingDeck]);

  return (
    <AuthContext.Provider
      value={{ user, setUser, signOut, preloadMatchingDeck, consumeMatchingDeckPreloadForEmail }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
