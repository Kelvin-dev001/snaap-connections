const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const Category = require('../models/category');
const requireAdmin = require('../middleware/requireAdmin');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper to upload buffer to Cloudinary
async function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'categories',
        public_id: filename ? filename.split('.')[0] : undefined,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// GET all categories (icons are absolute Cloudinary URLs) - PUBLIC
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// All routes below require admin authentication
router.use(requireAdmin);

// CREATE category
router.post('/', upload.single('icon'), async (req, res) => {
  try {
    const { name, description } = req.body;
    let iconUrl = req.body.icon || "";
    if (req.file && req.file.buffer) {
      // Upload to Cloudinary
      iconUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    }
    const category = new Category({ name, description, icon: iconUrl });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// UPDATE category
router.put('/:id', upload.single('icon'), async (req, res) => {
  try {
    const { name, description } = req.body;
    let update = { name, description };

    if (req.file && req.file.buffer) {
      // Upload to Cloudinary
      update.icon = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    } else if (req.body.icon) {
      update.icon = req.body.icon;
    }

    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category' });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

module.exports = router;