const mongoose = require('mongoose');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const { notifyWalletUpdate } = require('../utils/walletEvents');

const ESEWA_QR_META = {
  accountName: 'GamePasal',
  esewaId: '98XXXXXXXX',
  qrUrl: 'https://res.cloudinary.com/dtuqbqgz7/image/upload/v1755162375/524287925_1632856864055000_2332463781533267913_n_bpa4bv.png'
};

exports.initTopupEsewaQR = async (req, res) => {
  try {
    const { amountPaisa, idempotencyKey, referenceNote } = req.body || {};
    const userId = req.user.id;

    const MIN = 100 * 100; // NPR 100
    const MAX = 25000 * 100; // NPR 25,000
    if (!amountPaisa || typeof amountPaisa !== 'number' || amountPaisa < MIN || amountPaisa > MAX) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (!idempotencyKey) {
      return res.status(400).json({ success: false, message: 'idempotencyKey required' });
    }

    const existing = await WalletTransaction.findOne({ user: userId, idempotencyKey }).lean();
    if (existing) {
      return res.status(200).json({ success: true, message: 'Already initialized', data: { txnId: existing._id, qr: ESEWA_QR_META } });
    }

    // Limit pending tickets per user
    const pendingCount = await WalletTransaction.countDocuments({ user: userId, status: { $in: ['PENDING','UNDER_REVIEW'] } });
    if (pendingCount >= 3) {
      return res.status(429).json({ success: false, message: 'Too many pending top-ups. Please complete existing ones.' });
    }

    const txn = await WalletTransaction.create({
      user: userId,
      type: 'TOPUP',
      method: 'ESEWA_QR',
      amount: amountPaisa,
      status: 'PENDING',
      receiptUrl: null,
      referenceNote: referenceNote || '',
      idempotencyKey
    });

    return res.status(201).json({ success: true, data: { txnId: txn._id, qr: ESEWA_QR_META } });
  } catch (e) {
    console.error('initTopupEsewaQR error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// New method for direct payment gateway top-up
exports.initTopupGateway = async (req, res) => {
  try {
    const { amountPaisa, gateway, idempotencyKey, referenceNote } = req.body || {};
    const userId = req.user.id;

    const MIN = 100 * 100; // NPR 100
    const MAX = 100000 * 100; // NPR 100,000
    if (!amountPaisa || typeof amountPaisa !== 'number' || amountPaisa < MIN || amountPaisa > MAX) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (!gateway || !['ESEWA', 'KHALTI'].includes(gateway)) {
      return res.status(400).json({ success: false, message: 'Valid gateway required (ESEWA or KHALTI)' });
    }
    if (!idempotencyKey) {
      return res.status(400).json({ success: false, message: 'idempotencyKey required' });
    }

    const existing = await WalletTransaction.findOne({ user: userId, idempotencyKey }).lean();
    if (existing) {
      return res.status(200).json({ 
        success: true, 
        message: 'Already initialized', 
        data: { 
          txnId: existing._id, 
          paymentUrl: existing.paymentUrl,
          alreadyExists: true 
        } 
      });
    }

    // Limit pending tickets per user
    const pendingCount = await WalletTransaction.countDocuments({ 
      user: userId, 
      status: { $in: ['PENDING','UNDER_REVIEW'] } 
    });
    if (pendingCount >= 3) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many pending top-ups. Please complete existing ones.' 
      });
    }

    // Create transaction record
    const txn = await WalletTransaction.create({
      user: userId,
      type: 'TOPUP',
      method: `${gateway}_GATEWAY`,
      amount: amountPaisa,
      status: 'PENDING',
      gateway: gateway,
      referenceNote: referenceNote || '',
      idempotencyKey
    });

    // Redirect to payment controller
    const paymentController = require('./paymentController');
    
    // Update request body with required parameters for payment controller
    req.body.purpose = 'TOPUP';
    req.body.orderId = null; // No order for wallet top-up
    
    if (gateway === 'ESEWA') {
      return paymentController.initiateEsewaPayment(req, res);
    } else if (gateway === 'KHALTI') {
      return paymentController.initiateKhaltiPayment(req, res);
    }

  } catch (e) {
    console.error('initTopupGateway error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.uploadReceipt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { txnId, referenceNote, receiptUrl: receiptUrlFromBody } = req.body || {};
    if (!txnId) return res.status(400).json({ success: false, message: 'txnId required' });

    const txn = await WalletTransaction.findOne({ _id: txnId, user: userId });
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (!['PENDING','UNDER_REVIEW'].includes(txn.status)) {
      return res.status(400).json({ success: false, message: 'Transaction not in a receivable state' });
    }

    if (req.file) {
      // Normalize as absolute URL path under /uploads
      const normalized = req.file.path.replace(/\\/g, '/');
      txn.receiptUrl = normalized.startsWith('uploads') ? `/${normalized}` : normalized;
    } else if (receiptUrlFromBody) {
      const url = String(receiptUrlFromBody);
      if (!/^https?:\/\//i.test(url)) {
        return res.status(400).json({ success: false, message: 'Invalid receiptUrl' });
      }
      txn.receiptUrl = url;
    } else {
      return res.status(400).json({ success: false, message: 'Receipt file or receiptUrl is required' });
    }
    if (referenceNote) txn.referenceNote = referenceNote;
    txn.status = 'UNDER_REVIEW';
    await txn.save();

    res.json({ success: true, message: 'Receipt uploaded. Under review.', data: { txnId: txn._id, receiptUrl: txn.receiptUrl } });
  } catch (e) {
    console.error('uploadReceipt error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMyWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;
    const [txns, count] = await Promise.all([
      WalletTransaction.find({ user: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      WalletTransaction.countDocuments({ user: req.user.id })
    ]);
    res.json({ success: true, data: { balancePaisa: user.walletBalance || 0, currency: user.walletCurrency || 'GP Credits', transactions: txns, page, total: count } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.adminListTopups = async (req, res) => {
  try {
    const { status, user, from, to } = req.query;
    const q = { type: 'TOPUP', method: 'ESEWA_QR' };
    if (status) q.status = status;
    if (user) q.user = user;
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;
    const [txns, count] = await Promise.all([
      WalletTransaction.find(q).populate('user','email username').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      WalletTransaction.countDocuments(q)
    ]);
    res.json({ success: true, data: { transactions: txns, page, total: count } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.adminApproveTopup = async (req, res) => {
  const { txnId } = req.params;
  const { adminNote } = req.body || {};
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const txn = await WalletTransaction.findById(txnId).session(session);
      if (!txn) throw new Error('TXN_NOT_FOUND');
      if (txn.type !== 'TOPUP' || txn.method !== 'ESEWA_QR') throw new Error('INVALID_TXN_TYPE');
      if (txn.status === 'SUCCESS') { result = txn; return; }
      if (txn.status !== 'UNDER_REVIEW') throw new Error('TXN_NOT_READY');
      if (!txn.receiptUrl) throw new Error('NO_RECEIPT');

      const user = await User.findById(txn.user).session(session);
      const newBalance = (user.walletBalance || 0) + txn.amount;

      txn.status = 'SUCCESS';
      txn.balanceAfter = newBalance;
      txn.adminNote = adminNote || '';
      await txn.save({ session });

      user.walletBalance = newBalance;
      if (!user.walletCurrency) user.walletCurrency = 'GP Credits';
      await user.save({ session });

      result = txn;
    });
    // Notify user via SSE
    notifyWalletUpdate(result.user, result.balanceAfter);
    res.json({ success: true, data: { txn: result, newBalancePaisa: result.balanceAfter } });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  } finally {
    session.endSession();
  }
};

exports.adminRejectTopup = async (req, res) => {
  try {
    const { txnId } = req.params;
    const { adminNote } = req.body || {};
    const txn = await WalletTransaction.findById(txnId);
    if (!txn) return res.status(404).json({ success: false, message: 'TXN_NOT_FOUND' });
    if (txn.type !== 'TOPUP' || txn.method !== 'ESEWA_QR') return res.status(400).json({ success: false, message: 'INVALID_TXN_TYPE' });
    if (!['PENDING','UNDER_REVIEW'].includes(txn.status)) return res.status(400).json({ success: false, message: 'TXN_NOT_REVIEWABLE' });
    txn.status = 'REJECTED';
    txn.adminNote = adminNote || '';
    await txn.save();
    res.json({ success: true, data: { txn } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.adminAdjustTopup = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { txnId } = req.params;
    const { newAmountPaisa, adminNote } = req.body || {};
    if (typeof newAmountPaisa !== 'number') {
      return res.status(400).json({ success: false, message: 'newAmountPaisa is required' });
    }
    let result;
    await session.withTransaction(async () => {
      const txn = await WalletTransaction.findById(txnId).session(session);
      if (!txn) throw new Error('TXN_NOT_FOUND');
      if (txn.type !== 'TOPUP' || txn.method !== 'ESEWA_QR') throw new Error('INVALID_TXN_TYPE');
      if (txn.status !== 'SUCCESS') throw new Error('ONLY_SUCCESS_CAN_ADJUST');

      const delta = Math.round(newAmountPaisa) - Math.round(txn.amount);
      if (delta === 0) {
        result = { adjusted: false, balancePaisa: undefined };
        return;
      }

      const user = await User.findById(txn.user).session(session);
      const newBalance = (user.walletBalance || 0) + delta;

      // Update the original transaction amount
      txn.amount = Math.round(newAmountPaisa);
      txn.adminNote = adminNote || '';
      await txn.save({ session });

      // Create adjustment record
      const adj = await WalletTransaction.create([{
        user: txn.user,
        type: 'ADJUSTMENT',
        method: 'INTERNAL',
        amount: delta,
        status: 'SUCCESS',
        referenceNote: `Adjust of ${txnId} from ${txn.amount - delta} to ${newAmountPaisa}`,
        adminNote: adminNote || '',
        balanceAfter: newBalance
      }], { session });

      user.walletBalance = newBalance;
      await user.save({ session });

      result = { adjusted: true, adjustment: adj[0], balancePaisa: newBalance, originalTxn: txn };
    });

    if (result.adjusted) {
      notifyWalletUpdate(result.adjustment.user, result.balancePaisa);
    }
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  } finally {
    session.endSession();
  }
};

exports.adminRevertTopup = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { txnId } = req.params;
    const { adminNote } = req.body || {};
    let result;
    await session.withTransaction(async () => {
      const txn = await WalletTransaction.findById(txnId).session(session);
      if (!txn) throw new Error('TXN_NOT_FOUND');
      if (txn.type !== 'TOPUP' || txn.method !== 'ESEWA_QR') throw new Error('INVALID_TXN_TYPE');
      if (txn.status !== 'SUCCESS') throw new Error('ONLY_SUCCESS_CAN_REVERT');

      const user = await User.findById(txn.user).session(session);
      const originalAmount = Math.round(txn.amount);
      const newBalance = Math.max(0, (user.walletBalance || 0) - originalAmount);

      // Mark the original transaction as DELETED
      txn.status = 'DELETED';
      txn.adminNote = adminNote || '';
      await txn.save({ session });

      // Create a deletion record for audit purposes
      const deletionRecord = await WalletTransaction.create([{
        user: txn.user,
        type: 'DELETION',
        method: 'INTERNAL',
        amount: -originalAmount,
        status: 'SUCCESS',
        referenceNote: `Deleted top-up ${txnId} (was ${originalAmount} paisa)`,
        adminNote: adminNote || '',
        balanceAfter: newBalance
      }], { session });

      // Update user's wallet balance
      user.walletBalance = newBalance;
      await user.save({ session });

      result = { 
        deleted: true, 
        deletionRecord: deletionRecord[0], 
        balancePaisa: newBalance,
        originalAmount: originalAmount
      };
    });

    notifyWalletUpdate(result.deletionRecord.user, result.balancePaisa);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  } finally {
    session.endSession();
  }
};

