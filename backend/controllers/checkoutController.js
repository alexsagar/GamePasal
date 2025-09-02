const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { notifyWalletUpdate } = require('../utils/walletEvents');

async function calculateCartTotals(items) {
  let totalPaisa = 0;
  const lineItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId).lean();
    if (!product || !product.isActive) throw new Error('PRODUCT_NOT_AVAILABLE');
    const unit = (product.salePrice || product.price) * 100; // convert NPR -> paisa
    const qty = Math.max(1, parseInt(item.quantity || 1, 10));
    totalPaisa += unit * qty;
    lineItems.push({ productId: product._id, title: product.title, unitPaisa: unit, quantity: qty });
  }
  return { totalPaisa, lineItems };
}

exports.quote = async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items required' });
    }
    const user = await User.findById(req.user.id).lean();
    const { totalPaisa } = await calculateCartTotals(items);
    const walletBalancePaisa = user.walletBalance || 0;
    const canPayWalletOnly = walletBalancePaisa >= totalPaisa;
    res.json({ success: true, data: { totalPaisa, walletBalancePaisa, canPayWalletOnly } });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || 'Failed to quote' });
  }
};

exports.createIntent = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { items, shippingId, paymentMethod, walletAmountPaisa = 0, gateway, idempotencyKey } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items required' });
    }
    if (!idempotencyKey) {
      return res.status(400).json({ success: false, message: 'idempotencyKey required' });
    }

    // Prevent duplicate intents
    const existing = await Order.findOne({ checkoutIdempotencyKey: idempotencyKey, userId: req.user.id }).lean();
    if (existing) {
      return res.json({ success: true, data: { orderId: existing._id, alreadyExists: true, paid: existing.paymentStatusV2 === 'PAID' } });
    }

    const { totalPaisa, lineItems } = await calculateCartTotals(items);
    const user = await User.findById(req.user.id).session(session);
    const requestedWallet = Math.max(0, Math.floor(walletAmountPaisa));
    if (requestedWallet > totalPaisa) return res.status(400).json({ success: false, message: 'Wallet amount exceeds total' });
    if (requestedWallet > (user.walletBalance || 0)) return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });

    let orderDoc; let holdTxn;
    await session.withTransaction(async () => {
      // Generate order number with timestamp to avoid race conditions
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const orderNumber = `ORD-${timestamp}${random}`;
      
      // Convert lineItems to products format for Order model
      const products = lineItems.map(item => ({
        productId: item.productId,
        title: item.title,
        price: Math.round(item.unitPaisa / 100), // Convert paisa back to NPR
        quantity: item.quantity
      }));
      
      const [order] = await Order.create([{ 
        userId: req.user.id,
        orderNumber,
        products,
        totalAmount: Math.round(totalPaisa / 100),
        paymentMethod: 'Pending',
        paymentStatus: 'pending',
        // v2 fields
        totalPaisa,
        paymentStatusV2: 'PENDING',
        paymentMethodV2: requestedWallet > 0 ? (requestedWallet === totalPaisa ? 'WALLET' : 'SPLIT') : 'GATEWAY',
        gateway: gateway || null,
        checkoutIdempotencyKey: idempotencyKey
      }], { session });
      orderDoc = order;

      if (requestedWallet > 0) {
        const newBalance = Math.max(0, (user.walletBalance || 0) - requestedWallet);
        const [created] = await WalletTransaction.create([{
          user: req.user.id,
          type: 'HOLD',
          method: 'CHECKOUT',
          provider: 'CHECKOUT',
          amount: -requestedWallet,
          status: 'AUTHORIZED',
          orderId: order._id,
          referenceNote: 'Wallet hold for checkout',
          balanceAfter: newBalance,
          idempotencyKey
        }], { session });
        holdTxn = created;
        user.walletBalance = newBalance;
        await user.save({ session });
        await Order.updateOne({ _id: order._id }, { walletHoldTxnId: created._id, walletUsedPaisa: requestedWallet }, { session });
      }
    });

    const remainder = totalPaisa - requestedWallet;
    if (remainder === 0) {
      // Wallet-only: capture immediately by converting HOLD row to PURCHASE success (no second debit)
      if (!holdTxn) return res.status(500).json({ success: false, message: 'Missing hold transaction' });
      await session.withTransaction(async () => {
        await WalletTransaction.updateOne({ _id: holdTxn._id }, { status: 'SUCCESS', type: 'PURCHASE' }, { session });
        await Order.updateOne({ _id: orderDoc._id }, {
          paymentStatusV2: 'PAID',
          paymentMethodV2: 'WALLET',
          walletUsedPaisa: requestedWallet,
          gatewayUsedPaisa: 0
        }, { session });
      });
      notifyWalletUpdate(req.user.id, (user.walletBalance || 0));
      return res.json({ success: true, data: { orderId: orderDoc._id, paid: true } });
    }

    // Gateway or split
    await Order.updateOne({ _id: orderDoc._id }, {
      paymentMethodV2: requestedWallet > 0 ? 'SPLIT' : 'GATEWAY',
      gatewayUsedPaisa: remainder,
      gateway: gateway || null,
      gatewayRef: null
    });

    // Integrate with payment gateways
    if (gateway === 'ESEWA' || gateway === 'KHALTI') {
      try {
        const paymentController = require('./paymentController');
        
        // Create payment intent
        const paymentReq = {
          body: {
            amountPaisa: remainder,
            purpose: 'PURCHASE',
            orderId: orderDoc._id,
            idempotencyKey: `${orderDoc._id}-${Date.now()}`
          },
          user: { id: req.user.id }
        };
        
        // Create a mock response object to capture the payment data
        let paymentData = null;
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              if (data.success && data.data) {
                paymentData = data.data;
              }
              return mockRes;
            }
          }),
          json: (data) => {
            if (data.success && data.data) {
              paymentData = data.data;
            }
            return mockRes;
          }
        };
        
        if (gateway === 'ESEWA') {
          await paymentController.initiateEsewaPayment(paymentReq, mockRes);
        } else if (gateway === 'KHALTI') {
          await paymentController.initiateKhaltiPayment(paymentReq, mockRes);
        }
        
        if (paymentData) {
          if (gateway === 'ESEWA' && paymentData.formData) {
            // For eSewa, return form data for frontend to submit
            return res.json({ 
              success: true, 
              data: { 
                orderId: orderDoc._id, 
                paid: false, 
                gateway: 'ESEWA',
                paymentUrl: paymentData.paymentUrl,
                formData: paymentData.formData
              } 
            });
          } else if (paymentData.paymentUrl) {
            // For Khalti and other gateways, return redirect URL
            return res.json({ 
              success: true, 
              data: { 
                orderId: orderDoc._id, 
                paid: false, 
                redirectUrl: paymentData.paymentUrl 
              } 
            });
          }
        }
        
        throw new Error('Payment data not generated');
      } catch (paymentError) {
        console.error('Payment gateway integration error:', paymentError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to initiate payment gateway' 
        });
      }
    }

    // For other gateways or no gateway, return placeholder
    return res.json({ success: true, data: { orderId: orderDoc._id, paid: false, redirectUrl: '/gateway/redirect' } });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || 'Failed to create intent' });
  } finally {
    session.endSession();
  }
};

