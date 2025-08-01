const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const createError = require('http-errors');

// Use memory storage to avoid writing to disk
const storage = multer.memoryStorage();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const fileFilter = (req, file, cb) => {
  const fileExt = file.originalname.split('.').pop().toLowerCase();
  if (
    !ALLOWED_FILE_TYPES.includes(file.mimetype) ||
    !ALLOWED_EXTENSIONS.includes(`.${fileExt}`)
  ) {
    return cb(createError(400, 'Only JPEG, PNG, WEBP, and GIF images are allowed'), false);
  }
  if (file.originalname.includes('/') || file.originalname.includes('..')) {
    return cb(createError(400, 'Invalid filename'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 10 }
});

module.exports = {
  upload,
  ALLOWED_FILE_TYPES
};