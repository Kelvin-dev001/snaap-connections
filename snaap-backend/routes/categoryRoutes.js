const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Category = require('../models/category');

// Setup multer for icon uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/categories/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-category' + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

router.post('/', upload.single('icon'), async (req, res) => {
  const { name, description } = req.body;
  const icon = req.file ? `/uploads/categories/${req.file.filename}` : req.body.icon || "";
  const category = new Category({ name, description, icon });
  await category.save();
  res.status(201).json(category);
});

router.put('/:id', upload.single('icon'), async (req, res) => {
  const { name, description } = req.body;
  let update = { name, description };
  if (req.file) {
    update.icon = `/uploads/categories/${req.file.filename}`;
  } else if (req.body.icon) {
    update.icon = req.body.icon;
  }
  const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(category);
});

router.delete('/:id', async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;