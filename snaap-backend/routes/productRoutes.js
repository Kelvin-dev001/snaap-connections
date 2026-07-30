const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const Product = require('../models/Product');
const requireAdmin = require('../middleware/requireAdmin');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const updatedUpload = upload.array('images', 10);

function generateSKU(name, brand) {
  const brandPart = brand ? brand.substring(0, 3).toUpperCase() : 'XXX';
  const namePart = name ? name.substring(0, 3).toUpperCase() : 'YYY';
  return `${brandPart}-${namePart}-${Date.now()}`;
}

async function uploadBufferToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'products',
        public_id: filename.split('.')[0],
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

function getExistingImages(req) {
  if (!req.body.existingImages) return [];
  if (Array.isArray(req.body.existingImages)) return req.body.existingImages;
  if (typeof req.body.existingImages === 'string' && req.body.existingImages.length > 0)
    return req.body.existingImages.split(',');
  return [];
}

function extractSpecs(body) {
  const specs = {};
  [
    'storage', 'ram', 'screenSize', 'camera', 'battery',
    'processor', 'os', 'material', 'wattage', 'connectivity', 'color'
  ].forEach(key => {
    if (body[key]) specs[key] = body[key];
    if (body[`specs[${key}]`]) specs[key] = body[`specs[${key}]`];
    if (body.specs && body.specs[key]) specs[key] = body.specs[key];
  });
  return specs;
}

function extractArray(field, body) {
  if (Array.isArray(body[`${field}[]`])) return body[`${field}[]`];
  if (body[`${field}[]`]) return [body[`${field}[]`]];
  if (Array.isArray(body[field])) return body[field];
  if (typeof body[field] === 'string' && body[field].length > 0) return body[field].split(',').map(s => s.trim());
  return [];
}

// ─── PUBLIC ROUTES ───────────────────────────────────────────────

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
  try {
    const { category, brand, featured, limit, minPrice, maxPrice, search, dealType, sort, page = 1 } = req.query;
    const query = {};

    if (brand) query.brand = { $regex: `^${String(brand)}$`, $options: 'i' };
    if (category) query.category = { $regex: `^${String(category)}$`, $options: 'i' };
    if (featured) query.isFeatured = true;
    if (dealType) query.dealType = String(dealType); // H5: block NoSQL operator injection
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      const searchStr = String(search); // H5: coerce so ?search[$ne]= can't inject an operator
      query.$or = [
        { name: { $regex: searchStr, $options: 'i' } },
        { brand: { $regex: searchStr, $options: 'i' } },
        { category: { $regex: searchStr, $options: 'i' } }
      ];
    }

    // P1-13: never surface soft-deleted (merged-away duplicate) products.
    query.isDeleted = { $ne: true };

    const limitNum = parseInt(limit) || 12;
    const pageNum = parseInt(page) || 1;

    const total = await Product.countDocuments(query);

    let products;
    let sortOption = {};
    if (!sort || sort === 'random') {
      products = await Product.aggregate([
        { $match: query },
        { $sample: { size: limitNum } }
      ]);
    } else {
      if (sort === 'price-low' || sort === 'price_asc') sortOption.price = 1;
      if (sort === 'price-high' || sort === 'price_desc') sortOption.price = -1;
      if (sort === 'newest') sortOption.createdAt = -1;
      if (Object.keys(sortOption).length === 0) sortOption.createdAt = -1;
      products = await Product.find(query)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort(sortOption);
    }

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      limit: limitNum,
      products: Array.isArray(products) ? products : []
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch products'
    });
  }
});

// GET UNIQUE BRANDS
router.get('/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { isDeleted: { $ne: true } });
    res.json({ success: true, brands });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to fetch brands' });
  }
});

// GET UNIQUE CATEGORIES
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isDeleted: { $ne: true } });
    res.json({ success: true, categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to fetch categories' });
  }
});

