const mongoose = require('mongoose');

// Named sequences (P10-3): one atomic $inc per order number, so two customers
// checking out at the same moment can never be given the same number.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

// 1, 2, 3… for each name. Callers add their own offset (orders start at 10001).
async function nextSeq(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

module.exports = { Counter, nextSeq };
