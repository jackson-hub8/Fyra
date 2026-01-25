/// file: Login.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Landing page for user login

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Try to parse error response, but handle empty responses
        let errorMessage = 'Login failed';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          // If parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse success response
      let userData;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          userData = await response.json();
        } else {
          const text = await response.text();
          throw new Error('Invalid response format');
        }
      } catch (parseError) {
        throw new Error('Failed to parse server response');
      }

      // Route based on isMatched status
      if (userData.isMatched) {
        navigate('/matched');
      } else {
        navigate('/unmatched');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="logo-container">
        <h1 className="logo-text">FYRA</h1>
      </div>

      <div className="form-card">
        <h2 className="form-title">Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="account-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="password-input"
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="password-input"
            required
            disabled={isLoading}
          />
          <div className="form-actions">
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
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
