// /utils/cloudinary.js
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image file to Cloudinary.
 * @param {string} filePath - Path to the local file (from multer or similar).
 * @param {string} folder - Folder in Cloudinary ("products", "banners", etc.).
 * @returns {Promise<object>} The Cloudinary response object.
 */
const uploadToCloudinary = (filePath, folder = "") =>
  cloudinary.uploader.upload(filePath, { folder });

module.exports = { uploadToCloudinary };
