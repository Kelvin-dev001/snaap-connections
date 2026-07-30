require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// --- ROUTE IMPORTS ---
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const homepageSectionRoutes = require("./routes/homepageSectionRoutes");

// --- CORS SETUP ---
const allowedOrigins = [
  'http://localhost:3000',
  'https://snaapconnections.co.ke',
  "https://next-frontend-tawny-ten.vercel.app", 
  'https://www.snaapconnections.co.ke'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

// Security headers (H3). CSP belongs on the frontend (this API serves JSON);
// CORP is set cross-origin so the Vercel storefront can consume the API.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// Brute-force protection on admin login only (H2). Deliberately NOT global: many
// Kenyan mobile customers share carrier-NAT IPs, so a global limiter would throttle
// real buyers. (In-memory store — fine for a single Render instance.)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
});
app.use('/api/auth/login', loginLimiter);

// --- API ROUTES ---
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', reviewRoutes);
app.use("/api/homepage-sections", homepageSectionRoutes);

// --- HEALTH CHECK ROUTE ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// (DeepSeek product-bot route removed — H1: it was an unauthenticated LLM proxy on
// our API key. The frontend bot was retired in P0-12. Revoke DEEPSEEK_API_KEY.)

// --- PORT CONFIGURATION ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for testing (optional)
module.exports = app;