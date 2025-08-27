const express = require('express');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { uploadReceipt, handleReceiptUploadError } = require('../middleware/uploadReceipt');
const {
  initTopupEsewaQR,
  uploadReceipt: uploadReceiptCtrl,
  getMyWallet,
  adminListTopups,
  adminApproveTopup,
  adminRejectTopup,
  adminAdjustTopup,
  adminRevertTopup
} = require('../controllers/walletController');

const router = express.Router();

// User routes
router.post('/topup/esewa-qr/init', auth, initTopupEsewaQR);
router.post('/topup/esewa-qr/upload-receipt', auth, uploadReceipt.single('file'), handleReceiptUploadError, uploadReceiptCtrl);
router.get('/me', auth, getMyWallet);

// Admin routes
router.get('/admin/topups', auth, isAdmin, adminListTopups);
router.post('/admin/topups/:txnId/approve', auth, isAdmin, adminApproveTopup);
router.post('/admin/topups/:txnId/reject', auth, isAdmin, adminRejectTopup);
router.post('/admin/topups/:txnId/adjust', auth, isAdmin, adminAdjustTopup);
router.post('/admin/topups/:txnId/revert', auth, isAdmin, adminRevertTopup);

module.exports = router;


