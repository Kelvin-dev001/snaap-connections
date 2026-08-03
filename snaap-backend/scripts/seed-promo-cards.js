/**
 * P3d — Seed the homepage "promo_cards" section.
 *
 * Replaces the five hardcoded promo cards (four of which advertised phones we don't
 * stock) with real, deep-linked, in-stock cards. The Ramadhan announcement is NOT
 * seeded, so the evergreen homepage <h1> stays in place.
 *
 * MODES (safe by default):
 *   node scripts/seed-promo-cards.js              # DRY-RUN — prints the plan, writes nothing
 *   node scripts/seed-promo-cards.js --apply      # creates/replaces the promo_cards section
 *   node scripts/seed-promo-cards.js --revert      # deletes the promo_cards section
 *   node scripts/seed-promo-cards.js --revert --backup backups/promo_cards-<ts>.json
 *
 * --apply first backs up any existing promo_cards doc to scripts/backups/, so this
 * is reversible either way. Every card is run through the same server-side validator
 * the API uses, so the seed itself cannot create a card that resolves to nothing.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const HomepageSection = require("../models/homepageSection");
const Product = require("../models/Product");
const { validateSection } = require("../utils/sectionValidation");

const MODE = process.argv.includes("--apply")
  ? "apply"
  : process.argv.includes("--revert")
  ? "revert"
  : "dry-run";

const SECTION_KEY = "promo_cards";

// ── Seed spec — edit here to change the owner-approved cards. IDs verified in-stock
//    against the live catalogue on 2026-08-03. ──────────────────────────────────
const SEED = {
  sectionKey: SECTION_KEY,
  title: "Homepage Promo Cards",
  subtitle: "",
  enabled: true,
  order: 0,
  startsAt: null,
  endsAt: null,
  cards: [
    { title: "Samsung Galaxy A56 5G", subtitle: "128/8GB · 2-year warranty · KSh 42,000", type: "offer", ctaType: "product", productId: "689c8258a46b1d70c0d94708", badge: "NEW IN STOCK", tone: "cool", priority: 100, ctaLabel: "Shop the A56" },
    { title: "Redmi Note 15", subtitle: "In stock now", type: "offer", ctaType: "product", productId: "6a62ca6e8128c864ab2eef26", badge: "IN STOCK", tone: "dark", priority: 80, ctaLabel: "Shop Redmi Note 15" },
    { title: "Tecno Camon 40 Pro", subtitle: "8/256GB", type: "offer", ctaType: "product", productId: "688b5385de43e4b4ab950a86", badge: "FRESH DEAL", tone: "midnight", priority: 60, ctaLabel: "Shop Camon 40 Pro" },
    { title: "oraimo Accessories", subtitle: "Audio, chargers & power banks", type: "offer", ctaType: "browse", ctaLink: "/products?brand=Oraimo", badge: "ACCESSORIES", tone: "light", priority: 40, ctaLabel: "Shop oraimo" },
  ],
};

function requireDb() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Run this from the snaap-backend directory with the .env in place.");
    process.exit(1);
  }
}

// Turn a spec card into the stored item shape, resolving deep link + image from the
// real product where relevant.
async function resolveCard(card) {
  const item = {
    title: card.title,
    subtitle: card.subtitle || "",
    iconKey: "default",
    category: card.category || "",
    search: card.search || "",
    ctaLabel: card.ctaLabel || "Shop now",
    ctaLink: card.ctaLink || "",
    image: card.image || "",
    type: card.type || "offer",
    ctaType: card.ctaType || "",
    productId: card.productId || null,
    badge: card.badge || "",
    badgeTone: card.badgeTone || "",
    tone: card.tone || "",
    alt: card.alt || card.title,
    priority: card.priority || 0,
    startsAt: card.startsAt || null,
    endsAt: card.endsAt || null,
  };
  const notes = [];

  if (item.ctaType === "product" && item.productId) {
    const p = await Product.findById(item.productId).lean();
    if (!p || p.isDeleted) {
      notes.push("!! product not found / deleted");
    } else {
      item.ctaLink = `/products/${p._id}`; // deep link (P1)
      if (!item.image) item.image = p.thumbnail || (p.images && p.images[0]) || "";
      notes.push(`-> ${p.name} (KSh ${p.price}, inStock=${p.inStock})`);
    }
  } else if (item.ctaType === "browse") {
    // Representative image from the first matching product, if none supplied.
    if (!item.image) {
      const qi = item.ctaLink.indexOf("?");
      const usp = qi >= 0 ? new URLSearchParams(item.ctaLink.slice(qi + 1)) : new URLSearchParams();
      const q = { isDeleted: { $ne: true } };
      if (usp.get("brand")) q.brand = { $regex: `^${usp.get("brand")}$`, $options: "i" };
      if (usp.get("category")) q.category = { $regex: `^${usp.get("category")}$`, $options: "i" };
      const first = await Product.findOne(q).lean();
      if (first) item.image = first.thumbnail || (first.images && first.images[0]) || "";
    }
    notes.push(`browse ${item.ctaLink}`);
  }
  if (!item.image) notes.push("!! no image (renders text-only; add art in admin)");
  return { item, notes };
}

async function buildSection() {
  const resolved = [];
  for (const card of SEED.cards) resolved.push(await resolveCard(card));
  const items = resolved.map((r) => r.item);
  const doc = {
    sectionKey: SEED.sectionKey,
    title: SEED.title,
    subtitle: SEED.subtitle,
    enabled: SEED.enabled,
    order: SEED.order,
    startsAt: SEED.startsAt,
    endsAt: SEED.endsAt,
    items,
  };
  return { doc, resolved };
}

function backupExisting(existing) {
  const dir = path.join(__dirname, "backups");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `promo_cards-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(existing, null, 2));
  return file;
}

(async () => {
  requireDb();
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`\nMode: ${MODE.toUpperCase()}  (section "${SECTION_KEY}")\n`);

  try {
    const existing = await HomepageSection.findOne({ sectionKey: SECTION_KEY }).lean();

    if (MODE === "revert") {
      const backupArg = process.argv[process.argv.indexOf("--backup") + 1];
      if (process.argv.includes("--backup") && backupArg) {
        const restore = JSON.parse(fs.readFileSync(backupArg, "utf8"));
        delete restore._id;
        await HomepageSection.findOneAndUpdate({ sectionKey: SECTION_KEY }, restore, { upsert: true, new: true });
        console.log(`Restored promo_cards from ${backupArg}`);
      } else {
        const r = await HomepageSection.deleteOne({ sectionKey: SECTION_KEY });
        console.log(`Deleted promo_cards (${r.deletedCount} doc). Homepage promo area returns to empty.`);
      }
      return;
    }

    const { doc, resolved } = await buildSection();

    console.log("Planned promo_cards section:");
    console.log(`  enabled=${doc.enabled}  order=${doc.order}  cards=${doc.items.length}`);
    resolved.forEach((r, i) => {
      console.log(`  [${i + 1}] "${r.item.title}"  badge="${r.item.badge}"  ${r.notes.join("  ")}`);
      console.log(`        image: ${r.item.image || "(none)"}`);
    });

    const validation = await validateSection({ enabled: doc.enabled, items: doc.items });
    console.log(`\nValidation: ${validation.ok ? "OK — every card resolves to real stock" : "FAILED"}`);
    (validation.sectionErrors || []).forEach((e) => console.log("  section:", e));
    validation.items.forEach((r) => {
      (r.errors || []).forEach((e) => console.log(`  card ${r.index + 1} ERROR:`, e));
      (r.warnings || []).forEach((w) => console.log(`  card ${r.index + 1} warn:`, w));
    });

    console.log(`\nExisting promo_cards in DB: ${existing ? "YES (will be backed up then replaced)" : "no (will be created)"}`);

    if (MODE === "dry-run") {
      console.log("\nDRY-RUN — nothing written. Re-run with --apply once approved.");
      return;
    }

    // apply
    if (!validation.ok) {
      console.error("\nRefusing to apply: validation failed (see errors above).");
      process.exitCode = 1;
      return;
    }
    if (existing) {
      const file = backupExisting(existing);
      console.log(`\nBacked up existing promo_cards to ${file}`);
    }
    const saved = await HomepageSection.findOneAndUpdate({ sectionKey: SECTION_KEY }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`\nApplied. promo_cards _id=${saved._id}, ${saved.items.length} cards.`);
    console.log("Revert with: node scripts/seed-promo-cards.js --revert");
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
