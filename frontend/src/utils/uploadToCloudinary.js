// src/utils/uploadToCloudinary.js

/**
 * Upload a file to Cloudinary via the unsigned API (from frontend)
 *
 * @param {File|Blob} file - File from input
 * @param {string} uploadPreset - Cloudinary upload preset name (e.g., "Gamepasal")
 * @param {string} [folder] - Optional folder name ("products", "banners")
 * @returns {Promise<string>} Cloudinary secure_url string
 */
export const uploadToCloudinary = async (file, uploadPreset, folder = "") => {
  const CLOUD_NAME = "dtuqbqgz7"; // Your cloud name here
  const url = `https://api.cloudinary.com/v1_1/$dtuqbqgz7/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("Gamepasal", uploadPreset);
  if (folder) formData.append("folder", folder);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "Failed to upload image";
    try {
      const err = await response.json();
      if (err.error && err.error.message) message = err.error.message;
    } catch (_) {}
    throw new Error(message);
  }

  const data = await response.json();
  return data.secure_url;
};
