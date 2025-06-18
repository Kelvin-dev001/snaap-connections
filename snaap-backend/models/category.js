const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  icon: String // <-- Add this field for icon URL (optional)
});
module.exports = mongoose.model('Category', categorySchema);