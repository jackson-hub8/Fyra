import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../auth/login.css';

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

export default function AdminMatching() {
  const { user, signOut } = useAuth();
  const token = user?.adminToken ?? '';

  const [tab, setTab] = useState<'unmatched' | 'matched'>('unmatched');
  const [unmatchedUsers, setUnmatchedUsers] = useState<UnmatchedUser[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [possibleList, setPossibleList] = useState<PossibleRow[]>([]);
  const [questionnaire, setQuestionnaire] = useState<Record<string, unknown> | null>(null);
  const [qEmail, setQEmail] = useState<string | null>(null);
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
    setQuestionnaire(null);
    setQEmail(null);
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

  const loadQuestionnaire = async (email: string) => {
    setQEmail(email);
    setError('');
    try {
      const res = await fetch(`/api/admin/private-questionnaire?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { questionnaire?: Record<string, unknown>; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setQuestionnaire(data.questionnaire ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setQuestionnaire(null);
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

  return (
    <div className="login-page">
      <div className="logo-container">
        <h1 className="logo-text">FYRA</h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, opacity: 0.85 }}>Admin — matching oversight</p>
      </div>

      <div className="form-card" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={tab === 'unmatched' ? 'submit-button' : 'back-button'}
            onClick={() => setTab('unmatched')}
          >
            Unmatched
          </button>
          <button
            type="button"
            className={tab === 'matched' ? 'submit-button' : 'back-button'}
            onClick={() => setTab('matched')}
          >
            Matched
          </button>
          <button type="button" className="back-button" style={{ marginLeft: 'auto' }} onClick={() => signOut()}>
            Sign out
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {loading && <p style={{ marginTop: 8 }}>Loading…</p>}

        {tab === 'unmatched' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <h3 className="form-title" style={{ fontSize: '1.1rem' }}>
                Unmatched students
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, maxHeight: 360, overflowY: 'auto' }}>
                {unmatchedUsers.map((u) => (
                  <li key={u.email} style={{ marginBottom: 8 }}>
                    <button
                      type="button"
                      className={selectedEmail === u.email ? 'submit-button' : 'back-button'}
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => selectUser(u.email)}
                    >
                      {u.name}
                      <span style={{ opacity: 0.75, fontSize: 12, display: 'block' }}>{u.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="form-title" style={{ fontSize: '1.1rem' }}>
                Possible matches (by score)
              </h3>
              {!selectedEmail && <p style={{ color: '#666' }}>Select a student to see mutual likes.</p>}
              {selectedEmail && (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {possibleList.map((p) => (
                    <li
                      key={p.id}
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 10,
                      }}
                    >
                      <strong>{p.partnerName}</strong>
                      <div style={{ fontSize: 13, color: '#555' }}>{p.partnerEmail}</div>
                      <div style={{ fontSize: 13, marginTop: 6 }}>
                        Score: <strong>{p.similarityScore.toFixed(3)}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        <button type="button" className="submit-button" onClick={() => approve(p.id)}>
                          Approve
                        </button>
                        <button type="button" className="back-button" onClick={() => reject(p.id)}>
                          Reject
                        </button>
                        <button type="button" className="back-button" onClick={() => loadQuestionnaire(p.partnerEmail)}>
                          View questionnaire
                        </button>
                      </div>
                    </li>
                  ))}
                  {possibleList.length === 0 && <p style={{ color: '#666' }}>No possible matches yet.</p>}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === 'matched' && (
          <div>
            <h3 className="form-title" style={{ fontSize: '1.1rem' }}>
              Matched pairs
            </h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {matchedPairs.map((m) => (
                <li
                  key={m.id}
                  style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}
                >
                  <strong>{m.user1.name}</strong> &amp; <strong>{m.user2.name}</strong>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {m.user1.email} — {m.user2.email}
                  </div>
                </li>
              ))}
            </ul>

            <h3 className="form-title" style={{ fontSize: '1.1rem', marginTop: 24 }}>
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
        )}

        {questionnaire && qEmail && (
          <div style={{ marginTop: 24, padding: 16, background: '#f8f8f8', borderRadius: 8, maxHeight: 320, overflowY: 'auto' }}>
            <h4 style={{ marginTop: 0 }}>Private questionnaire — {qEmail}</h4>
            <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(questionnaire, null, 2)}
            </pre>
            <button type="button" className="back-button" onClick={() => setQuestionnaire(null)}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
