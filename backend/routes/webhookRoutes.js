const express = require('express');
const { handleGatewayWebhook, handleWalletTopupWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Webhooks are usually unauthenticated but must be verified by signature inside controller
router.post('/:gateway', handleGatewayWebhook);
router.post('/:gateway/wallet-topup', handleWalletTopupWebhook);

module.exports = router;


