/// file: ProfileCard.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Profile card: view/edit bio, photo, interests, daily life, pet peeves.

import { useCallback, useEffect, useState } from 'react';
import './ProfileCard.css';

type ProfileData = {
  userEmail: string;
  name?: string;
  bio: string | null;
  profilePicture: string | null;
  topInterests: string | null;
  dailyLife: string | null;
};

type PetPeeve = { id: number; petPeeve: string };

export default function ProfileCard({ email }: { email: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [petPeeves, setPetPeeves] = useState<PetPeeve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [editDailyLife, setEditDailyLife] = useState('');
  const [editPetPeeves, setEditPetPeeves] = useState<string[]>([]);
  const [petPeeveInput, setPetPeeveInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!email) return;
    setError('');
    try {
      const [pRes, ppRes] = await Promise.all([
        fetch(`/api/profiles?email=${encodeURIComponent(email)}`),
        fetch(`/api/petPeeves?email=${encodeURIComponent(email)}`),
      ]);
      if (!pRes.ok) throw new Error('Failed to load profile');
      if (!ppRes.ok) throw new Error('Failed to load pet peeves');
      const p = (await pRes.json()) as ProfileData;
      const pp = (await ppRes.json()) as PetPeeve[];
      setProfile(p);
      setPetPeeves(pp);
      setEditBio(p.bio ?? '');
      setEditInterests(p.topInterests ?? '');
      setEditDailyLife(p.dailyLife ?? '');
      setEditPetPeeves(pp.map((x) => x.petPeeve));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (!email) return;
    fetchProfile();
  }, [email, fetchProfile]);

  const addPetPeeve = () => {
    const v = petPeeveInput.trim();
    if (!v || editPetPeeves.includes(v)) return;
    setEditPetPeeves((prev) => [...prev, v]);
    setPetPeeveInput('');
  };

  const removeEditPetPeeve = (idx: number) => {
    setEditPetPeeves((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveEdit = async () => {
    if (!email) return;
    setError('');
    setSaving(true);
    try {
      const interests = editInterests.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
      const daily = editDailyLife.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
      const pRes = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          bio: editBio.trim() || undefined,
          topInterests: interests.length ? interests.join(', ') : undefined,
          dailyLife: daily.length ? daily.join(', ') : undefined,
        }),
      });
      if (!pRes.ok) {
        const d = await pRes.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error || 'Failed to save profile');
      }
      const existing = new Set(petPeeves.map((x) => x.petPeeve));
      const toAdd = editPetPeeves.filter((x) => !existing.has(x));
      const toRemove = petPeeves.filter((p) => !editPetPeeves.includes(p.petPeeve));
      for (const pp of toRemove) {
        await fetch(`/api/petPeeves?email=${encodeURIComponent(email)}&id=${pp.id}`, { method: 'DELETE' });
      }
      for (const pp of toAdd) {
        const res = await fetch('/api/petPeeves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, petPeeve: pp }),
        });
        if (!res.ok) throw new Error('Failed to save pet peeves');
      }
      await fetchProfile();
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditBio(profile?.bio ?? '');
    setEditInterests(profile?.topInterests ?? '');
    setEditDailyLife(profile?.dailyLife ?? '');
    setEditPetPeeves(petPeeves.map((x) => x.petPeeve));
    setPetPeeveInput('');
    setEditing(false);
    setError('');
  };

  if (!email) return null;

  return (
    <div className="profile-card-wrap">
      {loading && <div className="profile-loading">Loading profile…</div>}
      {error && <div className="profile-error">{error}</div>}
      {!loading && profile && (
        <div className="profile-card">
          <div className="profile-photo-section">
            <div className="profile-photo-placeholder">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" />
              ) : (
                'PHOTO'
              )}
            </div>
            {editing ? (
              <div className="profile-edit-form">
                <label>Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="A short intro..."
                  rows={5}
                />
              </div>
            ) : (
              <div className="profile-bio">
                {profile.bio || <span className="profile-empty">No bio yet.</span>}
              </div>
            )}
          </div>
          <div className="profile-details">
            {editing ? (
              <>
                <div className="profile-edit-form">
                  <label>Top interests (comma or line separated)</label>
                  <textarea
                    value={editInterests}
                    onChange={(e) => setEditInterests(e.target.value)}
                    placeholder="e.g. Football, Cooking, Reading"
                    rows={2}
                  />
                </div>
                <div className="profile-edit-form">
                  <label>Daily life (comma or line separated)</label>
                  <textarea
                    value={editDailyLife}
                    onChange={(e) => setEditDailyLife(e.target.value)}
                    placeholder="e.g. Early Bird, Study at the library"
                    rows={2}
                  />
                </div>
                <div className="profile-edit-form">
                  <label>Roommate pet peeves</label>
                  <div className="profile-petpeeve-list">
                    {editPetPeeves.map((pp, i) => (
                      <span key={i} className="profile-petpeeve-tag">
                        {pp}
                        <button type="button" onClick={() => removeEditPetPeeve(i)} aria-label={`Remove ${pp}`}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="profile-petpeeve-add">
                    <input
                      type="text"
                      value={petPeeveInput}
                      onChange={(e) => setPetPeeveInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPetPeeve())}
                      placeholder="Add one..."
                    />
                    <button type="button" className="btn-add-pp" onClick={addPetPeeve}>
                      Add
                    </button>
                  </div>
                </div>
                <div className="profile-edit-actions">
                  <button type="button" className="btn-cancel" onClick={cancelEdit} disabled={saving}>
                    Cancel
                  </button>
                  <button type="button" className="btn-save" onClick={saveEdit} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="profile-edit-form" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3>Top Interests</h3>
                    <button type="button" className="btn-edit-inline" onClick={() => setEditing(true)} aria-label="Edit profile">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                  <ul>
                    {(profile.topInterests ?? '').split(/[,]+/).map((s) => s.trim()).filter(Boolean).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {!profile.topInterests?.trim() && <li className="profile-empty">None added yet.</li>}
                  </ul>
                </div>
                <h3>Daily life</h3>
                <ul>
                  {(profile.dailyLife ?? '').split(/[,]+/).map((s) => s.trim()).filter(Boolean).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                  {!profile.dailyLife?.trim() && <li className="profile-empty">None added yet.</li>}
                </ul>
                <h3>Roommate Pet Peeves</h3>
                <ul>
                  {petPeeves.map((p) => (
                    <li key={p.id}>{p.petPeeve}</li>
                  ))}
                  {petPeeves.length === 0 && <li className="profile-empty">None added yet.</li>}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
