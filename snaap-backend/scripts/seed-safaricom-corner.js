/**
 * P7 — Seed the homepage "safaricom_corner" section with 12 service tiles.
 *
 * Repoints the Safaricom Corner cards from the products catalogue to the new
 * dedicated service pages (/safaricom/<slug>). Each card is a "service" tile
 * (ctaType ""), so it skips stock validation — it links to editorial content,
 * not a product.
 *
 * MODES (safe by default):
 *   node scripts/seed-safaricom-corner.js              # DRY-RUN — prints the plan, writes nothing
 *   node scripts/seed-safaricom-corner.js --apply      # creates/replaces the section items
 *   node scripts/seed-safaricom-corner.js --revert      # deletes the section
 *   node scripts/seed-safaricom-corner.js --revert --backup backups/safaricom_corner-<ts>.json
 *
 * --apply first backs up any existing safaricom_corner doc to scripts/backups/,
 * and PRESERVES that section's order/title/subtitle (so the homepage position
 * doesn't move) — it only swaps in the 12 service tiles below. Reversible either
 * way. Every card is run through the same server-side validator the API uses.
 *
 * The card roster here MUST stay in step with the frontend
 * next-frontend/src/constants/safaricomServices.js (slug + iconKey).
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const HomepageSection = require("../models/homepageSection");
const { validateSection } = require("../utils/sectionValidation");

const MODE = process.argv.includes("--apply")
  ? "apply"
  : process.argv.includes("--revert")
  ? "revert"
  : "dry-run";

const SECTION_KEY = "safaricom_corner";

// Defaults used only when no safaricom_corner section exists yet.
const DEFAULT_TITLE = "Safaricom Corner";
const DEFAULT_SUBTITLE = "Safaricom services at our shop — tap a service to learn more.";
const DEFAULT_ORDER = 0;

// ── The 12 service tiles. slug -> /safaricom/<slug>. iconKey must exist in
//    next-frontend/src/components/SafaricomCorner.js iconMap. ─────────────────
const SERVICES = [
  { slug: "mpesa", title: "M-PESA Services", subtitle: "Deposit, withdraw, send, pay", iconKey: "mpesa" },
  { slug: "sim", title: "SIM & Line Services", subtitle: "New SIM, replacement, registration", iconKey: "sim" },
  { slug: "airtime-data", title: "Airtime & Data", subtitle: "Bundles for every need", iconKey: "data" },
  { slug: "home-fibre", title: "Home Internet", subtitle: "Safaricom Home Fibre", iconKey: "fibre" },
  { slug: "mpesa-business", title: "M-PESA for Business", subtitle: "Till, PayBill & more", iconKey: "business" },
  { slug: "paybill", title: "M-PESA PayBill", subtitle: "Collect customer payments", iconKey: "paybill" },
  { slug: "pochi-la-biashara", title: "Pochi la Biashara", subtitle: "Separate business money", iconKey: "pochi" },
  { slug: "business-app", title: "Business App", subtitle: "Manage your M-PESA business", iconKey: "app" },
  { slug: "business-connectivity", title: "Business Connectivity", subtitle: "4G/5G, voice, data, SMS", iconKey: "connectivity" },
  { slug: "devices", title: "Devices", subtitle: "Phones, routers & MiFi", iconKey: "devices" },
  { slug: "bulk-payments", title: "Bulk Payments", subtitle: "Pay many recipients", iconKey: "bulk" },
  { slug: "support", title: "Get Help", subtitle: "Not sure? Talk to us", iconKey: "support" },
];

function requireDb() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Run this from the snaap-backend directory with the .env in place.");
    process.exit(1);
  }
}

// Service tile: no product, no image (renders the icon), internal deep link.
function buildItems() {
  return SERVICES.map((s) => ({
    title: s.title,
    subtitle: s.subtitle,
    iconKey: s.iconKey,
    ctaLabel: "View service",
    ctaLink: `/safaricom/${s.slug}`,
    image: "",
    type: "service",
    ctaType: "",
  }));
}

function backupExisting(existing) {
  const dir = path.join(__dirname, "backups");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `safaricom_corner-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
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
        console.log(`Restored safaricom_corner from ${backupArg}`);
      } else {
        const r = await HomepageSection.deleteOne({ sectionKey: SECTION_KEY });
        console.log(`Deleted safaricom_corner (${r.deletedCount} doc). Homepage Safaricom Corner returns to empty.`);
      }
      return;
    }

    const items = buildItems();
    // Preserve the existing section's placement/heading; only swap the tiles.
    const doc = {
      sectionKey: SECTION_KEY,
      title: existing?.title || DEFAULT_TITLE,
      subtitle: existing?.subtitle || DEFAULT_SUBTITLE,
      enabled: existing?.enabled ?? true,
      order: existing?.order ?? DEFAULT_ORDER,
      startsAt: existing?.startsAt ?? null,
      endsAt: existing?.endsAt ?? null,
      items,
    };

    console.log("Planned safaricom_corner section:");
    console.log(`  title="${doc.title}"  enabled=${doc.enabled}  order=${doc.order}  cards=${doc.items.length}`);
    doc.items.forEach((it, i) => {
      console.log(`  [${String(i + 1).padStart(2)}] "${it.title}"  icon=${it.iconKey}  -> ${it.ctaLink}`);
    });

    const validation = await validateSection({ enabled: doc.enabled, items: doc.items });
    console.log(`\nValidation: ${validation.ok ? "OK — all tiles valid (service tiles skip stock checks)" : "FAILED"}`);
    (validation.sectionErrors || []).forEach((e) => console.log("  section:", e));
    validation.items.forEach((r) => {
      (r.errors || []).forEach((e) => console.log(`  card ${r.index + 1} ERROR:`, e));
      (r.warnings || []).forEach((w) => console.log(`  card ${r.index + 1} warn:`, w));
    });

    console.log(
      `\nExisting safaricom_corner in DB: ${existing ? `YES (${existing.items?.length || 0} cards — will be backed up then replaced)` : "no (will be created)"}`
    );

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
      console.log(`\nBacked up existing safaricom_corner to ${file}`);
    }
    const saved = await HomepageSection.findOneAndUpdate({ sectionKey: SECTION_KEY }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`\nApplied. safaricom_corner _id=${saved._id}, ${saved.items.length} cards.`);
    console.log("Revert with: node scripts/seed-safaricom-corner.js --revert");
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
