import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Gamepad2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, completeTwoFactorLogin } = useAuth();
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);
    if (result.success && result.twoFactorRequired) {
      setTwoFARequired(true);
      setTempToken(result.tempToken);
      toast('Enter your 2FA code to continue');
    } else if (result.success) {
      toast.success("Logged in successfully!");
      navigate(from, { replace: true });
    } else {
      if (result.requiresVerification) {
        navigate('/verify-otp', { state: { email: result.email, from } });
      } else {
        toast.error(result.message || "Login failed. Please try again.");
      }
    }

    setLoading(false);
  };

  const handleTwoFASubmit = async (e) => {
    e.preventDefault();
    if (!twoFACode || !tempToken) return;
    setLoading(true);
    const res = await completeTwoFactorLogin(twoFACode, tempToken);
    if (res.success) {
      toast.success('2FA verified. Logged in!');
      navigate(from, { replace: true });
    } else {
      toast.error(res.message || 'Invalid 2FA code');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Gamepad2 size={32} />
            <span>GamePasal</span>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        <form className="auth-form" onSubmit={twoFARequired ? handleTwoFASubmit : handleSubmit}>
          {/* No inline error div! */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {!twoFARequired && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {twoFARequired && (
            <div className="form-group">
              <label className="form-label">Two‑Factor Code</label>
              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type="text"
                  name="twofa"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value)}
                  className="form-input"
                  placeholder="Enter 6‑digit code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? (twoFARequired ? 'Verifying...' : 'Signing In...') : (twoFARequired ? 'Verify 2FA' : 'Sign In')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">
              Sign up here
            </Link>
          </p>
        </div>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div className="social-auth">
          <button className="social-btn google">
            <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
            Google
          </button>
          <button className="social-btn facebook">
            <span>f</span>
            Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
