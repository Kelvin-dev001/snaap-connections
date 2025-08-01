const cloudinary = require('cloudinary').v2;

// Use built-in config. The SDK will automatically read CLOUDINARY_URL from process.env.
cloudinary.config({
  secure: true
});

module.exports = cloudinary;