const mongoose = require('mongoose');

// Coupons (P10-5). Owner's rules, 27 Oct 2026: PERCENTAGE OFF only, ONE USE
// PER CUSTOMER, and a coupon may take money off the delivery fee.
//
// Never advertised sitewide: there is no "free delivery" offer on this site
// (CLAUDE.md). A 100%-off-delivery code is a specific promotion the owner hands
// out, not a claim the storefront makes.
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  percentOff: { type: Number, required: true, min: 1, max: 100 },
  appliesTo: { type: String, enum: ['items', 'delivery', 'both'], default: 'items' },
  active: { type: Boolean, default: true },
  note: { type: String, maxlength: 200 }, // staff only, e.g. "Instagram giveaway"
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
