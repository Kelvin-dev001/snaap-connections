const mongoose = require('mongoose');

// P10-3: orders are placed on the site and handled in the admin portal.
//
// Older documents have only `products`, `phone` and `status` (the WhatsApp era,
// when nothing on the storefront ever created one). They still load: every new
// field is optional at the schema level, and the admin shows them as legacy.

const ORDER_STATUSES = ['pending', 'confirmed', 'paid', 'dispatched', 'delivered', 'cancelled'];

// A snapshot of the product as it was sold. Later price or name changes in the
// catalogue never rewrite what a customer ordered.
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  sku: String,
  image: String,
  unitPrice: Number,
  quantity: Number,
  lineTotal: Number,
}, { _id: false });

// One M-Pesa code the customer (or the shop, on their behalf) has given us.
// A code is a claim until an admin finds it on the Till statement.
const paymentSchema = new mongoose.Schema({
  kind: { type: String, enum: ['full', 'items', 'delivery'] },
  mpesaCode: String,
  submittedAt: { type: Date, default: Date.now },
  submittedBy: { type: String, enum: ['customer', 'admin'] },
  status: { type: String, enum: ['submitted', 'verified', 'rejected'], default: 'submitted' },
  reviewedAt: Date,
  // Another order already carries this code — shown to the admin, not blocked.
  possibleDuplicate: { type: Boolean, default: false },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  customer: {
    name: String,
    phone: String, // +254… (utils/phone.js)
    email: String,
  },

  items: [orderItemSchema],

  fulfilment: {
    method: { type: String, enum: ['delivery', 'pickup'] },
    county: String,
    town: String,
    address: String,
    notes: String,
  },

  // P10-5. Copied onto the order so a later change to the coupon never
  // changes what this customer was charged.
  coupon: {
    code: String,
    percentOff: Number,
    appliesTo: { type: String, enum: ['items', 'delivery', 'both'] },
  },

  totals: {
    subtotal: Number,
    itemsDiscount: Number,
    deliveryFee: Number,      // null until confirmed for Nairobi/Machakos
    deliveryDiscount: Number,
    total: Number,            // null until the delivery fee is known
  },
  // none = pickup; fixed = coast rate; tbc = waiting for the shop; confirmed = set by admin
  deliveryStatus: { type: String, enum: ['none', 'fixed', 'tbc', 'confirmed'] },
  // single = one payment for the total; split = items now, delivery later
  paymentPlan: { type: String, enum: ['single', 'split'] },
  payments: [paymentSchema],

  status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
  statusHistory: [{
    status: String,
    at: { type: Date, default: Date.now },
    note: String,
    _id: false,
  }],
  adminNotes: String,

  // Legacy (pre-P10) shape — kept so old documents still validate on save.
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
  }],
  phone: String,
}, { timestamps: true });

// Sparse: legacy documents have no number, and a plain unique index would
// treat all of their missing values as one duplicate.
orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ 'payments.mpesaCode': 1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
Order.ORDER_STATUSES = ORDER_STATUSES;

module.exports = Order;
