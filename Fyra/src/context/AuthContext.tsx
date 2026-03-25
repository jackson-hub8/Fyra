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
  /** Set when logging in as admin; use adminToken for admin API Authorization header. */
  isAdmin?: boolean;
  adminToken?: string;
};

type MatchingDeckPreload = { userEmail: string; deck: string[] };

/** Matches ProfileCard + /api/profiles responses; cached so Matching stack can render without per-card loaders. */
export type ProfileCardCacheEntry = {
  profile: {
    userEmail: string;
    name?: string;
    bio: string | null;
    profilePicture: string | null;
    topInterests: string | null;
    dailyLife: string | null;
  };
  petPeeves: { id: number; petPeeve: string }[];
};

type AuthContextValue = {
  user: User | null;
  setUser: (u: User | null) => void;
  signOut: () => void;
  /** Fetches /api/matching/deck and caches for the matching page. No-op if cache already holds this user. */
  preloadMatchingDeck: (email: string) => Promise<void>;
  /** Read cached deck without clearing (e.g. before deferring consume for Strict Mode / layout). */
  peekMatchingDeckPreloadForEmail: (email: string) => string[] | null;
  /** Clears cached deck after it has been applied to the UI. */
  consumeMatchingDeckPreloadForEmail: (email: string) => string[] | null;
  /** Profile + pet peeves prefetched for deck cards (read in ProfileCard when readOnly). */
  peekProfileCardCache: (email: string) => ProfileCardCacheEntry | null;
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
  const profileCardCacheRef = useRef<Map<string, ProfileCardCacheEntry>>(new Map());
  const profileCardPreloadInflightRef = useRef<Map<string, Promise<void>>>(new Map());

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
        profileCardCacheRef.current.clear();
        profileCardPreloadInflightRef.current.clear();
      } else if (prev && u.email.toLowerCase() !== prev.email.toLowerCase()) {
        matchingDeckPreloadRef.current = null;
        preloadInflightRef.current.clear();
        profileCardCacheRef.current.clear();
        profileCardPreloadInflightRef.current.clear();
      }
      return u;
    });
  }, []);

  const signOut = useCallback(() => {
    matchingDeckPreloadRef.current = null;
    preloadInflightRef.current.clear();
    profileCardCacheRef.current.clear();
    profileCardPreloadInflightRef.current.clear();
    setUserState(null);
  }, []);

  const prefetchProfileCardsForEmails = useCallback(async (emails: string[]) => {
    const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];

    const prefetchOne = async (normalized: string) => {
      if (profileCardCacheRef.current.has(normalized)) return;
      const existing = profileCardPreloadInflightRef.current.get(normalized);
      if (existing) {
        await existing;
        return;
      }
      const run = (async () => {
        try {
          const [pRes, ppRes] = await Promise.all([
            fetch(`/api/profiles/profiles?email=${encodeURIComponent(normalized)}`),
            fetch(`/api/profiles/petPeeves?email=${encodeURIComponent(normalized)}`),
          ]);
          if (!pRes.ok || !ppRes.ok) return;
          const profile = (await pRes.json()) as ProfileCardCacheEntry['profile'];
          const petPeeves = (await ppRes.json()) as ProfileCardCacheEntry['petPeeves'];
          profileCardCacheRef.current.set(normalized, { profile, petPeeves: Array.isArray(petPeeves) ? petPeeves : [] });
        } finally {
          profileCardPreloadInflightRef.current.delete(normalized);
        }
      })();
      profileCardPreloadInflightRef.current.set(normalized, run);
      await run;
    };

    await Promise.all(unique.map((e) => prefetchOne(e)));
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
        await prefetchProfileCardsForEmails(deck.slice(0, 3));
      } finally {
        preloadInflightRef.current.delete(normalized);
      }
    })();
    preloadInflightRef.current.set(normalized, run);
    await run;
  }, [prefetchProfileCardsForEmails]);

  const peekProfileCardCache = useCallback((email: string): ProfileCardCacheEntry | null => {
    const key = email.trim().toLowerCase();
    const e = profileCardCacheRef.current.get(key);
    return e ? { profile: { ...e.profile }, petPeeves: [...e.petPeeves] } : null;
  }, []);

  const peekMatchingDeckPreloadForEmail = useCallback((email: string): string[] | null => {
    const normalized = email.trim().toLowerCase();
    const p = matchingDeckPreloadRef.current;
    if (p?.userEmail === normalized) {
      return [...p.deck];
    }
    return null;
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
    if (!user?.email || user.isAdmin || user.isMatched || !user.profileSetupComplete) {
      return;
    }
    void preloadMatchingDeck(user.email);
  }, [user?.email, user?.isAdmin, user?.isMatched, user?.profileSetupComplete, preloadMatchingDeck]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        signOut,
        preloadMatchingDeck,
        peekMatchingDeckPreloadForEmail,
        consumeMatchingDeckPreloadForEmail,
        peekProfileCardCache,
      }}
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
