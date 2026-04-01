/// EditChoreModal.tsx
/// Modal to edit chore title and due date (any day).

import { useState, useEffect } from 'react';
import { OPEN_TEXT_MAX_LENGTH } from '../../lib/textFieldLimits';
import type { Chore } from '../../context/ChoresContext';

type EditChoreModalProps = {
  chore: Chore;
  onClose: () => void;
  onSubmit: (id: string, title: string, dueDate: string) => Promise<void>;
};

export default function EditChoreModal({
  chore,
  onClose,
  onSubmit,
}: EditChoreModalProps) {
  const [title, setTitle] = useState(chore.title);
  const [dueDate, setDueDate] = useState(chore.dueDate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(chore.title);
    setDueDate(chore.dueDate);
  }, [chore]);

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
      await onSubmit(chore.id, t, dueDate);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chore');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chore-detail-modal add-chore-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chore-detail-header">
          <h3>Edit Chore</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="add-chore-form" onSubmit={handleSubmit}>
          <div className="add-chore-field">
            <label htmlFor="edit-chore-title">Title</label>
            <input
              id="edit-chore-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Take out trash"
              maxLength={OPEN_TEXT_MAX_LENGTH}
              autoFocus
            />
          </div>
          <div className="add-chore-field">
            <label htmlFor="edit-chore-day">Due date</label>
            <input
              id="edit-chore-day"
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
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
