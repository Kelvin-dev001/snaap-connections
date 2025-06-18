require('dotenv').config();
const mongoose = require('mongoose');

console.log("Testing connection to:", process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => {
    console.error('❌ Connection Failed:');
    console.log("1. Check your .env file for MONGODB_URI");
    console.log("2. Verify password in MongoDB Atlas");
    console.log("3. Confirm IP is whitelisted (0.0.0.0/0 for testing)");
    console.log("Full error:", err.message);
  });