// GET ACTIVE DEALS (grouped by dealType, only non-expired)
router.get('/deals/active', async (req, res) => {
  try {
    const now = new Date();
    const deals = await Product.find({
      isDeleted: { $ne: true },
      dealType: { $in: ["dealOfTheDay", "flashSale", "limitedOffer"] },
      $or: [
        { dealExpiry: null },
        { dealExpiry: { $exists: false } },
        { dealExpiry: { $gt: now } },
      ],
    }).sort({ dealType: 1, updatedAt: -1 });

    const grouped = {
      dealOfTheDay: [],
      flashSale: [],
      limitedOffer: [],
    };

    deals.forEach((p) => {
      if (grouped[p.dealType]) {
        grouped[p.dealType].push(p);
      }
    });

    res.json({ success: true, deals: grouped });
  } catch (err) {
    console.error('Error fetching active deals:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch deals' });
  }
});

// GET SINGLE PRODUCT BY ID (must be AFTER /deals/active, /brands, /categories)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Product not found'
      });
    }
    res.json({ success: true, product: product.toObject() });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to fetch product' });
  }
});

// ─── PROTECTED ROUTES ────────────────────────────────────────────
router.use(requireAdmin);

// PRODUCT CREATE
router.post('/', updatedUpload, async (req, res) => {
  try {
    const { name, price, brand, category } = req.body;

    if (!name || !price || !brand || !category) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Name, price, brand, and category are required'
      });
    }

    const existingImages = getExistingImages(req);
    let cloudinaryImages = [];
    if (req.files && req.files.length > 0) {
      cloudinaryImages = await Promise.all(
        req.files.map(file => uploadBufferToCloudinary(file.buffer, file.originalname))
      );
    }
    const images = [...existingImages, ...cloudinaryImages];

    const productData = {
      name,
      price: Number(price),
      brand,
      category,
      shortDescription: req.body.shortDescription || '',
      fullDescription: req.body.fullDescription || '',
      keyFeatures: extractArray('keyFeatures', req.body),
      tags: extractArray('tags', req.body),
      compatibleWith: extractArray('compatibleWith', req.body),
      relatedProducts: extractArray('relatedProducts', req.body),
      accessoryType: req.body.accessoryType || '',
      model: req.body.model || '',
      videoUrl: req.body.videoUrl || '',
      currency: req.body.currency || 'KES',
      discountPrice: req.body.discountPrice ? Number(req.body.discountPrice) : undefined,
      specs: extractSpecs(req.body),
      sku: req.body.sku || generateSKU(name, brand),
      stockQuantity: Number(req.body.stockQuantity) || Number(req.body.stock) || 0,
      inStock: req.body.inStock !== 'false',
      images,
      thumbnail: images[0] || null,
      isFeatured: req.body.isFeatured === 'true' || req.body.isActive === 'true' || false,
      isNewRelease: req.body.isNewRelease === 'true' || false,
      isOnSale: req.body.isOnSale === 'true' || false,
      releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : undefined,
      warrantyPeriod: req.body.warrantyPeriod || '1 year',
      returnPolicyDays: req.body.returnPolicyDays ? Number(req.body.returnPolicyDays) : 30,
      dealType: req.body.dealType || "",
      dealExpiry: req.body.dealExpiry ? new Date(req.body.dealExpiry) : null,
    };

    const product = new Product(productData);
    const savedProduct = await product.save();

    res.status(201).json({ success: true, product: savedProduct.toObject() });
  } catch (err) {
    console.error('Error creating product:', err);

    if (err.code === 11000 && err.keyPattern && err.keyPattern.sku) {
      return res.status(400).json({ success: false, error: 'DUPLICATE_SKU', message: 'SKU already exists' });
    }

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', messages: errors });
    }

    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to create product' });
  }
});

