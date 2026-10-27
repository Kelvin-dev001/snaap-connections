const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCode, customerKeys, couponProblem, describe } = require('../utils/coupons');

test('codes are upper-cased and limited to letters, digits and dashes', () => {
  assert.equal(normalizeCode(' karibu10 '), 'KARIBU10');
  assert.equal(normalizeCode('EID-2026'), 'EID-2026');
  for (const bad of ['', 'ab', 'way-too-long-coupon-code', 'SPACE IN', 'DOLLAR$', null, { $ne: 1 }]) {
    assert.equal(normalizeCode(bad), null, String(bad));
  }
});

test('a customer is every identity the order carries', () => {
  assert.deepEqual(
    customerKeys({ phone: '+254712345678', email: 'A@B.co', userId: 'u1' }),
    ['phone:+254712345678', 'email:a@b.co', 'user:u1']
  );
  assert.deepEqual(customerKeys({ phone: '+254712345678' }), ['phone:+254712345678']);
});

test('a delivery-only coupon does nothing for pickup, so it is refused there', () => {
  assert.match(couponProblem({ appliesTo: 'delivery' }, 'pickup'), /pickup/);
  assert.equal(couponProblem({ appliesTo: 'delivery' }, 'delivery'), null);
  assert.equal(couponProblem({ appliesTo: 'items' }, 'pickup'), null);
  assert.equal(couponProblem({ appliesTo: 'both' }, 'pickup'), null);
});

test('descriptions say exactly what the coupon takes money off', () => {
  assert.equal(describe({ percentOff: 10, appliesTo: 'items' }), '10% off items');
  assert.equal(describe({ percentOff: 100, appliesTo: 'delivery' }), '100% off delivery');
  assert.equal(describe({ percentOff: 5, appliesTo: 'both' }), '5% off items and delivery');
});
