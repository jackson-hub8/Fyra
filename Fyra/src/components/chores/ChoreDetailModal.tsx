/// ChoreDetailModal.tsx
/// Modal to view a chore with Edit, Mark complete / uncomplete, and Delete.

import type { Chore } from '../../context/ChoresContext';

type ChoreDetailModalProps = {
  chore: Chore;
  onClose: () => void;
  onEdit: (chore: Chore) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
};

function formatDueDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${days[date.getDay()]}, ${date.getMonth() + 1}/${date.getDate()}/${y}`;
}

export default function ChoreDetailModal({
  chore,
  onClose,
  onEdit,
  onToggleComplete,
  onDelete,
}: ChoreDetailModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chore-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chore-detail-header">
          <h3>{chore.title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="chore-detail-body">
          <div className="chore-detail-row">
            <span className="chore-detail-label">Due</span>
            <span>{formatDueDate(chore.dueDate)}</span>
          </div>
          {chore.completed && (
            <div className="chore-detail-row">
              <span className="chore-detail-label">Status</span>
              <span>Completed</span>
            </div>
          )}
        </div>
        <div className="chore-detail-actions">
          <button
            type="button"
            className="chore-complete-btn"
            onClick={() => onToggleComplete(chore.id, !chore.completed)}
          >
            {chore.completed ? 'Mark incomplete' : 'Mark complete'}
          </button>
          <button type="button" className="edit-chore-btn" onClick={() => onEdit(chore)}>
            Edit
          </button>
          <button type="button" className="delete-chore-btn" onClick={() => onDelete(chore.id)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
