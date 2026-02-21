/// file: Calendar.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Calendar page for matched users with events, day view, and event detail/edit.

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import type { CalendarEvent } from '../../context/EventsContext';
import DayViewModal from '../../components/calendar/DayViewModal';
import EventDetailModal from '../../components/calendar/EventDetailModal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import '../home.css';
import './calendar.css';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Calendar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    getEventsForDate,
    getEventColor,
    deleteEvent,
  } = useEvents();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const isMobile = useMediaQuery('(max-width: 600px)');
  const weekdayLabels = isMobile ? dayNamesShort : dayNames;

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

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddEvent = () => {
    navigate('/calendar/new');
  };

  const monthName = monthNames[currentDate.getMonth()];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) cells.push(null);
  }

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  const openDayView = (date: Date) => {
    setDetailEvent(null);
    setDayViewDate(date);
  };

  const handleEventClick = (ev: CalendarEvent) => {
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
        <div className="header-left">
          <div className="logo-left">FYRA</div>
          <div className="university-text">Transylvania University</div>
        </div>
        <div className="page-title">Calendar</div>
        <div className="header-right">
          <Link to="/settings" className="header-settings-link" aria-label="Settings">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </Link>
          <button className="sign-out-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="main-content calendar-main">
        <div className="calendar-header-controls">
          <div className="month-navigation">
            <button className="month-arrow" onClick={handlePreviousMonth}>←</button>
            <h2 className="month-name">{monthName}</h2>
            <button className="month-arrow" onClick={handleNextMonth}>→</button>
          </div>
          <button className="add-event-button" onClick={handleAddEvent}>+</button>
        </div>

        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {weekdayLabels.map((day) => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {cells.map((cellDate, index) => {
              const isEmpty = cellDate === null;
              const isToday = !isEmpty && isCurrentMonth && cellDate!.getDate() === today.getDate();
              const dayNumber = isEmpty ? null : cellDate!.getDate();
              const eventsForDay = isEmpty ? [] : getEventsForDate(cellDate!);
              const maxVisible = 4;
              const visibleEvents = eventsForDay.slice(0, maxVisible);
              const moreCount = eventsForDay.length - maxVisible;
              const showMoreLink = moreCount > 0;

              return (
                <div
                  key={index}
                  className={`calendar-day ${isEmpty ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                >
                  {dayNumber !== null && <span className="day-number">{dayNumber}</span>}
                  {!isEmpty && (
                    <div className="calendar-day-events">
                      {visibleEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          className="calendar-event-bubble"
                          style={{ backgroundColor: getEventColor(ev.creatorId) }}
                          onClick={() => handleEventClick(ev)}
                        >
                          {ev.isAllDay ? ev.title : `${ev.startTime} ${ev.title}`}
                        </button>
                      ))}
                      {showMoreLink && (
                        <button
                          type="button"
                          className="calendar-day-more"
                          onClick={() => openDayView(cellDate!)}
                        >
                          +{moreCount} more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {dayViewDate && (
        <DayViewModal
          date={dayViewDate}
          onClose={() => setDayViewDate(null)}
          onEventClick={handleEventClick}
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
        <button className="nav-item" onClick={() => navigate('/matched')}>Home</button>
        <button className="nav-item" onClick={() => navigate('/calendar')}>Calendar</button>
        <button className="nav-item" onClick={() => navigate('/profile')}>Profile</button>
      </div>
    </div>
  );
};

export default Calendar;
