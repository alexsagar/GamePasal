const mongoose = require('mongoose');
const crypto = require('crypto');
const PaymentAttempt = require('../models/PaymentAttempt');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendPhoto, sendText, buildCaption } = require('../lib/telegram');
const { onOrderPaid } = require('../services/fulfilment');
const cloudinary = require('../utils/cloudinary');
const { normalizeOrderStatus } = require('../utils/orderStateMachine');

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

// Upload receipt and notify via Telegram
exports.uploadPaymentReceipt = async (req, res) => {
  try {
    const { orderId } = req.body;
    const receipt = req.file;

    if (!receipt) {
      return res.status(400).json({ message: 'No receipt file uploaded' });
    }

    // Find the order and get details
    const order = await Order.findById(orderId)
      .populate('user', 'email name')
      .populate('products.product', 'name price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get user details (handle both registered and guest users)
    const userEmail = order.user ? order.user.email : order.guestEmail;
    const userName = order.user ? order.user.name : 'Guest User';

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(receipt.path, {
      folder: 'receipts',
      use_filename: true,
      unique_filename: true
    });

    // Update order with receipt URL
    order.paymentReceipt = result.secure_url;
    await order.save();

    // Build message for Telegram
    const caption = `🧾 *New Payment Receipt*\n\n` +
      `👤 User: ${userName} (${userEmail})\n` +
      `🛒 Products:\n${order.products.map(p =>
        `- ${p.product.name} x${p.quantity}`
      ).join('\n')}\n` +
      `💰 Total Amount: NPR ${(order.totalAmount / 100).toFixed(2)}\n` +
      `🆔 Order ID: \`${order._id}\`\n` +
      `📧 Order Type: ${order.user ? 'Registered User' : 'Guest Checkout'}`;

    // Send to Telegram with receipt
    await sendPhoto({
      url: result.secure_url,
      captionMd: caption
    });

    res.json({ message: 'Receipt uploaded and notification sent' });
  } catch (error) {
    console.error('Receipt upload error:', error);
    res.status(500).json({ message: 'Failed to process receipt' });
  }
};

// === ORDER QR FLOW ===

// Submit QR payment for order
exports.submitQrForOrder = async (req, res) => {
  try {
    const { orderId, amountNpr, payerName, referenceLast4, paidAtLocal, proofUrl } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!orderId || !amountNpr) {
      return res.status(400).json({
        success: false,
        message: 'orderId and amountNpr are required'
      });
    }

    // Find and validate order
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order'
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
    const expectedAmount = order.totalPaisa ? order.totalPaisa / 100 : order.total || 0;
    if (Math.abs(amountNpr - expectedAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Amount mismatch. Expected NPR ${expectedAmount.toFixed(2)}`
      });
    }

    // Create payment attempt
    const attempt = new PaymentAttempt({
      targetType: 'ORDER',
      targetId: orderId,
      userId,
      amountNpr,
      payerName,
      referenceLast4,
      paidAtLocal: paidAtLocal ? new Date(paidAtLocal) : undefined,
      proofUrl,
      status: 'SUBMITTED'
    });

    await attempt.save();

    // Update order status
    order.status = 'AWAITING_VERIFICATION';
    order.audit.push({
      action: 'PAYMENT_SUBMITTED',
      timestamp: new Date(),
      note: `Payment attempt submitted: NPR ${amountNpr}`
    });
    await order.save();

    // Send Telegram notification
    try {
      const adminUrl = `${APP_BASE_URL}/admin/orders/${orderId}?attempt=${attempt._id}`;
      const caption = buildCaption({
        kind: 'ORDER',
        order,
        user: order.user,
        attempt,
        adminUrl
      });

      if (proofUrl) {
        await sendPhoto({ url: proofUrl, captionMd: caption });
      } else {
        await sendText(caption);
      }
    } catch (telegramError) {
      console.error('Telegram notification failed:', telegramError);
      // Don't fail the request if telegram fails
    }

    res.json({
      success: true,
      data: { attemptId: attempt._id }
    });

  } catch (error) {
    console.error('submitQrForOrder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit payment'
    });
  }
};

// Admin approve order payment attempt
exports.adminApproveOrderAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { reviewNote } = req.body;
    const reviewer = req.user.username || req.user.email;

    const attempt = await PaymentAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Payment attempt not found'
      });
    }

    if (attempt.status !== 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: 'Payment attempt already processed'
      });
    }

    if (attempt.targetType !== 'ORDER') {
      return res.status(400).json({
        success: false,
        message: 'Invalid attempt type for order approval'
      });
    }

    const order = await Order.findById(attempt.targetId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'AWAITING_VERIFICATION') {
      return res.status(400).json({
        success: false,
        message: 'Order is not awaiting verification'
      });
    }

    // Update attempt
    attempt.status = 'APPROVED';
    attempt.reviewer = reviewer;
    attempt.reviewNote = reviewNote;
    await attempt.save();

    // Update order
    order.status = 'PAID';
    order.audit.push({
      action: 'PAYMENT_APPROVED',
      timestamp: new Date(),
      note: reviewNote || 'Payment approved by admin',
      reviewer
    });
    await order.save();

    // Trigger fulfillment
    await onOrderPaid(order);

    // Send Telegram notification
    try {
      await sendText(`✅ *Payment Approved*\nOrder: \`${order.orderCode || order.orderNumber}\`\nAmount: NPR ${attempt.amountNpr.toFixed(2)}\nReviewer: ${reviewer}`);
    } catch (telegramError) {
      console.error('Telegram notification failed:', telegramError);
    }

    res.json({
      success: true,
      message: 'Payment approved successfully'
    });

  } catch (error) {
    console.error('adminApproveOrderAttempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve payment'
    });
  }
};

