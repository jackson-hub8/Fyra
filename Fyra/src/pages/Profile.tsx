/// file: Profile.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Profile page for matched users: header + ProfileCard + Home | Calendar | Profile nav.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import './profile.css';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  if (!user?.email) return null;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="logo-left">FYRA</div>
        <div className="page-title">Profile</div>
        <div className="header-right">
          <span className="university-text">Transylvania University</span>
          <button
            type="button"
            className="profile-edit-icon"
            onClick={handleSignOut}
            style={{ textDecoration: 'underline', fontSize: 14, background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="profile-main">
        <ProfileCard email={user.email} />
      </main>
      <nav className="profile-bottom-nav">
        <button type="button" className="nav-item" onClick={() => navigate('/matched')}>
          Home
        </button>
        <button type="button" className="nav-item" onClick={() => navigate('/calendar')}>
          Calendar
        </button>
        <button type="button" className="nav-item active">
          Profile
        </button>
      </nav>
    </div>
  );
}
