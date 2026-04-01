import './student-search-table.css';

export type StudentSearchRow = { email: string; name: string; classStanding: string | null };

type Props = {
  results: StudentSearchRow[];
  emptyMessage?: string;
  onNameClick?: (row: StudentSearchRow) => void;
  selectActions?: {
    onSelectA: (row: StudentSearchRow) => void;
    onSelectB: (row: StudentSearchRow) => void;
    selectedAEmail: string | null;
    selectedBEmail: string | null;
  };
};

export default function StudentSearchResultsTable({
  results,
  emptyMessage = 'No results.',
  onNameClick,
  selectActions,
}: Props) {
  const classLabel = (s: string | null) => (s && s.trim() ? s : '—');

  return (
    <table className="student-results-table">
      <caption className="student-results-caption">Students</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Class</th>
          <th scope="col">Email</th>
          {selectActions && <th scope="col">Select</th>}
        </tr>
      </thead>
      <tbody>
        {results.map((row) => (
          <tr key={row.email}>
            <td>
              {onNameClick ? (
                <button
                  type="button"
                  className="student-results-name-link"
                  onClick={() => onNameClick(row)}
                >
                  {row.name}
                </button>
              ) : (
                row.name
              )}
            </td>
            <td>{classLabel(row.classStanding)}</td>
            <td style={{ wordBreak: 'break-all' }}>{row.email}</td>
            {selectActions && (
              <td>
                <div className="student-search-select-actions">
                  <button
                    type="button"
                    className="student-search-mini-btn"
                    onClick={() => selectActions.onSelectA(row)}
                    disabled={selectActions.selectedAEmail === row.email}
                  >
                    {selectActions.selectedAEmail === row.email ? 'A ✓' : 'Roommate A'}
                  </button>
                  <button
                    type="button"
                    className="student-search-mini-btn"
                    onClick={() => selectActions.onSelectB(row)}
                    disabled={selectActions.selectedBEmail === row.email}
                  >
                    {selectActions.selectedBEmail === row.email ? 'B ✓' : 'Roommate B'}
                  </button>
                </div>
              </td>
            )}
          </tr>
        ))}
        {results.length === 0 && (
          <tr>
            <td colSpan={selectActions ? 4 : 3} style={{ textAlign: 'center', color: '#666' }}>
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
