const mongoose = require('mongoose');

// Legacy webhook handler - return 410 Gone
exports.handleGatewayWebhook = async (req, res) => {
  const gateway = req.params.gateway.toUpperCase();
  
  console.log(`Legacy webhook called for ${gateway} - returning 410 Gone`);
  
  res.status(410).json({
    success: false,
    message: 'Payment method removed. Use Fonepay QR.'
  });
};