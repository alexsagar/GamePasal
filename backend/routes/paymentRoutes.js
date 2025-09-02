const express = require('express');
const { body } = require('express-validator');
const {
  initiateEsewaPayment,
  initiateKhaltiPayment,
  verifyEsewaPayment,
  verifyKhaltiPayment,
  getPaymentStatus
} = require('../controllers/paymentController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const paymentValidation = [
  body('amountPaisa')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => {
      const amount = parseInt(value);
      if (amount < 10000 || amount > 10000000) { // NPR 100 to 100,000
        throw new Error('Amount must be between NPR 100 and 100,000');
      }
      return true;
    }),
  body('purpose')
    .isIn(['TOPUP', 'PURCHASE'])
    .withMessage('Purpose must be either TOPUP or PURCHASE'),
  body('idempotencyKey')
    .notEmpty()
    .withMessage('Idempotency key is required')
];

const verificationValidation = [
  body('transaction_uuid')
    .optional()
    .notEmpty()
    .withMessage('Transaction UUID is required for eSewa'),
  body('total_amount')
    .optional()
    .isNumeric()
    .withMessage('Total amount must be a number'),
  body('product_code')
    .optional()
    .notEmpty()
    .withMessage('Product code is required for eSewa'),
  body('signature')
    .optional()
    .notEmpty()
    .withMessage('Signature is required for eSewa'),
  body('pidx')
    .optional()
    .notEmpty()
    .withMessage('Payment ID (pidx) is required for Khalti')
];

// Payment initiation routes (protected)
router.post('/esewa/initiate', auth, paymentValidation, initiateEsewaPayment);
router.post('/khalti/initiate', auth, paymentValidation, initiateKhaltiPayment);

// Payment verification routes (public - called by payment gateways)
router.post('/esewa/verify', verificationValidation, verifyEsewaPayment);
router.post('/khalti/verify', verificationValidation, verifyKhaltiPayment);

// Payment status route (protected)
router.get('/status/:txnId', auth, getPaymentStatus);

module.exports = router;
