/// file: Login.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Landing page for user login

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.length > 0 && password.length > 0) {
      navigate('/home');
    }
  };

  return (
    <div className="login-page">
      <div className="logo-container">
        <h1 className="logo-text">FYRA</h1>
      </div>

      <div className="form-card">
        <h2 className="form-title">Login</h2>
        <form onSubmit={handleSubmit} className="account-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="password-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="password-input"
          />
          <div className="form-actions">
            <button type="submit" className="login-button">
              Login
            </button>
          </div>
          <div className="signup-link">
            Don't have an account?{' '}
            <span className="signup-text" onClick={() => navigate('/signup')}>
              Sign Up
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
