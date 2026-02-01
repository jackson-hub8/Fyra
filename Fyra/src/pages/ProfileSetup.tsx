/// file: ProfileSetup.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Profile setup: 24 private questions (multi-page) + build profile (bio, interests, daily life, pet peeves).

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PROFILE_QUESTIONS } from '../config/profileQuestions';
import './login.css';

const TOTAL_QUESTION_PAGES = PROFILE_QUESTIONS.length;

export default function ProfileSetup() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [buildProfile, setBuildProfile] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [bio, setBio] = useState('');
  const [topInterests, setTopInterests] = useState<string[]>([]);
  const [topInterestsInput, setTopInterestsInput] = useState('');
  const [dailyLife, setDailyLife] = useState<string[]>([]);
  const [dailyLifeInput, setDailyLifeInput] = useState('');
  const [petPeeves, setPetPeeves] = useState<string[]>([]);
  const [adaAccommodationsDetails, setAdaAccommodationsDetails] = useState('');
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
      if (q.id === 'adaAccommodations' && v === 'Yes' && !adaAccommodationsDetails.trim()) {
        setError('Please specify your accommodations.');
        return false;
      }
    }
    return true;
  };

  const validateBuildProfile = () => {
    if (!bio.trim()) {
      setError('Please provide a bio.');
      return false;
    }
    if (topInterests.length === 0) {
      setError('Please add at least one top interest.');
      return false;
    }
    if (dailyLife.length === 0) {
      setError('Please add at least one daily life item.');
      return false;
    }
    if (petPeeves.length === 0) {
      setError('Please add at least one roommate pet peeve.');
      return false;
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
    // Build profile page: validate then submit
    if (!validateBuildProfile()) return;
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

  const addTopInterest = () => {
    const v = topInterestsInput.trim();
    if (!v || topInterests.includes(v)) return;
    setTopInterests((prev) => [...prev, v]);
    setTopInterestsInput('');
  };

  const removeTopInterest = (idx: number) => {
    setTopInterests((prev) => prev.filter((_, i) => i !== idx));
  };

  const addDailyLifeItem = () => {
    const v = dailyLifeInput.trim();
    if (!v || dailyLife.includes(v)) return;
    setDailyLife((prev) => [...prev, v]);
    setDailyLifeInput('');
  };

  const removeDailyLifeItem = (idx: number) => {
    setDailyLife((prev) => prev.filter((_, i) => i !== idx));
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
          let v = (form[q.id] ?? '').trim();
          if (q.id === 'adaAccommodations' && v === 'Yes') {
            v = adaAccommodationsDetails.trim() || 'Yes';
          }
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

      const interests = topInterests;
      const daily = dailyLife;
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
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Bio *</label>
            <textarea
              className="password-input"
              placeholder="A short intro, e.g. major, hometown, interests..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              style={{ resize: 'vertical', minHeight: 80 }}
            />
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Top interests *</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                className="password-input"
                placeholder="e.g. Football, Cooking, Reading"
                value={topInterestsInput}
                onChange={(e) => setTopInterestsInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopInterest())}
              />
              <button type="button" className="submit-button" onClick={addTopInterest}>
                Add
              </button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
              {topInterests.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span>{item}</span>
                  <button type="button" className="back-button" onClick={() => removeTopInterest(i)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Daily life *</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                className="password-input"
                placeholder="e.g. Disorganized but not messy, Early Bird"
                value={dailyLifeInput}
                onChange={(e) => setDailyLifeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDailyLifeItem())}
              />
              <button type="button" className="submit-button" onClick={addDailyLifeItem}>
                Add
              </button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
              {dailyLife.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span>{item}</span>
                  <button type="button" className="back-button" onClick={() => removeDailyLifeItem(i)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Roommate pet peeves *</label>
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
                  <>
                    <select
                      className="password-input"
                      value={form[q.id] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateForm(q.id, val);
                        if (q.id === 'adaAccommodations' && val === 'No') setAdaAccommodationsDetails('');
                      }}
                    >
                      {(q.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {q.id === 'adaAccommodations' && (form[q.id] ?? '') === 'Yes' && (
                      <textarea
                        className="password-input"
                        placeholder="Please specify your accommodations..."
                        value={adaAccommodationsDetails}
                        onChange={(e) => setAdaAccommodationsDetails(e.target.value)}
                        rows={3}
                        style={{ resize: 'vertical', marginTop: 8, display: 'block' }}
                      />
                    )}
                  </>
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
