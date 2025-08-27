const express = require('express');
const { 
  getBanners, 
  createBanner, 
  updateBanner, 
  deleteBanner 
} = require('../controllers/contentController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { upload, handleUploadError } = require('../middleware/upload'); // Multer
const { check, body } = require('express-validator');

const router = express.Router();

// Validation rules for create and update
const bannerValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('subtitle').optional().isString(),
  body('image').optional().isString(),
  body('buttonLabel').optional().isString(),
  check('buttonUrl').optional().isURL().withMessage('Button URL must be a valid URL'),
  body('active').optional().isBoolean(),
  body('productId')
    .optional()
    .isMongoId()
    .withMessage('productId must be a valid MongoDB ObjectId'),
];

// Get banners (no auth required)
router.get('/', getBanners);

// Create banner (requires auth, admin, image upload, and validation)
router.post(
  '/', 
  auth, 
  isAdmin, 
  upload.single('image'), 
  handleUploadError, 
  bannerValidationRules, 
  createBanner
);

// Update banner (requires auth, admin, optional image upload, and validation)
router.put(
  '/:id', 
  auth, 
  isAdmin, 
  upload.single('image'), 
  handleUploadError, 
  bannerValidationRules, 
  updateBanner
);

// Delete banner (requires auth and admin)
router.delete('/:id', auth, isAdmin, deleteBanner);

module.exports = router;
