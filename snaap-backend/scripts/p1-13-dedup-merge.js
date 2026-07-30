/**
 * P1-13 — Apply duplicate merges. Owner-approved 2026-07-29. READ-SAFE by default.
 *
 * Run from inside the backend (so `mongoose` resolves) with MONGODB_URI set:
 *   copy this file into snaap-connections/snaap-backend/ then run
 *     DRY_RUN=1 node P1-13-apply-migration.js     # reports only, writes nothing
 *     DRY_RUN=0 node P1-13-apply-migration.js     # applies
 *
 * Safeguards:
 *  - Reference-checks every loser against orders / reviews / homepage sections and
 *    BLOCKS (leaves in place) any that is referenced — never orphans order history.
 *  - Soft-deletes (isDeleted=true, mergedInto=survivor, deletedAt) — reversible in
 *    one command: db.products.updateMany({deletedReason:"P1-13 duplicate"},{$unset:{isDeleted:"",mergedInto:"",deletedAt:"",deletedReason:""}}).
 *  - Applies the 3 owner-set price corrections on survivors.
 *
 * IMPORTANT: soft-delete only TAGS the record. For losers to disappear from
 * listings / search / sitemap, add `isDeleted: { $ne: true }` to the product-list
 * queries in the backend (productRoutes GET /products, /products/deals/active,
 * featured, search) and the single GET /products/:id. Until then, the frontend
 * 301s (next.config.mjs) cover direct URL hits but losers still show in listings.
 */
const mongoose = require("mongoose");
// Load a gitignored snaap-backend/.env if present, so MONGODB_URI never has to be
// typed on a command line or pasted anywhere. (dotenv is a backend dependency.)
try { require("dotenv").config(); } catch { /* optional — MONGODB_URI may already be in the env */ }

const DRY = process.env.DRY_RUN !== "0";
const URI = process.env.MONGODB_URI;
if (!URI) { console.error("Set MONGODB_URI in the environment first."); process.exit(1); }

const MERGES = [
  { group: "D1 Itel A100c 64/2GB",        survivor: "691493c47d0055637803eceb", losers: ["690b9c5294166453cc1a0986", "690b9bf894166453cc1a0984"] },
  { group: "D2 USB-A To Micro",           survivor: "692c49ec7d0055637803f612", losers: ["692c47297d0055637803f5f1"] },
  { group: "D3 Dual USB-A Charger",       survivor: "6929ef697d0055637803f57f", losers: ["6929eb7a7d0055637803f57c"] },
  { group: "D4 itel S26 ultra 256/8GB",   survivor: "69149b3e7d0055637803ed35", losers: ["69149aa27d0055637803ed33"] },
  { group: "D5 Tecno Spark Slim 256/8GB", survivor: "691461c57d0055637803ec94", losers: ["6914617c7d0055637803ec92"] },
  { group: "P1 Itel S24 128/4GB",         survivor: "68a5a52765492b5b215d528d", losers: ["68a5a77a65492b5b215d5290"], price: 18500 },
  { group: "P2 Itel A70 128/3GB",         survivor: "68a49977a46b1d70c0d94a93", losers: ["68a49ce1a46b1d70c0d94a9a"], price: 13500 },
  { group: "P3 Itel A60s 64/4GB",         survivor: "68a458cfa46b1d70c0d94a76", losers: ["68a45797a46b1d70c0d94a73"], price: 13500 },
  { group: "P7 Tecno Camon 40 Pro 4G",    survivor: "688b5385de43e4b4ab950a86", losers: ["687eb4daa2f0fde8dbb4f4fa"], price: 31999 },
  { group: "P4 Redmi Pad SE",             survivor: "68a04369a46b1d70c0d949ad", losers: ["68a04221a46b1d70c0d949aa"] },
];

const OID = (s) => new mongoose.Types.ObjectId(s);
const idMatch = (id) => ({ $in: [OID(id), id] }); // match ObjectId or string storage

(async () => {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const Products = db.collection("products");
  const Orders = db.collection("orders");
  const Reviews = db.collection("reviews");
  const Sections = db.collection("homepagesections"); // confirm collection name if different

  console.log(`\nP1-13 apply — MODE: ${DRY ? "DRY RUN (no writes)" : "APPLY (writing)"}\n`);
  let softDeleted = 0, blocked = 0, priced = 0;

  for (const m of MERGES) {
    console.log(`### ${m.group}`);
    const survivor = await Products.findOne({ _id: OID(m.survivor) });
    if (!survivor) { console.log(`  !! survivor ${m.survivor} MISSING — skipping whole group`); blocked++; console.log(""); continue; }

    for (const lid of m.losers) {
      const loser = await Products.findOne({ _id: OID(lid) });
      if (!loser) { console.log(`  - loser ${lid}: not found (already retired?) — skip`); continue; }
      if (loser.isDeleted) { console.log(`  - loser ${lid}: already isDeleted — skip`); continue; }

      const inOrders = await Orders.countDocuments({ "products.productId": idMatch(lid) });
      const inReviews = await Reviews.countDocuments({ product: idMatch(lid) });
      const inSections = await Sections.countDocuments({ "items.ctaLink": { $regex: lid } });
      if (inOrders || inReviews || inSections) {
        console.log(`  !! loser ${lid} REFERENCED (orders:${inOrders} reviews:${inReviews} sections:${inSections}) — BLOCKED, left in place`);
        blocked++;
        continue;
      }
      console.log(`  - loser ${lid} "${loser.name}" — clear; ${DRY ? "would soft-delete" : "soft-deleting"}`);
      if (!DRY) {
        await Products.updateOne(
          { _id: OID(lid) },
          { $set: { isDeleted: true, deletedAt: new Date(), mergedInto: OID(m.survivor), deletedReason: "P1-13 duplicate" } }
        );
      }
      softDeleted++;
    }

    if (m.price != null && survivor.price !== m.price) {
      console.log(`  - survivor price ${survivor.price} -> ${m.price} ${DRY ? "(would set)" : "(set)"}`);
      if (!DRY) await Products.updateOne({ _id: OID(m.survivor) }, { $set: { price: m.price } });
      priced++;
    }
    console.log("");
  }

  console.log(`Summary: ${softDeleted} soft-deleted, ${blocked} blocked/missing, ${priced} price fixes.`);
  console.log(DRY ? "DRY RUN complete — nothing changed. Re-run with DRY_RUN=0 to apply." : "APPLY complete.");
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
