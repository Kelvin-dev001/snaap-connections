/**
 * P2 — Fix the 9 mispriced Floating Ark accessories. Owner-approved 2026-07-30:
 * all set to KSh 550 (they were placeholder KSh 1 / KSh 10).
 *
 * Run on the host (MONGODB_URI in env), from the backend root:
 *   DRY_RUN=1 node scripts/p2-fix-prices.js     # reports only
 *   DRY_RUN=0 node scripts/p2-fix-prices.js     # applies
 *
 * Also clears any junk discountPrice (<= 100) on these records so they don't
 * render a bogus "sale" price. Reversible (it just sets a Number field).
 */
const mongoose = require("mongoose");
try { require("dotenv").config(); } catch { /* MONGODB_URI may already be in env */ }

const DRY = process.env.DRY_RUN !== "0";
const URI = process.env.MONGODB_URI;
if (!URI) { console.error("Set MONGODB_URI in the environment first."); process.exit(1); }

const NEW_PRICE = 550;
const IDS = [
  "692c28837d0055637803f5d9", // USB-C To Type C
  "692c23f57d0055637803f5ca", // USB-A direct charger 5W (iron-weighted)
  "6929f8e07d0055637803f585", // 2 in 1 cable, micro + type-C
  "6929f3a07d0055637803f582", // USB-A To Type C
  "6929ef697d0055637803f57f", // Dual USB-A Charger (Wall Charger)
  "692dede17d0055637803f6d0", // Li-ion Battery
  "692ddbc27d0055637803f6b7", // USB-A+C Charger (Fast Charge) 20W
  "692c49ec7d0055637803f612", // USB-A To Micro
  "692c2bd67d0055637803f5e2", // USB-A To lightning
];
const OID = (s) => new mongoose.Types.ObjectId(s);

(async () => {
  await mongoose.connect(URI);
  const Products = mongoose.connection.db.collection("products");
  console.log(`\nP2 price fix -> KSh ${NEW_PRICE} — MODE: ${DRY ? "DRY RUN (no writes)" : "APPLY (writing)"}\n`);

  let applied = 0, missing = 0;
  for (const id of IDS) {
    const p = await Products.findOne({ _id: OID(id) });
    if (!p) { console.log(`  ${id}: NOT FOUND — skip`); missing++; continue; }
    const junkDisc = p.discountPrice != null && p.discountPrice <= 100;
    console.log(`  ${id} "${(p.name || "").trim()}": ${p.price} -> ${NEW_PRICE}${junkDisc ? ` (also clearing junk discountPrice ${p.discountPrice})` : ""}`);
    if (!DRY) {
      const update = { $set: { price: NEW_PRICE } };
      if (junkDisc) update.$unset = { discountPrice: "" };
      await Products.updateOne({ _id: OID(id) }, update);
      applied++;
    }
  }
  console.log(DRY
    ? `\nDRY RUN — ${IDS.length - missing} of ${IDS.length} would be set to KSh ${NEW_PRICE}. Re-run with DRY_RUN=0 to apply.`
    : `\nAPPLY complete: ${applied} products set to KSh ${NEW_PRICE}.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
