// Run: npm test   (node --test, built into Node — no test dependency)
const test = require('node:test');
const assert = require('node:assert/strict');
const { priceOrder, computeTotals, deliveryFor, unitPriceOf } = require('../utils/pricing');

const A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const C = 'cccccccccccccccccccccccc';
const products = new Map([
  [A, { _id: A, name: 'Phone A', price: 12999, inStock: true }],
  [B, { _id: B, name: 'Phone B', price: 8999, discountPrice: 8499, inStock: true }],
  [C, { _id: C, name: 'Sold out', price: 5000, inStock: false }],
]);

test('charges the price the storefront displays (discountPrice || price)', () => {
  assert.equal(unitPriceOf(products.get(A)), 12999);
  assert.equal(unitPriceOf(products.get(B)), 8499);
});

test('coast delivery is a fixed KSh 300, paid in one payment', () => {
  const r = priceOrder({
    items: [{ productId: A, quantity: 1 }, { productId: B, quantity: 2 }],
    productsById: products,
    fulfilment: { method: 'delivery', county: 'mombasa' },
  });
  assert.deepEqual(r.errors, []);
  assert.equal(r.totals.subtotal, 12999 + 2 * 8499);
  assert.equal(r.totals.deliveryFee, 300);
  assert.equal(r.totals.total, 12999 + 2 * 8499 + 300);
  assert.equal(r.paymentPlan, 'single');
  assert.equal(r.dueNow, r.totals.total);
  assert.equal(r.delivery.county, 'Mombasa'); // canonical spelling
});

test('Nairobi/Machakos: fee to be confirmed, items paid now (split)', () => {
  const r = priceOrder({
    items: [{ productId: A, quantity: 1 }],
    productsById: products,
    fulfilment: { method: 'delivery', county: 'Nairobi' },
  });
  assert.equal(r.delivery.status, 'tbc');
  assert.equal(r.totals.deliveryFee, null);
  assert.equal(r.totals.total, null);
  assert.equal(r.paymentPlan, 'split');
  assert.equal(r.dueNow, 12999);
});

test('pickup has no delivery fee and is a single payment', () => {
  const r = priceOrder({ items: [{ productId: A, quantity: 1 }], productsById: products, fulfilment: { method: 'pickup' } });
  assert.equal(r.totals.deliveryFee, 0);
  assert.equal(r.totals.total, 12999);
  assert.equal(r.paymentPlan, 'single');
});

test('a sixth county is refused — there is no sixth county', () => {
  const r = priceOrder({ items: [{ productId: A, quantity: 1 }], productsById: products, fulfilment: { method: 'delivery', county: 'Kisumu' } });
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /Mombasa, Kilifi, Kwale, Nairobi, Machakos/);
});

test('missing, retired and out-of-stock products are line errors, never priced', () => {
  const retired = 'dddddddddddddddddddddddd';
  const r = priceOrder({
    items: [{ productId: C, quantity: 1 }, { productId: retired, quantity: 1 }, { productId: A, quantity: 1 }],
    productsById: new Map([...products, [retired, { _id: retired, name: 'Old', price: 100, isDeleted: true, inStock: true }]]),
  });
  assert.equal(r.lines.length, 1);
  assert.equal(r.lineErrors.length, 2);
  assert.match(r.lineErrors.find((e) => e.productId === C).message, /out of stock/);
});

test('quantities: whole numbers, max 10 per product, duplicates merged', () => {
  const merged = priceOrder({ items: [{ productId: A, quantity: 4 }, { productId: A, quantity: 3 }], productsById: products });
  assert.equal(merged.lines.length, 1);
  assert.equal(merged.lines[0].quantity, 7);

  const tooMany = priceOrder({ items: [{ productId: A, quantity: 11 }], productsById: products });
  assert.equal(tooMany.lines.length, 0);
  assert.match(tooMany.lineErrors[0].message, /up to 10/);

  for (const quantity of [0, -1, 1.5, '2abc', null]) {
    const r = priceOrder({ items: [{ productId: A, quantity }], productsById: products });
    assert.equal(r.lines.length, 0, `quantity ${quantity} must be rejected`);
  }
});

test('ids that are not ObjectIds never reach pricing', () => {
  const r = priceOrder({ items: [{ productId: { $ne: null }, quantity: 1 }], productsById: products });
  assert.equal(r.lines.length, 0);
  assert.equal(r.errors.length, 1);
});

test('an empty or oversized cart is refused', () => {
  assert.equal(priceOrder({ items: [], productsById: products }).errors.length, 1);
  const lots = Array.from({ length: 21 }, () => ({ productId: A, quantity: 1 }));
  assert.match(priceOrder({ items: lots, productsById: products }).errors[0], /up to 20/);
});

test('no fulfilment yet (cart page): subtotal only, no total', () => {
  const r = priceOrder({ items: [{ productId: A, quantity: 2 }], productsById: products });
  assert.equal(r.totals.subtotal, 25998);
  assert.equal(r.totals.total, null);
  assert.equal(r.delivery, null);
});

test('percentage coupons: items, delivery or both; whole shillings', () => {
  const items = [{ productId: A, quantity: 1 }];
  const coast = { method: 'delivery', county: 'Kilifi' };

  const onItems = priceOrder({ items, productsById: products, fulfilment: coast, coupon: { percentOff: 10, appliesTo: 'items' } });
  assert.equal(onItems.totals.itemsDiscount, 1300); // 1299.9 rounds to 1300
  assert.equal(onItems.totals.deliveryDiscount, 0);
  assert.equal(onItems.totals.total, 12999 - 1300 + 300);

  const onDelivery = priceOrder({ items, productsById: products, fulfilment: coast, coupon: { percentOff: 100, appliesTo: 'delivery' } });
  assert.equal(onDelivery.totals.deliveryDiscount, 300);
  assert.equal(onDelivery.totals.total, 12999);

  // The DISCOUNT is what rounds (6499.5 -> 6500), so the receipt always adds
  // up: 12,999 - 6,500 + (300 - 150) = 6,649.
  const both = priceOrder({ items, productsById: products, fulfilment: coast, coupon: { percentOff: 50, appliesTo: 'both' } });
  assert.equal(both.totals.itemsDiscount, 6500);
  assert.equal(both.totals.total, 12999 - 6500 + (300 - 150));
});

test('confirming a TBC fee later applies the coupon to it then', () => {
  const tbc = computeTotals(10000, null, { percentOff: 20, appliesTo: 'both' });
  assert.equal(tbc.total, null);
  assert.equal(tbc.itemsTotal, 8000);
  const confirmed = computeTotals(10000, 1000, { percentOff: 20, appliesTo: 'both' });
  assert.equal(confirmed.deliveryDiscount, 200);
  assert.equal(confirmed.total, 8800);
});

test('deliveryFor refuses an unknown method', () => {
  assert.ok(deliveryFor({ method: 'drone' }).error);
  assert.ok(deliveryFor(null).error);
});
