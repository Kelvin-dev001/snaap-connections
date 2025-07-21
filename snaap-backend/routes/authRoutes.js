const express = require('express');
const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'secure123';

// Admin Login
router.post('/login', (req, res) => {
  const { password } = req.body;
  console.log('Received password:', JSON.stringify(password));
  console.log('ADMIN_PASSWORD:', JSON.stringify(ADMIN_PASSWORD));
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  req.session.isAdmin = true;
  // Ensure session is saved and 'Set-Cookie' is sent before sending response
  req.session.save(() => {
    res.json({ success: true });
  });
});

// Admin Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Check login status (optional, for frontend)
router.get('/check', (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

module.exports = router;