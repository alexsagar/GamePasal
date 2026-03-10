const express = require('express');
const {
  initiateEsewaPayment,
  verifyEsewaPayment,
  getPaymentStatus
} = require('../controllers/paymentController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/esewa/initiate', auth, initiateEsewaPayment);
router.post('/esewa/verify', verifyEsewaPayment);
router.get('/status/:txnId', auth, getPaymentStatus);

module.exports = router;
