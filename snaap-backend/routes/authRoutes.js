const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'secure123';
const JWT_SECRET = process.env.JWT_SECRET || 'superjwtsecret';
const JWT_EXPIRES_IN = '2h'; // Adjust as needed

// Admin Login
router.post('/login', (req, res) => {
  const { password } = req.body;
  console.log('Received password:', JSON.stringify(password));
  console.log('ADMIN_PASSWORD:', JSON.stringify(ADMIN_PASSWORD));
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  // Create JWT
  const token = jwt.sign({ isAdmin: true }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({ success: true, token });
});

// Admin Logout (client will just delete token)
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

// Check login status (frontend sends token in Authorization header)
router.get('/check', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.json({ isAdmin: false });
  }
  const token = auth.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ isAdmin: true });
  } catch (err) {
    res.json({ isAdmin: false });
  }
});

module.exports = router;