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

  // Get current week (Sunday to Saturday)
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay); // Go back to Sunday

  const weekDays = [];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDays.push({
      dayName: dayNamesShort[i],
      dayNumber: date.getDate(),
      date: date,
      isToday: date.toDateString() === today.toDateString()
    });
  }

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
        <div className="week-calendar">
          <div className="week-calendar-header">
            {weekDays.map((day) => (
              <div
                key={day.dayNumber}
                className={`week-day-header ${day.isToday ? 'today' : ''}`}
              >
                <div className="week-day-name">{day.dayName}</div>
                <div className={`week-day-number ${day.isToday ? 'today-number' : ''}`}>
                  {day.dayNumber}
                </div>
              </div>
            ))}
          </div>
          <div className="week-calendar-body">
            {weekDays.map((day) => (
              <div
                key={day.dayNumber}
                className={`week-day-cell ${day.isToday ? 'today-cell' : ''}`}
              >
                {/* Events will go here later */}
              </div>
            ))}
          </div>
        </div>
        
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
        <button className="nav-item" onClick={() => navigate('/matched')}>
          Home
        </button>
        <button className="nav-item" onClick={() => navigate('/calendar')}>
          Calendar
        </button>
        <button className="nav-item">Profile</button>
      </div>
    </div>
  );
};

export default Home;
