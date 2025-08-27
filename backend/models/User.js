const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [2, 'Username must be at least 2 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    match: [/^(98|97)\d{8}$/, 'Please provide a valid Nepali phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
    validate: {
      validator: function(password) {
        // Enhanced password validation
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Social Media Linking
  socialAccounts: {
    google: {
      id: String,
      email: String,
      verified: { type: Boolean, default: false }
    },
    facebook: {
      id: String,
      email: String,
      verified: { type: Boolean, default: false }
    },
    twitter: {
      id: String,
      email: String,
      verified: { type: Boolean, default: false }
    }
  },
  
  // Two-Factor Authentication
  twoFactorAuth: {
    enabled: { type: Boolean, default: false },
    secret: String,
    backupCodes: [String],
    verified: { type: Boolean, default: false }
  },
  
  refreshTokens: [{
    token: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  // Wallet fields (paisa)
  walletBalance: {
    type: Number,
    default: 0
  },
  walletCurrency: {
    type: String,
    default: 'GP Credits'
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'refreshTokens.token': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000);
  
  this.otp = {
    code: otp,
    expiresAt
  };
  
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(candidateOTP) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  
  if (this.otp.expiresAt < new Date()) {
    return false;
  }
  
  return this.otp.code === candidateOTP;
};

// Clear OTP
userSchema.methods.clearOTP = function() {
  this.otp = undefined;
};

// Social Media Linking Methods
userSchema.methods.linkSocialAccount = function(provider, socialData) {
  if (!this.socialAccounts) {
    this.socialAccounts = {};
  }
  
  this.socialAccounts[provider] = {
    id: socialData.id,
    email: socialData.email,
    verified: true
  };
  
  // If social email matches user email, mark email as verified
  if (socialData.email.toLowerCase() === this.email.toLowerCase()) {
    this.emailVerified = true;
    this.isVerified = true;
  }
};

userSchema.methods.unlinkSocialAccount = function(provider) {
  if (this.socialAccounts && this.socialAccounts[provider]) {
    delete this.socialAccounts[provider];
  }
};

userSchema.methods.hasSocialAccount = function(provider) {
  return this.socialAccounts && this.socialAccounts[provider] && this.socialAccounts[provider].verified;
};

// Two-Factor Authentication Methods
userSchema.methods.enable2FA = function(secret, backupCodes) {
  this.twoFactorAuth = {
    enabled: true,
    secret: secret,
    backupCodes: backupCodes,
    verified: true
  };
};

userSchema.methods.disable2FA = function() {
  this.twoFactorAuth = {
    enabled: false,
    secret: undefined,
    backupCodes: [],
    verified: false
  };
};

userSchema.methods.verify2FASecret = function(secret) {
  return this.twoFactorAuth && this.twoFactorAuth.secret === secret;
};

userSchema.methods.verifyBackupCode = function(code) {
  if (!this.twoFactorAuth || !this.twoFactorAuth.backupCodes) {
    return false;
  }
  
  const index = this.twoFactorAuth.backupCodes.indexOf(code);
  if (index > -1) {
    // Remove used backup code
    this.twoFactorAuth.backupCodes.splice(index, 1);
    return true;
  }
  
  return false;
};

userSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
  }
  return codes;
};

// Add refresh token
userSchema.methods.addRefreshToken = function(token) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  this.refreshTokens.push({
    token,
    expiresAt
  });
  
  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', userSchema);