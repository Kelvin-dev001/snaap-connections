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
// P10-3: reads the online-order fields. Before checkout existed this summed a
// `totalAmount` field and a 'completed' status that no order ever had.
router.get('/dashboard', async (req, res) => {
  try {
    // Money counts once the shop has checked the payment.
    const REVENUE_STATUSES = ['paid', 'dispatched', 'delivered'];
    // An order's value: its total — or, while a Nairobi/Machakos delivery fee
    // is unconfirmed, its items.
    const orderValue = {
      $ifNull: ['$totals.total', {
        $subtract: [{ $ifNull: ['$totals.subtotal', 0] }, { $ifNull: ['$totals.itemsDiscount', 0] }],
      }],
    };
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [totalOrders, pendingOrders, paymentsToCheck, totalDelivered, totalCustomers, revenue, salesByMonth, categoryDist, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: { $ne: 'cancelled' }, 'payments.status': 'submitted' }),
      Order.countDocuments({ status: 'delivered' }),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: { status: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, total: { $sum: orderValue } } },
      ]),
      Order.aggregate([
        { $match: { status: { $in: REVENUE_STATUSES }, createdAt: { $gte: sixMonthsAgo } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Africa/Nairobi' } },
          total: { $sum: orderValue },
        } },
        { $sort: { _id: 1 } },
      ]),
      Product.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber customer.name status totals deliveryStatus createdAt')
        .lean(),
    ]);

    res.json({
      success: true,
      stats: {
        totalRevenue: revenue[0]?.total || 0,
        totalOrders,
        pendingOrders,
        paymentsToCheck,
        totalDelivered,
        totalCustomers,
      },
      sales: salesByMonth.map((item) => ({ month: item._id, total: item.total })),
      productDistribution: categoryDist,
      recentOrders,
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