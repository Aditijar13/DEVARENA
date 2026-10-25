import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Mail, Lock, User, Check, ArrowRight } from 'lucide-react';
import { loginUser, registerUser } from '../store/slices/authSlice';
import { Spinner } from '../components/common/index';
import '../styles/login.css';

const GOOGLE_URL = (process.env.REACT_APP_API_URL || '/api') + '/auth/google';

const OAuthButtons = () => (
  <div className="auth-oauth-row">
    <button type="button" className="auth-oauth-btn auth-oauth-btn--google" onClick={() => window.location.href = GOOGLE_URL}>
      <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/><path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/><path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
      <span>Google</span>
    </button>
    <button type="button" className="auth-oauth-btn auth-oauth-btn--github" onClick={() => window.location.href = (process.env.REACT_APP_API_URL || '/api') + '/auth/github'}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
      <span>GitHub</span>
    </button>
  </div>
);

/* ── Login ── */
const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useSelector(s => s.auth);
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors]     = useState({});
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const validate = () => {
    const e = {};
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password) e.password = 'Password required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (validate()) dispatch(loginUser(form));
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        {/* Header Tabs */}
        <div className="auth-nav-toggle">
          <button type="button" className="auth-nav-tab auth-nav-tab--active">Log in</button>
          <Link to="/register" className="auth-nav-tab">Sign up</Link>
        </div>

        <div className="auth-card__header">
          <div className="auth-card__brand">
            <div className="auth-card__logo-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>
            </div>
            <span className="auth-card__brand-name">Dev<span style={{ color: 'var(--da-blue)' }}>Arena</span></span>
          </div>
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__sub">Continue your developer journey &amp; hackathons</p>
        </div>

        <OAuthButtons />

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or with email</span>
          <div className="auth-divider-line" />
        </div>

        {error && (
          <div className="auth-error-box">{typeof error === 'string' ? error : 'Invalid credentials.'}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <div className="auth-input-wrap">
              <Mail size={14} className="auth-input-icon" />
              <input
                type="email"
                value={form.email}
                placeholder="Email address"
                onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); }}
                className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="auth-field-error">{errors.email}</p>}
          </div>

          <div className="auth-field">
            <div className="auth-input-wrap">
              <Lock size={14} className="auth-input-icon" />
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                placeholder="Password"
                onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
                className={`auth-input${errors.password ? ' auth-input--error' : ''}`}
                autoComplete="current-password"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(p => !p)}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="auth-field-error">{errors.password}</p>}
          </div>

          <div className="auth-meta-row">
            <label className="auth-remember">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Remember me
            </label>
            <span className="auth-forgot">Forgot password?</span>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <Spinner size={16} /> : <>Log in <ArrowRight size={14} /></>}
          </button>
        </form>

        <p className="auth-card-footer-text">
          Protected by DevArena Auth &bull; By signing in you accept our Terms
        </p>
      </div>
    </div>
  );
};

/* ── Register ── */
export const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(s => s.auth);
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'participant' });
  const [showPw, setShowPw]     = useState(false);
  const [showCPw, setShowCPw]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [agreed, setAgreed]     = useState(true);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Full name required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!agreed) e.agree = 'Please accept terms';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (validate()) dispatch(registerUser(form));
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        {/* Header Tabs */}
        <div className="auth-nav-toggle">
          <Link to="/login" className="auth-nav-tab">Log in</Link>
          <button type="button" className="auth-nav-tab auth-nav-tab--active">Sign up</button>
        </div>

        <div className="auth-card__header">
          <div className="auth-card__brand">
            <div className="auth-card__logo-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>
            </div>
            <span className="auth-card__brand-name">Dev<span style={{ color: 'var(--da-blue)' }}>Arena</span></span>
          </div>
          <h1 className="auth-card__title">Create an account</h1>
          <p className="auth-card__sub">Join 4,200+ developers competing in hackathons</p>
        </div>

        <OAuthButtons />

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or with email</span>
          <div className="auth-divider-line" />
        </div>

        {error && (
          <div className="auth-error-box">{typeof error === 'string' ? error : 'Registration failed.'}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <div className="auth-input-wrap">
              <User size={14} className="auth-input-icon" />
              <input
                type="text"
                value={form.name}
                placeholder="Full Name"
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
                className={`auth-input${errors.name ? ' auth-input--error' : ''}`}
                autoComplete="name"
              />
            </div>
            {errors.name && <p className="auth-field-error">{errors.name}</p>}
          </div>

          <div className="auth-field">
            <div className="auth-input-wrap">
              <Mail size={14} className="auth-input-icon" />
              <input
                type="email"
                value={form.email}
                placeholder="Email address"
                onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); }}
                className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="auth-field-error">{errors.email}</p>}
          </div>

          <div className="auth-grid-2">
            <div className="auth-field">
              <div className="auth-input-wrap">
                <Lock size={14} className="auth-input-icon" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  placeholder="Password"
                  onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
                  className={`auth-input${errors.password ? ' auth-input--error' : ''}`}
                  autoComplete="new-password"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="auth-field-error">{errors.password}</p>}
            </div>

            <div className="auth-field">
              <div className="auth-input-wrap">
                <Lock size={14} className="auth-input-icon" />
                <input
                  type={showCPw ? 'text' : 'password'}
                  value={form.confirmPassword}
                  placeholder="Confirm"
                  onChange={e => { setForm(p => ({ ...p, confirmPassword: e.target.value })); setErrors(p => ({ ...p, confirmPassword: '' })); }}
                  className={`auth-input${errors.confirmPassword ? ' auth-input--error' : ''}`}
                  autoComplete="new-password"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowCPw(p => !p)}>
                  {showCPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="auth-field-error">{errors.confirmPassword}</p>}
            </div>
          </div>

          <label className="auth-check-row" onClick={() => setAgreed(p => !p)}>
            <div className={`auth-check-box${agreed ? ' auth-check-box--checked' : ''}`}>
              {agreed && <Check size={10} color="#fff" strokeWidth={3} />}
            </div>
            <span className="auth-check-text">
              I agree to the <span style={{ color: 'var(--da-blue)', fontWeight: 600 }}>Terms of Service</span> &amp; <span style={{ color: 'var(--da-blue)', fontWeight: 600 }}>Privacy Policy</span>
            </span>
          </label>
          {errors.agree && <p className="auth-field-error" style={{ marginBottom: 6 }}>{errors.agree}</p>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <Spinner size={16} /> : <>Create account <ArrowRight size={14} /></>}
          </button>
        </form>

        <p className="auth-card-footer-text">
          Already registered? <Link to="/login" style={{ color: 'var(--da-blue)', fontWeight: 700 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
