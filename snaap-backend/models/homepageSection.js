const mongoose = require("mongoose");

const homepageItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    iconKey: { type: String, default: "default" },
    category: { type: String, default: "" },
    search: { type: String, default: "" },
    ctaLabel: { type: String, default: "View Service" },
    ctaLink: { type: String, default: "" },
    image: { type: String, default: "" }
  },
  { _id: true }
);

const homepageSectionSchema = new mongoose.Schema(
  {
    sectionKey: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    items: [homepageItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomepageSection", homepageSectionSchema);