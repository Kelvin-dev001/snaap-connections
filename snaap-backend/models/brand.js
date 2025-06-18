const mongoose = require('mongoose');
const brandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  logo: String // <-- Add this field for logo URL
});
module.exports = mongoose.model('Brand', brandSchema);