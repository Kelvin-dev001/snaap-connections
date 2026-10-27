const mongoose = require('mongoose');

// Customer accounts (P10-4). Staff do not have User documents: the admin signs
// in with the single ADMIN_PASSWORD (routes/authRoutes.js), and a customer
// token can never act as an admin (separate cookie AND a separately derived
// signing key — utils/customerToken.js).
const userSchema = new mongoose.Schema({
  // Basic information
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String }, // +2547… / +2541… (utils/phone.js), optional

  // Authentication: a bcrypt hash, never the password.
  password: { type: String, required: true },
  // Bumped on every password change, admin reset and block, which signs the
  // customer out on every device (the token carries the version it was issued
  // with).
  tokenVersion: { type: Number, default: 0 },
  // Set by an admin password reset: the customer must choose a new password
  // before using their account.
  mustChangePassword: { type: Boolean, default: false },
  lastLoginAt: { type: Date },

  // Roles for permissions (e.g., 'admin', 'customer')
  role: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer'
  },

  // Pre-fills checkout. Never shared beyond the customer and the admin.
  defaultAddress: {
    county: String,
    town: String,
    address: String,
  },
  // Legacy free-text address (pre-P10).
  address: { type: String },

  // The wishlist, synced from the customer's devices (P10-2 keeps a device copy).
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Account status — false = blocked by an admin.
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