// Admin reject order payment attempt
exports.adminRejectOrderAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { reviewNote } = req.body;
    const reviewer = req.user.username || req.user.email;

    const attempt = await PaymentAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Payment attempt not found'
      });
    }

    if (attempt.status !== 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: 'Payment attempt already processed'
      });
    }

    if (attempt.targetType !== 'ORDER') {
      return res.status(400).json({
        success: false,
        message: 'Invalid attempt type for order rejection'
      });
    }

    const order = await Order.findById(attempt.targetId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update attempt
    attempt.status = 'REJECTED';
    attempt.reviewer = reviewer;
    attempt.reviewNote = reviewNote;
    await attempt.save();

    // Update order status back to awaiting payment
    order.status = 'AWAITING_PAYMENT';
    order.audit.push({
      action: 'PAYMENT_REJECTED',
      timestamp: new Date(),
      note: reviewNote || 'Payment rejected by admin',
      reviewer
    });
    await order.save();

    // Send Telegram notification
    try {
      await sendText(`❌ *Payment Rejected*\nOrder: \`${order.orderCode || order.orderNumber}\`\nAmount: NPR ${attempt.amountNpr.toFixed(2)}\nReason: ${reviewNote || 'No reason provided'}\nReviewer: ${reviewer}`);
    } catch (telegramError) {
      console.error('Telegram notification failed:', telegramError);
    }

    res.json({
      success: true,
      message: 'Payment rejected successfully'
    });

  } catch (error) {
    console.error('adminRejectOrderAttempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment'
    });
  }
};

// === ADMIN LIST ENDPOINTS ===

// Get payment attempts for admin
exports.getPaymentAttempts = async (req, res) => {
  try {
    const { targetType, status, limit = 50 } = req.query;

    const query = {};
    if (targetType) query.targetType = targetType.toUpperCase();
    if (status) query.status = status.toUpperCase();

    const attempts = await PaymentAttempt.find(query)
      .populate('userId', 'username email')
      .populate('targetId') // This will populate Order or User based on targetType
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Transform the data to include user info properly
    const transformedAttempts = attempts.map(attempt => ({
      ...attempt.toObject(),
      user: attempt.userId // Rename userId to user for frontend compatibility
    }));

    res.json(transformedAttempts);
  } catch (error) {
    console.error('getPaymentAttempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment attempts'
    });
  }
};

// === LEGACY ENDPOINTS ===

