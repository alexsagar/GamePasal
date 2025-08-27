const express = require('express');
const { body } = require('express-validator');
const {
  getContentBySection,
  getAllContent,
  createOrUpdateContent,
  updateContentBySection,
  deleteContentBySection
} = require('../controllers/contentController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Validation rules
const contentValidation = [
  body('section')
    .optional()
    .isIn(['hero', 'footer', 'about', 'contact', 'terms', 'privacy', 'banner', 'promotion'])
    .withMessage('Invalid section type'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('subtitle')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Subtitle cannot exceed 300 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL')
];

// Public routes
router.get('/', getAllContent);
router.get('/:section', getContentBySection);

// Protected admin routes
router.post('/', auth, isAdmin, contentValidation, createOrUpdateContent);
router.put('/:section', auth, isAdmin, contentValidation, updateContentBySection);
router.delete('/:section', auth, isAdmin, deleteContentBySection);

module.exports = router;