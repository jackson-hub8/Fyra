/// file: ProfileCard.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Profile card: view/edit bio, photo, interests, daily life, pet peeves.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  isAllowedProfilePhotoFile,
  MAX_PROFILE_PHOTO_BYTES,
  profilePhotoContentTypeForUpload,
} from '../lib/profilePhotoUpload';
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

type ProfileCardProps = { email: string; readOnly?: boolean };

export default function ProfileCard({ email, readOnly = false }: ProfileCardProps) {
  const { peekProfileCardCache } = useAuth();
  const cached = email ? peekProfileCardCache(email) : null;
  const [profile, setProfile] = useState<ProfileData | null>(() => cached?.profile ?? null);
  const [petPeeves, setPetPeeves] = useState<PetPeeve[]>(() => cached?.petPeeves ?? []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editDailyLife, setEditDailyLife] = useState<string[]>([]);
  const [topInterestsInput, setTopInterestsInput] = useState('');
  const [dailyLifeInput, setDailyLifeInput] = useState('');
  const [editPetPeeves, setEditPetPeeves] = useState<string[]>([]);
  const [petPeeveInput, setPetPeeveInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    if (!email) return;
    setError('');
    try {
      const [pRes, ppRes] = await Promise.all([
        fetch(`/api/profiles/profiles?email=${encodeURIComponent(email)}`),
        fetch(`/api/profiles/petPeeves?email=${encodeURIComponent(email)}`),
      ]);
      if (!pRes.ok) throw new Error('Failed to load profile');
      if (!ppRes.ok) throw new Error('Failed to load pet peeves');
      const p = (await pRes.json()) as ProfileData;
      const pp = (await ppRes.json()) as PetPeeve[];
      setProfile(p);
      setPetPeeves(pp);
      setEditBio(p.bio ?? '');
      setEditInterests((p.topInterests ?? '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean));
      setEditDailyLife((p.dailyLife ?? '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean));
      setEditPetPeeves(pp.map((x) => x.petPeeve));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (!email) return;
    if (readOnly) {
      const cachedNow = peekProfileCardCache(email);
      if (cachedNow) {
        setProfile(cachedNow.profile);
        setPetPeeves(cachedNow.petPeeves);
        setEditBio(cachedNow.profile.bio ?? '');
        setEditInterests(
          (cachedNow.profile.topInterests ?? '')
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        );
        setEditDailyLife(
          (cachedNow.profile.dailyLife ?? '')
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        );
        setEditPetPeeves(cachedNow.petPeeves.map((x) => x.petPeeve));
        setLoading(false);
        return;
      }
    }
    fetchProfile();
  }, [email, readOnly, fetchProfile, peekProfileCardCache]);

  const addTopInterest = () => {
    const v = topInterestsInput.trim();
    if (!v || editInterests.includes(v)) return;
    setEditInterests((prev) => [...prev, v]);
    setTopInterestsInput('');
  };

  const removeTopInterest = (idx: number) => {
    setEditInterests((prev) => prev.filter((_, i) => i !== idx));
  };

  const addDailyLifeItem = () => {
    const v = dailyLifeInput.trim();
    if (!v || editDailyLife.includes(v)) return;
    setEditDailyLife((prev) => [...prev, v]);
    setDailyLifeInput('');
  };

  const removeDailyLifeItem = (idx: number) => {
    setEditDailyLife((prev) => prev.filter((_, i) => i !== idx));
  };

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
      const interests = editInterests;
      const daily = editDailyLife;
      const pRes = await fetch('/api/profiles/profiles', {
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
        await fetch(`/api/profiles/petPeeves?email=${encodeURIComponent(email)}&id=${pp.id}`, { method: 'DELETE' });
      }
      for (const pp of toAdd) {
        const res = await fetch('/api/profiles/petPeeves', {
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
    setEditInterests((profile?.topInterests ?? '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean));
    setEditDailyLife((profile?.dailyLife ?? '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean));
    setTopInterestsInput('');
    setDailyLifeInput('');
    setEditPetPeeves(petPeeves.map((x) => x.petPeeve));
    setPetPeeveInput('');
    setEditing(false);
    setError('');
    setPhotoError('');
  };

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !email) return;
    setPhotoError('');
    if (!isAllowedProfilePhotoFile(file)) {
      setPhotoError('Use JPEG, PNG, WebP, or HEIC.');
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setPhotoError('File too large. Max 4MB.');
      return;
    }
    setPhotoUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const data = (r.result as string) ?? '';
          const i = data.indexOf(',');
          resolve(i >= 0 ? data.slice(i + 1) : data);
        };
        r.onerror = () => reject(new Error('Read failed'));
        r.readAsDataURL(file);
      });
      const res = await fetch('/api/profiles/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          photo: base64,
          contentType: profilePhotoContentTypeForUpload(file),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; photoUrl?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Upload failed');
      }
      setProfile((prev) => (prev ? { ...prev, profilePicture: data.photoUrl ?? prev.profilePicture } : null));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!email) return;
    setPhotoError('');
    setPhotoUploading(true);
    try {
      const res = await fetch(`/api/profiles/photo?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Remove failed');
      }
      setProfile((prev) => (prev ? { ...prev, profilePicture: null } : null));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setPhotoUploading(false);
    }
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
            {!readOnly && editing && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="profile-photo-file-input"
                  aria-label="Upload profile photo"
                  onChange={handlePhotoFile}
                />
                <div className="profile-photo-actions">
                  <button
                    type="button"
                    className="btn-photo-upload"
                    disabled={photoUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoUploading ? 'Uploading…' : profile.profilePicture ? 'Change photo' : 'Upload photo'}
                  </button>
                  {profile.profilePicture && (
                    <button
                      type="button"
                      className="btn-photo-remove"
                      disabled={photoUploading}
                      onClick={handleRemovePhoto}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
                {photoError && <div className="profile-photo-error">{photoError}</div>}
              </>
            )}
            <div className="profile-card-name">{profile.name?.trim() || profile.userEmail}</div>
            {!readOnly && editing ? (
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
            {!readOnly && editing ? (
              <>
                <div className="profile-edit-form">
                  <label>Top interests</label>
                  <div className="profile-petpeeve-list">
                    {editInterests.map((item, i) => (
                      <span key={i} className="profile-petpeeve-tag">
                        {item}
                        <button type="button" onClick={() => removeTopInterest(i)} aria-label={`Remove ${item}`}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="profile-petpeeve-add">
                    <input
                      type="text"
                      value={topInterestsInput}
                      onChange={(e) => setTopInterestsInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopInterest())}
                      placeholder="Add one..."
                    />
                    <button type="button" className="btn-add-pp" onClick={addTopInterest}>
                      Add
                    </button>
                  </div>
                </div>
                <div className="profile-edit-form">
                  <label>Daily life</label>
                  <div className="profile-petpeeve-list">
                    {editDailyLife.map((item, i) => (
                      <span key={i} className="profile-petpeeve-tag">
                        {item}
                        <button type="button" onClick={() => removeDailyLifeItem(i)} aria-label={`Remove ${item}`}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="profile-petpeeve-add">
                    <input
                      type="text"
                      value={dailyLifeInput}
                      onChange={(e) => setDailyLifeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDailyLifeItem())}
                      placeholder="Add one..."
                    />
                    <button type="button" className="btn-add-pp" onClick={addDailyLifeItem}>
                      Add
                    </button>
                  </div>
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
              </>
            ) : (
              <>
                <div className="profile-edit-form" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3>Top Interests</h3>
                    {!readOnly && (
                      <button type="button" className="btn-edit-inline" onClick={() => setEditing(true)} aria-label="Edit profile">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                    )}
                  </div>
                  <ul>
                    {(profile.topInterests ?? '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {!profile.topInterests?.trim() && <li className="profile-empty">None added yet.</li>}
                  </ul>
                </div>
                <h3>Daily life</h3>
                <ul>
                  {(profile.dailyLife ?? '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).map((item, i) => (
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
          {!readOnly && editing && (
            <div className="profile-edit-actions">
              <button type="button" className="btn-cancel" onClick={cancelEdit} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn-save" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