// eSewa endpoints
exports.initiateEsewaPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const amount = order.gatewayUsedPaisa ? Math.round(order.gatewayUsedPaisa / 100) : order.totalAmount;
    const transaction_uuid = order.orderCode || order.orderNumber;
    const product_code = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
    const secret_key = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';

    const signatureString = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const signature = crypto.createHmac('sha256', secret_key).update(signatureString).digest('base64');

    res.json({
      success: true,
      data: {
        amount,
        tax_amount: 0,
        total_amount: amount,
        transaction_uuid,
        product_code,
        product_service_charge: 0,
        product_delivery_charge: 0,
        success_url: `${process.env.CLIENT_URL}/payment/esewa/success`,
        failure_url: `${process.env.CLIENT_URL}/payment/esewa/failure`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature,
        gateway_url: process.env.ESEWA_GATEWAY_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
      }
    });
  } catch (error) {
    console.error('eSewa initiate error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate eSewa payment' });
  }
};

exports.verifyEsewaPayment = async (req, res) => {
  try {
    const encodedData = req.body.data || req.query.data;
    if (!encodedData) {
      console.error('eSewa Verify: Missing payment data');
      return res.status(400).json({ success: false, message: 'Missing payment data' });
    }

    // eSewa callback data can contain "+" characters that sometimes arrive as spaces
    // when returned through query params. Normalize before decoding.
    const normalizedEncodedData = String(encodedData)
      .trim()
      .replace(/ /g, '+')
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decodedString = Buffer.from(normalizedEncodedData, 'base64').toString('utf-8');
    console.log('eSewa Verify: Decoded string:', decodedString);
    const paymentData = JSON.parse(decodedString);

    const { transaction_uuid, status, signature, signed_field_names } = paymentData;

    if (status !== 'COMPLETE') {
      console.error('eSewa Verify: Payment status not COMPLETE:', status);
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    const secret_key = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
    const fields = signed_field_names.split(',');
    let signatureString = '';
    fields.forEach((field, index) => {
      signatureString += `${field}=${paymentData[field] || ''}`;
      if (index < fields.length - 1) signatureString += ',';
    });

    console.log('eSewa Verify: Signature string to hash:', signatureString);

    const expectedSignature = crypto.createHmac('sha256', secret_key).update(signatureString).digest('base64');

    console.log('eSewa Verify: Received signature:', signature);
    console.log('eSewa Verify: Expected signature:', expectedSignature);

    if (signature !== expectedSignature) {
      console.error('eSewa Verify: Signature mismatch!');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const order = await Order.findOne({ $or: [{ orderCode: transaction_uuid }, { orderNumber: transaction_uuid }] });
    if (!order) {
      console.error('eSewa Verify: Order not found for uuid:', transaction_uuid);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatusV2 === 'PAID') {
      return res.json({ success: true, message: 'Order was already paid', data: { orderId: order._id } });
    }

    order.paymentMethod = 'esewa';
    order.paymentStatus = 'verified';
    order.paymentStatusV2 = 'PAID';
    order.gatewayRef = paymentData.transaction_code;
    order.paymentDetails = {
      ...(order.paymentDetails || {}),
      provider: 'esewa',
      externalRef: paymentData.transaction_code,
      transactionId: paymentData.transaction_code,
      gatewayResponse: paymentData,
      paymentDate: new Date()
    };

    order.audit.push({
      action: 'PAYMENT_COMPLETED',
      timestamp: new Date(),
      note: `eSewa payment verified. Txn: ${paymentData.transaction_code}.`
    });

    await order.save();
    await onOrderPaid(order);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { orderId: order._id, status: normalizeOrderStatus(order.status) }
    });
  } catch (error) {
    console.error('eSewa verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify eSewa payment' });
  }
};

// Legacy Khalti endpoints - return 410 Gone
exports.initiateKhaltiPayment = async (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Payment method removed. Use Fonepay QR.'
  });
};

exports.verifyKhaltiPayment = async (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Payment method removed. Use Fonepay QR.'
  });
};

// Legacy payment status endpoint
exports.getPaymentStatus = async (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Legacy payment status endpoint removed. Use the order status endpoints instead.'
  });
};
