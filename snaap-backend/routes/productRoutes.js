const express = require('express');
const router = express.Router();
const { upload, processUpload } = require('../middleware/upload');
const Product = require('../models/Product');
const multer = require('multer');
const updatedUpload = upload.array('images', 10);

// Helper function to generate SKU
const generateSKU = (name, brand) => {
  return `${brand.slice(0, 3).toUpperCase()}-${name.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
};

// Helper for Absolute URLs
function makeImageUrl(req, path) {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
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
  // Support both .url (if set by processUpload), or path fallback
  return files.map(file => file.url || `/uploads/${file.filename}`);
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

    // Map images/thumbnails to absolute URLs
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

    // Map images/thumbnails to absolute URLs for single product
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

// --- PRODUCT CREATE ---
router.post('/', updatedUpload, (req, res, next) => {
  // Attach .url to each file for consistency
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
    
    // Validate required fields
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
      specs: {
        storage: req.body.storage,
        ram: req.body.ram,
        screenSize: req.body.screenSize,
        camera: req.body.camera,
        battery: req.body.battery,
        processor: req.body.processor,
        os: req.body.os,
        material: req.body.material,
        wattage: req.body.wattage,
        connectivity: req.body.connectivity,
        color: req.body.color,
      },
      sku: req.body.sku || generateSKU(name, brand),
      stockQuantity: Number(req.body.stockQuantity) || Number(req.body.stock) || 0,
      inStock: req.body.inStock !== 'false',
      images,
      thumbnail: images[0] || null,
      isFeatured: req.body.isFeatured === 'true' || req.body.isActive === 'true' || false,
      warrantyPeriod: req.body.warrantyPeriod || '1 year'
    };

    // Save product
    const product = new Product(productData);
    const savedProduct = await product.save();

    // Map images to absolute URL for response
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

    // Handle duplicate SKU
    if (err.code === 11000 && err.keyPattern && err.keyPattern.sku) {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_SKU',
        message: 'SKU already exists'
      });
    }

    // Handle validation errors
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

    // Validate required fields
    if (!name || !price || !brand || !category) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Name, price, brand, and category are required'
      });
    }

    // Get existing product
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

    // Build update data
    const updateData = {
      name,
      price: Number(price),
      brand,
      category,
      shortDescription: req.body.shortDescription || existingProduct.shortDescription,
      fullDescription: req.body.fullDescription || existingProduct.fullDescription,
      specs: {
        storage: req.body.storage || existingProduct.specs.storage,
        ram: req.body.ram || existingProduct.specs.ram,
        screenSize: req.body.screenSize || existingProduct.specs.screenSize,
        camera: req.body.camera || existingProduct.specs.camera,
        battery: req.body.battery || existingProduct.specs.battery,
        processor: req.body.processor || existingProduct.specs.processor,
        os: req.body.os || existingProduct.specs.os,
        material: req.body.material || existingProduct.specs.material,
        wattage: req.body.wattage || existingProduct.specs.wattage,
        connectivity: req.body.connectivity || existingProduct.specs.connectivity,
        color: req.body.color || existingProduct.specs.color,
      },
      sku: req.body.sku || existingProduct.sku,
      stockQuantity: Number(req.body.stockQuantity) || Number(req.body.stock) || existingProduct.stockQuantity,
      inStock: typeof req.body.inStock !== 'undefined' ? req.body.inStock !== 'false' : existingProduct.inStock,
      images,
      thumbnail: images[0] || existingProduct.thumbnail,
      isFeatured: req.body.isFeatured === 'true' || req.body.isActive === 'true' || existingProduct.isFeatured,
      warrantyPeriod: req.body.warrantyPeriod || existingProduct.warrantyPeriod
    };

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Map images to absolute URL for response
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
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to update product'
    });
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