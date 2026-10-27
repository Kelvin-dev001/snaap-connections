// Order pricing (P10-3). Pure functions — no database, no request objects — so
// the money rules are unit-tested (test/pricing.test.js) and the quote the
// customer sees and the order they place are computed by the same code.
//
// The browser sends product ids and quantities only. Prices always come from the
// product documents passed in here.

const { DELIVERY_ZONES, MAX_QTY_PER_LINE, MAX_LINES } = require('../config/business');

const OBJECT_ID = /^[a-f0-9]{24}$/i;

// The same rule the storefront uses to DISPLAY a price (ProductCard, the product
// page): what the customer saw is what they are charged.
const unitPriceOf = (product) => product.discountPrice || product.price;

// KSh has no cents on this site. Discounts round to the nearest shilling.
const percentOf = (amount, percent) => Math.round((amount * percent) / 100);

function zoneForCounty(county) {
  const wanted = String(county || '').trim().toLowerCase();
  for (const zone of DELIVERY_ZONES) {
    const match = zone.counties.find((c) => c.toLowerCase() === wanted);
    if (match) return { zone, county: match };
  }
  return null;
}

// fulfilment: { method: 'delivery' | 'pickup', county? }
//   pickup         -> no fee (nothing is delivered)
//   coast county   -> fixed fee
//   Nairobi/Mach.  -> fee null: "to be confirmed" by the shop after a call
function deliveryFor(fulfilment) {
  if (!fulfilment || !['delivery', 'pickup'].includes(fulfilment.method)) {
    return { error: 'Choose delivery or pickup from our shop.' };
  }
  if (fulfilment.method === 'pickup') {
    return { method: 'pickup', county: null, zoneId: null, fee: 0, status: 'none' };
  }
  const found = zoneForCounty(fulfilment.county);
  if (!found) {
    const all = DELIVERY_ZONES.flatMap((z) => z.counties).join(', ');
    return { error: `We deliver to ${all} only. You can also pick up from our shop in Mombasa.` };
  }
  const { zone, county } = found;
  return zone.feeKES == null
    ? { method: 'delivery', county, zoneId: zone.id, fee: null, status: 'tbc' }
    : { method: 'delivery', county, zoneId: zone.id, fee: zone.feeKES, status: 'fixed' };
}

const couponApplies = (coupon, part) =>
  Boolean(coupon) && (coupon.appliesTo === 'both' || coupon.appliesTo === part);

// Totals from a subtotal, a delivery fee (null = to be confirmed) and an
// optional coupon { percentOff, appliesTo: 'items' | 'delivery' | 'both' }.
// Also used when an admin confirms a TBC fee, so the arithmetic lives once.
function computeTotals(subtotal, deliveryFee, coupon = null) {
  const itemsDiscount = couponApplies(coupon, 'items') ? percentOf(subtotal, coupon.percentOff) : 0;
  const deliveryDiscount =
    deliveryFee != null && couponApplies(coupon, 'delivery') ? percentOf(deliveryFee, coupon.percentOff) : 0;
  const itemsTotal = subtotal - itemsDiscount;
  const deliveryTotal = deliveryFee == null ? null : deliveryFee - deliveryDiscount;
  return {
    subtotal,
    itemsDiscount,
    deliveryFee,
    deliveryDiscount,
    itemsTotal,
    deliveryTotal,
    total: deliveryTotal == null ? null : itemsTotal + deliveryTotal,
  };
}

// items:        [{ productId, quantity }] exactly as the browser sent them
// productsById: Map(id -> product document)
// fulfilment:   optional — the cart page prices items before delivery is chosen
// coupon:       optional (P10-5)
function priceOrder({ items, productsById, fulfilment, coupon = null }) {
  if (!Array.isArray(items) || items.length === 0) {
    return { errors: ['Your cart is empty.'], lines: [], lineErrors: [] };
  }
  if (items.length > MAX_LINES) {
    return { errors: [`An order can hold up to ${MAX_LINES} different products.`], lines: [], lineErrors: [] };
  }

  const errors = [];
  // The same product twice becomes one line.
  const qtyById = new Map();
  for (const item of items) {
    const id = String(item?.productId ?? '');
    const quantity = Number(item?.quantity);
    if (!OBJECT_ID.test(id)) {
      errors.push('Something in your cart is not a valid product. Please remove it and try again.');
      continue;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      errors.push('Quantities must be whole numbers of at least 1.');
      continue;
    }
    qtyById.set(id, (qtyById.get(id) || 0) + quantity);
  }

  const lines = [];
  const lineErrors = [];
  for (const [id, quantity] of qtyById) {
    const product = productsById.get(id);
    if (!product || product.isDeleted) {
      lineErrors.push({ productId: id, message: 'This product is no longer available.' });
      continue;
    }
    if (product.inStock === false) {
      lineErrors.push({ productId: id, message: `${product.name} is out of stock.` });
      continue;
    }
    if (quantity > MAX_QTY_PER_LINE) {
      lineErrors.push({ productId: id, message: `You can order up to ${MAX_QTY_PER_LINE} of ${product.name}.` });
      continue;
    }
    const unitPrice = unitPriceOf(product);
    if (!(typeof unitPrice === 'number' && Number.isFinite(unitPrice) && unitPrice > 0)) {
      lineErrors.push({ productId: id, message: `${product.name} can't be ordered online right now. Please contact us.` });
      continue;
    }
    lines.push({
      product: id,
      name: product.name,
      sku: product.sku || '',
      image: product.thumbnail || (Array.isArray(product.images) ? product.images[0] : '') || '',
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
    });
  }

  let delivery = null;
  if (fulfilment) {
    delivery = deliveryFor(fulfilment);
    if (delivery.error) errors.push(delivery.error);
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const deliveryFee = delivery && !delivery.error ? delivery.fee : null;
  const totals = computeTotals(subtotal, deliveryFee, coupon);

  // "split": Nairobi/Machakos — the items are paid now and the delivery fee
  // after the shop confirms it. "single": one payment for the whole total.
  const paymentPlan = delivery && delivery.status === 'tbc' ? 'split' : 'single';
  const dueNow = paymentPlan === 'split' ? totals.itemsTotal : totals.total;

  return { errors, lineErrors, lines, delivery, totals, paymentPlan, dueNow };
}

module.exports = { unitPriceOf, percentOf, deliveryFor, computeTotals, priceOrder, zoneForCounty };
