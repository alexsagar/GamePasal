const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getUserOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  refundOrder
} = require('../controllers/orderController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Validation rules
const orderValidation = [
  body('products')
    .isArray({ min: 1 })
    .withMessage('Products array is required and must contain at least one item'),
  body('products.*.productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('products.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress.fullName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Full name is required'),
  body('shippingAddress.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  body('shippingAddress.phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Valid phone number is required')
];

// Protected routes
router.use(auth);

// User routes
router.post('/', orderValidation, createOrder);
router.get('/user', getUserOrders);
router.get('/:id', getOrder);
router.delete('/:id', cancelOrder);
router.delete('/:id/delete', deleteOrder);

// Admin routes
router.get('/', isAdmin, getAllOrders);
router.put('/:id', isAdmin, updateOrderStatus);
router.post('/:id/refund', isAdmin, refundOrder);

module.exports = router;