// The business facts the API needs to PRICE an order (P10-3).
//
// next-frontend/src/constants/business.js is the source of truth for every fact
// a customer reads. This file mirrors only what the server must know to compute
// totals it can trust — a total sent by the browser can't be trusted. The
// storefront's daily live check (scripts/ci/check-live-data.js) compares
// GET /api/orders/config against its own constants and fails on any drift, so
// the two cannot quietly disagree.
//
// Confirmed by the owner:
// - delivery matrix: 27 Jul 2026 (five counties, no free-delivery threshold)
// - M-Pesa Buy Goods Till 9478805 as the only payment method: 27 Oct 2026
// - Nairobi/Machakos fee is "to be confirmed" per order, paid separately
//   after the call (items now, delivery later): 27 Oct 2026

module.exports = Object.freeze({
  MPESA_TILL: '9478805',

  // Shop pickup has no delivery fee. It is not "free delivery" — nothing is
  // delivered — and must never be presented as a delivery offer.
  PICKUP_LOCATION: 'Digo Rd, Opp Baroda Mall, Mombasa',

  DELIVERY_ZONES: Object.freeze([
    Object.freeze({ id: 'coast', counties: ['Mombasa', 'Kilifi', 'Kwale'], feeKES: 300, time: 'Same day' }),
    // feeKES null = to be confirmed: the order goes in without a delivery fee
    // and an admin sets it after calling the customer.
    Object.freeze({ id: 'upcountry', counties: ['Nairobi', 'Machakos'], feeKES: null, feeMinKES: 500, feeMaxKES: 1500, time: 'Within 24 hours' }),
  ]),

  MAX_QTY_PER_LINE: 10,
  MAX_LINES: 20,
});
