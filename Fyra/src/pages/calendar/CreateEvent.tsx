/// file: CreateEvent.tsx
/// Form to create a new calendar event.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import '../home.css';
import './createEvent.css';
import TimePicker from '../../components/calendar/TimePicker';

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addOneHour = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  const nextH = (h + 1) % 24;
  return `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { addEvent } = useEvents();
  const today = toYMD(new Date());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const titleValid = title.trim().length > 0;
  const endDateValid = endDate >= startDate;
  const timeValid = isAllDay || startTime < endTime;
  const canSubmit = titleValid && endDateValid && timeValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setSubmitError(null);
    if (!canSubmit || !user?.email) return;
    try {
      await addEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate,
        isAllDay,
        startTime: isAllDay ? null : startTime,
        endTime: isAllDay ? null : endTime,
        creatorId: user.email,
      });
      navigate('/calendar');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (endDate < value) setEndDate(value);
  };

  if (!user?.email) {
    navigate('/');
    return null;
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="logo-left">FYRA</div>
        <div className="page-title">New Event</div>
        <div className="header-right">
          <div className="university-text">Transylvania University</div>
          <button className="sign-out-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="main-content">
        <form className="create-event-form" onSubmit={handleSubmit}>
          {submitError && (
            <div className="field-error" style={{ marginBottom: 8 }}>{submitError}</div>
          )}
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Event title"
              className={touched && !titleValid ? 'invalid' : ''}
            />
            {touched && !titleValid && (
              <span className="field-error">Title is required</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start date *</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End date *</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {touched && !endDateValid && (
                <span className="field-error">End date must be on or after start date</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
              />
              All day
            </label>
          </div>

          {!isAllDay && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start time *</label>
                <TimePicker
                  id="startTime"
                  value={startTime}
                  minuteSelectAriaLabel="Start time, minutes"
                  periodSelectAriaLabel="Start time, AM or PM"
                  onChange={(next) => {
                    setStartTime(next);
                    setEndTime(addOneHour(next));
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTime">End time *</label>
                <TimePicker
                  id="endTime"
                  value={endTime}
                  minuteSelectAriaLabel="End time, minutes"
                  periodSelectAriaLabel="End time, AM or PM"
                  onChange={setEndTime}
                />
                {touched && !timeValid && (
                  <span className="field-error">End time must be after start time</span>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/calendar')}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={!canSubmit}>
              Create Event
            </button>
          </div>
        </form>
      </div>

      <div className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/matched')}>
          Home
        </button>
        <button className="nav-item" onClick={() => navigate('/calendar')}>
          Calendar
        </button>
        <button className="nav-item" onClick={() => navigate('/profile')}>
          Profile
        </button>
      </div>
    </div>
  );
};

export default CreateEvent;
