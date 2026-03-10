const express = require('express');
const { handleGatewayWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Legacy webhook routes - return 410 Gone
router.post('/:gateway', handleGatewayWebhook);
router.post('/:gateway/wallet-topup', handleGatewayWebhook);

module.exports = router;


