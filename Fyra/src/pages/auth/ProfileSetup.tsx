/// file: ProfileSetup.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Profile setup: 24 private questions (multi-page) + build profile (bio, interests, daily life, pet peeves).

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PROFILE_QUESTIONS } from '../../config/profileQuestions';
import type { AllergyCategory, SportCategory } from '../../config/profileQuestions';
import ProfileCardSetup from '../../components/ProfileCardSetup';
import './login.css';

const TOTAL_QUESTION_PAGES = PROFILE_QUESTIONS.length;

const ALLERGIES_DELIMITER = ' | ';
const SPORTS_DELIMITER = ' | ';
const CHECKLIST_DELIMITER = ' | ';

function parseChecklistValue(value: string): Set<string> {
  const selected = new Set<string>();
  (value || '')
    .split(CHECKLIST_DELIMITER)
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((p) => selected.add(p));
  return selected;
}

function buildChecklistValue(selected: Set<string>): string {
  return [...selected].join(CHECKLIST_DELIMITER);
}

function parseSportsValue(value: string): Set<string> {
  const selected = new Set<string>();
  (value || '')
    .split(SPORTS_DELIMITER)
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((p) => selected.add(p));
  return selected;
}

function buildSportsValue(selected: Set<string>, noneSelected: boolean): string {
  if (noneSelected) return 'None';
  return [...selected].filter((v) => v !== 'None').join(SPORTS_DELIMITER);
}

function parseAllergiesValue(value: string): { selected: Set<string>; otherText: string } {
  const selected = new Set<string>();
  let otherText = '';
  const parts = (value || '').split(ALLERGIES_DELIMITER).map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    if (p.startsWith('Other:')) {
      selected.add('Other');
      otherText = p.slice(6).trim();
    } else {
      selected.add(p);
    }
  }
  return { selected, otherText };
}

function buildAllergiesValue(selected: Set<string>, otherText: string): string {
  const parts: string[] = [];
  selected.forEach((v) => {
    if (v !== 'Other') parts.push(v);
  });
  if (selected.has('Other')) {
    parts.push(otherText ? `Other: ${otherText}` : 'Other');
  }
  return parts.join(ALLERGIES_DELIMITER);
}

