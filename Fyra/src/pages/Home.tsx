/// file: Home.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Home page for matched users with current week calendar and events.

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { useChores } from '../context/ChoresContext';
import type { CalendarEvent } from '../context/EventsContext';
import type { Chore } from '../context/ChoresContext';
import DayViewModal from '../components/calendar/DayViewModal';
import EventDetailModal from '../components/calendar/EventDetailModal';
import ChoreDetailModal from '../components/chores/ChoreDetailModal';
import AddChoreModal from '../components/chores/AddChoreModal';
import EditChoreModal from '../components/chores/EditChoreModal';
import './home.css';
import './calendar/calendar.css';
import { formatEventTimeDisplay } from '../utils/formatTime12h';

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut, setUser } = useAuth();
  const { getEventsForDate, getEventColor, deleteEvent, roomMembers, matchId, refetch: refetchEvents } =
    useEvents();
  const {
    getChoresForWeek,
    addChore,
    updateChore,
    deleteChore,
    refetch: refetchChores,
  } = useChores();
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);
  const [detailChore, setDetailChore] = useState<Chore | null>(null);
  const [showAddChore, setShowAddChore] = useState(false);
  const [editChore, setEditChore] = useState<Chore | null>(null);
  const [adminUnmatchBusy, setAdminUnmatchBusy] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  if (!user?.email) return null;

  // Get current week (Sunday to Saturday)
  const today = new Date();
  const currentDay = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);

  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDays: { dayName: string; dayNumber: number; date: Date; isToday: boolean }[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDays.push({
      dayName: dayNamesShort[i],
      dayNumber: date.getDate(),
      date,
      isToday: date.toDateString() === today.toDateString(),
    });
  }

  const openDayView = (date: Date) => {
    setDetailEvent(null);
    setDayViewDate(date);
  };

  const handleEventFromDayView = (ev: CalendarEvent) => {
    setDayViewDate(null);
    setDetailEvent(ev);
  };

  const handleEdit = (id: string) => {
    setDetailEvent(null);
    setDayViewDate(null);
    navigate(`/calendar/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      setDetailEvent(null);
      setDayViewDate(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  // Current week range for chores (same as week calendar)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const weekChores = getChoresForWeek(startOfWeek, endOfWeek);

  const handleAddChore = async (title: string, dueDate: string) => {
    await addChore({ title, dueDate, completed: false });
  };

  const handleChoreToggleComplete = async (id: string, completed: boolean) => {
    await updateChore(id, { completed });
    setDetailChore((c) => (c?.id === id ? { ...c, completed } : c));
  };

  const handleChoreDelete = async (id: string) => {
    try {
      await deleteChore(id);
      setDetailChore(null);
      setEditChore(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete chore');
    }
  };

  const handleChoreEdit = (chore: Chore) => {
    setDetailChore(null);
    setEditChore(chore);
  };

  const handleEditChoreSubmit = async (id: string, title: string, dueDate: string) => {
    await updateChore(id, { title, dueDate });
    setEditChore(null);
    setDetailChore((c) => (c?.id === id ? { ...c, title, dueDate } : c));
  };

  function dateToYMD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function choreDayLabel(dueDate: string): string {
    const d = weekDays.find((wd) => dateToYMD(wd.date) === dueDate);
    return d ? d.dayName : dueDate;
  }

  const handleAdminUnmatchRoom = async () => {
    const token = user?.adminToken;
    if (!token || matchId == null || !user?.email) return;
    if (
      !window.confirm(
        'Unmatch this room? Both roommates become unmatched and their shared calendar and chores are permanently removed.',
      )
    ) {
      return;
    }
    setAdminUnmatchBusy(true);
    try {
      const res = await fetch('/api/admin/unmatch-room', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Unmatch failed');
      setUser({
        ...user,
        isMatched: false,
      });
      await refetchEvents();
      await refetchChores();
      if (user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/unmatched');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unmatch failed');
    } finally {
      setAdminUnmatchBusy(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="header-left">
          <div className="logo-left">FYRA</div>
          <div className="university-text">Transylvania University</div>
        </div>
        <div className="page-title">Home</div>
        <div className="header-right">
          {user.isAdmin && (
            <Link to="/admin" className="header-admin-link">
              Admin
            </Link>
          )}
          <button className="sign-out-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="week-calendar">
          <div className="week-calendar-header">
            {weekDays.map((day) => (
              <div
                key={day.date.toDateString()}
                className={`week-day-header ${day.isToday ? 'today' : ''}`}
              >
                <div className="week-day-name">{day.dayName}</div>
                <div className={`week-day-number ${day.isToday ? 'today-number' : ''}`}>
                  {day.dayNumber}
                </div>
              </div>
            ))}
          </div>
          <div className="week-calendar-body">
            {weekDays.map((day) => {
              const eventsForDay = getEventsForDate(day.date);
              const maxVisible = 4;
              const visibleEvents = eventsForDay.slice(0, maxVisible);
              const moreCount = eventsForDay.length - maxVisible;
              const showMoreLink = moreCount > 0;
              return (
                <div
                  key={day.date.toDateString()}
                  className={`week-day-cell ${day.isToday ? 'today-cell' : ''}`}
                >
                  <div className="week-day-events">
                    {visibleEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        className="week-event-bubble"
                        style={{ backgroundColor: getEventColor(ev.creatorId) }}
                        onClick={() => setDetailEvent(ev)}
                      >
                        <span className="week-event-time">{formatEventTimeDisplay(ev)}</span>
                        <span className="week-event-title">{ev.title}</span>
                      </button>
                    ))}
                    {showMoreLink && (
                      <button
                        type="button"
                        className="week-day-more"
                        onClick={() => openDayView(day.date)}
                      >
                        +{moreCount} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bottom-sections">
          <div className="chores-section">
            <div className="chores-header">
              <div className="chores-title">Chores</div>
              <button
                type="button"
                className="add-chore-button"
                onClick={() => setShowAddChore(true)}
                aria-label="Add chore"
              >
                +
              </button>
            </div>
            <div className="chores-list-scroll">
              {weekChores.length === 0 ? (
                <p className="chores-empty">No chores this week. Tap + to add one.</p>
              ) : (
                weekChores.map((chore) => (
                  <button
                    key={chore.id}
                    type="button"
                    className={`chore-item ${chore.completed ? 'chore-item-completed' : ''}`}
                    onClick={() => setDetailChore(chore)}
                  >
                    <span className="chore-item-title">{chore.title}</span>
                    <span className="chore-item-day">{choreDayLabel(chore.dueDate)}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="roommate-section">
            <div className="roommate-title">Room</div>
            <div className="roommate-content">
              {roomMembers && roomMembers.length > 0
                ? roomMembers.map((m) => (
                    <div key={m.email} className="roommate-name">
                      {m.name}
                    </div>
                  ))
                : <span className="roommate-name">—</span>}
            </div>
            {user.isAdmin && user.adminToken && matchId != null && (
              <div className="home-admin-unmatch">
                <p className="home-admin-unmatch-hint">
                  Admin: remove this roommate pair. Both users return to unmatched; shared calendar and chores are deleted.
                </p>
                <button
                  type="button"
                  className="home-admin-unmatch-btn"
                  disabled={adminUnmatchBusy}
                  onClick={() => void handleAdminUnmatchRoom()}
                >
                  {adminUnmatchBusy ? 'Working…' : 'Unmatch room'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {dayViewDate && (
        <DayViewModal
          date={dayViewDate}
          onClose={() => setDayViewDate(null)}
          onEventClick={handleEventFromDayView}
          getEventsForDate={getEventsForDate}
          getEventColor={getEventColor}
        />
      )}
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          getEventColor={getEventColor}
          canEdit={detailEvent.creatorId?.toLowerCase() === user?.email?.trim()?.toLowerCase()}
        />
      )}

      {detailChore && (
        <ChoreDetailModal
          chore={detailChore}
          onClose={() => setDetailChore(null)}
          onEdit={handleChoreEdit}
          onToggleComplete={handleChoreToggleComplete}
          onDelete={handleChoreDelete}
        />
      )}
      {showAddChore && (
        <AddChoreModal
          onClose={() => setShowAddChore(false)}
          onSubmit={handleAddChore}
        />
      )}
      {editChore && (
        <EditChoreModal
          chore={editChore}
          onClose={() => setEditChore(null)}
          onSubmit={handleEditChoreSubmit}
        />
      )}

      <div className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/matched')}>
          Home
        </button>
        <button className="nav-item" onClick={() => navigate('/calendar')}>
          Calendar
        </button>
        <button className="nav-item" onClick={() => navigate('/profile')}>
          Profile
        </button>
      </div>
    </div>
  );
};

export default Home;
