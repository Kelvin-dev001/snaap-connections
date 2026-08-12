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

// A hero slider saves up to 5 slides carrying TWO artworks each (wide + phone),
// which is exactly 10 files — the old limit, with nothing to spare. Multer
// rejects the 11th with an error the section routes surface as a generic 500,
// so the owner would have seen "Failed to save" with no reason. The headroom is
// cheap: this route is behind requireAdmin and every file is capped at 5MB.
const MAX_FILES = 12;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES }
});

module.exports = {
  upload,
  ALLOWED_FILE_TYPES
};