export default function ProfileSetup() {
  const { user, setUser, preloadMatchingDeck } = useAuth();
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
  const [tagInputByQuestionId, setTagInputByQuestionId] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  const fetchBuildProfilePicture = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/profiles/profiles?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = (await res.json()) as { profilePicture?: string | null };
        setProfilePicture(data.profilePicture ?? null);
      }
    } catch {
      // keep null
    }
  }, [user?.email]);

  useEffect(() => {
    if (buildProfile) fetchBuildProfilePicture();
  }, [buildProfile, fetchBuildProfilePicture]);

  const isQuestionPage = !buildProfile;
  const currentQuestions = isQuestionPage ? PROFILE_QUESTIONS[page] : [];
  const isLastQuestionPage = isQuestionPage && page === TOTAL_QUESTION_PAGES - 1;

  const isBuildProfileValid =
    bio.trim().length > 0 &&
    topInterests.length > 0 &&
    dailyLife.length > 0 &&
    petPeeves.length > 0;

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
      if (q.id === 'animalAllergies' && q.type === 'allergies') {
        const { selected, otherText } = parseAllergiesValue(v);
        if (selected.has('Other') && !otherText.trim()) {
          setError('Please specify your other allergy.');
          return false;
        }
      }
      if (q.type === 'tags' && q.required) {
        const items = (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []) as string[];
        if (items.length === 0) {
          setError(`Please add at least one item for: ${q.label.replace(/\s*\*$/, '')}`);
          return false;
        }
      }
      if (q.type === 'checklist' && q.required) {
        const selected = parseChecklistValue(v);
        if (selected.size === 0) {
          setError(`Please select at least one option for: ${q.label.replace(/\s*\*$/, '')}`);
          return false;
        }
        const single = q.singleChoiceValue;
        const max = q.maxSelections ?? 3;
        if (single && selected.has(single)) {
          if (selected.size > 1) {
            setError(`Please select either ${single} or up to ${max} majors, not both.`);
            return false;
          }
        } else if (selected.size > max) {
          setError(`Please select at most ${max} options.`);
          return false;
        }
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
      const qRes = await fetch('/api/profiles/privateQuestionnaire', {
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
      const pRes = await fetch('/api/profiles/profiles', {
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
        const ppRes = await fetch('/api/profiles/petPeeves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, petPeeve: pp }),
        });
        if (!ppRes.ok) throw new Error('Failed to save pet peeves');
      }

      const compRes = await fetch('/api/profiles/profileSetupComplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (!compRes.ok) throw new Error('Failed to complete profile setup');

      setUser({ ...user, profileSetupComplete: true });
      await preloadMatchingDeck(user.email);
      navigate('/unmatched');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user?.email) return null;

  return (
    <div className="login-page login-page-profile-setup">
      <div className="logo-container">
        <h1 className="logo-text">FYRA</h1>
      </div>
      <div className={`form-card ${buildProfile ? 'form-card-profile-build' : ''}`}>
        <h2 className="form-title">
          {buildProfile ? 'Build your profile' : `Profile setup (${page + 1} of ${TOTAL_QUESTION_PAGES})`}
        </h2>
        <p className="form-title-subtitle">
          {buildProfile ? 'All information on this section will be on your public profile' : 'Your answers to this questionnaire will remain private'}
        </p>
        {error && <div className="error-message">{error}</div>}

        {buildProfile ? (
          <ProfileCardSetup
            email={user.email}
            profilePicture={profilePicture}
            onProfilePictureChange={setProfilePicture}
            bio={bio}
            onBioChange={setBio}
            topInterests={topInterests}
            topInterestsInput={topInterestsInput}
            onTopInterestsInputChange={setTopInterestsInput}
            onAddTopInterest={addTopInterest}
            onRemoveTopInterest={removeTopInterest}
            dailyLife={dailyLife}
            dailyLifeInput={dailyLifeInput}
            onDailyLifeInputChange={setDailyLifeInput}
            onAddDailyLifeItem={addDailyLifeItem}
            onRemoveDailyLifeItem={removeDailyLifeItem}
            petPeeves={petPeeves}
            petPeeveInput={petPeeveInput}
            onPetPeeveInputChange={setPetPeeveInput}
            onAddPetPeeve={addPetPeeve}
            onRemovePetPeeve={removePetPeeve}
          />
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
                {q.type === 'tags' && (() => {
                  const raw = (form[q.id] ?? '').trim();
                  const items = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
                  const tagInput = tagInputByQuestionId[q.id] ?? '';
                  const addTag = (newItem: string) => {
                    const v = newItem.trim();
                    if (!v || items.includes(v)) return;
                    updateForm(q.id, [...items, v].join(', '));
                    setTagInputByQuestionId((prev) => ({ ...prev, [q.id]: '' }));
                  };
                  const removeTag = (idx: number) => {
                    updateForm(
                      q.id,
                      items.filter((_, i) => i !== idx).join(', ')
                    );
                  };
                  return (
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input
                          type="text"
                          className="password-input"
                          placeholder={q.placeholder}
                          value={tagInput}
                          onChange={(e) =>
                            setTagInputByQuestionId((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          onKeyDown={(e) =>
                            e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))
                          }
                        />
                        <button type="button" className="submit-button" onClick={() => addTag(tagInput)}>
                          Add
                        </button>
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {items.map((item, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span>{item}</span>
                            <button type="button" className="back-button" onClick={() => removeTag(i)}>
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
                {q.type === 'allergies' && q.allergyCategories && (() => {
                  const raw = (form[q.id] ?? '').trim();
                  const { selected, otherText } = parseAllergiesValue(raw);
                  const noneSelected = selected.has('None');
                  const toggle = (value: string) => {
                    if (value === 'None') {
                      updateForm(q.id, buildAllergiesValue(new Set(['None']), ''));
                      return;
                    }
                    const next = new Set(selected);
                    next.delete('None');
                    if (next.has(value)) next.delete(value);
                    else next.add(value);
                    updateForm(q.id, buildAllergiesValue(next, otherText));
                  };
                  const setOther = (text: string) => {
                    const nextSelected = new Set(selected);
                    if (text.trim()) nextSelected.add('Other');
                    else nextSelected.delete('Other');
                    updateForm(q.id, buildAllergiesValue(nextSelected, text));
                  };
                  const allOptions = (q.allergyCategories as AllergyCategory[]).flatMap((cat) => cat.options);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {allOptions.map((opt) => (
                        <label
                          key={opt.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            fontWeight: 'normal',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={opt.value === 'None' ? noneSelected : selected.has(opt.value) || (opt.value === 'Other' && !!otherText.trim())}
                            onChange={() => toggle(opt.value)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                      {(selected.has('Other') || otherText) && (
                        <input
                          type="text"
                          className="password-input"
                          placeholder="Describe your allergy..."
                          value={otherText}
                          onChange={(e) => setOther(e.target.value)}
                          style={{ marginLeft: 24, maxWidth: 320 }}
                        />
                      )}
                    </div>
                  );
                })()}
                {q.type === 'sports' && q.sportCategories && (() => {
                  const raw = (form[q.id] ?? '').trim();
                  const selected = parseSportsValue(raw);
                  const noneSelected = selected.has('None');
                  const toggle = (value: string) => {
                    if (value === 'None') {
                      updateForm(q.id, 'None');
                      return;
                    }
                    const next = new Set(selected);
                    next.delete('None');
                    if (next.has(value)) next.delete(value);
                    else next.add(value);
                    updateForm(q.id, buildSportsValue(next, false));
                  };
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(q.sportCategories as SportCategory[]).map((cat, cidx) => (
                        <div key={cidx}>
                          {cat.category && (
                            <div style={{ fontWeight: 600, marginBottom: 6, color: '#555' }}>
                              {cat.category}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {cat.options.map((opt) => (
                              <label
                                key={opt.value}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  cursor: 'pointer',
                                  fontWeight: 'normal',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={opt.value === 'None' ? noneSelected : selected.has(opt.value)}
                                  onChange={() => toggle(opt.value)}
                                />
                                <span>{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {q.type === 'checklist' && q.checklistOptions && (() => {
                  const raw = (form[q.id] ?? '').trim();
                  const selected = parseChecklistValue(raw);
                  const max = q.maxSelections ?? 3;
                  const single = q.singleChoiceValue;
                  const toggle = (value: string) => {
                    const next = new Set(selected);
                    if (value === single) {
                      updateForm(q.id, single);
                      return;
                    }
                    next.delete(single ?? '');
                    if (next.has(value)) next.delete(value);
                    else if (next.size < max) next.add(value);
                    updateForm(q.id, buildChecklistValue(next));
                  };
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: 14, color: '#666' }}>
                        Select up to {max}.
                      </p>
                      <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.checklistOptions.map((opt) => (
                        <label
                          key={opt.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            fontWeight: 'normal',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(opt.value)}
                            onChange={() => toggle(opt.value)}
                            disabled={
                              opt.value !== single &&
                              !selected.has(opt.value) &&
                              selected.size >= max &&
                              !selected.has(single ?? '')
                            }
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}

        <div className="form-actions-bottom">
          <button type="button" className="back-button" onClick={handleBack} disabled={isSubmitting}>
            Back
          </button>
          <button
            type="button"
            className="submit-button"
            onClick={handleNext}
            disabled={isSubmitting || (buildProfile && !isBuildProfileValid)}
          >
            {isSubmitting ? 'Saving...' : buildProfile ? 'Finish' : isLastQuestionPage ? 'Continue' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
