const express = require('express');
const { body } = require('express-validator');
const { subscribe } = require('../controllers/subscriptionController');

const router = express.Router();

router.post('/subscribe', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('source').optional().isString()
], subscribe);

module.exports = router; 