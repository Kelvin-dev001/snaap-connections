const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const requireAdmin = require('../middleware/requireAdmin');
const { hashPassword } = require('../utils/accounts');

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Money counts once the shop has checked the payment.
const REVENUE_STATUSES = ['paid', 'dispatched', 'delivered'];
// An order's value: its total — or, while a Nairobi/Machakos delivery fee is
// unconfirmed, its items.
const ORDER_VALUE = {
  $ifNull: ['$totals.total', {
    $subtract: [{ $ifNull: ['$totals.subtotal', 0] }, { $ifNull: ['$totals.itemsDiscount', 0] }],
  }],
};

// A temporary password the admin reads out to the customer. No look-alike
// characters (0/O, 1/l/I) — it's dictated over the phone.
function temporaryPassword(length = 10) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[crypto.randomInt(alphabet.length)];
  return out;
}

// PROTECTED ROUTES: require admin authentication for all routes below
router.use(requireAdmin);

// GET /api/admin/customers (admin only — C1: moved below the auth guard; was public)
router.get('/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // cap page size
    const term = req.query.search ? String(req.query.search).trim().slice(0, 100) : ''; // coerce (H5) + bound
    // Escaped: a search box must not be a regex engine (ReDoS).
    const rx = term ? new RegExp(escapeRegex(term), 'i') : null;
    const search = rx ? { $or: [{ name: rx }, { email: rx }, { phone: rx }] } : {};

    const [customers, count] = await Promise.all([
      User.find({ role: 'customer', ...search })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-password -tokenVersion -wishlist')
        .lean(),
      User.countDocuments({ role: 'customer', ...search })
    ]);

    // P10-4: orders placed through each account, and what they've paid.
    const stats = await Order.aggregate([
      { $match: { user: { $in: customers.map((c) => c._id) } } },
      { $group: {
        _id: '$user',
        ordersCount: { $sum: 1 },
        totalSpent: { $sum: { $cond: [{ $in: ['$status', REVENUE_STATUSES] }, ORDER_VALUE, 0] } },
      } },
    ]);
    const byUser = new Map(stats.map((s) => [String(s._id), s]));
    res.json({
      customers: customers.map((c) => ({
        ...c,
        ordersCount: byUser.get(String(c._id))?.ordersCount || 0,
        totalSpent: byUser.get(String(c._id))?.totalSpent || 0,
      })),
      count,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// PATCH /api/admin/customers/:id { isActive } — block or unblock. Blocking also
// ends every session the customer has open.
router.patch('/customers/:id', async (req, res) => {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(400).json({ message: 'Invalid customer id' });
    if (typeof req.body?.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be true or false' });
    const update = { $set: { isActive: req.body.isActive } };
    if (!req.body.isActive) update.$inc = { tokenVersion: 1 };
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'customer' }, update, { new: true })
      .select('-password -tokenVersion -wishlist');
    if (!user) return res.status(404).json({ message: 'Customer not found' });
    res.json({ customer: user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update customer' });
  }
});

// POST /api/admin/customers/:id/reset-password — the owner's reset flow (no
// email reset). Returns a temporary password ONCE for the admin to give the
// customer; it is stored only as a hash. The customer must choose a new one
// at their next sign-in, and every existing session ends now.
router.post('/customers/:id/reset-password', async (req, res) => {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(400).json({ message: 'Invalid customer id' });
    const temporary = temporaryPassword();
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'customer' },
      { $set: { password: await hashPassword(temporary), mustChangePassword: true }, $inc: { tokenVersion: 1 } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Customer not found' });
    res.json({ temporaryPassword: temporary, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset the password' });
  }
});

// GET /api/admin/dashboard (protected)
// P10-3: reads the online-order fields. Before checkout existed this summed a
// `totalAmount` field and a 'completed' status that no order ever had.
router.get('/dashboard', async (req, res) => {
  try {
    const orderValue = ORDER_VALUE;
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