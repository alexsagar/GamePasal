const express = require('express');
const { body } = require('express-validator');
const {
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
  resendVerification
} = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^(98|97)\d{8}$/)
    .withMessage('Please provide a valid Nepali phone number'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshTokenValidation, refreshToken);
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Social Media Linking
router.post('/link-social', auth, linkSocialAccount);
router.delete('/unlink-social', auth, unlinkSocialAccount);

// Two-Factor Authentication
router.post('/setup-2fa', auth, setup2FA);
router.post('/verify-2fa', auth, verify2FA);
router.delete('/disable-2fa', auth, disable2FA);
// 2FA login completion (public; uses temp token)
router.post('/verify-2fa-login', verify2FALogin);

// Email Verification
router.post('/resend-verification', resendVerification);

module.exports = router;