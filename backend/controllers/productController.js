const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      platform,
      genre,
      search,
      sort = 'createdAt',
      order = 'desc',
      minPrice,
      maxPrice,
      rating,
      featured
    } = req.query;

    const filter = { isActive: true };
     
    if (category) {
      filter.category = category;
    }
    if (platform) {
      // Platform-specific page: only Games should match
      filter.platform = platform;
      if (!filter.category) {
        filter.category = 'Game';
      }
    }
    
    if (genre) filter.genre = genre;
    if (featured) filter.isFeatured = featured === 'true';

    // Section filters
    if (req.query.isTopSeller) filter.isTopSeller = req.query.isTopSeller === 'true';
    if (req.query.isTrending) filter.isTrending = req.query.isTrending === 'true';
    if (req.query.isBestSelling) filter.isBestSelling = req.query.isBestSelling === 'true';
   if (req.query.isPreOrder !== undefined) {
  filter.isPreOrder = req.query.isPreOrder === 'true';
}
    if (req.query.isDealOfTheDay) filter.isDealOfTheDay = req.query.isDealOfTheDay === 'true';
  
    if (rating) filter.rating = { $gte: parseFloat(rating) };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {};
    if (sort === 'price') {
      sortOptions.price = order === 'desc' ? -1 : 1;
    } else if (sort === 'rating') {
      sortOptions.rating = order === 'desc' ? -1 : 1;
    } else if (sort === 'name') {
      sortOptions.title = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = order === 'desc' ? -1 : 1;
    }

    const products = await Product.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'username');

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: products
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
};
// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let imageUrl = req.body.image;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'products',
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Either upload an image file or provide an image URL'
      });
    }

    let features = req.body.features;
    if (typeof features === 'string') {
      try { features = JSON.parse(features); } catch (e) { features = []; }
    }
    let systemRequirements = req.body.systemRequirements;
    if (typeof systemRequirements === 'string') {
      try { systemRequirements = JSON.parse(systemRequirements); } catch (e) { systemRequirements = {}; }
    }

    const productData = {
      title: req.body.title,
      category: req.body.category,
      platform: req.body.platform,
      description: req.body.description,
      price: parseFloat(req.body.price),
      salePrice: req.body.salePrice ? parseFloat(req.body.salePrice) : undefined,
      stock: parseInt(req.body.stock),
      image: imageUrl,
      genre: req.body.genre && req.body.genre.trim() !== '' ? req.body.genre : undefined,
      rating: req.body.rating ? parseFloat(req.body.rating) : undefined,
      badge: req.body.badge && req.body.badge.trim() !== '' ? req.body.badge : undefined,
      type: req.body.type && req.body.type.trim() !== '' ? req.body.type : undefined,
      features: features || [],
      systemRequirements: systemRequirements || {},
      releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : undefined,
      developer: req.body.developer,
      publisher: req.body.publisher,
      // -- Homepage toggles start here --
      isFeatured:    req.body.isFeatured    === 'true' || req.body.isFeatured    === true,
      isTopSeller:   req.body.isTopSeller   === 'true' || req.body.isTopSeller   === true,
      isTrending:    req.body.isTrending    === 'true' || req.body.isTrending    === true,
      isBestSelling: req.body.isBestSelling === 'true' || req.body.isBestSelling === true,
      isPreOrder:    req.body.isPreOrder    === 'true' || req.body.isPreOrder    === true,
      isDealOfTheDay:req.body.isDealOfTheDay=== 'true' || req.body.isDealOfTheDay=== true,
      // --
      createdBy: req.user.id
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Create product error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    // Convert price and salePrice to numbers early
    if (req.body.price) req.body.price = Number(req.body.price);
    if (req.body.salePrice) req.body.salePrice = Number(req.body.salePrice);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate salePrice < price before updating
    const newPrice = req.body.price !== undefined ? req.body.price : existingProduct.price;
    const newSalePrice = req.body.salePrice !== undefined ? req.body.salePrice : existingProduct.salePrice;

    if (newSalePrice !== undefined && newPrice !== undefined && newSalePrice >= newPrice) {
      return res.status(400).json({
        success: false,
        message: 'Sale price must be less than regular price',
      });
    }

    let imageUrl = existingProduct.image;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'products',
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    } else if (req.body.image && req.body.image !== existingProduct.image) {
      imageUrl = req.body.image;
    }

    let features = req.body.features;
    if (typeof features === 'string') {
      try {
        features = JSON.parse(features);
      } catch (e) {
        features = existingProduct.features;
      }
    }

    let systemRequirements = req.body.systemRequirements;
    if (typeof systemRequirements === 'string') {
      try {
        systemRequirements = JSON.parse(systemRequirements);
      } catch (e) {
        systemRequirements = existingProduct.systemRequirements;
      }
    }

    const updateData = {
      title: req.body.title || existingProduct.title,
      category: req.body.category || existingProduct.category,
      platform: req.body.platform || existingProduct.platform,
      description: req.body.description || existingProduct.description,
      price: newPrice,
      salePrice: newSalePrice,
      stock: req.body.stock ? parseInt(req.body.stock) : existingProduct.stock,
      image: imageUrl,
      genre: req.body.genre && req.body.genre.trim() !== '' ? req.body.genre : existingProduct.genre,
      rating: req.body.rating ? parseFloat(req.body.rating) : existingProduct.rating,
      badge: req.body.badge && req.body.badge.trim() !== '' ? req.body.badge : existingProduct.badge,
      type: req.body.type && req.body.type.trim() !== '' ? req.body.type : existingProduct.type,
      features: features || existingProduct.features,
      systemRequirements: systemRequirements || existingProduct.systemRequirements,
      releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : existingProduct.releaseDate,
      developer: req.body.developer || existingProduct.developer,
      publisher: req.body.publisher || existingProduct.publisher,
      // -- Homepage toggles --
      isFeatured:    req.body.isFeatured    !== undefined ? (req.body.isFeatured    === 'true' || req.body.isFeatured    === true) : existingProduct.isFeatured,
      isTopSeller:   req.body.isTopSeller   !== undefined ? (req.body.isTopSeller   === 'true' || req.body.isTopSeller   === true) : existingProduct.isTopSeller,
      isTrending:    req.body.isTrending    !== undefined ? (req.body.isTrending    === 'true' || req.body.isTrending    === true) : existingProduct.isTrending,
      isBestSelling: req.body.isBestSelling !== undefined ? (req.body.isBestSelling === 'true' || req.body.isBestSelling === true) : existingProduct.isBestSelling,
      isPreOrder:    req.body.isPreOrder    !== undefined ? (req.body.isPreOrder    === 'true' || req.body.isPreOrder    === true) : existingProduct.isPreOrder,
      isDealOfTheDay:req.body.isDealOfTheDay!== undefined ? (req.body.isDealOfTheDay=== 'true' || req.body.isDealOfTheDay=== true) : existingProduct.isDealOfTheDay,
      // --
    };

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Update product error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated image file if it exists and is not a URL
    if (product.image && !product.image.startsWith('http')) {
      const imagePath = path.join('uploads', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Hard delete the product
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({
      isActive: true,
      isFeatured: true
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('createdBy', 'username');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured products'
    });
  }
};

