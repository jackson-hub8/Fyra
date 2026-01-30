/// file: ProfileSetup.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Profile setup: 24 private questions (multi-page) + build profile (bio, interests, daily life, pet peeves).

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PROFILE_QUESTIONS } from '../config/profileQuestions';
import './login.css';

const TOTAL_QUESTION_PAGES = PROFILE_QUESTIONS.length;

function formatPhone(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function ProfileSetup() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [buildProfile, setBuildProfile] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [bio, setBio] = useState('');
  const [topInterests, setTopInterests] = useState('');
  const [dailyLife, setDailyLife] = useState('');
  const [petPeeves, setPetPeeves] = useState<string[]>([]);
  const [petPeeveInput, setPetPeeveInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  const isQuestionPage = !buildProfile;
  const currentQuestions = isQuestionPage ? PROFILE_QUESTIONS[page] : [];
  const isLastQuestionPage = isQuestionPage && page === TOTAL_QUESTION_PAGES - 1;

  const updateForm = (id: string, value: string) => {
    setForm((prev) => ({ ...prev, [id]: value }));
    setError('');
  };

  const validateQuestionPage = () => {
    for (const q of currentQuestions) {
      const v = (form[q.id] ?? '').trim();
      if (q.required && !v) {
        setError(`Please answer: ${q.label.replace(/\s*\*$/, '')}`);
        return false;
      }
      if (q.id === 'cellPhoneNumber') {
        const digits = v.replace(/\D/g, '');
        if (digits.length !== 10) {
          setError('Enter a valid 10-digit phone number (XXX-XXX-XXXX).');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (isQuestionPage) {
      if (!validateQuestionPage()) return;
      if (isLastQuestionPage) {
        setBuildProfile(true);
        return;
      }
      setPage((p) => p + 1);
      return;
    }
    // Build profile page: submit all
    handleSubmit();
  };

  const handleBack = () => {
    setError('');
    if (buildProfile) {
      setBuildProfile(false);
      setPage(TOTAL_QUESTION_PAGES - 1);
      return;
    }
    if (page > 0) setPage((p) => p - 1);
    else navigate('/');
  };

  const addPetPeeve = () => {
    const v = petPeeveInput.trim();
    if (!v || petPeeves.includes(v)) return;
    setPetPeeves((prev) => [...prev, v]);
    setPetPeeveInput('');
  };

  const removePetPeeve = (idx: number) => {
    setPetPeeves((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!user?.email) return;
    setError('');
    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = { email: user.email };
      for (const group of PROFILE_QUESTIONS) {
        for (const q of group) {
          const v = (form[q.id] ?? '').trim();
          if (v) payload[q.id] = v;
        }
      }
      const qRes = await fetch('/api/privateQuestionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!qRes.ok) {
        const d = await qRes.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save questionnaire');
      }

      const interests = topInterests.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
      const daily = dailyLife.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
      const pRes = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          bio: bio.trim() || undefined,
          topInterests: interests.length ? interests.join(', ') : undefined,
          dailyLife: daily.length ? daily.join(', ') : undefined,
        }),
      });
      if (!pRes.ok) {
        const d = await pRes.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save profile');
      }

      for (const pp of petPeeves) {
        const ppRes = await fetch('/api/petPeeves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, petPeeve: pp }),
        });
        if (!ppRes.ok) throw new Error('Failed to save pet peeves');
      }

      const compRes = await fetch('/api/profileSetupComplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (!compRes.ok) throw new Error('Failed to complete profile setup');

      setUser({ ...user, profileSetupComplete: true });
      navigate('/unmatched');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user?.email) return null;

  return (
    <div className="login-page">
      <div className="logo-container">
        <h1 className="logo-text">FYRA</h1>
      </div>
      <div className="form-card">
        <h2 className="form-title">
          {buildProfile ? 'Build your profile' : `Profile setup (${page + 1} of ${TOTAL_QUESTION_PAGES})`}
        </h2>
        {error && <div className="error-message">{error}</div>}

        {buildProfile ? (
          <div className="account-form">
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Bio</label>
            <textarea
              className="password-input"
              placeholder="A short intro, e.g. major, hometown, interests..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              style={{ resize: 'vertical', minHeight: 80 }}
            />
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Top interests (comma or line separated)</label>
            <textarea
              className="password-input"
              placeholder="e.g. Football, Cooking, Reading, History"
              value={topInterests}
              onChange={(e) => setTopInterests(e.target.value)}
              rows={2}
              style={{ resize: 'vertical' }}
            />
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Daily life (comma or line separated)</label>
            <textarea
              className="password-input"
              placeholder="e.g. Disorganized but not messy, Early Bird, Study at the library"
              value={dailyLife}
              onChange={(e) => setDailyLife(e.target.value)}
              rows={2}
              style={{ resize: 'vertical' }}
            />
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Roommate pet peeves</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                className="password-input"
                placeholder="e.g. Loud chewers"
                value={petPeeveInput}
                onChange={(e) => setPetPeeveInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPetPeeve())}
              />
              <button type="button" className="submit-button" onClick={addPetPeeve}>
                Add
              </button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
              {petPeeves.map((pp, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span>{pp}</span>
                  <button type="button" className="back-button" onClick={() => removePetPeeve(i)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="account-form">
            {currentQuestions.map((q) => (
              <div key={q.id} style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>{q.label}</label>
                {q.type === 'select' && (
                  <select
                    className="password-input"
                    value={form[q.id] ?? ''}
                    onChange={(e) => updateForm(q.id, e.target.value)}
                  >
                    {(q.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
                {q.type === 'text' && (
                  <input
                    type="text"
                    className="password-input"
                    placeholder={q.placeholder}
                    value={form[q.id] ?? ''}
                    onChange={(e) => updateForm(q.id, e.target.value)}
                  />
                )}
                {q.type === 'tel' && (
                  <input
                    type="tel"
                    className="password-input"
                    placeholder={q.placeholder ?? 'XXX-XXX-XXXX'}
                    value={form[q.id] ?? ''}
                    onChange={(e) => updateForm(q.id, formatPhone(e.target.value))}
                  />
                )}
                {q.type === 'textarea' && (
                  <textarea
                    className="password-input"
                    placeholder={q.placeholder}
                    value={form[q.id] ?? ''}
                    onChange={(e) => updateForm(q.id, e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="form-actions-bottom">
          <button type="button" className="back-button" onClick={handleBack} disabled={isSubmitting}>
            Back
          </button>
          <button type="button" className="submit-button" onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : buildProfile ? 'Finish' : isLastQuestionPage ? 'Continue' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
