/// file: UnmatchedLayout.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Unmatched layout: header + outlet + Profile | Search | Matching nav.

import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../profile/profile.css';

export default function UnmatchedLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) {
      navigate('/');
      return;
    }
  }, [user, navigate]);
  const path = location.pathname;
  const isSearch = path.endsWith('/search');
  const isMatching = path.endsWith('/matching');
  const isSettings = path.endsWith('/settings');
  const title = isSearch ? 'Search' : isMatching ? 'Matching' : isSettings ? 'Settings' : 'Profile';

  if (!user?.email) return null;

  return (
    <div className="profile-page unmatched-page">
      <header className="profile-header">
        <div className="header-left">
          <div className="logo-left">FYRA</div>
          <div className="university-text">Transylvania University</div>
        </div>
        <div className="page-title">{title}</div>
        <div className="header-right">
          <Link to="/unmatched/settings" className="header-settings-link" aria-label="Settings">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </Link>
          <button
            type="button"
            className="sign-out-button"
            onClick={() => { signOut(); navigate('/'); }}
          >
            Sign Out
          </button>
        </div>
      </header>
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
          className={`nav-item ${!isSearch && !isMatching && !isSettings ? 'active' : ''}`}
          onClick={() => navigate('/unmatched')}
        >
          Profile
        </button>
      </nav>
    </div>
  );
}
