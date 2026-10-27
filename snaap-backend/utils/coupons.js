// Coupon rules (P10-5): percentage off, one use per customer, may reduce the
// delivery fee (owner, 27 Oct 2026).
const Coupon = require('../models/Coupon');
const CouponRedemption = require('../models/CouponRedemption');

// "save10 " -> "SAVE10". Letters, digits and dashes, 3–20 long.
function normalizeCode(input) {
  if (typeof input !== 'string') return null;
  const code = input.trim().toUpperCase();
  return /^[A-Z0-9-]{3,20}$/.test(code) ? code : null;
}

// Every identity an order carries. A coupon used by any of them is used.
function customerKeys({ phone, email, userId }) {
  return [
    phone ? `phone:${phone}` : null,
    email ? `email:${String(email).toLowerCase()}` : null,
    userId ? `user:${userId}` : null,
  ].filter(Boolean);
}

const findActiveCoupon = (code) => (code ? Coupon.findOne({ code, active: true }) : null);

async function alreadyUsed(coupon, keys) {
  if (!keys.length) return false;
  return Boolean(await CouponRedemption.exists({ coupon: coupon._id, key: { $in: keys } }));
}

// Why this coupon can't be used for this order, or null.
function couponProblem(coupon, fulfilmentMethod) {
  if (coupon.appliesTo === 'delivery' && fulfilmentMethod === 'pickup') {
    return 'This coupon takes money off delivery, and pickup from the shop has no delivery fee.';
  }
  return null;
}

// Claim the coupon for an order. Throws { code: 'COUPON_USED' } if any key
// was claimed first — including by an order placed in the same instant.
async function redeem(coupon, keys, orderId) {
  try {
    await CouponRedemption.insertMany(keys.map((key) => ({ coupon: coupon._id, key, order: orderId })), { ordered: true });
  } catch (err) {
    // insertMany stops at the first duplicate; drop anything it did write.
    await CouponRedemption.deleteMany({ order: orderId }).catch(() => {});
    if (err && (err.code === 11000 || err.writeErrors?.some?.((e) => e.code === 11000))) {
      const used = new Error('COUPON_USED');
      used.code = 'COUPON_USED';
      throw used;
    }
    throw err;
  }
}

// A cancelled order gives its coupon back.
const release = (orderId) => CouponRedemption.deleteMany({ order: orderId });

const snapshot = (coupon) => ({ code: coupon.code, percentOff: coupon.percentOff, appliesTo: coupon.appliesTo });

const describe = (c) =>
  `${c.percentOff}% off ${c.appliesTo === 'both' ? 'items and delivery' : c.appliesTo === 'delivery' ? 'delivery' : 'items'}`;

const USED_MESSAGE = "You've already used this coupon. It can be used once per customer.";
const INVALID_MESSAGE = "That coupon code isn't valid, or it has ended.";

module.exports = {
  normalizeCode, customerKeys, findActiveCoupon, alreadyUsed, couponProblem, redeem, release, snapshot, describe,
  USED_MESSAGE, INVALID_MESSAGE,
};
