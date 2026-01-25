/// file: Home.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Home page for matched users

import { useNavigate } from 'react-router-dom';
import './home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate('/');
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="logo-left">FYRA</div>
        <div className="page-title">Home</div>
        <div className="header-right">
          <div className="university-text">Transylvania University</div>
          <button className="sign-out-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="calendar-placeholder">Calendar</div>
        
        <div className="bottom-sections">
          <div className="chores-section">
            <div className="chores-header">
              <div className="chores-title">Chores</div>
              <button className="add-chore-button">+</button>
            </div>
          </div>
          
          <div className="roommate-section">
            <div className="roommate-title">Roommate</div>
            <div className="roommate-content">roommate</div>
          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <button className="nav-item">Home</button>
        <button className="nav-item">Calendar</button>
        <button className="nav-item">Profile</button>
      </div>
    </div>
  );
};

export default Home;
