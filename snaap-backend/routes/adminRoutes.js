const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const requireAdmin = require('../middleware/adminAuth');

// PUBLIC: GET /api/admin/customers (no auth)
router.get('/customers', async (req, res) => {
  try {
    // Pagination and search support if needed
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search
      ? { $or: [
          { name: new RegExp(req.query.search, 'i') },
          { email: new RegExp(req.query.search, 'i') }
        ]}
      : {};

    const [customers, count] = await Promise.all([
      User.find({ role: 'customer', ...search })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-password'),
      User.countDocuments({ role: 'customer', ...search })
    ]);

    res.json({ customers, count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// All routes below this line require admin authentication
router.use(requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // 1. Total Revenue and Orders (from completed orders)
    const completedOrders = await Order.find({ status: 'completed' });
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // 2. Customers
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 3. Sales by month (last 6 months)
    const salesByMonth = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { $substr: ['$createdAt', 0, 7] }, // Format: 'YYYY-MM'
          total: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 6 }
    ]);
    salesByMonth.reverse(); // So it's chronological

    // 4. Product distribution by category (matches your product model)
    const categoryDist = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        totalCustomers,
      },
      sales: salesByMonth.map(item => ({
        month: item._id,
        total: item.total
      })),
      productDistribution: categoryDist
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
});

module.exports = router;