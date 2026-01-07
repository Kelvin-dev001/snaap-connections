require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const OpenAI = require("openai");

// --- ROUTE IMPORTS ---
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// --- API ROUTES ---
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', reviewRoutes);

// --- HEALTH CHECK ROUTE ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// --- DEEPSEEK PRODUCT ADVISOR BOT ROUTE ---
// Replace OpenAI with DeepSeek using OpenAI SDK but set baseURL and use DeepSeek API key
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
});

app.post('/api/product-bot', async (req, res) => {
  const { message } = req.body;
  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are a fun, friendly product advisor for a Kenyan tech shop. Always ask follow-up questions if needed. Help users compare, recommend, and choose tech gadgets."
        },
        { role: "user", content: message }
      ],
      max_tokens: 600,
      temperature: 0.8
    });
    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error('DeepSeek Error:', err?.response?.data || err);
    res.status(500).json({ error: "Failed to fetch from DeepSeek" });
  }
});

// --- PORT CONFIGURATION ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for testing (optional)
module.exports = app;