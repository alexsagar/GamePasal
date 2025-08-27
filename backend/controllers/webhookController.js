const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { notifyWalletUpdate } = require('../utils/walletEvents');

// Placeholder verification; replace with real signature checks per gateway
function verifyGateway(req, gateway) {
  return true;
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


