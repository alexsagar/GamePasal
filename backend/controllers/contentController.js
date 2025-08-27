const { validationResult } = require('express-validator');
const Content = require('../models/Content');

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary (ensure your .env is set up)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// @desc    Get all banners
// @route   GET /api/banners
// @access  Public
const getBanners = async (req, res) => {
  try {
    // Optionally filter by isActive from query (?isActive=true)
    const filter = { section: 'banner' };
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const banners = await Content.find(filter)
    .populate('productId')
    .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch banners' });
  }
};

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let imageUrl = req.body.image;

    // Handle file upload
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'banners'
      });
      imageUrl = result.secure_url;
      // Delete local file after upload
      fs.unlinkSync(req.file.path);
    }

    // Always set section to 'banner'
    const banner = await Content.create({
      ...req.body,
      image: imageUrl,
      section: 'banner',
      updatedBy: req.user?.id,
      isActive: req.body.isActive === 'true' || req.body.isActive === true,
    });

    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a banner by ID
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const id = req.params.id;
    let imageUrl = req.body.image;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'banners'
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const updateData = {
      ...req.body,
      image: imageUrl,
      section: 'banner',
      updatedBy: req.user?.id,
      isActive: req.body.isActive === 'true' || req.body.isActive === true,
    };

    const banner = await Content.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a banner by ID (hard delete)
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res) => {
  try {
    const id = req.params.id;
    const banner = await Content.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    res.status(200).json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get content by section
// @route   GET /api/content/:section
// @access  Public
const getContentBySection = async (req, res) => {
  try {
    const { section } = req.params;

    const content = await Content.find({ section, isActive: true })
      .populate('updatedBy', 'username');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found for this section'
      });
    }

    res.status(200).json({
      success: true,
      data: content
    });

  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching content'
    });
  }
};

// @desc    Get all content sections
// @route   GET /api/content
// @access  Public
const getAllContent = async (req, res) => {
  try {
    const { isActive = true } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const content = await Content.find(filter)
      .populate('updatedBy', 'username')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });

  } catch (error) {
    console.error('Get all content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching content'
    });
  }
};

// @desc    Create or update content
// @route   POST /api/content
// @access  Private/Admin
const createOrUpdateContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { section, title, subtitle, description, image, images, data, isActive } = req.body;

    // Check if content already exists for this section
    let content = await Content.findOne({ section });

    if (content) {
      // Update existing content
      content.title = title;
      content.subtitle = subtitle || content.subtitle;
      content.description = description || content.description;
      content.image = image || content.image;
      content.images = images || content.images;
      content.data = data || content.data;
      content.isActive = isActive !== undefined ? isActive : content.isActive;
      content.updatedBy = req.user.id;

      await content.save();

      res.status(200).json({
        success: true,
        message: 'Content updated successfully',
        data: content
      });
    } else {
      // Create new content
      content = await Content.create({
        section,
        title,
        subtitle,
        description,
        image,
        images,
        data,
        isActive,
        updatedBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Content created successfully',
        data: content
      });
    }

  } catch (error) {
    console.error('Create/Update content error:', error);
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
      message: 'Server error while saving content'
    });
  }
};

// @desc    Update content by section
// @route   PUT /api/content/:section
// @access  Private/Admin
const updateContentBySection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { section } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    const content = await Content.findOneAndUpdate(
      { section },
      updateData,
      {
        new: true,
        runValidators: true,
        upsert: true // Create if doesn't exist
      }
    ).populate('updatedBy', 'username');

    res.status(200).json({
      success: true,
      message: 'Content updated successfully',
      data: content
    });

  } catch (error) {
    console.error('Update content error:', error);
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
      message: 'Server error while updating content'
    });
  }
};

// @desc    Delete content by section
// @route   DELETE /api/content/:section
// @access  Private/Admin
const deleteContentBySection = async (req, res) => {
  try {
    const { section } = req.params;

    const content = await Content.findOne({ section });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Soft delete - just mark as inactive
    content.isActive = false;
    content.updatedBy = req.user.id;
    await content.save();

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting content'
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(12); // Limit to top 12, or as many as you want
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch featured products' });
  }
};

// @desc    Get top seller products
// @route   GET /api/products/top-sellers
// @access  Public
const getTopSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ isTopSeller: true, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(12);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Get top sellers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top sellers' });
  }
};

// @desc    Get trending products
// @route   GET /api/products/trending
// @access  Public
const getTrendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ isTrending: true, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(12);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Get trending products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending products' });
  }
};

// @desc    Get best selling products
// @route   GET /api/products/best-selling
// @access  Public
const getBestSellingProducts = async (req, res) => {
  try {
    const products = await Product.find({ isBestSelling: true, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(12);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Get best selling products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch best selling products' });
  }
};

// @desc    Get pre-order products
// @route   GET /api/products/preorder
// @access  Public
const getPreOrderProducts = async (req, res) => {
  try {
    const products = await Product.find({ isPreOrder: true, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(12);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Get pre-order products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pre-order products' });
  }
};


module.exports = {

  // Banner APIs
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,

  // Section content APIS
  getContentBySection,
  getAllContent,
  createOrUpdateContent,
  updateContentBySection,
  deleteContentBySection,

    // Home product section APIs
  getFeaturedProducts,
  getTopSellerProducts,
  getTrendingProducts,
  getBestSellingProducts,
  getPreOrderProducts,
};