const Product = require('../models/Product');

// Get all products (with filtering)
exports.getAllProducts = async (req, res) => {
  try {
    const { brand, category, minPrice, maxPrice, sort } = req.query;
    const query = {};

    // Apply filters
    if (brand) query.brand = brand;
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Apply sorting
    let sortOption = {};
    if (sort === 'price_asc') sortOption.price = 1;
    if (sort === 'price_desc') sortOption.price = -1;

    const products = await Product.find(query).sort(sortOption);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all unique brands (for frontend dropdown)
exports.getBrands = async (req, res) => {
  try {
    const brands = await Product.distinct('brand');
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};