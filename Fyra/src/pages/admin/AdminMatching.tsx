import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../auth/login.css';
import '../profile/profile.css';
import '../home.css';
import './admin-matching.css';

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

/** Private questionnaire fields in display order with plain-language labels. */
const QUESTIONNAIRE_FIELDS: { key: string; label: string }[] = [
  { key: 'gender', label: 'Gender identity' },
  { key: 'sexAssignedAtBirth', label: 'Sex assigned at birth' },
  { key: 'adaAccommodations', label: 'ADA accommodations' },
  { key: 'animalAllergies', label: 'Animal allergies' },
  { key: 'varsitySport', label: 'Varsity sports' },
  { key: 'smoking', label: 'Nicotine / smoking' },
  { key: 'cannabis', label: 'Cannabis' },
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'roomTemp', label: 'Room temperature preference' },
  { key: 'bedroomDescription', label: 'Bedroom organization' },
  { key: 'sleepType', label: 'Sleep schedule type' },
  { key: 'weekdayBedtime', label: 'Typical weekday bedtime' },
  { key: 'freeTime', label: 'Free time & hobbies' },
  { key: 'campusActivity', label: 'Campus activity level' },
  { key: 'visitorFrequency', label: 'How often visitors come by' },
  { key: 'weekendHomeFrequency', label: 'Weekends away from campus' },
  { key: 'firstClassTime', label: 'First class time' },
  { key: 'musicPreference', label: 'Music preference' },
  { key: 'politicalViews', label: 'Political views' },
  { key: 'religion', label: 'Religion / spirituality' },
  { key: 'studyEnvironment', label: 'Preferred study environment' },
  { key: 'intendedMajor', label: 'Intended major / focus' },
  { key: 'vehicleToCampus', label: 'Transportation to campus' },
];

function formatAnswer(value: unknown): string {
  if (value === null || value === undefined) return '—';
  const s = String(value).trim();
  return s.length === 0 ? '—' : s;
}

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
        {QUESTIONNAIRE_FIELDS.map(({ key, label }) => (
          <div key={key} className="admin-q-row">
            <dt>{label}</dt>
            <dd>{formatAnswer(data[key])}</dd>
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

  const [tab, setTab] = useState<'unmatched' | 'matched'>('unmatched');
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
  const [manualA, setManualA] = useState('');
  const [manualB, setManualB] = useState('');

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

  useEffect(() => {
    if (tab === 'unmatched') void loadUnmatched();
    else void loadMatched();
  }, [tab, loadUnmatched, loadMatched]);

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

  const openPairQuestionnaires = async (partnerEmail: string, partnerName: string) => {
    if (!selectedEmail) return;
    const primaryName =
      unmatchedUsers.find((u) => u.email === selectedEmail)?.name ?? selectedEmail;
    setPairModalLoading(true);
    setError('');
    setPairModal(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resA, resB] = await Promise.all([
        fetch(`/api/admin/private-questionnaire?email=${encodeURIComponent(selectedEmail)}`, {
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
        primaryEmail: selectedEmail,
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  const manualMatch = async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/manual-match', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmailA: manualA.trim(), userEmailB: manualB.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Manual match failed');
      setManualA('');
      setManualB('');
      await loadUnmatched();
      await loadMatched();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  const pageTitle = tab === 'unmatched' ? 'Unmatched' : 'Matched';

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
        {loading && !pairModalLoading && <p className="profile-loading">Loading…</p>}

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
                <p style={{ color: '#666', margin: 0 }}>Select a student to see mutual likes.</p>
              )}
              {selectedEmail && (
                <ul className="admin-matching-scroll">
                  {possibleList.map((p) => (
                    <li key={p.id}>
                      <div className="admin-possible-card">
                        <strong>{p.partnerName}</strong>
                        <div style={{ fontSize: 13, color: '#555' }}>{p.partnerEmail}</div>
                        <div style={{ fontSize: 13, marginTop: 6 }}>
                          Similarity score: <strong>{p.similarityScore.toFixed(3)}</strong>
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

        {tab === 'matched' && (
          <div className="admin-matched-block">
            <h3 className="form-title" style={{ fontSize: '1.1rem' }}>
              Matched pairs
            </h3>
            <ul className="admin-matched-scroll">
              {matchedPairs.map((m) => (
                <li key={m.id}>
                  <strong>{m.user1.name}</strong> &amp; <strong>{m.user2.name}</strong>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {m.user1.email} — {m.user2.email}
                  </div>
                </li>
              ))}
            </ul>

            <div className="admin-manual-block">
              <h3 className="form-title" style={{ fontSize: '1.1rem', marginTop: 0 }}>
                Manual match
              </h3>
              <p style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>
                Create a roommate pair without a pending possible match.
              </p>
              <input
                className="password-input"
                placeholder="User email A"
                value={manualA}
                onChange={(e) => setManualA(e.target.value)}
                style={{ marginBottom: 8, display: 'block', maxWidth: 400 }}
              />
              <input
                className="password-input"
                placeholder="User email B"
                value={manualB}
                onChange={(e) => setManualB(e.target.value)}
                style={{ marginBottom: 8, display: 'block', maxWidth: 400 }}
              />
              <button type="button" className="submit-button" onClick={() => void manualMatch()}>
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
