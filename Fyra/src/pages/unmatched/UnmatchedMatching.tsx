/// file: UnmatchedMatching.tsx
/// Tinder-style matching: card stack, drag tilt, like/pass overlays, fly-off animations.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileCard from '../../components/ProfileCard';
import './UnmatchedMatching.css';

const SWIPE_THRESHOLD_PX = 80;
const FLY_OFF_DURATION_MS = 280;

export default function UnmatchedMatching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [swiping, setSwiping] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [pointerDown, setPointerDown] = useState(false);
  const dragStartRef = useRef<number>(0);
  const dragOffsetRef = useRef<number>(0);
  const pendingSwipeRef = useRef<{ targetEmail: string; action: 'like' | 'pass' } | null>(null);

  const currentEmail = deck[currentIndex] ?? null;
  const nextEmails = [deck[currentIndex + 1], deck[currentIndex + 2]].filter(Boolean) as string[];

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

  const triggerSwipe = useCallback(
    (action: 'like' | 'pass') => {
      if (!currentEmail || swiping || exitDirection) return;
      pendingSwipeRef.current = { targetEmail: currentEmail, action };
      setSwiping(true);
      setExitDirection(action === 'like' ? 'right' : 'left');
    },
    [currentEmail, swiping, exitDirection]
  );

  useEffect(() => {
    if (!exitDirection) return;
    const t = setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setExitDirection(null);
      setSwiping(false);
      setDragOffset(0);
      const pending = pendingSwipeRef.current;
      pendingSwipeRef.current = null;
      if (!user?.email || !pending) return;
      fetch('/api/matching/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swiperEmail: user.email,
          targetEmail: pending.targetEmail,
          action: pending.action,
        }),
      })
        .then(async (res) => {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) setError(data?.error ?? 'Swipe failed');
        })
        .catch(() => setError('Something went wrong'));
    }, FLY_OFF_DURATION_MS);
    return () => clearTimeout(t);
  }, [exitDirection, user?.email]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (exitDirection) return;
    setPointerDown(true);
    dragStartRef.current = e.clientX;
    dragOffsetRef.current = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [exitDirection]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons === 0 || exitDirection) return;
    const delta = e.clientX - dragStartRef.current;
    dragOffsetRef.current = delta;
    setDragOffset(delta);
  }, [exitDirection]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setPointerDown(false);
    const offset = dragOffsetRef.current;
    setDragOffset(0);
    dragOffsetRef.current = 0;
    dragStartRef.current = 0;
    if (Math.abs(offset) >= SWIPE_THRESHOLD_PX && currentEmail && !swiping && !exitDirection) {
      pendingSwipeRef.current = {
        targetEmail: currentEmail,
        action: offset > 0 ? 'like' : 'pass',
      };
      setSwiping(true);
      setExitDirection(offset > 0 ? 'right' : 'left');
    }
  }, [currentEmail, swiping, exitDirection]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setPointerDown(false);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    dragStartRef.current = 0;
  }, []);

  useEffect(() => {
    const onPointerUp = () => {
      setPointerDown(false);
      setDragOffset(0);
      dragOffsetRef.current = 0;
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
  const showOverlayLike = !exitDirection && dragOffset > SWIPE_THRESHOLD_PX;
  const showOverlayPass = !exitDirection && dragOffset < -SWIPE_THRESHOLD_PX;
  const overlayOpacity = Math.min(1, (Math.abs(dragOffset) - SWIPE_THRESHOLD_PX) / 80);
  const overlayStyle = { opacity: showOverlayLike || showOverlayPass ? overlayOpacity : 0 };

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
          <p className="matching-empty-hint">Check back later</p>
        </div>
      )}
      {!loading && !noMoreCards && (
        <>
          <div className="matching-stack">
            <div className="matching-stack-wrapper">
              {/* Back cards (next in stack) - absolute so they sit behind */}
              {nextEmails.map((email, i) => (
                <div
                  key={email}
                  className="matching-stack-card matching-stack-card-back"
                  style={{ '--stack-index': i + 1 } as React.CSSProperties}
                >
                  <div className="matching-stack-card-inner">
                    <ProfileCard email={email} readOnly />
                  </div>
                </div>
              ))}
              {/* Top card (in flow so wrapper height = content height; draggable) */}
              {currentEmail && (
              <div
                className={`matching-stack-card matching-stack-card-top ${exitDirection ? `matching-card-exit-${exitDirection}` : ''}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerCancel}
                style={{
                  '--matching-drag-offset': `${dragOffset}px`,
                  '--matching-drag-rotate': `${dragOffset * 0.03}deg`,
                  transition: pointerDown ? 'none' : undefined,
                } as React.CSSProperties}
              >
                <div className="matching-stack-card-inner">
                  {showOverlayLike && (
                    <div className="matching-card-overlay matching-card-overlay-like" style={overlayStyle} aria-hidden>
                      <span className="matching-overlay-icon">✓</span>
                    </div>
                  )}
                  {showOverlayPass && (
                    <div className="matching-card-overlay matching-card-overlay-pass" style={overlayStyle} aria-hidden>
                      <span className="matching-overlay-icon">×</span>
                    </div>
                  )}
                  <ProfileCard email={currentEmail} readOnly />
                </div>
              </div>
            )}
            </div>
          </div>
          <div className="matching-actions">
            <button
              type="button"
              className="matching-btn matching-btn-pass"
              onClick={() => triggerSwipe('pass')}
              disabled={swiping || !!exitDirection}
              aria-label="Pass"
            >
              <span aria-hidden>×</span>
            </button>
            <button
              type="button"
              className="matching-btn matching-btn-like"
              onClick={() => triggerSwipe('like')}
              disabled={swiping || !!exitDirection}
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
