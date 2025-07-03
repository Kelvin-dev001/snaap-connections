const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Brand = require('../models/brand');

// Multer setup for logo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/brands/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-brand' + path.extname(file.originalname));
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

// GET all brands (logo as absolute URL)
router.get('/', async (req, res) => {
  const brands = await Brand.find();
  const brandsWithAbsoluteLogo = brands.map(brand => ({
    ...brand.toObject(),
    logo: makeImageUrl(req, brand.logo)
  }));
  res.json(brandsWithAbsoluteLogo);
});

// CREATE brand
router.post('/', upload.single('logo'), async (req, res) => {
  const { name, description } = req.body;
  const logo = req.file ? `/uploads/brands/${req.file.filename}` : req.body.logo || "";
  const brand = new Brand({ name, description, logo });
  await brand.save();
  const brandWithAbsoluteLogo = {
    ...brand.toObject(),
    logo: makeImageUrl(req, brand.logo)
  };
  res.status(201).json(brandWithAbsoluteLogo);
});

// UPDATE brand
router.put('/:id', upload.single('logo'), async (req, res) => {
  const { name, description } = req.body;
  let update = { name, description };
  if (req.file) {
    update.logo = `/uploads/brands/${req.file.filename}`;
  } else if (req.body.logo) {
    update.logo = req.body.logo;
  }
  const brand = await Brand.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!brand) return res.status(404).json({ message: 'Brand not found' });
  const brandWithAbsoluteLogo = {
    ...brand.toObject(),
    logo: makeImageUrl(req, brand.logo)
  };
  res.json(brandWithAbsoluteLogo);
});

// DELETE brand
router.delete('/:id', async (req, res) => {
  await Brand.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;