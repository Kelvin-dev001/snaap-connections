const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Category = require('../models/category');

// Multer setup for icon uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/categories/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-category' + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Helper to make absolute URL
function makeImageUrl(req, path) {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

// GET all categories (icon as absolute URL)
router.get('/', async (req, res) => {
  const categories = await Category.find();
  const categoriesWithAbsoluteIcon = categories.map(category => ({
    ...category.toObject(),
    icon: makeImageUrl(req, category.icon)
  }));
  res.json(categoriesWithAbsoluteIcon);
});

// CREATE category
router.post('/', upload.single('icon'), async (req, res) => {
  const { name, description } = req.body;
  const icon = req.file ? `/uploads/categories/${req.file.filename}` : req.body.icon || "";
  const category = new Category({ name, description, icon });
  await category.save();
  const categoryWithAbsoluteIcon = {
    ...category.toObject(),
    icon: makeImageUrl(req, category.icon)
  };
  res.status(201).json(categoryWithAbsoluteIcon);
});

// UPDATE category
router.put('/:id', upload.single('icon'), async (req, res) => {
  const { name, description } = req.body;
  let update = { name, description };
  if (req.file) {
    update.icon = `/uploads/categories/${req.file.filename}`;
  } else if (req.body.icon) {
    update.icon = req.body.icon;
  }
  const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  const categoryWithAbsoluteIcon = {
    ...category.toObject(),
    icon: makeImageUrl(req, category.icon)
  };
  res.json(categoryWithAbsoluteIcon);
});

// DELETE category
router.delete('/:id', async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;