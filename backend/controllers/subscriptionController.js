const { validationResult } = require('express-validator');
const Subscriber = require('../models/Subscriber');

exports.subscribe = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
    }

    const { email, source } = req.body;
    let subscriber = await Subscriber.findOne({ email });

    if (subscriber) {
      if (subscriber.unsubscribed) {
        subscriber.unsubscribed = false;
        subscriber.source = source || subscriber.source;
        await subscriber.save();
      }
      return res.json({ success: true, message: 'You are already subscribed.' });
    }

    await Subscriber.create({ email, source: source || 'website' });
    return res.status(201).json({ success: true, message: 'Subscribed successfully!' });
  } catch (err) {
    console.error('Subscription error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}; 