// PRODUCT UPDATE
router.put('/:id', updatedUpload, async (req, res) => {
  try {
    const { name, price, brand, category } = req.body;

    if (!name || !price || !brand || !category) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Name, price, brand, and category are required'
      });
    }

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Product not found' });
    }

    const existingImages = getExistingImages(req);
    let cloudinaryImages = [];
    if (req.files && req.files.length > 0) {
      cloudinaryImages = await Promise.all(
        req.files.map(file => uploadBufferToCloudinary(file.buffer, file.originalname))
      );
    }
    const images = [...existingImages, ...cloudinaryImages];

    const updateData = {
      name,
      price: Number(price),
      brand,
      category,
      shortDescription: typeof req.body.shortDescription !== 'undefined' ? req.body.shortDescription : existingProduct.shortDescription,
      fullDescription: typeof req.body.fullDescription !== 'undefined' ? req.body.fullDescription : existingProduct.fullDescription,
      keyFeatures: extractArray('keyFeatures', req.body).length > 0 ? extractArray('keyFeatures', req.body) : existingProduct.keyFeatures,
      tags: extractArray('tags', req.body).length > 0 ? extractArray('tags', req.body) : existingProduct.tags,
      compatibleWith: extractArray('compatibleWith', req.body).length > 0 ? extractArray('compatibleWith', req.body) : existingProduct.compatibleWith,
      relatedProducts: extractArray('relatedProducts', req.body).length > 0 ? extractArray('relatedProducts', req.body) : existingProduct.relatedProducts,
      accessoryType: typeof req.body.accessoryType !== 'undefined' ? req.body.accessoryType : existingProduct.accessoryType,
      model: typeof req.body.model !== 'undefined' ? req.body.model : existingProduct.model,
      videoUrl: typeof req.body.videoUrl !== 'undefined' ? req.body.videoUrl : existingProduct.videoUrl,
      currency: typeof req.body.currency !== 'undefined' ? req.body.currency : existingProduct.currency,
      discountPrice: typeof req.body.discountPrice !== 'undefined' ? Number(req.body.discountPrice) : existingProduct.discountPrice,
      specs: Object.keys(extractSpecs(req.body)).length > 0 ? extractSpecs(req.body) : existingProduct.specs,
      sku: typeof req.body.sku !== 'undefined' ? req.body.sku : existingProduct.sku,
      stockQuantity: typeof req.body.stockQuantity !== 'undefined' ? Number(req.body.stockQuantity) : typeof req.body.stock !== 'undefined' ? Number(req.body.stock) : existingProduct.stockQuantity,
      inStock: typeof req.body.inStock !== 'undefined' ? req.body.inStock !== 'false' : existingProduct.inStock,
      isOnSale: typeof req.body.isOnSale !== 'undefined' ? req.body.isOnSale === 'true' : existingProduct.isOnSale,
      images,
      thumbnail: images[0] || existingProduct.thumbnail,
      isFeatured: typeof req.body.isFeatured !== 'undefined' ? (req.body.isFeatured === 'true' || req.body.isActive === 'true') : existingProduct.isFeatured,
      isNewRelease: typeof req.body.isNewRelease !== 'undefined' ? req.body.isNewRelease === 'true' : existingProduct.isNewRelease,
      releaseDate: typeof req.body.releaseDate !== 'undefined' && req.body.releaseDate ? new Date(req.body.releaseDate) : existingProduct.releaseDate,
      warrantyPeriod: typeof req.body.warrantyPeriod !== 'undefined' ? req.body.warrantyPeriod : existingProduct.warrantyPeriod,
      returnPolicyDays: typeof req.body.returnPolicyDays !== 'undefined' ? Number(req.body.returnPolicyDays) : existingProduct.returnPolicyDays,
      dealType: typeof req.body.dealType !== 'undefined' ? req.body.dealType : existingProduct.dealType,
      dealExpiry: typeof req.body.dealExpiry !== 'undefined' && req.body.dealExpiry
        ? new Date(req.body.dealExpiry)
        : typeof req.body.dealExpiry !== 'undefined'
          ? null
          : existingProduct.dealExpiry,
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ success: true, product: updatedProduct.toObject() });
  } catch (err) {
    console.error('Error updating product:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to update product' });
    }
  }
});

// PRODUCT DELETE
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to delete product' });
  }
});

module.exports = router;