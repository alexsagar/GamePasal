const mongoose = require('mongoose');

const walletTxnSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  type: { type: String, enum: ['TOPUP','PURCHASE','REFUND','ADJUSTMENT','DELETION','HOLD','RELEASE'], required: true },
  method: { type: String, enum: ['ESEWA_QR','ESEWA_GATEWAY','KHALTI_GATEWAY','INTERNAL','CHECKOUT'], default: 'ESEWA_QR' },
  provider: { type: String, enum: ['ESEWA_QR','CHECKOUT','ESEWA','KHALTI','IMEPAY','FONEPAY','INTERNAL'], default: 'INTERNAL' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING','UNDER_REVIEW','AUTHORIZED','SUCCESS','REJECTED','DELETED','FAILED','RELEASED'], default: 'PENDING', index: true },
  receiptUrl: String,
  referenceNote: String,
  adminNote: String,
  balanceAfter: Number,
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  idempotencyKey: { type: String, index: true },
  gatewayTransactionId: { type: String, index: true },
  gateway: { type: String, enum: ['ESEWA','KHALTI','IMEPAY','FONEPAY'], default: null },
  paymentUrl: { type: String },
  gatewayResponse: mongoose.Schema.Types.Mixed,
  meta: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', walletTxnSchema);


