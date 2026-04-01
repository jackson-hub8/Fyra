/// AddChoreModal.tsx
/// Modal to create a new chore with title and due date (any day).

import { useState } from 'react';
import { OPEN_TEXT_MAX_LENGTH } from '../../lib/textFieldLimits';

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type AddChoreModalProps = {
  onClose: () => void;
  onSubmit: (title: string, dueDate: string) => Promise<void>;
};

export default function AddChoreModal({
  onClose,
  onSubmit,
}: AddChoreModalProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => toYMD(new Date()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setError('Title is required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(t, dueDate);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add chore');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chore-detail-modal add-chore-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chore-detail-header">
          <h3>Add Chore</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="add-chore-form" onSubmit={handleSubmit}>
          <div className="add-chore-field">
            <label htmlFor="chore-title">Title</label>
            <input
              id="chore-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Take out trash"
              maxLength={OPEN_TEXT_MAX_LENGTH}
              autoFocus
            />
          </div>
          <div className="add-chore-field">
            <label htmlFor="chore-day">Due date</label>
            <input
              id="chore-day"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          {error && <p className="add-chore-error">{error}</p>}
          <div className="chore-detail-actions">
            <button type="button" className="cancel-chore-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="edit-chore-btn" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Chore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
