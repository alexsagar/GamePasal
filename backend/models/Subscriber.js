const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  source: { type: String, default: 'website' },
  unsubscribed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Subscriber', subscriberSchema); 