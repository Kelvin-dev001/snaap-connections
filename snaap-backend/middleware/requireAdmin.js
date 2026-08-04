const jwt = require('jsonwebtoken');
const { getTokenFromReq } = require('../utils/adminToken');

const JWT_SECRET = process.env.JWT_SECRET; // C3: no public fallback (env is set on Render)

// P6-D: authorize from the httpOnly admin cookie (or a Bearer header fallback).
function requireAdmin(req, res, next) {
  const token = getTokenFromReq(req);
  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.isAdmin) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = requireAdmin;
