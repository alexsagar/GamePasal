const mongoose = require('mongoose');

const PaymentAttemptSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: ['ORDER', 'WALLET'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // Dynamic reference based on targetType
    // When ORDER: refers to Order
    // When WALLET: refers to User
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amountNpr: {
    type: Number,
    required: true,
    min: 0
  },
  payerName: String,
  referenceLast4: String,
  paidAtLocal: Date,
  proofUrl: String, // public or signed URL
  status: {
    type: String,
    enum: ['SUBMITTED', 'APPROVED', 'REJECTED'],
    default: 'SUBMITTED',
    index: true
  },
  reviewer: String,
  reviewNote: String
}, {
  timestamps: true
});

// Compound indexes for performance
PaymentAttemptSchema.index({ targetType: 1, targetId: 1 });
PaymentAttemptSchema.index({ userId: 1, createdAt: -1 });
PaymentAttemptSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentAttempt', PaymentAttemptSchema);

