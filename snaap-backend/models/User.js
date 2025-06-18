const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic information
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String }, // Optional, can be used for contact or WhatsApp

  // Authentication
  password: { type: String, required: true }, // Hashed password

  // Roles for permissions (e.g., 'admin', 'customer')
  role: { 
    type: String, 
    enum: ['admin', 'customer'],
    default: 'customer'
  },

  // Address (optional, good for orders)
  address: { type: String },

  // Account status (optional)
  isActive: { type: Boolean, default: true },

  // Timestamps for tracking
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);