/// file: EditEvent.tsx
/// Form to edit an existing calendar event.

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import '../home.css';
import './createEvent.css';

const EditEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const { events, updateEvent } = useEvents();
  const event = events.find((e) => e.id === id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? '');
      setStartDate(event.startDate);
      setEndDate(event.endDate);
      setIsAllDay(event.isAllDay);
      setStartTime(event.startTime ?? '09:00');
      setEndTime(event.endTime ?? '10:00');
    }
  }, [event]);

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
    if (!canSubmit || !id) return;
    try {
      await updateEvent(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate,
        isAllDay,
        startTime: isAllDay ? null : startTime,
        endTime: isAllDay ? null : endTime,
      });
      navigate('/calendar');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update event');
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (endDate < value) setEndDate(value);
  };

  const addOneHour = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const nextH = (h + 1) % 24;
    return `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  if (!user?.email) {
    navigate('/');
    return null;
  }

  if (!event) {
    return (
      <div className="home-page">
        <div className="home-header">
          <div className="logo-left">FYRA</div>
          <div className="page-title">Event not found</div>
          <div className="header-right">
            <button className="sign-out-button" onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>
        <div className="main-content">
          <p>This event may have been deleted.</p>
          <button className="submit-button" onClick={() => navigate('/calendar')}>
            Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="logo-left">FYRA</div>
        <div className="page-title">Edit Event</div>
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
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                  const next = e.target.value;
                  setStartTime(next);
                  setEndTime(addOneHour(next));
                }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTime">End time *</label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
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
              Save Changes
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

export default EditEvent;
