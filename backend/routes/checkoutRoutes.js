const express = require('express');
const auth = require('../middleware/auth');
const { quote, createIntent, cancel } = require('../controllers/checkoutController');

const router = express.Router();
router.use(auth);

router.post('/quote', quote);
router.post('/create-intent', createIntent);
router.post('/cancel', cancel);

module.exports = router;


