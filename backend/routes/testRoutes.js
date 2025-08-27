// routes/testRoutes.js
const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../utils/sendOTP');

router.post('/send-test-otp', async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit

  const result = await sendOTPEmail(email, otp);
  if (result.success) {
    res.json({ success: true, message: 'OTP sent successfully' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: result.error });
  }
});

module.exports = router;
