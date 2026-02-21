/// file: Settings.tsx
/// Settings page placeholder; same style as Home/Profile/Calendar.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../home.css';
import './settings.css';

export default function Settings() {
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
    <div className="home-page settings-page">
      <div className="home-header">
        <div className="header-left">
          <div className="logo-left">FYRA</div>
          <div className="university-text">Transylvania University</div>
        </div>
        <div className="page-title">Settings</div>
        <div className="header-right">
          <button type="button" className="sign-out-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
      <main className="settings-main">
        <p className="settings-placeholder">Settings page</p>
      </main>
      <div className="bottom-nav">
        <button type="button" className="nav-item" onClick={() => navigate('/matched')}>
          Home
        </button>
        <button type="button" className="nav-item" onClick={() => navigate('/calendar')}>
          Calendar
        </button>
        <button type="button" className="nav-item" onClick={() => navigate('/profile')}>
          Profile
        </button>
      </div>
    </div>
  );
}
