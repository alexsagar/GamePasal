const express = require('express');
const { handleGatewayWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Webhooks are usually unauthenticated but must be verified by signature inside controller
router.post('/:gateway', handleGatewayWebhook);

module.exports = router;


