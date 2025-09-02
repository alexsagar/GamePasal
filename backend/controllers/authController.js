const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticator } = require('otplib');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/sendOTP');

// Generate JWT Token with enhanced security
const generateToken = (id) => {
  const payload = { 
    id, 
    iat: Math.floor(Date.now() / 1000),
    type: 'access'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
    issuer: 'gamepasals',
    audience: 'gamepasals-users'
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const payload = { 
    id, 
    token: refreshToken,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  };
  
  return {
    token: jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'gamepasals',
      audience: 'gamepasals-users'
    }),
    refreshToken
  };
};

// Validate JWT Secret strength
const validateJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  return true;
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Validate JWT secret strength
    validateJWTSecret();
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne(
      phone ? { $or: [{ email }, { phone }] } : { email }
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email' + (phone ? ' or phone number' : '')
      });
    }

    // Create user (password will be hashed by pre-save middleware)
    const user = new User({
      username,
      email,
      password,
      ...(phone && { phone })
    });

    // Generate and save OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, 'verification');
    
    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      data: {
        userId: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.clearOTP();
    user.lastLogin = new Date();
    
    // Generate tokens
    const accessToken = generateToken(user._id);
    const { token: refreshToken, refreshToken: refreshTokenValue } = generateRefreshToken(user._id);
    
    // Add refresh token to user
    user.addRefreshToken(refreshTokenValue);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP for unverified users
      const otp = user.generateOTP();
      await user.save();

      // Send OTP email
      await sendOTPEmail(user.email, otp, 'verification');

      return res.status(401).json({
        success: false,
        message: 'Please verify your email. A new OTP has been sent.',
        requiresVerification: true,
        email: user.email
      });
    }

    // If 2FA is enabled, return a temporary token indicating 2FA is required
    if (user.twoFactorAuth && user.twoFactorAuth.enabled) {
      const tempToken = jwt.sign({ id: user._id, type: 'twofactor', purpose: 'login' }, process.env.JWT_SECRET, {
        expiresIn: '5m',
        issuer: 'gamepasals',
        audience: 'gamepasals-users'
      });
      return res.status(200).json({
        success: true,
        message: 'Two-factor authentication required',
        data: {
          twoFactorRequired: true,
          tempToken,
          user: {
            id: user._id,
            username: user.username,
            email: user.email
          }
        }
      });
    }

    // Update last login
    user.lastLogin = new Date();
    
    // Generate tokens
    const accessToken = generateToken(user._id);
    const { token: refreshToken, refreshToken: refreshTokenValue } = generateRefreshToken(user._id);
    
    // Add refresh token to user
    user.addRefreshToken(refreshTokenValue);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        twoFactorAuth: {
          enabled: !!(user.twoFactorAuth && user.twoFactorAuth.enabled)
        },
        socialAccounts: {
          google: { verified: !!user?.socialAccounts?.google?.verified },
          facebook: { verified: !!user?.socialAccounts?.facebook?.verified },
          twitter: { verified: !!user?.socialAccounts?.twitter?.verified }
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate OTP for password reset
    const otp = user.generateOTP();
    await user.save();

    // Send reset OTP email
    const emailResult = await sendOTPEmail(email, otp, 'reset');
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update password
    user.password = newPassword;
    user.clearOTP();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: refreshTokenFromBody } = req.body;

    if (!refreshTokenFromBody) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshTokenFromBody, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if refresh token exists in user's refresh tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === decoded.token);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const user = req.user;
    
    // Remove all refresh tokens for this user
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Link social media account
// @route   POST /api/auth/link-social
// @access  Private
const linkSocialAccount = async (req, res) => {
  try {
    const { provider, socialId, socialEmail } = req.body;
    const userId = req.user.id;

    if (!provider || !socialId || !socialEmail) {
      return res.status(400).json({
        success: false,
        message: 'Provider, social ID, and social email are required'
      });
    }

    const validProviders = ['google', 'facebook', 'twitter'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider. Supported: google, facebook, twitter'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if social account is already linked to another user
    const existingSocialUser = await User.findOne({
      [`socialAccounts.${provider}.id`]: socialId
    });

    if (existingSocialUser && existingSocialUser._id.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: 'This social account is already linked to another user'
      });
    }

    // Link social account
    user.linkSocialAccount(provider, {
      id: socialId,
      email: socialEmail
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: `${provider} account linked successfully`,
      data: {
        provider,
        linked: true,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Link social account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while linking social account'
    });
  }
};

// @desc    Unlink social media account
// @route   DELETE /api/auth/unlink-social
// @access  Private
const unlinkSocialAccount = async (req, res) => {
  try {
    const { provider } = req.body;
    const userId = req.user.id;

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider is required'
      });
    }

    const validProviders = ['google', 'facebook', 'twitter'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider. Supported: google, facebook, twitter'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Unlink social account
    user.unlinkSocialAccount(provider);
    await user.save();

    res.status(200).json({
      success: true,
      message: `${provider} account unlinked successfully`
    });

  } catch (error) {
    console.error('Unlink social account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unlinking social account'
    });
  }
};

// @desc    Setup 2FA
// @route   POST /api/auth/setup-2fa
// @access  Private
const setup2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.twoFactorAuth && user.twoFactorAuth.enabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled'
      });
    }

    // Generate TOTP secret and backup codes
    const secret = authenticator.generateSecret();
    const backupCodes = user.generateBackupCodes();
    // Store temporarily (not enabled yet)
    user.twoFactorAuth = {
      enabled: false,
      secret: secret,
      backupCodes: backupCodes,
      verified: false
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA setup initiated',
      data: {
        secret,
        backupCodes,
        // Provide both otpauthUrl and qrCode (same content) for compatibility
        otpauthUrl: authenticator.keyuri(user.email, 'GamePasal', secret),
        qrCode: authenticator.keyuri(user.email, 'GamePasal', secret)
      }
    });

  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting up 2FA'
    });
  }
};

