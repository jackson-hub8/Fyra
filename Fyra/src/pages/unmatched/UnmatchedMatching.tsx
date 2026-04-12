/// file: UnmatchedMatching.tsx
/// Tinder-style matching: card stack, drag tilt, like/pass overlays, fly-off animations.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileCard from '../../components/ProfileCard';
import { REPORT_REASON_MAX_LENGTH } from '../../lib/reportReason';
import './UnmatchedMatching.css';

const SWIPE_THRESHOLD_PX = 80;
const FLY_OFF_DURATION_MS = 280;

export default function UnmatchedMatching() {
  const { user, peekMatchingDeckPreloadForEmail, consumeMatchingDeckPreloadForEmail, preloadMatchingDeck } =
    useAuth();
  const navigate = useNavigate();
  const deckPeek = user?.email ? peekMatchingDeckPreloadForEmail(user.email) : null;
  const [deck, setDeck] = useState<string[]>(() => deckPeek ?? []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(() => deckPeek === null);
  const [error, setError] = useState('');
  const [swiping, setSwiping] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [pointerDown, setPointerDown] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const dragStartRef = useRef<number>(0);
  const dragOffsetRef = useRef<number>(0);
  const pendingSwipeRef = useRef<{ targetEmail: string; action: 'like' | 'pass' } | null>(null);
  const exitDirectionRef = useRef<'left' | 'right' | null>(null);
  exitDirectionRef.current = exitDirection;

  const currentEmail = deck[currentIndex] ?? null;
  const nextEmails = [deck[currentIndex + 1], deck[currentIndex + 2]].filter(Boolean) as string[];

  const openReportModal = useCallback(() => {
    setReportMessage('');
    setReportReason('');
    setReportModalOpen(true);
  }, []);

  const closeReportModal = useCallback(() => {
    if (reportSubmitting) return;
    setReportModalOpen(false);
    setReportReason('');
    setReportMessage('');
  }, [reportSubmitting]);

  const submitReport = useCallback(async () => {
    if (!user?.email || !currentEmail) return;
    const trimmed = reportReason.trim();
    if (trimmed.length === 0 || trimmed.length > REPORT_REASON_MAX_LENGTH) {
      setReportMessage(`Please enter a reason (1–${REPORT_REASON_MAX_LENGTH} characters).`);
      return;
    }
    setReportSubmitting(true);
    setReportMessage('');
    try {
      const res = await fetch('/api/matching/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterEmail: user.email,
          reportedEmail: currentEmail,
          reason: trimmed,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setReportMessage(data.error ?? 'Could not submit report');
        return;
      }
      setReportModalOpen(false);
      setReportReason('');
      setReportMessage('');
      setError('');
    } catch {
      setReportMessage('Something went wrong');
    } finally {
      setReportSubmitting(false);
    }
  }, [user?.email, currentEmail, reportReason]);

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

  useLayoutEffect(() => {
    if (!user?.email) {
      navigate('/');
      return;
    }

    const applyPreloadedDeck = (emails: string[]) => {
      setDeck(emails);
      setCurrentIndex(0);
      setLoading(false);
      setError('');
      // Defer consume so React Strict Mode's mount→unmount→remount still sees the cache on the second mount.
      window.setTimeout(() => {
        consumeMatchingDeckPreloadForEmail(user.email);
      }, 0);
    };

    const peeked = peekMatchingDeckPreloadForEmail(user.email);
    if (peeked !== null) {
      applyPreloadedDeck(peeked);
      return;
    }

    let cancelled = false;
    void (async () => {
      await preloadMatchingDeck(user.email);
      if (cancelled) return;
      const afterPreload = peekMatchingDeckPreloadForEmail(user.email);
      if (afterPreload !== null) {
        applyPreloadedDeck(afterPreload);
        return;
      }
      fetchDeck();
    })();

    return () => {
      cancelled = true;
    };
  }, [
    user?.email,
    navigate,
    fetchDeck,
    peekMatchingDeckPreloadForEmail,
    consumeMatchingDeckPreloadForEmail,
    preloadMatchingDeck,
  ]);

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
    if (exitDirectionRef.current) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setPointerDown(false);
    const offset = dragOffsetRef.current;
    setDragOffset(0);
    dragOffsetRef.current = 0;
    dragStartRef.current = 0;
    if (Math.abs(offset) >= SWIPE_THRESHOLD_PX && currentEmail && !swiping && !exitDirectionRef.current) {
      pendingSwipeRef.current = {
        targetEmail: currentEmail,
        action: offset > 0 ? 'like' : 'pass',
      };
      setSwiping(true);
      setExitDirection(offset > 0 ? 'right' : 'left');
    }
  }, [currentEmail, swiping]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setPointerDown(false);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    dragStartRef.current = 0;
  }, []);

  useEffect(() => {
    const onPointerUp = () => {
      if (exitDirectionRef.current) return;
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
  const showOverlayLike =
    exitDirection === 'right' || (!exitDirection && dragOffset > SWIPE_THRESHOLD_PX);
  const showOverlayPass =
    exitDirection === 'left' || (!exitDirection && dragOffset < -SWIPE_THRESHOLD_PX);
  const overlayOpacity =
    exitDirection === 'right' || exitDirection === 'left'
      ? 1
      : Math.min(1, (Math.abs(dragOffset) - SWIPE_THRESHOLD_PX) / 80);
  const overlayStyle = { opacity: showOverlayLike || showOverlayPass ? overlayOpacity : 0 };

  const topCardTransformStyle: React.CSSProperties =
    exitDirection === 'right' || exitDirection === 'left'
      ? {
          transform:
            exitDirection === 'right'
              ? 'translateX(150%) rotate(15deg)'
              : 'translateX(-150%) rotate(-15deg)',
          transition: 'transform 0.28s ease-out',
          pointerEvents: 'none',
        }
      : {
          transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.03}deg)`,
          transition: pointerDown ? 'none' : 'transform 0.28s ease-out',
          pointerEvents: 'auto',
        };

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
                className="matching-stack-card matching-stack-card-top"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerCancel}
                style={topCardTransformStyle}
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
          <div className="matching-report-row">
            <button
              type="button"
              className="matching-report-open-btn"
              onClick={openReportModal}
              disabled={swiping || !!exitDirection || reportModalOpen}
            >
              Report profile
            </button>
          </div>
          <div className="matching-actions">
            <button
              type="button"
              className="matching-btn matching-btn-pass"
              onClick={() => triggerSwipe('pass')}
              disabled={swiping || !!exitDirection || reportModalOpen}
              aria-label="Pass"
            >
              <span aria-hidden>×</span>
            </button>
            <button
              type="button"
              className="matching-btn matching-btn-like"
              onClick={() => triggerSwipe('like')}
              disabled={swiping || !!exitDirection || reportModalOpen}
              aria-label="Like"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
          </div>
        </>
      )}

      {reportModalOpen && currentEmail && (
        <div
          className="matching-report-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="matching-report-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReportModal();
          }}
        >
          <div className="matching-report-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 id="matching-report-title" className="matching-report-title">
              Report this profile
            </h2>
            <p className="matching-report-hint">
              Tell us briefly why you are reporting this user ({REPORT_REASON_MAX_LENGTH} characters max).
            </p>
            <label className="matching-report-label" htmlFor="matching-report-reason">
              Reason
            </label>
            <textarea
              id="matching-report-reason"
              className="matching-report-textarea"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value.slice(0, REPORT_REASON_MAX_LENGTH))}
              maxLength={REPORT_REASON_MAX_LENGTH}
              rows={3}
              disabled={reportSubmitting}
            />
            <div className="matching-report-counter">
              {reportReason.length} / {REPORT_REASON_MAX_LENGTH}
            </div>
            {reportMessage && (
              <div className="matching-report-inline-error" role="alert">
                {reportMessage}
              </div>
            )}
            <div className="matching-report-actions">
              <button
                type="button"
                className="matching-report-cancel"
                onClick={closeReportModal}
                disabled={reportSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="matching-report-submit"
                onClick={() => void submitReport()}
                disabled={reportSubmitting}
              >
                {reportSubmitting ? 'Sending…' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
