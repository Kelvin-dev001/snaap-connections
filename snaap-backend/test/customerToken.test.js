const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'unit-test-secret';
const { verifyCustomerToken } = require('../utils/customerToken');

// Reach the signer the way the routes do, via a fake response.
function issueCustomerToken(user) {
  const { setCustomerCookie } = require('../utils/customerToken');
  let value = null;
  setCustomerCookie({ cookie: (name, v) => { value = v; } }, user);
  return value;
}

test('a customer token verifies as a customer token', () => {
  const token = issueCustomerToken({ _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', tokenVersion: 3 });
  const payload = verifyCustomerToken(token);
  assert.equal(payload.sub, 'aaaaaaaaaaaaaaaaaaaaaaaa');
  assert.equal(payload.typ, 'customer');
  assert.equal(payload.v, 3);
});

test('an ADMIN token never verifies as a customer token', () => {
  const admin = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '2h' });
  assert.equal(verifyCustomerToken(admin), null);
  // Even an admin-key token dressed up as a customer one is refused.
  const forged = jwt.sign({ sub: 'aaaaaaaaaaaaaaaaaaaaaaaa', typ: 'customer' }, process.env.JWT_SECRET);
  assert.equal(verifyCustomerToken(forged), null);
});

test('a CUSTOMER token never passes the admin check (requireAdmin verifies with JWT_SECRET)', () => {
  const token = issueCustomerToken({ _id: 'aaaaaaaaaaaaaaaaaaaaaaaa' });
  assert.throws(() => jwt.verify(token, process.env.JWT_SECRET));
});

test('garbage and missing tokens are null', () => {
  assert.equal(verifyCustomerToken(null), null);
  assert.equal(verifyCustomerToken('not.a.jwt'), null);
});
