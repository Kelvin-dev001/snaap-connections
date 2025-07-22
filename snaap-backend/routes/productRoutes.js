const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const Product = require('../models/Product');
const requireAdmin = require('../middleware/requireAdmin');
const updatedUpload = upload.array('images', 10);

// Helper function to generate SKU
const generateSKU = (name, brand) => {
  return `${brand.slice(0, 3).toUpperCase()}-${name.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
};

// Helper for Absolute URLs - always use HTTPS
function makeImageUrl(req, path) {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  let baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    // Force HTTPS for frontend image URLs
    baseUrl = `https://${req.get('host')}`;
  }
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Helper: handle existingImages from FormData (array or CSV)
function getExistingImages(req) {
  if (!req.body.existingImages) return [];
  if (Array.isArray(req.body.existingImages)) return req.body.existingImages;
  if (typeof req.body.existingImages === 'string' && req.body.existingImages.length > 0)
    return req.body.existingImages.split(',');
  return [];
}

// Helper: extract image URLs from multer files
function getImageUrls(files) {
  if (!files || files.length === 0) return [];
  return files.map(file => file.url || `/uploads/${file.filename}`);
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
    const { category, brand, featured, limit, minPrice, maxPrice } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (featured) query.isFeatured = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .limit(parseInt(limit) || 20)
      .sort({ createdAt: -1 });

    const productsWithAbsoluteImages = products.map(prod => ({
      ...prod.toObject(),
      images: Array.isArray(prod.images)
        ? prod.images.map(img => makeImageUrl(req, img))
        : [],
      thumbnail: makeImageUrl(req, prod.thumbnail),
    }));

    res.json({ 
      success: true, 
      count: products.length, 
      products: productsWithAbsoluteImages
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

    const productWithAbsoluteImages = {
      ...product.toObject(),
      images: Array.isArray(product.images)
        ? product.images.map(img => makeImageUrl(req, img))
        : [],
      thumbnail: makeImageUrl(req, product.thumbnail),
    };

    res.json({ 
      success: true, 
      product: productWithAbsoluteImages
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
router.post('/', updatedUpload, (req, res, next) => {
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(file => {
      file.url = `/uploads/${file.filename}`;
      file.localPath = file.path;
    });
  }
  next();
}, async (req, res) => {
  try {
    const { name, price, brand, category } = req.body;
    
    if (!name || !price || !brand || !category) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Name, price, brand, and category are required'
      });
    }

    // Handle images
    const existingImages = getExistingImages(req);
    const newImages = getImageUrls(req.files);
    const images = [...existingImages, ...newImages];

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
      returnPolicyDays: req.body.returnPolicyDays ? Number(req.body.returnPolicyDays) : 30
    };

    // Save product
    const product = new Product(productData);
    const savedProduct = await product.save();

    const responseProduct = {
      ...savedProduct.toObject(),
      images: Array.isArray(savedProduct.images)
        ? savedProduct.images.map(img => makeImageUrl(req, img))
        : [],
      thumbnail: makeImageUrl(req, savedProduct.thumbnail),
    };

    res.status(201).json({
      success: true,
      product: responseProduct
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
router.put('/:id', updatedUpload, (req, res, next) => {
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(file => {
      file.url = `/uploads/${file.filename}`;
      file.localPath = file.path;
    });
  }
  next();
}, async (req, res) => {
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

    // Handle images - combine existing and new
    const existingImages = getExistingImages(req);
    const newImages = getImageUrls(req.files);
    const images = [...existingImages, ...newImages];

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
      returnPolicyDays: typeof req.body.returnPolicyDays !== 'undefined' ? Number(req.body.returnPolicyDays) : existingProduct.returnPolicyDays
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    const responseProduct = {
      ...updatedProduct.toObject(),
      images: Array.isArray(updatedProduct.images)
        ? updatedProduct.images.map(img => makeImageUrl(req, img))
        : [],
      thumbnail: makeImageUrl(req, updatedProduct.thumbnail),
    };

    res.json({
      success: true,
      product: responseProduct
    });
  } catch (err) {
    console.error('Error updating product:', err);
    // Do not send a second response if headers already sent
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