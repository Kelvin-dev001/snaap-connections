const mongoose = require('mongoose');

// One row per (coupon, customer key) — the "one use per customer" rule lives in
// the UNIQUE index below, so two orders placed at the same moment can never
// both redeem: the second insert fails. A customer is keyed by every identity
// the order carries (phone, email, account), so changing one of them is not
// enough to reuse a coupon. Rows are deleted when their order is cancelled.
const couponRedemptionSchema = new mongoose.Schema({
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
  key: { type: String, required: true }, // "phone:+2547…", "email:…", "user:<id>"
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  createdAt: { type: Date, default: Date.now },
});

couponRedemptionSchema.index({ coupon: 1, key: 1 }, { unique: true });
couponRedemptionSchema.index({ order: 1 });

module.exports = mongoose.model('CouponRedemption', couponRedemptionSchema);
