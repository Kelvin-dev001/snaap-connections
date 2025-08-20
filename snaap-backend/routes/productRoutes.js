const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const Product = require('../models/Product');
const requireAdmin = require('../middleware/requireAdmin');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const updatedUpload = upload.array('images', 10);
// SKU generator function (fixes ReferenceError)
function generateSKU(name, brand) {
  // Simple SKU: first 3 letters of brand and name, timestamp
  const brandPart = brand ? brand.substring(0, 3).toUpperCase() : 'XXX';
  const namePart = name ? name.substring(0, 3).toUpperCase() : 'YYY';
  return `${brandPart}-${namePart}-${Date.now()}`;
}

// Helper: upload a buffer to Cloudinary
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

// Helper: handle existingImages from FormData (array or CSV)
function getExistingImages(req) {
  if (!req.body.existingImages) return [];
  if (Array.isArray(req.body.existingImages)) return req.body.existingImages;
  if (typeof req.body.existingImages === 'string' && req.body.existingImages.length > 0)
    return req.body.existingImages.split(',');
  return [];
}

// Helper to extract specs from flat, nested, or FormData style
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

// Helper to extract array fields from FormData or JSON
function extractArray(field, body) {
  if (Array.isArray(body[`${field}[]`])) return body[`${field}[]`];
  if (body[`${field}[]`]) return [body[`${field}[]`]];
  if (Array.isArray(body[field])) return body[field];
  if (typeof body[field] === 'string' && body[field].length > 0) return body[field].split(',').map(s => s.trim());
  return [];
}

// GET ALL PRODUCTS (client)
router.get('/', async (req, res) => {
  try {
    const { category, brand, featured, limit, minPrice, maxPrice, search, dealType } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (featured) query.isFeatured = true;
    if (dealType) query.dealType = dealType;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const { sort } = req.query;
let products;

if (sort === 'random') {
  // Use aggregation pipeline to get random products
  products = await Product.aggregate([
    { $match: query },
    { $sample: { size: parseInt(limit) || 1000 } }
  ]);
} else {
  // Default sort
  products = await Product.find(query)
    .limit(parseInt(limit) || 1000)
    .sort({ createdAt: -1 });
}

    res.json({ 
      success: true, 
      count: products.length, 
      products: products.map(prod => prod.toObject())
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
    const brands = await Product.distinct('brand');
    res.json({ 
      success: true, 
      brands 
    });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch brands'
    });
  }
});

// GET UNIQUE CATEGORIES
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ 
      success: true, 
      categories 
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch categories'
    });
  }
});

// GET SINGLE PRODUCT BY ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Product not found'
      });
    }
    res.json({ 
      success: true, 
      product: product.toObject()
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch product'
    });
  }
});

// --- PROTECTED ROUTES: requireAdmin ---
router.use(requireAdmin);

// --- PRODUCT CREATE ---
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

    // Handle images: upload to Cloudinary
    const existingImages = getExistingImages(req);
    let cloudinaryImages = [];
    if (req.files && req.files.length > 0) {
      cloudinaryImages = await Promise.all(
        req.files.map(file =>
          uploadBufferToCloudinary(file.buffer, file.originalname)
        )
      );
    }
    const images = [...existingImages, ...cloudinaryImages];

    // Build product data
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
      releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : undefined,
      warrantyPeriod: req.body.warrantyPeriod || '1 year',
      returnPolicyDays: req.body.returnPolicyDays ? Number(req.body.returnPolicyDays) : 30,
      dealType: req.body.dealType || ""
    };

    // Save product
    const product = new Product(productData);
    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      product: savedProduct.toObject()
    });
  } catch (err) {
    console.error('Error creating product:', err);

    if (err.code === 11000 && err.keyPattern && err.keyPattern.sku) {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_SKU',
        message: 'SKU already exists'
      });
    }

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        messages: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to create product'
    });
  }
});

// --- PRODUCT UPDATE ---
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
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Product not found'
      });
    }

    // Handle images: merge existing and new Cloudinary uploads
    const existingImages = getExistingImages(req);
    let cloudinaryImages = [];
    if (req.files && req.files.length > 0) {
      cloudinaryImages = await Promise.all(
        req.files.map(file =>
          uploadBufferToCloudinary(file.buffer, file.originalname)
        )
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
      images,
      thumbnail: images[0] || existingProduct.thumbnail,
      isFeatured: typeof req.body.isFeatured !== 'undefined' ? (req.body.isFeatured === 'true' || req.body.isActive === 'true') : existingProduct.isFeatured,
      isNewRelease: typeof req.body.isNewRelease !== 'undefined' ? req.body.isNewRelease === 'true' : existingProduct.isNewRelease,
      releaseDate: typeof req.body.releaseDate !== 'undefined' && req.body.releaseDate ? new Date(req.body.releaseDate) : existingProduct.releaseDate,
      warrantyPeriod: typeof req.body.warrantyPeriod !== 'undefined' ? req.body.warrantyPeriod : existingProduct.warrantyPeriod,
      returnPolicyDays: typeof req.body.returnPolicyDays !== 'undefined' ? Number(req.body.returnPolicyDays) : existingProduct.returnPolicyDays,
      dealType: typeof req.body.dealType !== 'undefined' ? req.body.dealType : existingProduct.dealType
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      product: updatedProduct.toObject()
    });
  } catch (err) {
    console.error('Error updating product:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to update product'
      });
    }
  }
});

// --- PRODUCT DELETE ---
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Product not found'
      });
    }
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to delete product'
    });
  }
});

module.exports = router;