const express = require('express');
const router = express.Router();
const redisClient = require('../config/redis');

// Get cart by ID
router.get('/:cartId', async (req, res) => {
    try {
        const { cartId } = req.params;
        if (!cartId) {
            return res.status(400).json({ success: false, message: 'Cart ID is required' });
        }

        const cartData = await redisClient.get(`cart:${cartId}`);

        if (cartData) {
            return res.json({ success: true, data: JSON.parse(cartData) });
        }

        // Return empty cart if not found
        return res.json({ success: true, data: [] });
    } catch (error) {
        console.error('Error fetching cart from Redis:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cart', error: error.message });
    }
});

// Update/Sync cart
router.post('/sync', async (req, res) => {
    try {
        const { cartId, items } = req.body;

        if (!cartId) {
            return res.status(400).json({ success: false, message: 'Cart ID is required' });
        }

        // Store cart data for 30 days (in seconds)
        const THIRTY_DAYS = 30 * 24 * 60 * 60;

        await redisClient.set(`cart:${cartId}`, JSON.stringify(items || []), 'EX', THIRTY_DAYS);

        res.json({ success: true, message: 'Cart synced successfully' });
    } catch (error) {
        console.error('Error saving cart to Redis:', error);
        res.status(500).json({ success: false, message: 'Failed to save cart', error: error.message });
    }
});

// Clear cart
router.delete('/:cartId', async (req, res) => {
    try {
        const { cartId } = req.params;
        if (!cartId) {
            return res.status(400).json({ success: false, message: 'Cart ID is required' });
        }

        await redisClient.del(`cart:${cartId}`);

        res.json({ success: true, message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('Error clearing cart from Redis:', error);
        res.status(500).json({ success: false, message: 'Failed to clear cart', error: error.message });
    }
});

module.exports = router;
