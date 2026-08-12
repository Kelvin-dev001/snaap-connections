// snaap-backend/utils/sectionValidation.js
//
// P3 homepage-section validation. Server-authoritative so a promo card cannot
// advertise a phone we don't sell (the live bug: 4 of 5 hardcoded cards did).
//
// Stock resolution MIRRORS the live listing (routes/productRoutes.js GET /):
//   brand/category -> case-insensitive EXACT match  { $regex: `^v$`, $options: 'i' }
//   search         -> case-insensitive substring across name/brand/category ($or)
//   price          -> minPrice/maxPrice => price $gte / $lte
//   soft-deleted (isDeleted) products are always excluded
// If this resolver and the listing ever disagree, the admin sees a count the
// customer's tap won't reproduce — so keep them in lock-step.

const mongoose = require("mongoose");
const Product = require("../models/Product");

const OUR_CLOUD = "dltfgasbb";
// P8: sectionKeys beginning with this are hero sliders (hero_slider_top,
// hero_slider_mid) and carry the extra rules in validateSection below.
const HERO_SLIDER_PREFIX = "hero_slider";
const MAX_HERO_SLIDES = 5;
const SUPPORTED_BROWSE_PARAMS = ["brand", "category", "search", "minPrice", "maxPrice", "dealType"];
const NEW_IN_STOCK_RE = /new\s*in\s*stock/i;
const PREORDER_RE = /pre[\s-]?order|order\s*on\s*request/i;

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Extract only the params the products listing actually honours. Unsupported ones
// (e.g. ?tag=) are ignored here exactly as the listing ignores them.
function parseBrowseParams(ctaLink) {
  const link = String(ctaLink || "");
  const qi = link.indexOf("?");
  if (qi === -1) return { params: {}, hadQuery: false, hadSupported: false };
  const usp = new URLSearchParams(link.slice(qi + 1));
  const params = {};
  let hadSupported = false;
  for (const key of SUPPORTED_BROWSE_PARAMS) {
    const v = usp.get(key);
    if (v != null && String(v).trim() !== "") {
      params[key] = String(v).trim();
      hadSupported = true;
    }
  }
  return { params, hadQuery: true, hadSupported };
}

function buildBrowseQuery(params) {
  const query = { isDeleted: { $ne: true } };
  if (params.brand) query.brand = { $regex: `^${escapeRegex(params.brand)}$`, $options: "i" };
  if (params.category) query.category = { $regex: `^${escapeRegex(params.category)}$`, $options: "i" };
  if (params.dealType) query.dealType = String(params.dealType);
  if (params.minPrice || params.maxPrice) {
    query.price = {};
    if (params.minPrice) query.price.$gte = Number(params.minPrice);
    if (params.maxPrice) query.price.$lte = Number(params.maxPrice);
  }
  if (params.search) {
    const s = escapeRegex(params.search);
    query.$or = [
      { name: { $regex: s, $options: "i" } },
      { brand: { $regex: s, $options: "i" } },
      { category: { $regex: s, $options: "i" } },
    ];
  }
  return query;
}

