const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Helper function for pagination, sorting, and population
const applyPaginationAndSorting = async (query, req) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Pagination setup
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Sorting setup
    let sort = {};
    if (req.query.sort) {
      const sortFields = req.query.sort.split(',');
      sortFields.forEach(field => {
        const sortOrder = field.startsWith('-') ? -1 : 1;
        const sortKey = field.replace(/^-/, '');
        sort[sortKey] = sortOrder;
      });
    } else {
      sort = { createdAt: -1 }; // Default: newest first
    }

    // Get the total count and orders
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate({
        path: 'products.product',
        select: 'name price category imageUrl'
      })
      .sort(sort)
      .skip(startIndex)
      .limit(limit)
      .lean();

    // Pagination result
    const pagination = {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      limit
    };

    if (startIndex + limit < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    return {
      success: true,
      count: orders.length,
      pagination,
      data: orders
    };
  } catch (err) {
    throw new Error(`Error in pagination and sorting: ${err.message}`);
  }
};

// GET all orders with pagination, sorting, and product population
router.get('/', async (req, res, next) => {
  try {
    const result = await applyPaginationAndSorting({}, req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Enhanced order validation function
const validateOrder = (req) => {
  const errors = [];
  const { products, phone } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    errors.push('Products must be a non-empty array');
  }

  if (!phone) {
    errors.push('Phone number is required');
  } else if (!/^\+254\d{9}$/.test(phone)) {
    errors.push('Phone number must be in +254XXXXXXXXX format');
  }

  return errors;
};

// POST: Submit a new order
router.post('/', async (req, res, next) => {
  try {
    // Validate the order
    const validationErrors = validateOrder(req);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        messages: validationErrors
      });
    }

    // Create the order
    const order = new Order({
      products: req.body.products,
      phone: req.body.phone,
      status: 'pending',
      createdAt: new Date()
    });

    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      message: 'Order submitted successfully',
      orderId: savedOrder._id,
      whatsappLink: `https://wa.me/${req.body.phone}?text=Order%20confirmed:%20${savedOrder._id}`
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: err.errors
      });
    }
    next(err);
  }
});

// DELETE: Remove an order by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});

// GET: Retrieve a single order by ID
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate({
      path: 'products.product',
      select: 'name price category imageUrl'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
});

// PATCH: Update the status of an order
router.patch('/:id', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Order status is required'
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
