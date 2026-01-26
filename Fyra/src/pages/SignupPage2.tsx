/// file: SignupPage2.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Second page of signup flow - collects Password and Confirm Password

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './login.css';

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
}

const SignupPage2 = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const signupData = location.state as SignupData;

  useEffect(() => {
    // Redirect to first signup page if no data
    if (!signupData || !signupData.email) {
      navigate('/signup');
    }
  }, [signupData, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    // Log what we're sending to the API
    console.log('Sending signup data:', {
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      email: signupData.email,
      hasPassword: !!password,
      signupData: signupData
    });

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          email: signupData.email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      // Success - redirect to unmatched screen
      navigate('/unmatched');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/signup', {
      state: signupData,
    });
  };

  if (!signupData || !signupData.email) {
    return null;
  }

  return (
    <div className="login-page">
      <div className="logo-container">
        <h1 className="logo-text">FYRA</h1>
      </div>

      <div className="form-card">
        <h2 className="form-title">Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="account-form">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="password-input"
            required
            minLength={8}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="password-input"
            required
            minLength={8}
          />
          <div className="form-actions-bottom">
            <button type="button" onClick={handleBack} className="back-button">
              Back
            </button>
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage2;
