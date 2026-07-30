const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const requireAdmin = require('../middleware/requireAdmin');

// PROTECTED ROUTES: require admin authentication for all routes below
router.use(requireAdmin);

// GET /api/admin/customers (admin only — C1: moved below the auth guard; was public)
router.get('/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // cap page size
    const term = req.query.search ? String(req.query.search).slice(0, 100) : ''; // coerce (H5) + bound (ReDoS)
    const search = term
      ? { $or: [
          { name: new RegExp(term, 'i') },
          { email: new RegExp(term, 'i') }
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

// GET /api/admin/dashboard (protected)
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