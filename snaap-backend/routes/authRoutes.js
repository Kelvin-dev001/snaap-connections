const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { COOKIE_NAME, getTokenFromReq, cookieOptions } = require('../utils/adminToken');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // C3: no public fallback
const JWT_SECRET = process.env.JWT_SECRET;         // C3: no public fallback
const JWT_EXPIRES_IN = '2h';

// Admin Login — sets an httpOnly cookie (P6-D). The token is NOT returned in the
// body, so page JavaScript never sees it.
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) { // fail closed if misconfigured
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  const token = jwt.sign({ isAdmin: true }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ success: true });
});

// Admin Logout — clears the cookie (attributes must match the ones it was set with).
router.post('/logout', (req, res) => {
  const { maxAge, ...clearOpts } = cookieOptions();
  res.clearCookie(COOKIE_NAME, clearOpts);
  res.json({ success: true });
});

// Check login status from the cookie (or Bearer fallback).
router.get('/check', (req, res) => {
  const token = getTokenFromReq(req);
  if (!token) return res.json({ isAdmin: false });
  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ isAdmin: true });
  } catch (err) {
    res.json({ isAdmin: false });
  }
});

module.exports = router;
