const mongoose = require('mongoose');

const paymentIntentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null // nullable for wallet top-ups
  },
  type: {
    type: String,
    enum: ['order', 'wallet'],
    default: 'order'
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'NPR'
  },
  provider: {
    type: String,
    enum: ['fonepay_qr'],
    default: 'fonepay_qr'
  },
  status: {
    type: String,
    enum: ['pending', 'awaiting_verification', 'verified', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  externalRef: {
    type: String,
    trim: true,
    maxlength: [100, 'External reference cannot exceed 100 characters']
  },
  receiptUrl: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  // Audit fields for admin actions
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  // IP tracking for security
  createdFromIP: {
    type: String,
    default: null
  },
  lastUpdatedFromIP: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentIntentSchema.index({ user: 1, createdAt: -1 });
paymentIntentSchema.index({ order: 1 });
paymentIntentSchema.index({ status: 1, createdAt: -1 });
paymentIntentSchema.index({ provider: 1, status: 1 });

// Virtual for formatted amount
paymentIntentSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Ensure virtual fields are serialized
paymentIntentSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update IP addresses
paymentIntentSchema.pre('save', function(next) {
  if (this.isNew) {
    // This would be set by the controller based on request IP
    this.createdFromIP = this.createdFromIP;
  } else {
    // This would be set by the controller based on request IP
    this.lastUpdatedFromIP = this.lastUpdatedFromIP;
  }
  next();
});

// Static method to find intents by status
paymentIntentSchema.statics.findByStatus = function(status, limit = 50) {
  return this.find({ status })
    .populate('user', 'username email')
    .populate('order', 'orderCode orderNumber totalAmount')
    .populate('verifiedBy', 'username email')
    .populate('rejectedBy', 'username email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Instance method to check if intent can be modified
paymentIntentSchema.methods.canModify = function() {
  return ['pending', 'awaiting_verification'].includes(this.status);
};

// Instance method to check if intent is completed
paymentIntentSchema.methods.isCompleted = function() {
  return ['verified', 'rejected', 'expired'].includes(this.status);
};

module.exports = mongoose.model('PaymentIntent', paymentIntentSchema);
