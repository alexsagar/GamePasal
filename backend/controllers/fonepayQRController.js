const PaymentIntent = require('../models/PaymentIntent');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendPhoto, sendText, buildCaption } = require('../lib/telegram');
const path = require('path');
const fs = require('fs').promises;

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per window

// Helper function to check rate limits
const checkRateLimit = (identifier, maxRequests = RATE_LIMIT_MAX_REQUESTS) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, []);
  }
  
  const requests = rateLimitStore.get(identifier);
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitStore.set(identifier, validRequests);
  return true;
};

// Helper function to get client IP
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         'unknown';
};

/**
 * Create a new payment intent for an order
 * POST /api/payments/qr/intents
 */
exports.createIntent = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const userId = req.user.id;
    const clientIP = getClientIP(req);

    // Rate limiting
    const rateLimitKey = `create_intent_${userId}_${clientIP}`;
    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({
        success: false,
        message: 'Too many payment intent creation requests. Please try again later.'
      });
    }

    // Validate required fields
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
      });
    }

    // Amount is optional from client; server derives expectedAmount
    const numericAmount = amount ? parseFloat(amount) : undefined;

    // Find and validate order
    const order = await Order.findById(orderId).populate('userId', 'username email');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check order ownership
    if (order.userId && order.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create payment intent for this order'
      });
    }

    // Check order status
    if (order.status !== 'AWAITING_PAYMENT') {
      return res.status(400).json({
        success: false,
        message: 'Order is not awaiting payment'
      });
    }

    // Validate amount matches order total
    const expectedAmount = order.totalPaisa ? order.totalPaisa / 100 : (order.totalAmount || order.subtotal || 0);
    if (typeof numericAmount === 'number' && Math.abs(numericAmount - expectedAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Amount mismatch. Expected ${expectedAmount.toFixed(2)} NPR`
      });
    }

    // Check for existing pending intent for this order
    const existingIntent = await PaymentIntent.findOne({
      order: orderId,
      status: { $in: ['pending', 'awaiting_verification'] }
    });

    if (existingIntent) {
      return res.status(400).json({
        success: false,
        message: 'A payment intent already exists for this order',
        data: { intentId: existingIntent._id }
      });
    }

    // Create payment intent
    const paymentIntent = new PaymentIntent({
      user: userId,
      order: orderId,
      type: 'order',
      amount: expectedAmount,
      currency: 'NPR',
      provider: 'fonepay_qr',
      status: 'pending',
      createdFromIP: clientIP
    });

    await paymentIntent.save();

    // Build absolute URL for the uploaded receipt served by /uploads
    const absoluteReceiptUrl = `${req.protocol}://${req.get('host')}/${paymentIntent.receiptUrl.replace(/^\/?/, '')}`;

    // Notify Telegram with receipt + minimal caption
    try {
      // Ensure we have populated references
      const [user, order] = await Promise.all([
        User.findById(paymentIntent.user).lean(),
        paymentIntent.order ? Order.findById(paymentIntent.order).lean() : Promise.resolve(null)
      ]);

      const caption = buildCaption({
        kind: order ? 'ORDER' : 'WALLET',
        order,
        user: user || {},
        attempt: {
          amountNpr: paymentIntent.amount,
          referenceLast4: paymentIntent.externalRef ? paymentIntent.externalRef.slice(-4) : undefined,
          paidAtLocal: new Date()
        },
        adminUrl: `${process.env.APP_BASE_URL || 'http://localhost:5173'}/admin/payment-attempts`
      });

      await sendPhoto({ url: absoluteReceiptUrl, captionMd: caption });
    } catch (notifyErr) {
      console.error('Telegram notify (receipt) failed:', notifyErr?.message || notifyErr);
      // Don't fail the request if telegram fails
    }

    // Return intent details with QR instructions
    res.json({
      success: true,
      data: {
        intentId: paymentIntent._id,
        amount: numericAmount,
        currency: 'NPR',
        orderId: orderId,
        status: 'pending',
        instructions: {
          merchantName: 'GamePasal',
          merchantId: 'GP-QR-001', // Static business QR ID
          qrInstructions: 'Scan the QR code with your banking app and pay the exact amount',
          referenceNote: 'Include your transaction reference when making the payment'
        },
        createdAt: paymentIntent.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent'
    });
  }
};

/**
 * Upload receipt for a payment intent
 * POST /api/payments/qr/:id/receipt
 */
exports.uploadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { externalRef } = req.body;
    const userId = req.user.id;
    const clientIP = getClientIP(req);

    // Rate limiting
    const rateLimitKey = `upload_receipt_${userId}_${clientIP}`;
    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({
        success: false,
        message: 'Too many receipt upload requests. Please try again later.'
      });
    }

    // Find payment intent
    const paymentIntent = await PaymentIntent.findById(id);
    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    // Check ownership
    if (paymentIntent.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload receipt for this payment intent'
      });
    }

    // Check if intent can be modified
    if (!paymentIntent.canModify()) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent cannot be modified in its current status'
      });
    }

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Receipt image is required'
      });
    }

    // externalRef optional (auto-filled by admin later)

    // Update payment intent
    if (externalRef && externalRef.trim()) {
      paymentIntent.externalRef = externalRef.trim();
    }
    paymentIntent.receiptUrl = req.file.path; // Path from multer
    paymentIntent.status = 'awaiting_verification';
    paymentIntent.lastUpdatedFromIP = clientIP;

    await paymentIntent.save();

    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      data: {
        intentId: paymentIntent._id,
        status: 'awaiting_verification',
        externalRef: paymentIntent.externalRef,
        uploadedAt: paymentIntent.updatedAt
      }
    });

  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload receipt'
    });
  }
};

