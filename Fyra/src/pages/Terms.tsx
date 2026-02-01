/// file: Terms.tsx
/// Terms & Conditions page shown after email verification.
/// - Accept: finalize signup (create user) then go to /unmatched.
/// - Decline: delete pending signup and go back to login.

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './login.css';

interface TermsLocationState {
  email: string;
}

const Terms = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const state = location.state as TermsLocationState | null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state?.email) {
      navigate('/signup');
    }
  }, [state, navigate]);

  if (!state?.email) {
    return null;
  }

  const handleDecision = async (accept: boolean) => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/signupComplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email, accept }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete signup');
      }

      if (!accept) {
        navigate('/');
      } else {
        const email = (data.email ?? state.email) as string;
        const name = (data.name ?? email) as string;
        setUser({ email, name, profileSetupComplete: false });
        navigate('/profile-setup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="logo-container">
        <h1 className="logo-text">FYRA</h1>
      </div>
      <div className="form-card">
        <h2 className="form-title">Terms &amp; Conditions</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="terms-scroll">
          <p>
            Welcome to FYRA. Please read these Terms &amp; Conditions carefully before creating your account.
          </p>
          <p>
            By accepting these terms, you agree to use FYRA responsibly, provide accurate information, and respect
            other students on the platform.
          </p>
          <p>
            You agree not to harass, threaten, or otherwise harm other users, and not to use FYRA for any illegal or
            unauthorized purpose. FYRA may suspend or terminate your access if you violate these terms.
          </p>
          <p>
            FYRA may update these terms from time to time.
          </p>
          <p>
            If you do not agree to these Terms &amp; Conditions, select &quot;Decline&quot; below and you will be
            returned to the login page without creating an account.
          </p>
        </div>
        <div className="form-actions-bottom">
          <button
            type="button"
            className="back-button"
            onClick={() => handleDecision(false)}
            disabled={isSubmitting}
          >
            Decline
          </button>
          <button
            type="button"
            className="submit-button"
            onClick={() => handleDecision(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Terms;

