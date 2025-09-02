import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Eye, EyeOff, Mail, Lock, User, Phone, Gamepad2,
  Facebook, Mail as MailIcon
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import './Auth.css';

const Signup = () => {
  const [step, setStep] = useState(1); // 1: Registration, 2: OTP Verification
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, verifyOTP, googleLogin, facebookLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
      setLoading(false);
      return;
    }

    const result = await register(formData);

    if (result.success) {
      toast.success('OTP sent to your email. Please check your inbox.');
      setStep(2);
    } else {
      toast.error(result.message || "Registration failed. Try again.");
    }
    setLoading(false);
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await verifyOTP(formData.email, otp);

    if (result.success) {
      toast.success('Account verified! You can now log in.');
      navigate('/');
    } else {
      toast.error(result.message || "OTP verification failed.");
    }
    setLoading(false);
  };

  const resendOTP = async () => {
    setLoading(true);
    const result = await register(formData);
    if (result.success) {
      toast.success('OTP resent to your email.');
    } else {
      toast.error(result.message || "Failed to resend OTP.");
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
        navigate('/');
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
            navigate('/');
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

  if (step === 2) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <Gamepad2 size={32} />
              <span>GamePasal</span>
            </div>
            <h1>Verify Your Email</h1>
            <p>We've sent a verification code to {formData.email}</p>
          </div>

          <form className="auth-form" onSubmit={handleOTPVerification}>
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="form-input otp-input"
                placeholder="Enter 6-digit code"
                maxLength="6"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary auth-btn"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Didn't receive the code?{' '}
              <button 
                onClick={resendOTP} 
                className="auth-link"
                disabled={loading}
              >
                Resend OTP
              </button>
            </p>
            <p>
              <button 
                onClick={() => setStep(1)} 
                className="auth-link"
              >
                Back to Registration
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Gamepad2 size={32} />
            <span>GamePasal</span>
          </div>
          <h1>Create Account</h1>
          <p>Join GamePasal and start your gaming journey</p>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          {/* All error/success toasts will show as popups! */}
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-group">
              <User className="input-icon" size={20} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Choose a username"
                required
              />
            </div>
          </div>

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

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div className="input-group">
              <Phone className="input-icon" size={20} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your phone number"
                required
              />
            </div>
          </div>

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
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-group">
              <Lock className="input-icon" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" required />
              <span className="checkmark"></span>
              I agree to the{' '}
              <Link to="/terms" className="auth-link">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="auth-link">Privacy Policy</Link>
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Social Media Login Options */}
        <div className="social-login-section">
          <div className="divider">
            <span>or</span>
          </div>
          
          <div className="social-buttons">
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
              type="button" 
              className="btn btn-social btn-facebook"
              onClick={handleFacebookLogin}
              disabled={loading}
            >
              <Facebook size={20} />
              Continue with Facebook
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
