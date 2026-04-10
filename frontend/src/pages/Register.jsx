import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { validateEmail, validateName, validatePassword, getPasswordStrength, getPasswordRequirements } from '../utils/validators';

const FieldError = ({ msg }) =>
  msg ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', color: '#ef4444', fontSize: '0.8rem' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {msg}
    </div>
  ) : null;

const PasswordStrengthBar = ({ password }) => {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '4px', background: i <= score ? color : 'var(--border-light)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ fontSize: '0.78rem', marginTop: '4px', color, fontWeight: '500' }}>{label}</div>
    </div>
  );
};

const PasswordRequirements = ({ password }) => {
  if (!password) return null;
  const reqs = getPasswordRequirements(password);
  return (
    <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {reqs.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', color: r.met ? '#16a34a' : '#ef4444', transition: 'color 0.2s' }}>
          {r.met
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
          {r.label}
        </div>
      ))}
    </div>
  );
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();

  const nameErr = touched.name ? validateName(name) : null;
  const emailErr = touched.email ? validateEmail(email) : null;
  const passwordErr = touched.password ? validatePassword(password) : null;
  const confirmPasswordErr = touched.confirmPassword
    ? (!confirmPassword ? 'Please confirm your password.' : confirmPassword !== password ? 'Passwords do not match.' : null)
    : null;

  const isValid = !validateName(name) && !validateEmail(email) && !validatePassword(password) && confirmPassword === password;

  const blur = (field) => setTouched(t => ({ ...t, [field]: true }));

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sign-In failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (!isValid) return;

    setError('');
    setLoading(true);
    try {
      await register(name, email, password, 'USER');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ show }) => show
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  const eyeBtnStyle = { position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0' };

  return (
    <div className="page-container flex-center">
      <div className="auth-card glass">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join the Smart Campus operations hub</p>
        </div>

        {error && (
          <div className="error-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <div className="flex-center" style={{ marginBottom: '1.5rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Sign-In was unsuccessful.')}
            theme="filled_blue"
            text="signup_with"
            shape="rectangular"
          />
        </div>

        <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0' }}>
          <hr style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--glass-bg)', padding: '0 15px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>or sign up with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s'\-]/g, ''))}
              onBlur={() => blur('name')}
              placeholder="Jane Doe"
              style={{ borderColor: nameErr ? '#ef4444' : touched.name && !nameErr ? '#22c55e' : undefined }}
            />
            <FieldError msg={nameErr} />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => blur('email')}
              placeholder="jane.doe@smartcampus.edu"
              style={{ borderColor: emailErr ? '#ef4444' : touched.email && !emailErr ? '#22c55e' : undefined }}
            />
            <FieldError msg={emailErr} />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => blur('password')}
                placeholder="••••••••"
                style={{ paddingRight: '2.8rem', borderColor: passwordErr ? '#ef4444' : touched.password && !passwordErr ? '#22c55e' : undefined }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={eyeBtnStyle} tabIndex={-1}><EyeIcon show={showPassword} /></button>
            </div>
            <PasswordStrengthBar password={password} />
                <PasswordRequirements password={password} />
                <FieldError msg={passwordErr} />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => blur('confirmPassword')}
                placeholder="••••••••"
                style={{ paddingRight: '2.8rem', borderColor: confirmPasswordErr ? '#ef4444' : touched.confirmPassword && !confirmPasswordErr ? '#22c55e' : undefined }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={eyeBtnStyle} tabIndex={-1}><EyeIcon show={showConfirm} /></button>
            </div>
            <FieldError msg={confirmPasswordErr} />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '0.5rem', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
