/// file: UnmatchedMatching.tsx
/// Matching page: swipeable profile cards, like/pass buttons, only unmatched users.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileCard from '../../components/ProfileCard';
import './UnmatchedMatching.css';

const SWIPE_THRESHOLD_PX = 80;

export default function UnmatchedMatching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [swiping, setSwiping] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef<number>(0);
  const dragOffsetRef = useRef<number>(0);

  const currentEmail = deck[currentIndex] ?? null;

  const fetchDeck = useCallback(async () => {
    if (!user?.email) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/matching/deck?email=${encodeURIComponent(user.email)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed to load deck');
      }
      const data = (await res.json()) as { deck: string[] };
      setDeck(Array.isArray(data.deck) ? data.deck : []);
      setCurrentIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load profiles');
      setDeck([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) {
      navigate('/');
      return;
    }
    fetchDeck();
  }, [user?.email, navigate, fetchDeck]);

  const performSwipe = useCallback(
    async (action: 'like' | 'pass') => {
      if (!user?.email || !currentEmail || swiping) return;
      setSwiping(true);
      setError('');
      try {
        const res = await fetch('/api/matching/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            swiperEmail: user.email,
            targetEmail: currentEmail,
            action,
          }),
        });
        const data = await res.json().catch(() => ({})) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Swipe failed');
        setCurrentIndex((i) => i + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        setSwiping(false);
        setDragOffset(0);
      }
    },
    [user?.email, currentEmail, swiping]
  );

  const handlePass = useCallback(() => performSwipe('pass'), [performSwipe]);
  const handleLike = useCallback(() => performSwipe('like'), [performSwipe]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartRef.current = e.clientX;
    dragOffsetRef.current = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    const delta = e.clientX - dragStartRef.current;
    dragOffsetRef.current = delta;
    setDragOffset(delta);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    const offset = dragOffsetRef.current;
    setDragOffset(0);
    dragOffsetRef.current = 0;
    dragStartRef.current = 0;
    if (Math.abs(offset) >= SWIPE_THRESHOLD_PX && currentEmail && !swiping) {
      if (offset > 0) performSwipe('like');
      else performSwipe('pass');
    }
  }, [currentEmail, swiping, performSwipe]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    dragStartRef.current = 0;
  }, []);

  useEffect(() => {
    const onPointerUp = () => {
      setDragOffset(0);
      dragStartRef.current = 0;
    };
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  if (!user?.email) return null;

  const noMoreCards = !loading && (deck.length === 0 || currentIndex >= deck.length);

  return (
    <div className="matching-page">
      {loading && (
        <div className="matching-loading">Loading profiles…</div>
      )}
      {error && (
        <div className="matching-error" role="alert">
          {error}
        </div>
      )}
      {!loading && noMoreCards && (
        <div className="matching-empty">
          <p>No more profiles to review.</p>
          <p className="matching-empty-hint">Check back later or update your profile.</p>
        </div>
      )}
      {!loading && !noMoreCards && currentEmail && (
        <>
          <div
            className="matching-card-container"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerCancel}
            style={{ '--matching-drag-offset': `${dragOffset}px` } as React.CSSProperties}
          >
            <div className="matching-card-inner">
              <ProfileCard email={currentEmail} readOnly />
            </div>
          </div>
          <div className="matching-actions">
            <button
              type="button"
              className="matching-btn matching-btn-pass"
              onClick={handlePass}
              disabled={swiping}
              aria-label="Pass"
            >
              <span aria-hidden>×</span>
            </button>
            <button
              type="button"
              className="matching-btn matching-btn-like"
              onClick={handleLike}
              disabled={swiping}
              aria-label="Like"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
