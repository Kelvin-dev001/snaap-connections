// src/utils/cloudinaryUrl.js

/**
 * Adds Cloudinary transformation parameters to a full Cloudinary URL.
 * @param {string} url - The original Cloudinary image URL.
 * @param {object} opts - Options like width, quality, format (all optional).
 * @returns {string} Optimized URL.
 */
export function getOptimizedCloudinaryUrl(url, { width = 400, quality = "auto", format = "auto" } = {}) {
  if (!url || typeof url !== "string") return "/fallback.png";
  // Only optimize Cloudinary URLs
  if (!url.includes("/image/upload/")) return url;

  // Find where to inject transformations
  const parts = url.split("/image/upload/");
  const transform = `f_${format},q_${quality},w_${width}/`;
  return `${parts[0]}/image/upload/${transform}${parts[1]}`; 
}