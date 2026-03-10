const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const deliverySchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    delivery_type: {
        type: String,
        enum: ['gift_card_code', 'game_redeem_code', 'game_login_details'],
        required: true
    },
    redeem_code: {
        type: String,
        get: decrypt,
        set: encrypt
    },
    login_email: {
        type: String, // Emails usually don't need AES encryption, but you can if stricter privacy is needed
    },
    login_password: {
        type: String,
        get: decrypt,
        set: encrypt
    },
    instructions: {
        type: String
    },
    sent_by_admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sent_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { getters: true }, // Ensure getters run when converting to JSON (decrypts data)
    toObject: { getters: true }
});

module.exports = mongoose.model('Delivery', deliverySchema);
