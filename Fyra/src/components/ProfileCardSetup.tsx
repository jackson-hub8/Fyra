/// Profile card used during profile setup: same layout as ProfileCard, always editable, controlled.

import './ProfileCard.css';

type Props = {
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
  return (
    <div className="profile-card-wrap">
      <div className="profile-card">
        <div className="profile-photo-section">
          <div className="profile-photo-placeholder">PHOTO</div>
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
