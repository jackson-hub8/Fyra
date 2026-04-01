/// file: UnmatchedSearch.tsx
/// Student search by name (Levenshtein, top 5) + optional class standing; profile modal + request match.

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProfileCard from '../../components/ProfileCard';
import StudentSearchResultsTable from '../../components/StudentSearchResultsTable';
import { CLASS_STANDING_OPTIONS } from '../../config/profileQuestions';
import '../auth/login.css';
import '../admin/admin-matching.css';
import './unmatched-search.css';

import type { StudentSearchRow } from '../../components/StudentSearchResultsTable';

export default function UnmatchedSearch() {
  const { user } = useAuth();
  const [showResults, setShowResults] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [standing, setStanding] = useState('');
  const [results, setResults] = useState<StudentSearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestedEmails, setRequestedEmails] = useState<Set<string>>(() => new Set());

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/matching/student-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searcherEmail: user.email,
          firstName,
          lastName,
          standing: standing.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { results?: StudentSearchRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      setResults(Array.isArray(data.results) ? data.results : []);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const backToForm = () => {
    setShowResults(false);
    setResults([]);
    setError('');
  };

  const closeProfile = () => {
    setProfileEmail(null);
    setRequestError('');
  };

  const requestMatch = async () => {
    if (!user?.email || !profileEmail) return;
    setRequestError('');
    setRequestLoading(true);
    try {
      const res = await fetch('/api/matching/match-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromEmail: user.email, toEmail: profileEmail }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Request failed');
      setRequestedEmails((prev) => new Set(prev).add(profileEmail.toLowerCase()));
      closeProfile();
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <>
      {!showResults ? (
        <div className="unmatched-search-wrap">
          {error && <div className="error-message" style={{ width: '100%', marginBottom: 8 }}>{error}</div>}
          <form className="unmatched-search-form" onSubmit={runSearch}>
            <input
              className="password-input"
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              aria-label="First name"
            />
            <input
              className="password-input"
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              aria-label="Last name"
            />
            <select
              className="student-search-select"
              value={standing}
              onChange={(e) => setStanding(e.target.value)}
              aria-label="Class year filter"
            >
              <option value="">Year (optional)</option>
              {CLASS_STANDING_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Searching…' : 'Submit'}
            </button>
          </form>
        </div>
      ) : (
        <div className="unmatched-search-results-wrap">
          {error && <div className="error-message" style={{ marginBottom: 8 }}>{error}</div>}
          <StudentSearchResultsTable
            results={results}
            emptyMessage="No results. Try different spelling or clear the year filter."
            onNameClick={(row) => {
              setRequestError('');
              setProfileEmail(row.email);
            }}
          />
          <button type="button" className="unmatched-search-back" onClick={backToForm}>
            Back
          </button>
        </div>
      )}

      {profileEmail && (
        <div
          className="admin-pair-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unmatched-search-profile-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeProfile();
          }}
        >
          <div
            className="admin-pair-modal unmatched-search-profile-modal"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="admin-pair-modal-header">
              <h2 id="unmatched-search-profile-title">Profile</h2>
              <button type="button" className="admin-pair-modal-close" onClick={closeProfile}>
                Close
              </button>
            </div>
            <div className="admin-pair-modal-body unmatched-search-profile-modal-body">
              <ProfileCard email={profileEmail} readOnly />
            </div>
            <div className="unmatched-search-modal-footer">
              {requestError && (
                <span className="error-message" style={{ flex: '1 1 100%', margin: 0 }}>
                  {requestError}
                </span>
              )}
              <button type="button" className="admin-pair-modal-close" onClick={closeProfile}>
                Cancel
              </button>
              <button
                type="button"
                className="submit-button"
                disabled={
                  requestLoading ||
                  requestedEmails.has(profileEmail.toLowerCase()) ||
                  !user?.email
                }
                onClick={() => void requestMatch()}
              >
                {requestedEmails.has(profileEmail.toLowerCase())
                  ? 'Requested'
                  : requestLoading
                    ? 'Sending…'
                    : 'Request match'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
