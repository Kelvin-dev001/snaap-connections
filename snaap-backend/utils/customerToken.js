// Customer session token (P10-4). Same transport as the admin token
// (utils/adminToken.js: httpOnly, SameSite=Lax, Secure, COOKIE_DOMAIN in
// production) but a different cookie AND a different signing key:
//
// The key is derived from JWT_SECRET with HMAC, so no new env var is needed,
// yet an admin token can never verify as a customer token or the other way
// round — and requireAdmin, which reads only `admin_token`, never even sees
// this cookie.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'customer_token';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function signingKey() {
  const base = process.env.JWT_SECRET;
  if (!base) return null; // fail closed: no secret, no customer sessions
  return crypto.createHmac('sha256', base).update('snaap-customer-session-v1').digest('hex');
}

function signCustomerToken(user) {
  const key = signingKey();
  if (!key) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ sub: String(user._id), typ: 'customer', v: user.tokenVersion || 0 }, key, { expiresIn: '30d' });
}

// Payload, or null for anything missing, expired, forged or not a customer token.
function verifyCustomerToken(token) {
  const key = signingKey();
  if (!token || !key) return null;
  try {
    const payload = jwt.verify(token, key);
    return payload && payload.typ === 'customer' && payload.sub ? payload : null;
  } catch {
    return null;
  }
}

function getCustomerTokenFromReq(req) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function customerCookieOptions() {
  const domain = process.env.COOKIE_DOMAIN || undefined;
  const isProd = Boolean(domain) || process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: MAX_AGE_MS,
    ...(domain ? { domain } : {}),
  };
}

function setCustomerCookie(res, user) {
  res.cookie(COOKIE_NAME, signCustomerToken(user), customerCookieOptions());
}

function clearCustomerCookie(res) {
  const { maxAge, ...opts } = customerCookieOptions();
  res.clearCookie(COOKIE_NAME, opts);
}

module.exports = {
  COOKIE_NAME,
  verifyCustomerToken,
  getCustomerTokenFromReq,
  setCustomerCookie,
  clearCustomerCookie,
};
