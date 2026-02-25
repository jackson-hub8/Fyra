/// file: SignupPage2.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Second page of signup flow - collects Password and Confirm Password.
/// On submit: send 6-digit code to email (no DB write). After verification, create user and go to /unmatched.

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
  const [step, setStep] = useState<'password' | 'verify'>('password');
  const [code, setCode] = useState('');
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const [, setClock] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const signupData = location.state as SignupData;

  useEffect(() => {
    if (!signupData || !signupData.email) {
      navigate('/signup');
    }
  }, [signupData, navigate]);

  // Countdown for resend cooldown on verify step
  useEffect(() => {
    if (step !== 'verify' || resendCooldownUntil <= Date.now()) return;
    const id = setInterval(() => {
      if (Date.now() >= resendCooldownUntil) {
        setResendCooldownUntil(0);
        return;
      }
      setClock((c) => c + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [step, resendCooldownUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/signupStart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          email: signupData.email,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      // On success: show verify step only. Never create Users or navigate to /unmatched from here.
      setStep('verify');
      setCode('');
      setResendCooldownUntil(Date.now() + 60 * 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/signupVerify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email, code: digits }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      // After successful email verification, show Terms & Conditions.
      navigate('/terms', { state: { email: signupData.email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'verify') {
      setStep('password');
      setError('');
      setCode('');
      setResendCooldownUntil(0);
    } else {
      navigate('/signup', { state: signupData });
    }
  };

  const handleResend = async () => {
    const secondsLeft = Math.ceil((resendCooldownUntil - Date.now()) / 1000);
    if (secondsLeft > 0) return;
    setError('');
    try {
      const response = await fetch('/api/auth/signupResend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to resend');
      setResendCooldownUntil(Date.now() + 60 * 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!signupData || !signupData.email) {
    return null;
  }

  // verify step
  if (step === 'verify') {
    const secondsLeft = Math.max(0, Math.ceil((resendCooldownUntil - Date.now()) / 1000));
    return (
      <div className="login-page">
        <div className="logo-container">
          <h1 className="logo-text">FYRA</h1>
        </div>
        <div className="form-card">
          <h2 className="form-title">Verify your email</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>
            We sent a 6-digit code to <strong>{signupData.email}</strong>
          </p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleVerify} className="account-form">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="password-input"
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20 }}
            />
            <p style={{ textAlign: 'center', marginTop: 0, marginBottom: 0 }}>
              {secondsLeft > 0 ? (
                <span style={{ color: '#999', fontSize: 14 }}>Resend code in {secondsLeft}s</span>
              ) : (
                <button type="button" onClick={handleResend} className="resend-link">Resend code</button>
              )}
            </p>
            <div className="form-actions-bottom">
              <button type="button" onClick={handleBack} className="back-button">
                Back
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting || code.replace(/\D/g, '').length !== 6}
              >
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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
            placeholder="Password *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="password-input"
            required
            minLength={8}
          />
          <input
            type="password"
            placeholder="Confirm Password *"
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
              {isSubmitting ? 'Sending code...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage2;