/**
 * Get payment intent status
 * GET /api/payments/qr/:id/status
 */
exports.getIntentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const paymentIntent = await PaymentIntent.findById(id)
      .populate('user', 'username email')
      .populate('order', 'orderCode orderNumber totalAmount')
      .populate('verifiedBy', 'username email')
      .populate('rejectedBy', 'username email');

    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    // Check ownership (users can only see their own intents)
    if (paymentIntent.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment intent'
      });
    }

    // Return status data (SSE-friendly format)
    const statusData = {
      success: true,
      data: {
        intentId: paymentIntent._id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        externalRef: paymentIntent.externalRef,
        notes: paymentIntent.notes,
        createdAt: paymentIntent.createdAt,
        updatedAt: paymentIntent.updatedAt,
        order: paymentIntent.order ? {
          orderCode: paymentIntent.order.orderCode || paymentIntent.order.orderNumber,
          totalAmount: paymentIntent.order.totalAmount
        } : null,
        verifiedBy: paymentIntent.verifiedBy ? {
          username: paymentIntent.verifiedBy.username,
          email: paymentIntent.verifiedBy.email
        } : null,
        rejectedBy: paymentIntent.rejectedBy ? {
          username: paymentIntent.rejectedBy.username,
          email: paymentIntent.rejectedBy.email
        } : null,
        verifiedAt: paymentIntent.verifiedAt,
        rejectedAt: paymentIntent.rejectedAt
      }
    };

    // Set SSE headers if requested
    const acceptsSSE = req.headers.accept && req.headers.accept.includes('text/event-stream');
    if (acceptsSSE) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify(statusData)}\n\n`);
      res.end();
    } else {
      res.json(statusData);
    }

  } catch (error) {
    console.error('Error getting intent status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment intent status'
    });
  }
};

/**
 * Admin verify payment intent
 * POST /api/payments/qr/:id/verify
 */
exports.adminVerify = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;
    const clientIP = getClientIP(req);

    // Find payment intent
    const paymentIntent = await PaymentIntent.findById(id)
      .populate('order')
      .populate('user');

    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    // Check if intent can be verified
    if (paymentIntent.status !== 'awaiting_verification') {
      return res.status(400).json({
        success: false,
        message: 'Payment intent is not awaiting verification'
      });
    }

    // Update payment intent
    paymentIntent.status = 'verified';
    paymentIntent.notes = notes || '';
    paymentIntent.verifiedBy = adminId;
    paymentIntent.verifiedAt = new Date();
    paymentIntent.lastUpdatedFromIP = clientIP;

    await paymentIntent.save();

    // If this is an order payment, mark the order as paid
    if (paymentIntent.type === 'order' && paymentIntent.order) {
      const order = paymentIntent.order;
      order.status = 'PAID';
      order.paymentStatus = 'verified';
      order.paymentMethod = 'fonepay_qr';
      order.gateway = 'FONEPAY';
      
      // Update payment details
      if (!order.paymentDetails) {
        order.paymentDetails = {};
      }
      order.paymentDetails.provider = 'fonepay_qr';
      order.paymentDetails.externalRef = paymentIntent.externalRef;
      order.paymentDetails.receiptUrl = paymentIntent.receiptUrl;
      order.paymentDetails.verifiedAt = new Date();

      // Add audit entry
      order.audit.push({
        action: 'PAYMENT_VERIFIED',
        timestamp: new Date(),
        note: `Payment verified via QR. Reference: ${paymentIntent.externalRef}`,
        reviewer: req.user.username || req.user.email
      });

      await order.save();
    }

    res.json({
      success: true,
      message: 'Payment intent verified successfully',
      data: {
        intentId: paymentIntent._id,
        status: 'verified',
        verifiedAt: paymentIntent.verifiedAt,
        verifiedBy: req.user.username || req.user.email,
        notes: paymentIntent.notes
      }
    });

  } catch (error) {
    console.error('Error verifying payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment intent'
    });
  }
};

/**
 * Admin reject payment intent
 * POST /api/payments/qr/:id/reject
 */
exports.adminReject = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;
    const clientIP = getClientIP(req);

    // Find payment intent
    const paymentIntent = await PaymentIntent.findById(id)
      .populate('order')
      .populate('user');

    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    // Check if intent can be rejected
    if (paymentIntent.status !== 'awaiting_verification') {
      return res.status(400).json({
        success: false,
        message: 'Payment intent is not awaiting verification'
      });
    }

    // Update payment intent
    paymentIntent.status = 'rejected';
    paymentIntent.notes = notes || '';
    paymentIntent.rejectedBy = adminId;
    paymentIntent.rejectedAt = new Date();
    paymentIntent.lastUpdatedFromIP = clientIP;

    await paymentIntent.save();

    // If this is an order payment, mark the order as awaiting payment again
    if (paymentIntent.type === 'order' && paymentIntent.order) {
      const order = paymentIntent.order;
      order.status = 'AWAITING_PAYMENT';
      order.paymentStatus = 'rejected';

      // Add audit entry
      order.audit.push({
        action: 'PAYMENT_REJECTED',
        timestamp: new Date(),
        note: `Payment rejected via QR. Reason: ${paymentIntent.notes}`,
        reviewer: req.user.username || req.user.email
      });

      await order.save();
    }

    res.json({
      success: true,
      message: 'Payment intent rejected successfully',
      data: {
        intentId: paymentIntent._id,
        status: 'rejected',
        rejectedAt: paymentIntent.rejectedAt,
        rejectedBy: req.user.username || req.user.email,
        notes: paymentIntent.notes
      }
    });

  } catch (error) {
    console.error('Error rejecting payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment intent'
    });
  }
};

/**
 * Admin get all payment intents
 * GET /api/payments/qr/admin/intents
 */
exports.adminGetIntents = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const intents = await PaymentIntent.find(query)
      .populate('user', 'username email')
      .populate('order', 'orderCode orderNumber totalAmount')
      .populate('verifiedBy', 'username email')
      .populate('rejectedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PaymentIntent.countDocuments(query);

    res.json({
      success: true,
      data: {
        intents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting payment intents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment intents'
    });
  }
};