exports.cancel = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId required' });

    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new Error('ORDER_NOT_FOUND');
      if (String(order.userId) !== String(req.user.id)) throw new Error('FORBIDDEN');
      if (order.paymentStatusV2 === 'PAID') throw new Error('ALREADY_PAID');

      // Release any active hold
      if (order.walletHoldTxnId) {
        const hold = await WalletTransaction.findById(order.walletHoldTxnId).session(session);
        if (hold && hold.status === 'AUTHORIZED') {
          const user = await User.findById(order.userId).session(session);
          const newBalance = (user.walletBalance || 0) + Math.abs(hold.amount);
          const [release] = await WalletTransaction.create([{
            user: order.userId,
            type: 'RELEASE',
            method: 'CHECKOUT',
            provider: 'CHECKOUT',
            amount: Math.abs(hold.amount),
            status: 'RELEASED',
            orderId: order._id,
            referenceNote: 'Checkout cancelled - release hold',
            balanceAfter: newBalance
          }], { session });
          user.walletBalance = newBalance;
          await user.save({ session });
          hold.status = 'RELEASED';
          await hold.save({ session });
          notifyWalletUpdate(order.userId, newBalance);
        }
      }

      order.paymentStatusV2 = 'CANCELLED';
      await order.save({ session });
    });

    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || 'Failed to cancel checkout' });
  } finally {
    session.endSession();
  }
};


