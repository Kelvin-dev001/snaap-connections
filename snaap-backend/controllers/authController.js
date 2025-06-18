const User = require('../models/User');
const ADMIN_PASSWORD = 'secure123'; // Your admin password

// Admin Login (Simplified without JWT)
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Verify admin credentials
    if (username !== 'admin' || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // 2. Return success response with the plain password
    // (This will be stored in localStorage on the frontend)
    res.json({ 
      success: true,
      message: 'Admin login successful',
      admin_password: ADMIN_PASSWORD // Send the password back to store in localStorage
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Middleware to check admin password
exports.requireAdmin = (req, res, next) => {
  try {
    // 1. Get password from headers
    const adminPassword = req.headers['admin-password'];
    
    // 2. Verify password matches
    if (adminPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Missing or invalid admin password' });
    }
    
    // 3. Proceed if valid
    next();
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};