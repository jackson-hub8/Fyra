/// file: UnmatchedLayout.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Unmatched layout: header + outlet + Profile | Search | Matching nav.

import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  const title = isSearch ? 'Search' : isMatching ? 'Matching' : 'Profile';

  if (!user?.email) return null;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="logo-left">FYRA</div>
        <div className="page-title">{title}</div>
        <div className="header-right">
          <span className="university-text">Transylvania University</span>
          <button
            type="button"
            onClick={() => { signOut(); navigate('/'); }}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 14, textDecoration: 'underline', fontFamily: 'inherit' }}
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
          className={`nav-item ${!isSearch && !isMatching ? 'active' : ''}`}
          onClick={() => navigate('/unmatched')}
        >
          Profile
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
          className={`nav-item ${isMatching ? 'active' : ''}`}
          onClick={() => navigate('/unmatched/matching')}
        >
          Matching
        </button>
      </nav>
    </div>
  );
}
