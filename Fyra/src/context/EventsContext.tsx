/// file: EventsContext.tsx
/// Calendar events shared between Home week view and Calendar page. Stored in DB; shared by 2 matched users with one color per user.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD (same or multi-day)
  startTime: string | null; // "HH:mm" or null when all-day
  endTime: string | null;
  isAllDay: boolean;
  creatorId: string; // email; one color per matched user (user1 vs user2)
};

export type RoomMember = { email: string; name: string };

type EventsContextValue = {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  /** Room members (matched users) with names; null when not matched. */
  roomMembers: RoomMember[] | null;
  refetch: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForDateRange: (start: Date, end: Date) => CalendarEvent[];
  getEventColor: (creatorId: string) => string;
};

const EventsContext = createContext<EventsContextValue | null>(null);

const DEFAULT_USER_COLOR = '#ec407a'; /* lighter pink */
const SECOND_USER_COLOR = '#5c8fd6'; /* lighter blue */

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [matchUserEmails, setMatchUserEmails] = useState<[string, string] | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    const email = user?.email?.trim()?.toLowerCase();
    if (!email) {
      setEvents([]);
      setMatchUserEmails(null);
      setRoomMembers(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar/events?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) {
        setEvents([]);
        setMatchUserEmails(null);
        setRoomMembers(null);
        setError(data?.error ?? 'Failed to load events');
        return;
      }
      setEvents(Array.isArray(data.events) ? data.events : []);
      setMatchUserEmails(
        Array.isArray(data.matchUserEmails) &&
          data.matchUserEmails.length >= 2
          ? [data.matchUserEmails[0], data.matchUserEmails[1]]
          : null
      );
      setRoomMembers(
        Array.isArray(data.matchUserNames) && data.matchUserNames.length >= 2
          ? data.matchUserNames
          : null
      );
    } catch (e) {
      setEvents([]);
      setMatchUserEmails(null);
      setRoomMembers(null);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = useCallback(
    async (event: Omit<CalendarEvent, 'id'>) => {
      const email = user?.email?.trim()?.toLowerCase();
      if (!email) throw new Error('Not signed in');
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          isAllDay: event.isAllDay,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create event');
      setEvents((prev) => [...prev, data]);
    },
    [user?.email]
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      const email = user?.email?.trim()?.toLowerCase();
      if (!email) throw new Error('Not signed in');
      const res = await fetch('/api/calendar/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          id: Number(id),
          ...updates,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to update event');
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );
    },
    [user?.email]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const email = user?.email?.trim()?.toLowerCase();
      if (!email) throw new Error('Not signed in');
      const res = await fetch(
        `/api/calendar/events?email=${encodeURIComponent(email)}&id=${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to delete event');
      setEvents((prev) => prev.filter((e) => e.id !== id));
    },
    [user?.email]
  );

  const getEventsForDate = useCallback(
    (date: Date) => {
      const ymd = toYMD(date);
      return events
        .filter((e) => {
          if (ymd < e.startDate || ymd > e.endDate) return false;
          return true;
        })
        .sort((a, b) => {
          if (a.isAllDay && !b.isAllDay) return -1;
          if (!a.isAllDay && b.isAllDay) return 1;
          if (a.isAllDay && b.isAllDay) return a.title.localeCompare(b.title);
          return (a.startTime || '').localeCompare(b.startTime || '');
        });
    },
    [events]
  );

  const getEventsForDateRange = useCallback(
    (start: Date, end: Date) => {
      const startYmd = toYMD(start);
      const endYmd = toYMD(end);
      return events
        .filter((e) => {
          if (e.endDate < startYmd || e.startDate > endYmd) return false;
          return true;
        })
        .sort((a, b) => {
          const d = a.startDate.localeCompare(b.startDate);
          if (d !== 0) return d;
          if (a.isAllDay && !b.isAllDay) return -1;
          if (!a.isAllDay && b.isAllDay) return 1;
          return (a.startTime || '').localeCompare(b.startTime || '');
        });
    },
    [events]
  );

  const getEventColor = useCallback(
    (creatorId: string) => {
      if (matchUserEmails) {
        const idx = matchUserEmails.indexOf(creatorId);
        return idx === 0 ? DEFAULT_USER_COLOR : idx === 1 ? SECOND_USER_COLOR : DEFAULT_USER_COLOR;
      }
      const ids = Array.from(new Set(events.map((e) => e.creatorId)));
      const idx = ids.indexOf(creatorId);
      return idx === 0 ? DEFAULT_USER_COLOR : idx === 1 ? SECOND_USER_COLOR : DEFAULT_USER_COLOR;
    },
    [events, matchUserEmails]
  );

  const value: EventsContextValue = useMemo(
    () => ({
      events,
      loading,
      error,
      roomMembers,
      refetch: fetchEvents,
      addEvent,
      updateEvent,
      deleteEvent,
      getEventsForDate,
      getEventsForDateRange,
      getEventColor,
    }),
    [
      events,
      loading,
      error,
      roomMembers,
      fetchEvents,
      addEvent,
      updateEvent,
      deleteEvent,
      getEventsForDate,
      getEventsForDateRange,
      getEventColor,
    ]
  );

  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
}