function classifyImage(url) {
  const u = String(url || "");
  if (!u) return "empty";
  if (u.startsWith("/")) return "local"; // /public placeholder on our own domain
  if (/res\.cloudinary\.com\/demo\//i.test(u)) return "demo"; // explicitly banned by the pack
  if (new RegExp(`res\\.cloudinary\\.com/${OUR_CLOUD}/`, "i").test(u)) return "ours";
  return "foreign"; // some other host/cloud
}

function isValidCtaLink(link) {
  const l = String(link || "");
  if (!l) return true; // empty allowed — service tiles build their own link
  if (l.startsWith("/")) return true; // internal path
  return /^https?:\/\//i.test(l); // absolute URL
}

// Validate a single card. Returns { ok, errors, warnings, resolvedCount, ... }.
async function validateItem(item, index) {
  const errors = [];
  const warnings = [];
  let resolvedCount = null;
  let productName = null;
  const label = item && item.title ? `"${item.title}"` : `Card #${index + 1}`;

  // Scheduling.
  if (item.startsAt && item.endsAt && new Date(item.endsAt) <= new Date(item.startsAt)) {
    errors.push(`${label}: end date must be after start date.`);
  }

  // CTA link shape.
  if (item.ctaLink && !isValidCtaLink(item.ctaLink)) {
    errors.push(`${label}: CTA link must be an internal path (starting with /) or an absolute http(s) URL.`);
  }

  // Image host. Both artworks get the same treatment: the mobile companion is
  // served to the majority of our traffic, so it can't be held to a looser
  // standard than the wide one.
  [
    { url: item.image, what: "image" },
    { url: item.imageMobile, what: "mobile image" },
  ].forEach(({ url, what }) => {
    if (!url) return; // mobile is optional; a missing wide image is caught by the route
    const imgClass = classifyImage(url);
    if (imgClass === "demo") {
      errors.push(`${label}: ${what} is on the Cloudinary demo cloud. Use our own cloud (${OUR_CLOUD}).`);
    } else if (imgClass === "foreign") {
      warnings.push(
        `${label}: ${what} is not on our Cloudinary cloud (${OUR_CLOUD}) — replace before publishing.`
      );
    }
  });

  const ctaType = item.ctaType || "";

  // Stock / CTA resolution — only for promo cards. Service tiles (ctaType "") skip this,
  // which is why the existing Safaricom Corner section keeps validating cleanly.
  if (ctaType === "product") {
    const id = item.productId;
    if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
      errors.push(`${label}: select a product for this card.`);
      resolvedCount = 0;
    } else {
      const product = await Product.findById(id).lean();
      if (!product || product.isDeleted) {
        errors.push(`${label}: the linked product no longer exists or has been removed.`);
        resolvedCount = 0;
      } else {
        resolvedCount = 1;
        productName = product.name;
      }
    }
  } else if (ctaType === "browse") {
    if (!item.ctaLink) {
      errors.push(`${label}: add a filter link for this browse card.`);
      resolvedCount = 0;
    } else {
      const { params, hadQuery, hadSupported } = parseBrowseParams(item.ctaLink);
      if (hadQuery && !hadSupported) {
        warnings.push(
          `${label}: the link uses a filter the products page ignores (e.g. ?tag=), so it lands on the full catalogue. Use ?brand=, ?category=, ?search= or a price range.`
        );
        resolvedCount = await Product.countDocuments({ isDeleted: { $ne: true } });
      } else {
        resolvedCount = await Product.countDocuments(buildBrowseQuery(params));
        if (resolvedCount < 1) {
          errors.push(`${label}: this filter currently returns 0 products.`);
        }
      }
    }
  } else if (ctaType === "whatsapp") {
    // Sell-to-order is allowed with no stock, but the badge must not claim NEW IN STOCK.
    if (item.badge && NEW_IN_STOCK_RE.test(item.badge) && !PREORDER_RE.test(item.badge)) {
      errors.push(
        `${label}: a WhatsApp/enquiry card can't use a "NEW IN STOCK" badge — use "PRE-ORDER" or "ORDER ON REQUEST".`
      );
    }
  }

  return {
    index,
    title: item.title || "",
    ctaType,
    resolvedCount,
    productName,
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function truthy(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}

// Validate a whole section payload. Used both by POST /validate (admin preview) and
// internally by create/update to reject a bad write.
async function validateSection(payload = {}) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const sectionErrors = [];
  const sectionKey = String(payload.sectionKey || "");

  if (payload.startsAt && payload.endsAt && new Date(payload.endsAt) <= new Date(payload.startsAt)) {
    sectionErrors.push("Section end date must be after start date.");
  }

  // P8 hero sliders. Two placements (hero_slider_top / hero_slider_mid) share
  // this section model; the only extra rules are a hard slide cap and a
  // declared link type.
  //
  // Requiring ctaType is what makes the cap meaningful: it routes every slide
  // through validateItem's existing stock resolution, so a banner can't point
  // at a deleted product or a filter that returns nothing. A full-bleed hero
  // that lands on an empty listing is the most expensive dead end on the site.
  //
  // The image is deliberately NOT checked here: POST /validate runs as an admin
  // preview before the file is uploaded, and the create/update routes already
  // reject a saved item with no image.
  if (sectionKey.startsWith(HERO_SLIDER_PREFIX)) {
    if (items.length > MAX_HERO_SLIDES) {
      sectionErrors.push(
        `A hero slider can hold at most ${MAX_HERO_SLIDES} slides (this one has ${items.length}).`
      );
    }
    items.forEach((item, index) => {
      if (!item || !item.ctaType) {
        const label = item && item.title ? `"${item.title}"` : `Slide #${index + 1}`;
        sectionErrors.push(`${label}: choose what this slide links to.`);
      }
    });
  }

  // Guard the one-heading invariant at the source: a single section must not carry
  // two announcement cards, or they'd fight over the homepage <h1>.
  const announcements = items.filter((it) => (it && it.type) === "announcement").length;
  if (announcements > 1) {
    sectionErrors.push("A section can have at most one announcement card (it owns the homepage heading).");
  }

  const itemResults = [];
  for (let i = 0; i < items.length; i++) {
    itemResults.push(await validateItem(items[i] || {}, i));
  }

  const ok = sectionErrors.length === 0 && itemResults.every((r) => r.ok);
  return {
    ok,
    enabled: truthy(payload.enabled),
    sectionErrors,
    items: itemResults,
  };
}

module.exports = {
  validateSection,
  validateItem,
  buildBrowseQuery,
  parseBrowseParams,
  classifyImage,
  OUR_CLOUD,
  HERO_SLIDER_PREFIX,
  MAX_HERO_SLIDES,
};
