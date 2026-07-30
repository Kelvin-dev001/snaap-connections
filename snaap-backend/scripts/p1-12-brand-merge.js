/**
 * P1-12 — Brand merge. Owner-approved 2026-07-30. DRY by default.
 * Run on the host (MONGODB_URI in env), from the backend root:
 *   DRY_RUN=1 node scripts/p1-12-brand-merge.js     # reports only
 *   DRY_RUN=0 node scripts/p1-12-brand-merge.js     # applies
 *
 * Does:
 *   1. Product.brand  "Xiaomi Redmi" -> "Redmi"  (unifies the 16/6 split)
 *   2. Shop-by-Brand tiles (brands collection):
 *        - rename tile "Xiaomi Redmi" -> "Redmi" (keeps its logo)
 *        - ADD tile "Itel" if missing (blank logo — upload in admin later)
 *        - REMOVE dead tile "Dell" (0 products) — full record logged first
 * Reversible: brand is a plain string field; no _id references are orphaned.
 */
const mongoose = require("mongoose");
try { require("dotenv").config(); } catch { /* MONGODB_URI may already be in env */ }

const DRY = process.env.DRY_RUN !== "0";
const URI = process.env.MONGODB_URI;
if (!URI) { console.error("Set MONGODB_URI in the environment first."); process.exit(1); }

const FROM = "Xiaomi Redmi";
const TO = "Redmi";
const ADD_TILES = ["Itel"];     // brands that have products but no tile
const REMOVE_TILES = ["Dell"];  // tiles with no products

const ci = (s) => ({ $regex: `^${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" });

(async () => {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const Products = db.collection("products");
  const Brands = db.collection("brands");
  const Sections = db.collection("homepagesections");

  console.log(`\nP1-12 brand merge — MODE: ${DRY ? "DRY RUN (no writes)" : "APPLY (writing)"}\n`);

  // 1) Product.brand  FROM -> TO
  const nFrom = await Products.countDocuments({ brand: ci(FROM) });
  const nTo = await Products.countDocuments({ brand: ci(TO) });
  console.log(`1) Products brand "${FROM}" (${nFrom}) -> "${TO}" (currently ${nTo}) = ${nTo + nFrom} after merge`);
  if (!DRY && nFrom) await Products.updateMany({ brand: ci(FROM) }, { $set: { brand: TO } });

  // 2) tiles
  console.log("\n2) Shop-by-Brand tiles:");
  const fromTile = await Brands.findOne({ name: ci(FROM) });
  const toTile = await Brands.findOne({ name: ci(TO) });
  if (fromTile && !toTile) {
    console.log(`   rename tile "${fromTile.name}" -> "${TO}" (keeps logo)`);
    if (!DRY) await Brands.updateOne({ _id: fromTile._id }, { $set: { name: TO } });
  } else if (fromTile && toTile) {
    console.log(`   "${TO}" tile already exists -> remove duplicate "${fromTile.name}" tile`);
    if (!DRY) await Brands.deleteOne({ _id: fromTile._id });
  } else if (!fromTile && !toTile) {
    console.log(`   no "${FROM}"/"${TO}" tile -> add "${TO}" (blank logo)`);
    if (!DRY) await Brands.insertOne({ name: TO, description: "", logo: "" });
  } else {
    console.log(`   "${TO}" tile present, "${FROM}" absent — nothing to do`);
  }
  for (const name of ADD_TILES) {
    const exists = await Brands.findOne({ name: ci(name) });
    console.log(`   tile "${name}": ${exists ? "already exists" : "ADD (blank logo — upload in admin)"}`);
    if (!DRY && !exists) await Brands.insertOne({ name, description: "", logo: "" });
  }
  for (const name of REMOVE_TILES) {
    const rec = await Brands.findOne({ name: ci(name) });
    if (!rec) { console.log(`   tile "${name}": not present`); continue; }
    const prodCount = await Products.countDocuments({ brand: ci(name) });
    if (prodCount === 0) {
      console.log(`   tile "${name}": 0 products -> REMOVE. (backup: ${JSON.stringify(rec)})`);
      if (!DRY) await Brands.deleteOne({ _id: rec._id });
    } else {
      console.log(`   tile "${name}": ${prodCount} products — KEEPING (not dead)`);
    }
  }

  // 3) reference report (manual follow-up if any)
  const refXiaomi = await Sections.countDocuments({ "items.ctaLink": /Xiaomi/i });
  const refDell = await Sections.countDocuments({ "items.ctaLink": /Dell/i });
  console.log(`\n3) Homepage-section links mentioning Xiaomi: ${refXiaomi} | Dell: ${refDell} (update manually if >0)`);

  console.log(DRY ? "\nDRY RUN complete — nothing changed. Re-run with DRY_RUN=0 to apply." : "\nAPPLY complete.");
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
