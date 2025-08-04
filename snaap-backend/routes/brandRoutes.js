const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const Brand = require('../models/brand');
const requireAdmin = require('../middleware/requireAdmin');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper to upload buffer to Cloudinary
async function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'brands',
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

// GET all brands (logos are already absolute URLs from Cloudinary) - PUBLIC
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch brands' });
  }
});

// All routes below require admin authentication
router.use(requireAdmin);

// CREATE brand
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const { name, description } = req.body;
    let logoUrl = req.body.logo || "";
    if (req.file && req.file.buffer) {
      // Upload to Cloudinary
      logoUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    }
    const brand = new Brand({ name, description, logo: logoUrl });
    await brand.save();
    res.status(201).json(brand);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create brand' });
  }
});

// UPDATE brand
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    const { name, description } = req.body;
    let update = { name, description };

    if (req.file && req.file.buffer) {
      // Upload to Cloudinary
      update.logo = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    } else if (req.body.logo) {
      update.logo = req.body.logo;
    }

    const brand = await Brand.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    res.json(brand);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update brand' });
  }
});

// DELETE brand
router.delete('/:id', async (req, res) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete brand' });
  }
});

module.exports = router;