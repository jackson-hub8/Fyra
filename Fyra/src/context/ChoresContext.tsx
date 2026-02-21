/// file: ChoresContext.tsx
/// Chores for matched users: title, dueDate, completed. Fetched from API; filter by current week on Home.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';

export type Chore = {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
};

type ChoresContextValue = {
  chores: Chore[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addChore: (chore: Omit<Chore, 'id'>) => Promise<void>;
  updateChore: (id: string, updates: Partial<Chore>) => Promise<void>;
  deleteChore: (id: string) => Promise<void>;
  getChoresForWeek: (startOfWeek: Date, endOfWeek: Date) => Chore[];
};

const ChoresContext = createContext<ChoresContextValue | null>(null);

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export function ChoresProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChores = useCallback(async () => {
    const email = user?.email?.trim()?.toLowerCase();
    if (!email) {
      setChores([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar/chores?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) {
        setChores([]);
        setError(data?.error ?? 'Failed to load chores');
        return;
      }
      setChores(Array.isArray(data.chores) ? data.chores : []);
    } catch (e) {
      setChores([]);
      setError('Failed to load chores');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchChores();
  }, [fetchChores]);

  const addChore = useCallback(
    async (chore: Omit<Chore, 'id'>) => {
      const email = user?.email?.trim()?.toLowerCase();
      if (!email) throw new Error('Not signed in');
      const res = await fetch('/api/calendar/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          title: chore.title,
          dueDate: chore.dueDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create chore');
      setChores((prev) => [...prev, { id: data.id, title: data.title, dueDate: data.dueDate, completed: data.completed ?? false }]);
    },
    [user?.email]
  );

  const updateChore = useCallback(
    async (id: string, updates: Partial<Chore>) => {
      const email = user?.email?.trim()?.toLowerCase();
      if (!email) throw new Error('Not signed in');
      const res = await fetch('/api/calendar/chores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          id: Number(id),
          ...updates,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to update chore');
      setChores((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    [user?.email]
  );

  const deleteChore = useCallback(
    async (id: string) => {
      const email = user?.email?.trim()?.toLowerCase();
      if (!email) throw new Error('Not signed in');
      const res = await fetch(
        `/api/calendar/chores?email=${encodeURIComponent(email)}&id=${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to delete chore');
      setChores((prev) => prev.filter((c) => c.id !== id));
    },
    [user?.email]
  );

  const getChoresForWeek = useCallback(
    (startOfWeek: Date, endOfWeek: Date) => {
      const startYmd = toYMD(startOfWeek);
      const endYmd = toYMD(endOfWeek);
      return chores
        .filter((c) => c.dueDate >= startYmd && c.dueDate <= endYmd)
        .sort((a, b) => {
          const d = a.dueDate.localeCompare(b.dueDate);
          if (d !== 0) return d;
          return a.title.localeCompare(b.title);
        });
    },
    [chores]
  );

  const value: ChoresContextValue = useMemo(
    () => ({
      chores,
      loading,
      error,
      refetch: fetchChores,
      addChore,
      updateChore,
      deleteChore,
      getChoresForWeek,
    }),
    [
      chores,
      loading,
      error,
      fetchChores,
      addChore,
      updateChore,
      deleteChore,
      getChoresForWeek,
    ]
  );

  return (
    <ChoresContext.Provider value={value}>{children}</ChoresContext.Provider>
  );
}

export function useChores() {
  const ctx = useContext(ChoresContext);
  if (!ctx) throw new Error('useChores must be used within ChoresProvider');
  return ctx;
}
