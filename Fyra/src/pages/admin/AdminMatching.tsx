import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../auth/login.css';
import '../profile/profile.css';
import '../home.css';
import './admin-matching.css';
import {
  PRIVATE_QUESTIONNAIRE_FIELD_ORDER,
  formatPrivateQuestionnaireAnswer,
  getPrivateQuestionnaireAdminLabel,
  CLASS_STANDING_OPTIONS,
} from '../../config/profileQuestions';
import StudentSearchResultsTable from '../../components/StudentSearchResultsTable';
import type { StudentSearchRow } from '../../components/StudentSearchResultsTable';
import '../unmatched/unmatched-search.css';

type UnmatchedUser = { email: string; name: string };
type PossibleRow = {
  id: number;
  partnerEmail: string;
  partnerName: string;
  similarityScore: number;
  createdAt: string;
};
type MatchedPair = {
  id: number;
  matchScore: number | null;
  matchedAt: string;
  user1: { email: string; name: string };
  user2: { email: string; name: string };
};

type MutualRequestPair = {
  user1: { email: string; name: string };
  user2: { email: string; name: string };
};

function QuestionnairePanel({
  heading,
  email,
  data,
}: {
  heading: string;
  email: string;
  data: Record<string, unknown> | null;
}) {
  if (!data) {
    return (
      <div className="admin-q-person">
        <h4>{heading}</h4>
        <p className="admin-q-email">{email}</p>
        <p style={{ color: '#666', fontSize: 14 }}>No questionnaire on file.</p>
      </div>
    );
  }
  return (
    <div className="admin-q-person">
      <h4>{heading}</h4>
      <p className="admin-q-email">{email}</p>
      <dl>
        {PRIVATE_QUESTIONNAIRE_FIELD_ORDER.map((key) => (
          <div key={key} className="admin-q-row">
            <dt>{getPrivateQuestionnaireAdminLabel(key)}</dt>
            <dd>{formatPrivateQuestionnaireAnswer(key, data[key])}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function AdminMatching() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const token = user?.adminToken ?? '';

  const [tab, setTab] = useState<'unmatched' | 'matched' | 'requested'>('unmatched');
  const [unmatchedUsers, setUnmatchedUsers] = useState<UnmatchedUser[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [possibleList, setPossibleList] = useState<PossibleRow[]>([]);
  const [pairModal, setPairModal] = useState<{
    primaryName: string;
    primaryEmail: string;
    partnerName: string;
    partnerEmail: string;
    questionnairePrimary: Record<string, unknown> | null;
    questionnairePartner: Record<string, unknown> | null;
  } | null>(null);
  const [pairModalLoading, setPairModalLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualPickA, setManualPickA] = useState<{ email: string; name: string } | null>(null);
  const [manualPickB, setManualPickB] = useState<{ email: string; name: string } | null>(null);
  const [manualSearchFirst, setManualSearchFirst] = useState('');
  const [manualSearchLast, setManualSearchLast] = useState('');
  const [manualSearchStanding, setManualSearchStanding] = useState('');
  const [manualSearchResults, setManualSearchResults] = useState<StudentSearchRow[]>([]);
  const [manualSearchLoading, setManualSearchLoading] = useState(false);
  const [mutualRequests, setMutualRequests] = useState<MutualRequestPair[]>([]);
  const [unmatchLoadingId, setUnmatchLoadingId] = useState<number | null>(null);

  const loadUnmatched = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/unmatched-users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { users?: UnmatchedUser[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setUnmatchedUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadMatched = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/matched-pairs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { matches?: MatchedPair[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setMatchedPairs(data.matches ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadMutualRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/mutual-match-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { mutual?: MutualRequestPair[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setMutualRequests(data.mutual ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === 'unmatched') void loadUnmatched();
    else if (tab === 'matched') void loadMatched();
    else void loadMutualRequests();
  }, [tab, loadUnmatched, loadMatched, loadMutualRequests]);

  const selectUser = async (email: string) => {
    setSelectedEmail(email);
    setError('');
    try {
      const res = await fetch(`/api/admin/possible-matches?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { possibleMatches?: PossibleRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setPossibleList(data.possibleMatches ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setPossibleList([]);
    }
  };

  const openPairQuestionnairesForEmails = async (
    primaryEmail: string,
    primaryName: string,
    partnerEmail: string,
    partnerName: string,
  ) => {
    setPairModalLoading(true);
    setError('');
    setPairModal(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resA, resB] = await Promise.all([
        fetch(`/api/admin/private-questionnaire?email=${encodeURIComponent(primaryEmail)}`, {
          headers,
        }),
        fetch(`/api/admin/private-questionnaire?email=${encodeURIComponent(partnerEmail)}`, {
          headers,
        }),
      ]);
      const dataA = (await resA.json()) as { questionnaire?: Record<string, unknown>; error?: string };
      const dataB = (await resB.json()) as { questionnaire?: Record<string, unknown>; error?: string };
      if (!resA.ok) throw new Error(dataA.error ?? 'Could not load first questionnaire');
      if (!resB.ok) throw new Error(dataB.error ?? 'Could not load second questionnaire');
      setPairModal({
        primaryName,
        primaryEmail,
        partnerName,
        partnerEmail,
        questionnairePrimary: dataA.questionnaire ?? null,
        questionnairePartner: dataB.questionnaire ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setPairModalLoading(false);
    }
  };

  const openPairQuestionnaires = async (partnerEmail: string, partnerName: string) => {
    if (!selectedEmail) return;
    const primaryName =
      unmatchedUsers.find((u) => u.email === selectedEmail)?.name ?? selectedEmail;
    await openPairQuestionnairesForEmails(selectedEmail, primaryName, partnerEmail, partnerName);
  };

  const approve = async (possibleMatchId: number) => {
    setError('');
    try {
      const res = await fetch('/api/admin/approve-match', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ possibleMatchId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Approve failed');
      if (selectedEmail) await selectUser(selectedEmail);
      await loadUnmatched();
      await loadMatched();
      await loadMutualRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  const reject = async (possibleMatchId: number) => {
    setError('');
    try {
      const res = await fetch('/api/admin/reject-match', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ possibleMatchId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Reject failed');
      if (selectedEmail) await selectUser(selectedEmail);
      await loadUnmatched();
      await loadMutualRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  const runManualStudentSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setManualSearchLoading(true);
    try {
      const res = await fetch('/api/admin/student-search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: manualSearchFirst,
          lastName: manualSearchLast,
          standing: manualSearchStanding.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { results?: StudentSearchRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      setManualSearchResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setManualSearchLoading(false);
    }
  };

  const manualMatch = async () => {
    const a = manualPickA?.email.trim().toLowerCase();
    const b = manualPickB?.email.trim().toLowerCase();
    if (!a || !b) {
      setError('Select roommate A and roommate B from the search results.');
      return;
    }
    if (a === b) {
      setError('Choose two different students.');
      return;
    }
    setError('');
    try {
      const res = await fetch('/api/admin/manual-match', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmailA: a, userEmailB: b }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Manual match failed');
      setManualPickA(null);
      setManualPickB(null);
      setManualSearchResults([]);
      await loadUnmatched();
      await loadMatched();
      await loadMutualRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  const matchPairFromMutualRequest = async (p: MutualRequestPair) => {
    setError('');
    try {
      const res = await fetch('/api/admin/manual-match', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmailA: p.user1.email,
          userEmailB: p.user2.email,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Match failed');
      await loadUnmatched();
      await loadMatched();
      await loadMutualRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  const unmatchRoom = async (matchId: number) => {
    if (
      !window.confirm(
        'Unmatch this pair? Both users become unmatched and their shared calendar and chores are permanently removed.',
      )
    ) {
      return;
    }
    setError('');
    setUnmatchLoadingId(matchId);
    try {
      const res = await fetch('/api/admin/unmatch-room', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Unmatch failed');
      await loadUnmatched();
      await loadMatched();
      await loadMutualRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setUnmatchLoadingId(null);
    }
  };

  const pageTitle =
    tab === 'unmatched' ? 'Unmatched' : tab === 'matched' ? 'Matched' : 'Requested';

  return (
    <div className="profile-page admin-matching-page">
      <div className="home-header">
        <div className="header-left">
          <div className="logo-left">FYRA</div>
          <div className="university-text">Transylvania University</div>
        </div>
        <div className="page-title">{pageTitle}</div>
        <div className="header-right">
          <button
            type="button"
            className="sign-out-button"
            onClick={() => {
              signOut();
              navigate('/');
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <main className="profile-main admin-matching-main">
        {error && <div className="error-message">{error}</div>}
        {loading && !pairModalLoading && !manualSearchLoading && (
          <p className="profile-loading">Loading…</p>
        )}

        {tab === 'unmatched' && (
          <div className="admin-matching-split">
            <section className="admin-matching-column" aria-label="Unmatched students">
              <h3 className="form-title" style={{ fontSize: '1.1rem' }}>
                Unmatched students
              </h3>
              <ul className="admin-matching-scroll">
                {unmatchedUsers.map((u) => (
                  <li key={u.email}>
                    <button
                      type="button"
                      className={selectedEmail === u.email ? 'submit-button' : 'back-button'}
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => void selectUser(u.email)}
                    >
                      {u.name}
                      <span style={{ opacity: 0.75, fontSize: 12, display: 'block' }}>{u.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="admin-matching-column" aria-label="Possible matches">
              <h3 className="form-title" style={{ fontSize: '1.1rem' }}>
                Possible matches (by score)
              </h3>
              {!selectedEmail && (
                <div className="admin-possible-empty">
                  <p>Select a student to see mutual likes.</p>
                </div>
              )}
              {selectedEmail && (
                <ul className="admin-matching-scroll">
                  {possibleList.map((p) => (
                    <li key={p.id}>
                      <div className="admin-possible-card">
                        <strong>{p.partnerName}</strong>
                        <div style={{ fontSize: 13, color: '#555' }}>{p.partnerEmail}</div>
                        <div style={{ fontSize: 13, marginTop: 6 }}>
                          Similarity score:{' '}
                          <strong>{`${(p.similarityScore * 100).toFixed(1)}%`}</strong>
                        </div>
                        <div className="admin-possible-actions">
                          <button type="button" className="submit-button" onClick={() => void approve(p.id)}>
                            Approve
                          </button>
                          <button type="button" className="back-button" onClick={() => void reject(p.id)}>
                            Reject
                          </button>
                          <button
                            type="button"
                            className="back-button"
                            onClick={() => void openPairQuestionnaires(p.partnerEmail, p.partnerName)}
                            disabled={pairModalLoading}
                          >
                            View questionnaires
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {possibleList.length === 0 && (
                    <li style={{ color: '#666' }}>No possible matches yet.</li>
                  )}
                </ul>
              )}
            </section>
          </div>
        )}

        {tab === 'requested' && (
          <div className="admin-matched-block">
            <h3 className="form-title" style={{ fontSize: '1.1rem' }}>
              Requested matches
            </h3>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>
              Pairs who used student search to request each other mutually. Match them to create a room.
            </p>
            <ul className="admin-matched-scroll">
              {mutualRequests.map((p) => (
                <li key={`${p.user1.email}-${p.user2.email}`} className="admin-matched-pair-row">
                  <div className="admin-matched-pair-info">
                    <strong>{p.user1.name}</strong> &amp; <strong>{p.user2.name}</strong>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {p.user1.email} — {p.user2.email}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      type="button"
                      className="submit-button"
                      onClick={() => void matchPairFromMutualRequest(p)}
                    >
                      Match pair
                    </button>
                    <button
                      type="button"
                      className="back-button"
                      onClick={() =>
                        void openPairQuestionnairesForEmails(
                          p.user1.email,
                          p.user1.name,
                          p.user2.email,
                          p.user2.name,
                        )
                      }
                      disabled={pairModalLoading}
                    >
                      View questionnaires
                    </button>
                  </div>
                </li>
              ))}
              {mutualRequests.length === 0 && (
                <li style={{ color: '#666' }}>No mutual match requests yet.</li>
              )}
            </ul>
          </div>
        )}

        {tab === 'matched' && (
          <div className="admin-matched-block">
            <h3 className="form-title" style={{ fontSize: '1.1rem' }}>
              Matched pairs
            </h3>
            <ul className="admin-matched-scroll">
              {matchedPairs.map((m) => (
                <li key={m.id} className="admin-matched-pair-row">
                  <div className="admin-matched-pair-info">
                    <strong>{m.user1.name}</strong> &amp; <strong>{m.user2.name}</strong>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {m.user1.email} — {m.user2.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="admin-unmatch-btn"
                    disabled={unmatchLoadingId === m.id}
                    onClick={() => void unmatchRoom(m.id)}
                  >
                    {unmatchLoadingId === m.id ? 'Working…' : 'Unmatch'}
                  </button>
                </li>
              ))}
            </ul>

            <div className="admin-manual-block">
              <h3 className="form-title" style={{ fontSize: '1.1rem', marginTop: 0 }}>
                Manual match
              </h3>
              <p style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>
                Search by name, then pick roommate A and roommate B from the top results.
              </p>
              <div className="unmatched-search-wrap" style={{ maxWidth: 560, marginBottom: 16 }}>
                <form className="unmatched-search-form" onSubmit={runManualStudentSearch}>
                  <input
                    className="password-input"
                    type="text"
                    placeholder="First Name"
                    value={manualSearchFirst}
                    onChange={(e) => setManualSearchFirst(e.target.value)}
                    aria-label="First name"
                  />
                  <input
                    className="password-input"
                    type="text"
                    placeholder="Last Name"
                    value={manualSearchLast}
                    onChange={(e) => setManualSearchLast(e.target.value)}
                    aria-label="Last name"
                  />
                  <select
                    className="student-search-select"
                    value={manualSearchStanding}
                    onChange={(e) => setManualSearchStanding(e.target.value)}
                    aria-label="Class year filter"
                  >
                    <option value="">Year (optional)</option>
                    {CLASS_STANDING_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="submit-button" disabled={manualSearchLoading}>
                    {manualSearchLoading ? 'Searching…' : 'Submit'}
                  </button>
                </form>
              </div>
              {(manualPickA || manualPickB) && (
                <div style={{ fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
                  <div>
                    <strong>Roommate A:</strong>{' '}
                    {manualPickA ? (
                      <>
                        {manualPickA.name}{' '}
                        <span style={{ color: '#666' }}>({manualPickA.email})</span>{' '}
                        <button type="button" className="back-button" onClick={() => setManualPickA(null)}>
                          Clear
                        </button>
                      </>
                    ) : (
                      <span style={{ color: '#666' }}>Not selected</span>
                    )}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <strong>Roommate B:</strong>{' '}
                    {manualPickB ? (
                      <>
                        {manualPickB.name}{' '}
                        <span style={{ color: '#666' }}>({manualPickB.email})</span>{' '}
                        <button type="button" className="back-button" onClick={() => setManualPickB(null)}>
                          Clear
                        </button>
                      </>
                    ) : (
                      <span style={{ color: '#666' }}>Not selected</span>
                    )}
                  </div>
                </div>
              )}
              <StudentSearchResultsTable
                results={manualSearchResults}
                selectActions={{
                  onSelectA: (row) => setManualPickA({ email: row.email, name: row.name }),
                  onSelectB: (row) => setManualPickB({ email: row.email, name: row.name }),
                  selectedAEmail: manualPickA?.email ?? null,
                  selectedBEmail: manualPickB?.email ?? null,
                }}
              />
              <button
                type="button"
                className="submit-button"
                style={{ marginTop: 16 }}
                onClick={() => void manualMatch()}
              >
                Match pair
              </button>
            </div>
          </div>
        )}
      </main>

      <nav className="profile-bottom-nav" aria-label="Admin sections">
        <button
          type="button"
          className={`nav-item ${tab === 'unmatched' ? 'active' : ''}`}
          onClick={() => setTab('unmatched')}
        >
          Unmatched
        </button>
        <button
          type="button"
          className={`nav-item ${tab === 'requested' ? 'active' : ''}`}
          onClick={() => setTab('requested')}
        >
          Requested
        </button>
        <button
          type="button"
          className={`nav-item ${tab === 'matched' ? 'active' : ''}`}
          onClick={() => setTab('matched')}
        >
          Matched
        </button>
      </nav>

      {(pairModalLoading || pairModal) && (
        <div
          className="admin-pair-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-pair-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pairModalLoading) {
              setPairModal(null);
            }
          }}
        >
          <div className="admin-pair-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-pair-modal-header">
              <h2 id="admin-pair-modal-title">Roommate questionnaires</h2>
              <button
                type="button"
                className="admin-pair-modal-close"
                onClick={() => {
                  setPairModal(null);
                  setPairModalLoading(false);
                }}
              >
                Close
              </button>
            </div>
            <div className="admin-pair-modal-body">
              {pairModalLoading && <p className="profile-loading">Loading questionnaires…</p>}
              {!pairModalLoading && pairModal && (
                <div className="admin-pair-modal-columns">
                  <QuestionnairePanel
                    heading={pairModal.primaryName}
                    email={pairModal.primaryEmail}
                    data={pairModal.questionnairePrimary}
                  />
                  <QuestionnairePanel
                    heading={pairModal.partnerName}
                    email={pairModal.partnerEmail}
                    data={pairModal.questionnairePartner}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
