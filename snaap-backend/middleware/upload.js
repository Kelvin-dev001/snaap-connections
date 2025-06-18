const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const createError = require('http-errors');

// Configure upload directory
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Create uploads directory if it doesn't exist
const createUploadsDir = () => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { 
        recursive: true,
        mode: 0o755
      });
      console.log(`Upload directory created at ${UPLOAD_DIR}`);
    }
  } catch (err) {
    console.error('Failed to create upload directory:', err);
    throw err;
  }
};

createUploadsDir();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    cb(null, uniqueFilename);
  }
});

// File validation
const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (
    !ALLOWED_FILE_TYPES.includes(file.mimetype) ||
    !ALLOWED_EXTENSIONS.includes(fileExt)
  ) {
    return cb(createError(400, 'Only JPEG, PNG, WEBP, and GIF images are allowed'), false);
  }

  if (file.originalname.includes('/') || file.originalname.includes('..')) {
    return cb(createError(400, 'Invalid filename'), false);
  }

  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10
  }
});

// Simple middleware to attach file URL to request
const processUpload = (req, res, next) => {
  if (req.file) {
    req.file.url = `/uploads/${req.file.filename}`;
    req.file.localPath = path.join(UPLOAD_DIR, req.file.filename);
  }
  next();
};

module.exports = {
  upload, // The raw multer instance
  processUpload,
  UPLOAD_DIR,
  ALLOWED_FILE_TYPES
};