const getGiftCards = async (req, res) => {
  try {
    const giftCards = await Product.find({ category: 'GiftCard', isActive: true }).lean();
    res.json({ data: giftCards });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getSoftware = async (req, res) => {
  try {
    const software = await Product.find({ category: 'Software', isActive: true }).lean();
    res.json({ data: software });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Top Sellers
const getTopSellerProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await Product.find({ isActive: true, isTopSeller: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('createdBy', 'username');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Get top sellers error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching top sellers' });
  }
};

// Trending
const getTrendingProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await Product.find({ isActive: true, isTrending: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('createdBy', 'username');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching trending products' });
  }
};

// Best Selling
const getBestSellingProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await Product.find({ isActive: true, isBestSelling: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('createdBy', 'username');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Get best selling error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching best selling products' });
  }
};

// Pre-Order
const getPreOrderProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await Product.find({ isActive: true, isPreOrder: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('createdBy', 'username');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Get pre order error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching pre order products' });
  }
};

// @desc    Get all products (Admin - no filters)
// @route   GET /api/products/admin
// @access  Private/Admin
const getAdminProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      platform,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = {};
     
    if (category) {
      filter.category = category;
    }
    if (platform) {
      filter.platform = platform;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {};
    if (sort === 'price') {
      sortOptions.price = order === 'desc' ? -1 : 1;
    } else if (sort === 'rating') {
      sortOptions.rating = order === 'desc' ? -1 : 1;
    } else if (sort === 'name') {
      sortOptions.title = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = order === 'desc' ? -1 : 1;
    }

    const products = await Product.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'username');

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: products
    });

  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


module.exports = {
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
};