const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Brand = require('../models/brand');

// Setup multer for logo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/brands/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-brand' + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  const brands = await Brand.find();
  res.json(brands);
});

router.post('/', upload.single('logo'), async (req, res) => {
  const { name, description } = req.body;
  const logo = req.file ? `/uploads/brands/${req.file.filename}` : req.body.logo || "";
  const brand = new Brand({ name, description, logo });
  await brand.save();
  res.status(201).json(brand);
});

router.put('/:id', upload.single('logo'), async (req, res) => {
  const { name, description } = req.body;
  let update = { name, description };
  if (req.file) {
    update.logo = `/uploads/brands/${req.file.filename}`;
  } else if (req.body.logo) {
    update.logo = req.body.logo;
  }
  const brand = await Brand.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(brand);
});

router.delete('/:id', async (req, res) => {
  await Brand.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;