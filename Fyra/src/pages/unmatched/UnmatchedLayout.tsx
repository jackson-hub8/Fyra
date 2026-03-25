/// file: UnmatchedLayout.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Unmatched layout: header + outlet + Profile | Search | Matching nav.

import { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../profile/profile.css';
import '../home.css';

export default function UnmatchedLayout() {
  const { user, signOut, preloadMatchingDeck } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  useLayoutEffect(() => {
    if (!user?.email || user.isMatched || !user.profileSetupComplete) return;
    void preloadMatchingDeck(user.email);
  }, [user?.email, user?.isMatched, user?.profileSetupComplete, preloadMatchingDeck]);
  const path = location.pathname;
  const isSearch = path.endsWith('/search');
  const isMatching = path.endsWith('/matching');
  const title = isSearch ? 'Search' : isMatching ? 'Matching' : 'Profile';

  if (!user?.email) return null;

  return (
    <div className="profile-page unmatched-page">
      <div className="home-header">
        <div className="header-left">
          <div className="logo-left">FYRA</div>
          <div className="university-text">Transylvania University</div>
        </div>
        <div className="page-title">{title}</div>
        <div className="header-right">
          <button
            type="button"
            className="sign-out-button"
            onClick={() => { signOut(); navigate('/'); }}
          >
            Sign Out
          </button>
        </div>
      </div>
      <main className="profile-main">
        <Outlet />
      </main>
      <nav className="profile-bottom-nav">
        <button
          type="button"
          className={`nav-item ${isMatching ? 'active' : ''}`}
          onClick={() => navigate('/unmatched/matching')}
        >
          Matching
        </button>
        <button
          type="button"
          className={`nav-item ${isSearch ? 'active' : ''}`}
          onClick={() => navigate('/unmatched/search')}
        >
          Search
        </button>
        <button
          type="button"
          className={`nav-item ${!isSearch && !isMatching ? 'active' : ''}`}
          onClick={() => navigate('/unmatched')}
        >
          Profile
        </button>
      </nav>
    </div>
  );
}
