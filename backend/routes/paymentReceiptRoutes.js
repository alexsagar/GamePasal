const express = require('express');
const router = express.Router();
const { uploadReceipt } = require('../middleware/uploadReceipt');
const { uploadPaymentReceipt } = require('../controllers/paymentController');

router.post('/upload-receipt', uploadReceipt.single('receipt'), uploadPaymentReceipt);

module.exports = router;
