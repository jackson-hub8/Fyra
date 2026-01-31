/// file: Calendar.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Calendar page for matched users(not done yet)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';
import './calendar.css';

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleSignOut = () => {
    navigate('/');
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddEvent = () => {
    // Placeholder for future functionality
    console.log('Add event clicked');
  };

  // Get month name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[currentDate.getMonth()];

  // Get days in month
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Create calendar grid
  const days = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  // Get current date for highlighting
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  const currentDay = today.getDate();

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="logo-left">FYRA</div>
        <div className="page-title">Calendar</div>
        <div className="header-right">
          <div className="university-text">Transylvania University</div>
          <button className="sign-out-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="calendar-header-controls">
          <div className="month-navigation">
            <button className="month-arrow" onClick={handlePreviousMonth}>
              ←
            </button>
            <h2 className="month-name">{monthName}</h2>
            <button className="month-arrow" onClick={handleNextMonth}>
              →
            </button>
          </div>
          <button className="add-event-button" onClick={handleAddEvent}>
            +
          </button>
        </div>

        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {dayNames.map((day) => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}
          </div>
          <div className="calendar-days">
            {days.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${day === null ? 'empty' : ''} ${
                  isCurrentMonth && day === currentDay ? 'today' : ''
                }`}
              >
                {day !== null && <span className="day-number">{day}</span>}
              </div>
            ))}
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

export default Calendar;
