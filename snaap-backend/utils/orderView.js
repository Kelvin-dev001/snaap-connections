// How an order is summarised for people (P10-3, shared with P10-4 accounts).
const BUSINESS = require('../config/business');

// What is owed, part by part. A rejected code counts for nothing; a submitted
// one is "awaiting check" until an admin verifies it.
function paymentSummary(order) {
  const t = order.totals || {};
  const payments = (order.payments || []).filter((p) => p.status !== 'rejected');
  const stateOf = (kind, amount) => {
    if (amount === 0) return 'none';
    const latest = payments.filter((p) => p.kind === kind).pop();
    if (!latest) return 'due';
    return latest.status === 'verified' ? 'verified' : 'submitted';
  };
  const itemsTotal = (t.subtotal || 0) - (t.itemsDiscount || 0);
  if (order.paymentPlan === 'split') {
    const deliveryTotal = t.deliveryFee == null ? null : t.deliveryFee - (t.deliveryDiscount || 0);
    return {
      items: { amount: itemsTotal, state: stateOf('items', itemsTotal) },
      delivery: deliveryTotal == null
        ? { amount: null, state: 'awaiting-fee' }
        : { amount: deliveryTotal, state: stateOf('delivery', deliveryTotal) },
    };
  }
  return { full: { amount: t.total, state: stateOf('full', t.total) } };
}

const allPaid = (summary) =>
  Object.values(summary).every((part) => part.state === 'verified' || part.state === 'none');

const maskCode = (code) => (code ? `${'•'.repeat(Math.max(code.length - 4, 0))}${code.slice(-4)}` : '');

// The customer's view: no street address, notes or admin notes, and only the
// tail of each M-Pesa code. Shown to anyone holding the order number + phone,
// and to the signed-in owner of the order.
function publicOrder(order) {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    items: (order.items || []).map((i) => ({
      product: i.product, name: i.name, image: i.image,
      unitPrice: i.unitPrice, quantity: i.quantity, lineTotal: i.lineTotal,
    })),
    fulfilment: {
      method: order.fulfilment?.method,
      county: order.fulfilment?.county || null,
      town: order.fulfilment?.town || null,
    },
    coupon: order.coupon?.code ? { code: order.coupon.code, percentOff: order.coupon.percentOff } : null,
    totals: order.totals,
    deliveryStatus: order.deliveryStatus,
    paymentPlan: order.paymentPlan,
    payment: paymentSummary(order),
    payments: (order.payments || []).map((p) => ({
      kind: p.kind, status: p.status, submittedAt: p.submittedAt, code: maskCode(p.mpesaCode),
    })),
    till: BUSINESS.MPESA_TILL,
  };
}

module.exports = { paymentSummary, allPaid, maskCode, publicOrder };
