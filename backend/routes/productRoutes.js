const express = require('express');
const { body } = require('express-validator');
const { upload, handleUploadError } = require('../middleware/upload');
const Product = require('../models/Product');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getTopSellerProducts,
  getTrendingProducts,
  getBestSellingProducts,
  getPreOrderProducts,
  getGiftCards,
  getSoftware,
  getAdminProducts
} = require('../controllers/productController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Escape regex special chars to prevent injection
function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Validation rules for product creation
const createProductValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('category')
    .isIn(['Game', 'GiftCard', 'Software'])
    .withMessage('Category must be either Game, GiftCard, or Software'),
  body('platform').custom((value, { req }) => {
    const cat = req.body.category;
    if (cat === 'Software') {
      if (typeof value !== 'undefined' && value !== null && String(value).trim() !== '') {
        throw new Error('Platform must not be provided for Software');
      }
      delete req.body.platform;
      return true;
    }
    const allowed = ['PC','PlayStation','Xbox','Nintendo','Steam','Mobile','iTunes','All'];
    if (!value || !allowed.includes(value)) {
      throw new Error('Valid platform is required for Game/GiftCard');
    }
    return true;
  }),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  // Custom validation for image - either file upload OR URL required
  body('image')
    .optional()
    .custom((value, { req }) => {
      // For creation, either file upload or URL is required
      if (!req.file && !value) {
        throw new Error('Either upload an image file or provide an image URL');
      }
      // If URL is provided, validate it
      if (value && !value.startsWith('http')) {
        throw new Error('Image URL must be a valid HTTP/HTTPS URL');
      }
      return true;
    })
];

// Validation rules for product update
const updateProductValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('category')
    .optional()
    .isIn(['Game', 'GiftCard', 'Software'])
    .withMessage('Category must be either Game, GiftCard, or Software'),
  body('platform').optional().custom(async (value, { req }) => {
    let cat = req.body.category;
    if (!cat) {
        const product = await Product.findById(req.params.id);
        if (product) {
            cat = product.category;
        }
    }
    if (cat === 'Software') {
      if (typeof value !== 'undefined' && value !== null && String(value).trim() !== '') {
        throw new Error('Platform must not be provided for Software');
      }
      delete req.body.platform;
      return true;
    }
    if (typeof value === 'undefined') {
      return true; // not updating platform
    }
    const allowed = ['PC','PlayStation','Xbox','Nintendo','Steam','Mobile','iTunes','All'];
    if (!allowed.includes(value)) {
      throw new Error('Invalid platform');
    }
    return true;
  }),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  // For updates, image is optional (keep existing if not provided)
  body('image')
    .optional()
    .custom((value, { req }) => {
      // If URL is provided, validate it
      if (value && !value.startsWith('http')) {
        throw new Error('Image URL must be a valid HTTP/HTTPS URL');
      }
      return true;
    })
];

// Live search endpoint with prefix and min-5 logic
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 20);
    const startsWith = String(req.query.startsWith).toLowerCase() === 'true';
    if (!q) return res.json([]);

    const regex = startsWith ? new RegExp('^' + escapeRegex(q), 'i') : new RegExp(escapeRegex(q), 'i');

    const primary = await Product.find({
      isActive: true,
      title: { $regex: regex }
    })
      .select('_id title image price salePrice')
      .limit(limit)
      .lean();

    let results = primary;
    // If single letter and fewer than 5 results, top up with popular picks (not necessarily same letter)
    if (q.length === 1 && primary.length < 5) {
      const remaining = Math.min(5 - primary.length, Math.max(0, limit - primary.length));
      if (remaining > 0) {
        // Prefer trending/top-seller, fall back to rating/reviewCount
        const excludeIds = primary.map(p => p._id);
        const popular = await Product.find({
          isActive: true,
          _id: { $nin: excludeIds },
          $or: [{ isTrending: true }, { isTopSeller: true }]
        })
          .sort({ createdAt: -1 })
          .select('_id title image price salePrice')
          .limit(remaining)
          .lean();

        let filled = popular;
        if (filled.length < remaining) {
          const more = await Product.find({ isActive: true, _id: { $nin: [...excludeIds, ...popular.map(p => p._id)] } })
            .sort({ reviewCount: -1, rating: -1 })
            .select('_id title image price salePrice')
            .limit(remaining - filled.length)
            .lean();
          filled = filled.concat(more);
        }
        results = primary.concat(filled.map(p => ({ ...p, popular: true })));
      }
    }

    res.json(results.slice(0, limit));
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json([]);
  }
});

// Admin routes (protected)
router.get('/admin', auth, isAdmin, getAdminProducts);

// Public routes
router.get('/featured', getFeaturedProducts);
router.get('/top-sellers', getTopSellerProducts);
router.get('/trending', getTrendingProducts);
router.get('/best-selling', getBestSellingProducts);
router.get('/preorder', getPreOrderProducts);
router.get('/gift-cards', getGiftCards);
router.get('/software', getSoftware);
router.get('/', getProducts);
router.get('/:id', getProduct);


// Protected admin routes
router.post('/', 
  auth, 
  isAdmin, 
  upload.single('image'), 
  handleUploadError, 
  createProductValidation, 
  createProduct
);

router.put('/:id', 
  auth, 
  isAdmin, 
  upload.single('image'), 
  handleUploadError, 
  updateProductValidation, 
  updateProduct
);

router.delete('/:id', auth, isAdmin, deleteProduct);

module.exports = router;