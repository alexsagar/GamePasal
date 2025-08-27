const express = require('express');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  promoteToAdmin 
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Validation rules
const profileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
  .optional()
  .matches(/^(\+?\d{10,15})$/)
  .withMessage('Please provide a valid phone number')
,
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password is required when updating password'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// Protected routes
router.use(auth);

// User routes
router.get('/profile', getProfile);
router.put('/profile', profileValidation, updateProfile);

// Admin routes
router.get('/', isAdmin, getAllUsers);
router.get('/:id', isAdmin, getUserById);
router.put('/promote/:id', isAdmin, promoteToAdmin); // ✅ auth already handled above
router.put('/:id/status', isAdmin, updateUserStatus);
router.delete('/:id', isAdmin, deleteUser);

module.exports = router;
