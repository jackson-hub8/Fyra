/// file: Home.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Home page for matched users with current week calendar and events.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import type { CalendarEvent } from '../context/EventsContext';
import DayViewModal from '../components/calendar/DayViewModal';
import EventDetailModal from '../components/calendar/EventDetailModal';
import './home.css';
import './calendar/calendar.css';

function formatEventTime(ev: CalendarEvent): string {
  if (ev.isAllDay) return 'All day';
  const start = ev.startTime ?? '';
  const end = ev.endTime ?? '';
  return `${start}${end ? ` – ${end}` : ''}`;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { getEventsForDate, getEventColor, deleteEvent } = useEvents();
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);

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

  const weekDays = [];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="logo-left">FYRA</div>
        <div className="page-title">Home</div>
        <div className="header-right">
          <div className="university-text">Transylvania University</div>
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
                        <span className="week-event-time">{formatEventTime(ev)}</span>
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
              <button className="add-chore-button">+</button>
            </div>
          </div>

          <div className="roommate-section">
            <div className="roommate-title">Roommate</div>
            <div className="roommate-content">roommate</div>
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