// @desc    Verify and enable 2FA (account settings)
// @route   POST /api/auth/verify-2fa
// @access  Private
const verify2FA = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.twoFactorAuth || !user.twoFactorAuth.secret) {
      return res.status(400).json({
        success: false,
        message: '2FA setup not initiated'
      });
    }

    // Verify TOTP code using secret
    const isValid = authenticator.verify({ token: code, secret: user.twoFactorAuth.secret });
    if (isValid) {
      user.enable2FA(user.twoFactorAuth.secret, user.twoFactorAuth.backupCodes);
      await user.save();

      res.status(200).json({
        success: true,
        message: '2FA enabled successfully',
        data: {
          enabled: true,
          backupCodes: user.twoFactorAuth.backupCodes
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying 2FA'
    });
  }
};
// @desc    Complete 2FA login (after password step)
// @route   POST /api/auth/verify-2fa-login
// @access  Public (uses temp token)
const verify2FALogin = async (req, res) => {
  try {
    const { code, tempToken } = req.body;
    if (!code || !tempToken) {
      return res.status(400).json({ success: false, message: 'Code and temp token are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    if (decoded.type !== 'twofactor' || decoded.purpose !== 'login') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.twoFactorAuth || !user.twoFactorAuth.secret) {
      return res.status(400).json({ success: false, message: '2FA not enabled' });
    }

    const isValid = require('otplib').authenticator.verify({ token: code, secret: user.twoFactorAuth.secret });
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Success: issue normal tokens
    user.lastLogin = new Date();
    const accessToken = generateToken(user._id);
    const { token: refreshToken, refreshToken: refreshTokenValue } = generateRefreshToken(user._id);
    user.addRefreshToken(refreshTokenValue);
    await user.save();

    return res.status(200).json({
      success: true,
      message: '2FA verified. Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    console.error('Verify 2FA login error:', error);
    res.status(500).json({ success: false, message: 'Server error while verifying 2FA login' });
  }
};

// @desc    Disable 2FA
// @route   DELETE /api/auth/disable-2fa
// @access  Private
const disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.twoFactorAuth || !user.twoFactorAuth.enabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled'
      });
    }

    user.disable2FA();
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully'
    });

  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while disabling 2FA'
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User is already verified'
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, 'verification');
    
    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending verification'
    });
  }
};

// @desc    Google OAuth login
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { idToken, email, name, picture } = req.body;

    if (!idToken || !email) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token and email are required'
      });
    }

    // Check if user exists with this email
    let user = await User.findOne({ email });

    if (user) {
      // User exists, check if Google account is linked
      if (!user.socialAccounts?.google?.verified) {
        // Link Google account to existing user
        user.linkSocialAccount('google', {
          id: idToken.split('.')[1], // Extract user ID from token
          email: email
        });
        await user.save();
      }
    } else {
      // Create new user with Google account
      const username = name?.replace(/\s+/g, '_').toLowerCase() || email.split('@')[0];
      
      // Ensure username is unique
      let uniqueUsername = username;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${username}_${counter}`;
        counter++;
      }

      user = new User({
        username: uniqueUsername,
        email: email,
        password: crypto.randomBytes(32).toString('hex'), // Random password
        isVerified: true,
        emailVerified: true
      });

      // Link Google account
      user.linkSocialAccount('google', {
        id: idToken.split('.')[1],
        email: email
      });

      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    
    // Generate tokens
    const accessToken = generateToken(user._id);
    const { token: refreshToken, refreshToken: refreshTokenValue } = generateRefreshToken(user._id);
    
    // Add refresh token to user
    user.addRefreshToken(refreshTokenValue);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google login'
    });
  }
};

// @desc    Facebook OAuth login
// @route   POST /api/auth/facebook
// @access  Public
const facebookLogin = async (req, res) => {
  try {
    const { accessToken, userID, email, name, picture } = req.body;

    if (!accessToken || !userID || !email) {
      return res.status(400).json({
        success: false,
        message: 'Facebook access token, user ID, and email are required'
      });
    }

    // Check if user exists with this email
    let user = await User.findOne({ email });

    if (user) {
      // User exists, check if Facebook account is linked
      if (!user.socialAccounts?.facebook?.verified) {
        // Link Facebook account to existing user
        user.linkSocialAccount('facebook', {
          id: userID,
          email: email
        });
        await user.save();
      }
    } else {
      // Create new user with Facebook account
      const username = name?.replace(/\s+/g, '_').toLowerCase() || email.split('@')[0];
      
      // Ensure username is unique
      let uniqueUsername = username;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${username}_${counter}`;
        counter++;
      }

      user = new User({
        username: uniqueUsername,
        email: email,
        password: crypto.randomBytes(32).toString('hex'), // Random password
        isVerified: true,
        emailVerified: true
      });

      // Link Facebook account
      user.linkSocialAccount('facebook', {
        id: userID,
        email: email
      });

      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    
    // Generate tokens
    const accessTokenJWT = generateToken(user._id);
    const { token: refreshToken, refreshToken: refreshTokenValue } = generateRefreshToken(user._id);
    
    // Add refresh token to user
    user.addRefreshToken(refreshTokenValue);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Facebook login successful',
      data: {
        accessToken: accessTokenJWT,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });

  } catch (error) {
    console.error('Facebook login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Facebook login'
    });
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  linkSocialAccount,
  unlinkSocialAccount,
  setup2FA,
  verify2FA,
  verify2FALogin,
  disable2FA,
  resendVerification,
  googleLogin,
  facebookLogin
};