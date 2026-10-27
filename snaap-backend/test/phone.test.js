const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeKenyanPhone, normalizeMpesaCode } = require('../utils/phone');

test('Kenyan mobile numbers in the forms people type', () => {
  for (const input of ['0712345678', '0712 345 678', '712345678', '254712345678', '+254712345678', '+254 712-345-678', '(0712) 345678']) {
    assert.equal(normalizeKenyanPhone(input), '+254712345678', input);
  }
  assert.equal(normalizeKenyanPhone('0112345678'), '+254112345678'); // 01x numbers
});

test('anything else is rejected', () => {
  for (const input of ['', null, undefined, '12345', '0812345678', '07123456789', '+255712345678', 'abc', { $ne: 1 }]) {
    assert.equal(normalizeKenyanPhone(input), null, String(input));
  }
});

test('M-Pesa codes: uppercased, spaces removed, 8-12 letters/digits', () => {
  assert.equal(normalizeMpesaCode(' sj12ab3cde '), 'SJ12AB3CDE');
  assert.equal(normalizeMpesaCode('SJ12 AB3C DE'), 'SJ12AB3CDE');
  assert.equal(normalizeMpesaCode('SJ12-AB3CDE'), null);
  assert.equal(normalizeMpesaCode('ABC'), null);
  assert.equal(normalizeMpesaCode(''), null);
});
