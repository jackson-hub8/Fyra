/// file: SignupPage1.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// First page of signup flow - collects First Name, Last Name, and Email

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const SignupPage1 = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.length > 0 && lastName.length > 0 && email.length > 0) {
      // Navigate to second signup page with form data
      navigate('/signup/password', {
        state: {
          firstName,
          lastName,
          email,
        },
      });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="logo-container">
        <h1 className="logo-text">FYRA</h1>
      </div>

      <div className="form-card">
        <h2 className="form-title">Create Account</h2>
        <form onSubmit={handleSubmit} className="account-form">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="password-input"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="password-input"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="password-input"
            required
          />
          <div className="form-actions-bottom">
            <button type="button" onClick={handleBack} className="back-button">
              Back
            </button>
            <button type="submit" className="submit-button">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage1;
