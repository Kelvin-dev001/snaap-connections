const User = require('../models/User');
const { getCustomerTokenFromReq, verifyCustomerToken } = require('../utils/customerToken');

// The signed-in customer for this request, or null. A token is only honoured
// while its version matches the account (a password change, admin reset or
// block bumps the version and so ends every session) and the account is active.
async function loadCustomer(req) {
  const payload = verifyCustomerToken(getCustomerTokenFromReq(req));
  if (!payload || !/^[a-f0-9]{24}$/i.test(payload.sub)) return null;
  const user = await User.findById(payload.sub).select('-password');
  if (!user || !user.isActive || user.role !== 'customer') return null;
  if ((user.tokenVersion || 0) !== (payload.v || 0)) return null;
  return user;
}

// 401 unless signed in. Sets req.customer.
async function requireCustomer(req, res, next) {
  try {
    const user = await loadCustomer(req);
    if (!user) return res.status(401).json({ message: 'Please sign in.' });
    req.customer = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Never blocks: sets req.customer when a valid session is present (checkout
// links the order to the account), otherwise carries on as a guest.
async function attachCustomer(req, res, next) {
  try {
    req.customer = await loadCustomer(req);
  } catch {
    req.customer = null;
  }
  next();
}

module.exports = { requireCustomer, attachCustomer, loadCustomer };
