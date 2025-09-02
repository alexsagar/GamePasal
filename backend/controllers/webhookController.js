const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { notifyWalletUpdate } = require('../utils/walletEvents');

// eSewa Configuration
const ESEWA_CONFIG = {
  secretKey: '8gBm/:&EnhH.1/q',
  token: '123456'
};

// Khalti Configuration
const KHALTI_CONFIG = {
  secretKey: '257c42b6b6bc40b4bbad0427fb0256d3'
};

// Verify gateway webhook signatures
function verifyGateway(req, gateway) {
  try {
    if (gateway === 'ESEWA') {
      const signature = req.headers['x-esewa-signature'] || req.body.signature;
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', ESEWA_CONFIG.secretKey)
        .update(payload)
        .digest('hex');
      
      return signature === expectedSignature;
    } else if (gateway === 'KHALTI') {
      const signature = req.headers['x-khalti-signature'] || req.body.signature;
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', KHALTI_CONFIG.secretKey)
        .update(payload)
        .digest('hex');
      
      return signature === expectedSignature;
    }
    
    // For development/testing, allow all webhooks
    return process.env.NODE_ENV === 'development';
  } catch (error) {
    console.error('Gateway verification error:', error);
    return false;
  }
}

exports.handleGatewayWebhook = async (req, res) => {
  const gateway = req.params.gateway.toUpperCase();
  if (!verifyGateway(req, gateway)) return res.status(401).end();

  const { gatewayRef, orderId, success, amountPaisa } = req.body || {};
  if (!orderId) return res.status(400).json({ success: false, message: 'orderId missing' });

  const session = await mongoose.startSession();
  try {
    let balanceForNotify;
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new Error('ORDER_NOT_FOUND');
      if (order.paymentStatusV2 === 'PAID') return; // idempotent

      order.gateway = gateway;
      order.gatewayRef = gatewayRef || order.gatewayRef || null;

      if (success) {
        // Capture wallet hold if exists
        if (order.walletHoldTxnId) {
          const hold = await WalletTransaction.findById(order.walletHoldTxnId).session(session);
          if (hold && (hold.status === 'AUTHORIZED')) {
            const user = await User.findById(order.userId).session(session);
            balanceForNotify = user.walletBalance || 0;
            // Convert hold to PURCHASE success without additional debit
            await WalletTransaction.updateOne({ _id: hold._id }, { status: 'SUCCESS', type: 'PURCHASE' }, { session });
          }
        }
        order.paymentStatusV2 = 'PAID';
        await order.save({ session });
      } else {
        // Failure: release hold if present
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
              referenceNote: 'Gateway failed - release hold',
              balanceAfter: newBalance
            }], { session });
            user.walletBalance = newBalance;
            await user.save({ session });
            hold.status = 'RELEASED';
            await hold.save({ session });
            balanceForNotify = newBalance;
          }
        }
        order.paymentStatusV2 = 'FAILED';
        await order.save({ session });
      }
    });

    if (typeof balanceForNotify === 'number') {
      const order = await Order.findById(orderId).lean();
      notifyWalletUpdate(order.userId, balanceForNotify);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || 'Webhook handling error' });
  } finally {
    session.endSession();
  }
};

// Handle wallet top-up webhooks
exports.handleWalletTopupWebhook = async (req, res) => {
  const gateway = req.params.gateway.toUpperCase();
  if (!verifyGateway(req, gateway)) return res.status(401).end();

  const session = await mongoose.startSession();
  try {
    let balanceForNotify;
    
    await session.withTransaction(async () => {
      let txn;
      
      if (gateway === 'ESEWA') {
        const { transaction_uuid, total_amount, product_code, status } = req.body;
        
        if (!transaction_uuid) throw new Error('Transaction UUID missing');
        
        txn = await WalletTransaction.findOne({ 
          gatewayTransactionId: transaction_uuid,
          gateway: 'ESEWA',
          type: 'TOPUP'
        }).session(session);
        
        if (!txn) throw new Error('Transaction not found');
        
        if (status === 'COMPLETE') {
          const user = await User.findById(txn.user).session(session);
          const newBalance = (user.walletBalance || 0) + txn.amount;
          
          txn.status = 'SUCCESS';
          txn.balanceAfter = newBalance;
          txn.gatewayResponse = { ...txn.gatewayResponse, webhook: req.body };
          await txn.save({ session });
          
          user.walletBalance = newBalance;
          if (!user.walletCurrency) user.walletCurrency = 'GP Credits';
          await user.save({ session });
          
          balanceForNotify = newBalance;
        } else {
          txn.status = 'FAILED';
          txn.gatewayResponse = { ...txn.gatewayResponse, webhook: req.body };
          await txn.save({ session });
        }
        
      } else if (gateway === 'KHALTI') {
        const { pidx, status, amount } = req.body;
        
        if (!pidx) throw new Error('Payment ID missing');
        
        txn = await WalletTransaction.findOne({ 
          'gatewayResponse.pidx': pidx,
          gateway: 'KHALTI',
          type: 'TOPUP'
        }).session(session);
        
        if (!txn) throw new Error('Transaction not found');
        
        if (status === 'Completed') {
          const user = await User.findById(txn.user).session(session);
          const newBalance = (user.walletBalance || 0) + txn.amount;
          
          txn.status = 'SUCCESS';
          txn.balanceAfter = newBalance;
          txn.gatewayResponse = { ...txn.gatewayResponse, webhook: req.body };
          await txn.save({ session });
          
          user.walletBalance = newBalance;
          if (!user.walletCurrency) user.walletCurrency = 'GP Credits';
          await user.save({ session });
          
          balanceForNotify = newBalance;
        } else {
          txn.status = 'FAILED';
          txn.gatewayResponse = { ...txn.gatewayResponse, webhook: req.body };
          await txn.save({ session });
        }
      }
    });

    if (typeof balanceForNotify === 'number') {
      notifyWalletUpdate(txn.user, balanceForNotify);
    }
    
    res.json({ success: true });
  } catch (e) {
    console.error('Wallet top-up webhook error:', e);
    res.status(400).json({ success: false, message: e.message || 'Webhook handling error' });
  } finally {
    session.endSession();
  }
};


