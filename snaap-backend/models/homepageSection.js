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
    image: { type: String, default: "" },

    // --- P3: promo-card fields. All optional; existing "service" items (Safaricom
    //     Corner) keep working untouched because every field below defaults. ---
    // Card kind. "service" = Safaricom-style tile (default, unchanged);
    // "announcement" = owns the homepage <h1>; "offer" = a promo card.
    type: { type: String, enum: ["service", "announcement", "offer"], default: "service" },
    // What the CTA resolves to. "" = legacy/service (skips stock validation).
    // "product" = a specific product; "browse" = a filter listing; "whatsapp" = enquiry (sell-to-order).
    ctaType: { type: String, enum: ["", "product", "browse", "whatsapp"], default: "" },
    // Deep-link target for ctaType "product" (preferred over ?brand= filters — P1's whole point).
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    badge: { type: String, default: "" },
    badgeTone: { type: String, default: "" },
    tone: { type: String, default: "" },
    alt: { type: String, default: "" },
    priority: { type: Number, default: 0 },
    // Per-card scheduling. Server-authoritative — evaluated in getStaticProps, never the device clock.
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
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
    // Section-level scheduling (server-authoritative). Null = always on.
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    items: [homepageItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomepageSection", homepageSectionSchema);