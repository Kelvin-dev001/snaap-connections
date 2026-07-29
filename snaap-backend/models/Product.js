const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String },
  category: { type: String, required: true },

  // Pricing
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  currency: { type: String, default: 'KES' },
  isOnSale: { type: Boolean, default: false },

  // 🔥 DEAL TYPE SUPPORT
  dealType: { 
    type: String, 
    enum: ["", "dealOfTheDay", "flashSale", "limitedOffer"],
    default: ""
  },
  dealExpiry: { type: Date, default: null },

  // Inventory
  sku: { type: String, unique: true },
  stockQuantity: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },

  // Specifications
  specs: {
    storage: { type: String },
    ram: { type: String },
    screenSize: { type: String },
    camera: { type: String },
    battery: { type: String },
    processor: { type: String },
    os: { type: String },
    material: { type: String },
    wattage: { type: String },
    connectivity: { type: String }
  },

  // Accessory-Specific
  accessoryType: { type: String },
  compatibleWith: [{ type: String }],

  // Media
  images: [{ type: String }],
  thumbnail: { type: String },
  videoUrl: { type: String },

  // Descriptions
  shortDescription: { type: String, maxlength: 160 },
  fullDescription: { type: String, maxlength: 2000 },
  keyFeatures: [{ type: String }],

  // Organization
  tags: [{ type: String }],
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Visibility
  isFeatured: { type: Boolean, default: false },
  isNewRelease: { type: Boolean, default: false },
  releaseDate: { type: Date, default: Date.now },

  // Warranty/Policy
  warrantyPeriod: { type: String },
  returnPolicyDays: { type: Number, default: 30 },

  // Soft delete (P1-13 dedup) — reversible; excluded from all public listings.
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  mergedInto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);