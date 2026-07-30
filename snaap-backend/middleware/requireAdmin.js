const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET; // C3: no public fallback (env is set on Render)

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = requireAdmin;