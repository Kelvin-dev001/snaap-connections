const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Coupon = require('../models/Coupon');
const CouponRedemption = require('../models/CouponRedemption');
const { normalizeCode, describe } = require('../utils/coupons');

// Admin coupon management (P10-5). Mounted behind requireAdmin in server.js.
// Percentage off only; one use per customer is enforced at checkout by the
// CouponRedemption unique index, not here.

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const APPLIES_TO = ['items', 'delivery', 'both'];

function validate(body, { creating }) {
  const out = {};
  if (creating) {
    const code = normalizeCode(body.code);
    if (!code) return { error: 'Use 3–20 letters, numbers or dashes for the code, e.g. KARIBU10.' };
    out.code = code;
  }
  if (body.percentOff !== undefined || creating) {
    const pct = Number(body.percentOff);
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) return { error: 'The discount must be a whole number from 1 to 100 (%).' };
    out.percentOff = pct;
  }
  if (body.appliesTo !== undefined || creating) {
    const appliesTo = body.appliesTo ?? 'items';
    if (!APPLIES_TO.includes(appliesTo)) return { error: 'Choose what the coupon takes money off: items, delivery or both.' };
    out.appliesTo = appliesTo;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') return { error: 'active must be true or false.' };
    out.active = body.active;
  }
  if (body.note !== undefined) {
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (note.length > 200) return { error: 'Keep the note under 200 characters.' };
    out.note = note;
  }
  return { value: out };
}

// Orders that used each coupon (distinct orders, not identity keys).
async function usage(ids) {
  const rows = await CouponRedemption.aggregate([
    { $match: { coupon: { $in: ids } } },
    { $group: { _id: { coupon: '$coupon', order: '$order' } } },
    { $group: { _id: '$_id.coupon', orders: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.orders]));
}

router.get('/', async (req, res) => {
  try {
    const list = await Coupon.find().sort({ createdAt: -1 }).lean();
    const used = await usage(list.map((c) => c._id));
    res.json({ coupons: list.map((c) => ({ ...c, description: describe(c), timesUsed: used.get(String(c._id)) || 0 })) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load coupons' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { value, error } = validate(req.body || {}, { creating: true });
    if (error) return res.status(400).json({ message: error });
    const coupon = await Coupon.create({ active: true, ...value });
    res.status(201).json({ coupon: { ...coupon.toObject(), description: describe(coupon), timesUsed: 0 } });
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ message: 'A coupon with this code already exists.' });
    res.status(500).json({ message: 'Failed to create the coupon' });
  }
});

// The code can't change — customers may already have it. Everything else can;
// orders keep the terms they were placed with.
router.patch('/:id', async (req, res) => {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(400).json({ message: 'Invalid coupon id' });
    if (req.body?.code !== undefined) return res.status(400).json({ message: "A coupon's code can't be changed. Create a new coupon instead." });
    const { value, error } = validate(req.body || {}, { creating: false });
    if (error) return res.status(400).json({ message: error });
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    const used = await usage([coupon._id]);
    res.json({ coupon: { ...coupon.toObject(), description: describe(coupon), timesUsed: used.get(String(coupon._id)) || 0 } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update the coupon' });
  }
});

// Only a coupon nobody has used can be deleted; a used one is switched off, so
// the record of who used it stays.
router.delete('/:id', async (req, res) => {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(400).json({ message: 'Invalid coupon id' });
    const used = await usage([new mongoose.Types.ObjectId(req.params.id)]);
    const times = used.get(req.params.id) || 0;
    if (times > 0) return res.status(409).json({ message: `This coupon has been used on ${times} order${times !== 1 ? 's' : ''}. Switch it off instead.` });
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete the coupon' });
  }
});

module.exports = router;
