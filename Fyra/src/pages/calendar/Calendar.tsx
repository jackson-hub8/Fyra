/// file: Calendar.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Calendar page for matched users with events, day view, and event detail/edit.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import type { CalendarEvent } from '../../context/EventsContext';
import DayViewModal from '../../components/calendar/DayViewModal';
import EventDetailModal from '../../components/calendar/EventDetailModal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { formatTime12h } from '../../utils/formatTime12h';
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
  const year = currentDate.getFullYear();
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
          <button className="sign-out-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="main-content calendar-main">
        <div className="calendar-header-controls">
          <div className="month-navigation">
            <button className="month-arrow" onClick={handlePreviousMonth}>←</button>
            <h2 className="month-name">{monthName} {year}</h2>
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
                          {ev.isAllDay ? ev.title : `${formatTime12h(ev.startTime ?? '')} ${ev.title}`}
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
          canEdit={detailEvent.creatorId?.toLowerCase() === user?.email?.trim()?.toLowerCase()}
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
