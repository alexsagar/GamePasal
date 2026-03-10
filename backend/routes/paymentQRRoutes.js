const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  createIntent,
  uploadReceipt,
  getIntentStatus,
  adminVerify,
  adminReject,
  adminGetIntents
} = require('../controllers/fonepayQRController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/receipts/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file per request
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Only one file is allowed per request.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files (JPG, PNG, GIF, etc.) are allowed.'
    });
  }

  next(error);
};

// Validation middleware
const validateCreateIntent = (req, res, next) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID is required'
    });
  }
  next();
};

const validateReceiptUpload = (req, res, next) => {
  const { externalRef } = req.body;
  // Make externalRef optional; if present, validate max length
  if (externalRef && externalRef.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Transaction reference cannot exceed 100 characters'
    });
  }
  next();
};

const validateAdminAction = (req, res, next) => {
  const { notes } = req.body;
  
  if (notes && notes.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Notes cannot exceed 500 characters'
    });
  }

  next();
};

// === USER ROUTES (require authentication) ===

/**
 * Create a new payment intent for an order
 * POST /api/payments/qr/intents
 */
router.post('/intents', 
  auth, 
  validateCreateIntent, 
  createIntent
);

/**
 * Upload receipt for a payment intent
 * POST /api/payments/qr/:id/receipt
 */
router.post('/:id/receipt',
  auth,
  validateReceiptUpload,
  upload.single('receipt'),
  handleMulterError,
  uploadReceipt
);

/**
 * Get payment intent status
 * GET /api/payments/qr/:id/status
 */
router.get('/:id/status',
  auth,
  getIntentStatus
);

// === ADMIN ROUTES (require admin authentication) ===

/**
 * Admin verify payment intent
 * POST /api/payments/qr/:id/verify
 */
router.post('/:id/verify',
  auth,
  isAdmin,
  validateAdminAction,
  adminVerify
);

/**
 * Admin reject payment intent
 * POST /api/payments/qr/:id/reject
 */
router.post('/:id/reject',
  auth,
  isAdmin,
  validateAdminAction,
  adminReject
);

/**
 * Admin get all payment intents
 * GET /api/payments/qr/admin/intents
 */
router.get('/admin/intents',
  auth,
  isAdmin,
  adminGetIntents
);

// === ERROR HANDLING ===

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'QR Payment route not found'
  });
});

// Global error handler for this router
router.use((error, req, res, next) => {
  console.error('QR Payment route error:', error);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'An error occurred processing your request'
    : error.message;

  res.status(500).json({
    success: false,
    message: message
  });
});

module.exports = router;
