const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true }, // "iPhone 15 Pro"
  brand: { type: String, required: true }, // "Apple"
  model: { type: String }, // "A2848"
  category: { 
    type: String, 
    required: true,
  },

  // Pricing
  price: { type: Number, required: true }, // 999.99
  discountPrice: { type: Number }, // 899.99 (optional)
  currency: { type: String, default: 'KES' },
  isOnSale: { type: Boolean, default: false },

  // Inventory
  sku: { type: String, unique: true }, // "APL-IP15P-128-BLK"
  stockQuantity: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },

  // Specifications (Conditional based on category)
  specs: {
    // For Phones/Tablets
    storage: { type: String }, // "128GB"
    ram: { type: String },     // "8GB"
    screenSize: { type: String }, // "6.7 inches"
    camera: { type: String }, // "48MP + 12MP + 12MP"
    battery: { type: String }, // "4422 mAh"
    processor: { type: String }, // "A17 Pro"
    os: { type: String }, // "iOS 17"

    // For Accessories
    material: { type: String }, // "Silicone" (for cases)
    wattage: { type: String }, // "20W" (for chargers)
    connectivity: { type: String } // "Bluetooth 5.3" (for headphones)
  },

  // Accessory-Specific
  accessoryType: { type: String }, // "Wireless Charger"
  compatibleWith: [{ type: String }], // ["iPhone 15", "Samsung S23"]

  // Media
  images: [{ type: String }], // Array of image URLs
  thumbnail: { type: String }, // Main thumbnail URL
  videoUrl: { type: String }, // Product video URL

  // Descriptions
  shortDescription: { type: String, maxlength: 160 },
  fullDescription: { type: String },
  keyFeatures: [{ type: String }], // ["5G support", "120Hz display"]

  // Organization
  tags: [{ type: String }], // ["flagship", "5G", "2023"]
  relatedProducts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  }],

  // Visibility
  isFeatured: { type: Boolean, default: false },
  isNewRelease: { type: Boolean, default: false },
  releaseDate: { type: Date, default: Date.now },

  // Warranty/Policy
  warrantyPeriod: { type: String }, // "1 year"
  returnPolicyDays: { type: Number, default: 30 },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);