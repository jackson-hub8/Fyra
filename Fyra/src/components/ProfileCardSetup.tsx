/// Profile card used during profile setup: same layout as ProfileCard, always editable, controlled.

import { useRef, useState } from 'react';
import './ProfileCard.css';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

type Props = {
  email: string;
  name: string;
  profilePicture: string | null;
  onProfilePictureChange: (url: string | null) => void;
  bio: string;
  onBioChange: (value: string) => void;
  topInterests: string[];
  topInterestsInput: string;
  onTopInterestsInputChange: (value: string) => void;
  onAddTopInterest: () => void;
  onRemoveTopInterest: (index: number) => void;
  dailyLife: string[];
  dailyLifeInput: string;
  onDailyLifeInputChange: (value: string) => void;
  onAddDailyLifeItem: () => void;
  onRemoveDailyLifeItem: (index: number) => void;
  petPeeves: string[];
  petPeeveInput: string;
  onPetPeeveInputChange: (value: string) => void;
  onAddPetPeeve: () => void;
  onRemovePetPeeve: (index: number) => void;
};

export default function ProfileCardSetup({
  email,
  name,
  profilePicture,
  onProfilePictureChange,
  bio,
  onBioChange,
  topInterests,
  topInterestsInput,
  onTopInterestsInputChange,
  onAddTopInterest,
  onRemoveTopInterest,
  dailyLife,
  dailyLifeInput,
  onDailyLifeInputChange,
  onAddDailyLifeItem,
  onRemoveDailyLifeItem,
  petPeeves,
  petPeeveInput,
  onPetPeeveInputChange,
  onAddPetPeeve,
  onRemovePetPeeve,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !email) return;
    setPhotoError('');
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Use JPEG, PNG, or WebP.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
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
        body: JSON.stringify({ email, photo: base64, contentType: file.type }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; photoUrl?: string };
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      onProfilePictureChange(data.photoUrl ?? null);
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
      onProfilePictureChange(null);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <div className="profile-card-wrap">
      <div className="profile-card">
        <div className="profile-photo-section">
          <div className="profile-photo-placeholder">
            {profilePicture ? <img src={profilePicture} alt="Profile" /> : 'PHOTO'}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
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
              {photoUploading ? 'Uploading…' : profilePicture ? 'Change photo' : 'Upload photo'}
            </button>
            {profilePicture && (
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
          <div className="profile-card-name">{name.trim() || email}</div>
          <div className="profile-edit-form">
            <label>Bio *</label>
            <textarea
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder="A short intro, e.g. major, hometown, interests..."
              rows={5}
            />
          </div>
        </div>
        <div className="profile-details">
          <div className="profile-edit-form">
            <label>Top interests *</label>
            <div className="profile-petpeeve-list">
              {topInterests.map((item, i) => (
                <span key={i} className="profile-petpeeve-tag">
                  {item}
                  <button type="button" onClick={() => onRemoveTopInterest(i)} aria-label={`Remove ${item}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="profile-petpeeve-add">
              <input
                type="text"
                value={topInterestsInput}
                onChange={(e) => onTopInterestsInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTopInterest())}
                placeholder="Add one..."
              />
              <button type="button" className="btn-add-pp" onClick={onAddTopInterest}>
                Add
              </button>
            </div>
          </div>
          <div className="profile-edit-form">
            <label>Daily life *</label>
            <div className="profile-petpeeve-list">
              {dailyLife.map((item, i) => (
                <span key={i} className="profile-petpeeve-tag">
                  {item}
                  <button type="button" onClick={() => onRemoveDailyLifeItem(i)} aria-label={`Remove ${item}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="profile-petpeeve-add">
              <input
                type="text"
                value={dailyLifeInput}
                onChange={(e) => onDailyLifeInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddDailyLifeItem())}
                placeholder="Add one..."
              />
              <button type="button" className="btn-add-pp" onClick={onAddDailyLifeItem}>
                Add
              </button>
            </div>
          </div>
          <div className="profile-edit-form">
            <label>Roommate pet peeves *</label>
            <div className="profile-petpeeve-list">
              {petPeeves.map((pp, i) => (
                <span key={i} className="profile-petpeeve-tag">
                  {pp}
                  <button type="button" onClick={() => onRemovePetPeeve(i)} aria-label={`Remove ${pp}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="profile-petpeeve-add">
              <input
                type="text"
                value={petPeeveInput}
                onChange={(e) => onPetPeeveInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddPetPeeve())}
                placeholder="Add one..."
              />
              <button type="button" className="btn-add-pp" onClick={onAddPetPeeve}>
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
