/// file: EventDetailModal.tsx
/// Shared modal to view event details with Edit/Delete actions.

import type { CalendarEvent } from '../../context/EventsContext';

type EventDetailModalProps = {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  getEventColor: (creatorId: string) => string;
  /** If false, only show event info (no Edit/Delete). Default true. */
  canEdit?: boolean;
};

export default function EventDetailModal({
  event,
  onClose,
  onEdit,
  onDelete,
  getEventColor,
  canEdit = true,
}: EventDetailModalProps) {
  const color = getEventColor(event.creatorId);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="event-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-detail-header" style={{ borderTopColor: color }}>
          <h3>{event.title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="event-detail-body">
          <div className="event-detail-row">
            <span className="event-detail-label">When</span>
            <span>
              {event.startDate === event.endDate
                ? event.startDate
                : `${event.startDate} – ${event.endDate}`}
              {event.isAllDay ? ' · All day' : ` · ${event.startTime} – ${event.endTime}`}
            </span>
          </div>
          {event.description && (
            <div className="event-detail-row">
              <span className="event-detail-label">Description</span>
              <span>{event.description}</span>
            </div>
          )}
        </div>
        {canEdit && (
          <div className="event-detail-actions">
            <button type="button" className="edit-event-btn" onClick={() => onEdit(event.id)}>
              Edit
            </button>
            <button type="button" className="delete-event-btn" onClick={() => onDelete(event.id)}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
