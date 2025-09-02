import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Gamepad2, Facebook } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, completeTwoFactorLogin, googleLogin, facebookLogin } = useAuth();
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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      
      // Decode the JWT token to get user info
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${credentialResponse.credential}`,
        },
      });
      
      const googleUser = await response.json();
      
      const result = await googleLogin({
        idToken: credentialResponse.credential,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture
      });

      if (result.success) {
        toast.success('Successfully logged in with Google!');
        navigate(from, { replace: true });
      } else {
        toast.error(result.message || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed. Please try again.');
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      
      // Wait for Facebook SDK to load
      const waitForFB = () => {
        return new Promise((resolve) => {
          if (window.FB) {
            resolve();
            return;
          }
          
          const checkFB = () => {
            if (window.FB) {
              resolve();
            } else {
              setTimeout(checkFB, 100);
            }
          };
          checkFB();
        });
      };

      await waitForFB();

      // Initialize Facebook SDK if not already done
      if (!window.FB.getLoginStatus) {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'your-facebook-app-id',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      }

      window.FB.login((response) => {
        if (response.authResponse) {
          handleFacebookResponse(response.authResponse);
        } else {
          toast.error('Facebook login was cancelled');
          setLoading(false);
        }
      }, { scope: 'email,public_profile' });
    } catch (error) {
      console.error('Facebook login error:', error);
      toast.error('Facebook login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleFacebookResponse = async (authResponse) => {
    try {
      // Get user info from Facebook
      window.FB.api('/me', { fields: 'id,name,email,picture' }, async (userInfo) => {
        try {
          const result = await facebookLogin({
            accessToken: authResponse.accessToken,
            userID: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture?.data?.url
          });

          if (result.success) {
            toast.success('Successfully logged in with Facebook!');
            navigate(from, { replace: true });
          } else {
            toast.error(result.message || 'Facebook login failed');
          }
        } catch (error) {
          console.error('Facebook API error:', error);
          toast.error('Facebook login failed. Please try again.');
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Facebook response error:', error);
      toast.error('Facebook login failed. Please try again.');
      setLoading(false);
    }
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
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="outline"
            size="large"
            width="300"
            text="continue_with"
            shape="rectangular"
            logo_alignment="left"
          />
          <button 
            className="social-btn facebook"
            onClick={handleFacebookLogin}
            disabled={loading}
          >
            <Facebook size={20} />
            Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
