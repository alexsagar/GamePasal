const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    title: String,
    price: Number,
    salePrice: Number,
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    image: String
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  subtotal: Number,
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  promoCode: String,
  paymentMethod: {
    type: String,
    enum: ['eSewa', 'Khalti', 'BankTransfer', 'Manual', 'Pending'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    paymentProof: String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  shippingAddress: {
    fullName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    country: String,
    zipCode: String
  },
  deliveryMethod: {
    type: String,
    enum: ['digital', 'email', 'sms'],
    default: 'digital'
  },
  deliveryDetails: {
    deliveredAt: Date,
    deliveryCode: String,
    downloadLinks: [String]
  },
  notes: String,
  adminNotes: String,
  statusHistory: [{
    status: String,
    updatedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String
  }],

  // V2 checkout + wallet fields (paisa integers)
  totalPaisa: { type: Number },
  walletUsedPaisa: { type: Number, default: 0 },
  gatewayUsedPaisa: { type: Number, default: 0 },
  paymentMethodV2: { type: String, enum: ['WALLET','GATEWAY','SPLIT'], default: undefined },
  paymentStatusV2: { type: String, enum: ['PENDING','PAID','FAILED','CANCELLED','REFUNDED'], default: 'PENDING' },
  gateway: { type: String, enum: ['ESEWA','KHALTI','IMEPAY','FONEPAY', null], default: null },
  gatewayRef: { type: String, index: true },
  walletHoldTxnId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction' },
  checkoutIdempotencyKey: { type: String, index: true }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    // Generate order number with timestamp to avoid race conditions
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp}${random}`;
  }
  next();
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  if (this.products && this.products.length > 0) {
    this.subtotal = this.products.reduce((total, item) => {
      const price = item.salePrice || item.price;
      return total + (price * item.quantity);
    }, 0);
    
    this.totalAmount = this.subtotal + this.tax - this.discount;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);