/// file: DayViewModal.tsx
/// Modal showing all events for a single day (scrollable list, click event for details).

import type { CalendarEvent } from '../../context/EventsContext';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatEventTime(ev: CalendarEvent): string {
  if (ev.isAllDay) return 'All day';
  const start = ev.startTime ?? '';
  const end = ev.endTime ?? '';
  return `${start}${end ? ` – ${end}` : ''}`;
}

function formatDayLabel(d: Date): string {
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export type DayViewModalProps = {
  date: Date;
  onClose: () => void;
  onEventClick: (ev: CalendarEvent) => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventColor: (creatorId: string) => string;
};

export default function DayViewModal({
  date,
  onClose,
  onEventClick,
  getEventsForDate,
  getEventColor,
}: DayViewModalProps) {
  const events = getEventsForDate(date);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="day-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="day-view-header">
          <h3>{formatDayLabel(date)}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="day-view-list">
          {events.length === 0 ? (
            <p className="day-view-empty">No events this day</p>
          ) : (
            events.map((ev) => (
              <button
                key={ev.id}
                type="button"
                className="day-view-event-item"
                style={{ borderLeftColor: getEventColor(ev.creatorId) }}
                onClick={() => onEventClick(ev)}
              >
                <span className="day-view-event-time">{formatEventTime(ev)}</span>
                <span className="day-view-event-title">{ev.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
