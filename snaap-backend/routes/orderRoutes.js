const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { nextSeq } = require('../models/Counter');
const requireAdmin = require('../middleware/requireAdmin');
const { priceOrder, computeTotals, zoneForCounty } = require('../utils/pricing');
const { normalizeKenyanPhone, normalizeMpesaCode } = require('../utils/phone');
const BUSINESS = require('../config/business');
const { paymentSummary, allPaid, publicOrder } = require('../utils/orderView');
const { attachCustomer } = require('../middleware/requireCustomer');
const { passwordProblem, emailTaken, createCustomer, publicUser, EMAIL_TAKEN_MESSAGE } = require('../utils/accounts');
const { setCustomerCookie } = require('../utils/customerToken');

// P10-3: orders are placed on the site (WhatsApp is support only now) and
// handled in the admin portal. Payment is M-Pesa Buy Goods to the shop's Till;
// the customer gives us the confirmation code and the shop checks it against
// its statement before an order counts as paid.

const ORDER_NUMBER_OFFSET = 10000; // the first order is SC-10001
const MAX_PAYMENT_ENTRIES = 10;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OBJECT_ID = /^[a-f0-9]{24}$/i;

const str = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "10023", "sc10023", "SC-10023" -> "SC-10023"
function normalizeOrderNumber(input) {
  const m = str(input).toUpperCase().match(/^(?:SC-?)?(\d{5,7})$/);
  return m ? `SC-${m[1]}` : null;
}

// Customer-facing limits key on the order number or the phone, never the IP:
// many Kenyan phones share one carrier-NAT address, so an IP limit would lock
// real buyers out together. Requests with no usable key are refused by
// validation anyway, so they are not counted.
const keyedLimiter = ({ key, message, ...options }) =>
  rateLimit({
    ...options,
    keyGenerator: key,
    skip: (req) => !key(req),
    standardHeaders: true,
    legacyHeaders: false,
    validate: false, // the IP-based checks don't apply to a custom key
    message: { success: false, message },
  });

// Counts orders actually placed, so fixing a typo in the form never locks a
// customer out.
const placeLimiter = keyedLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skipFailedRequests: true,
  key: (req) => normalizeKenyanPhone(req.body?.customer?.phone),
  message: 'Too many orders from this phone number in the last hour. Please contact us if you need help.',
});
// Counts FAILED lookups only: that is what guessing phone numbers for a known
// order number looks like. A customer refreshing their own order is never hit.
const lookupLimiter = keyedLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  key: (req) => normalizeOrderNumber(req.body?.orderNumber),
  message: 'Too many attempts for this order. Please wait a few minutes, or contact us.',
});

async function loadProducts(items) {
  const ids = [...new Set((Array.isArray(items) ? items : [])
    .map((i) => str(i?.productId))
    .filter((id) => OBJECT_ID.test(id)))].slice(0, 50);
  const docs = await Product.find({ _id: { $in: ids } })
    .select('name price discountPrice inStock isDeleted sku thumbnail images')
    .lean();
  return new Map(docs.map((d) => [String(d._id), d]));
}

// Add a code for one part of the payment, or correct one still awaiting check.
async function recordPayment(order, { kind, mpesaCode, by, verified = false }) {
  const possibleDuplicate = Boolean(await Order.exists({ 'payments.mpesaCode': mpesaCode, _id: { $ne: order._id } }))
    || (order.payments || []).some((p) => p.mpesaCode === mpesaCode && p.kind !== kind);
  const pending = (order.payments || []).filter((p) => p.kind === kind && p.status === 'submitted').pop();
  if (pending && !verified) {
    pending.mpesaCode = mpesaCode;
    pending.submittedAt = new Date();
    pending.submittedBy = by;
    pending.possibleDuplicate = possibleDuplicate;
  } else {
    order.payments.push({
      kind, mpesaCode, submittedBy: by, possibleDuplicate,
      status: verified ? 'verified' : 'submitted',
      ...(verified ? { reviewedAt: new Date() } : {}),
    });
  }
}

// Which part a new code pays for, or why nothing can be paid.
function resolvePaymentKind(order, requested) {
  if (order.status === 'cancelled') return { error: 'This order was cancelled.' };
  const summary = paymentSummary(order);
  const open = (part) => part && (part.state === 'due' || part.state === 'submitted');

  if (order.paymentPlan !== 'split') {
    if (requested && requested !== 'full') return { error: 'This order is paid in one payment.' };
    if (summary.full.state === 'verified') return { error: 'This order is already paid. Thank you!' };
    if (summary.full.amount == null) return { error: 'This order has no total yet. We will contact you.' };
    return { kind: 'full', amount: summary.full.amount };
  }

  // With no explicit part: unpaid items first, then a payable delivery fee,
  // and otherwise a correction to the items code still awaiting a check.
  const deliveryPayable = open(summary.delivery) && summary.delivery.amount != null;
  const kind = requested
    || (summary.items.state === 'due' ? 'items' : deliveryPayable ? 'delivery' : summary.items.state === 'submitted' ? 'items' : 'delivery');
  if (kind === 'items') {
    if (!open(summary.items)) return { error: 'The items on this order are already paid.' };
    return { kind, amount: summary.items.amount };
  }
  if (kind === 'delivery') {
    if (summary.delivery.state === 'awaiting-fee') {
      return { error: "We haven't confirmed your delivery fee yet. We'll call you with it before dispatch." };
    }
    if (!open(summary.delivery)) return { error: 'The delivery fee on this order is already paid.' };
    return { kind, amount: summary.delivery.amount };
  }
  return { error: 'Unknown payment.' };
}

async function findCustomerOrder(body) {
  const orderNumber = normalizeOrderNumber(body?.orderNumber);
  const phone = normalizeKenyanPhone(body?.phone);
  if (!orderNumber || !phone) return null;
  return Order.findOne({ orderNumber, 'customer.phone': phone });
}

const NOT_FOUND = "We couldn't find an order with that number and phone. Check both and try again.";

// ─── PUBLIC ──────────────────────────────────────────────────────────────

// What the API prices with — read by the storefront's daily drift check.
router.get('/config', (req, res) => {
  res.json({
    till: BUSINESS.MPESA_TILL,
    pickupLocation: BUSINESS.PICKUP_LOCATION,
    deliveryZones: BUSINESS.DELIVERY_ZONES,
    maxQtyPerLine: BUSINESS.MAX_QTY_PER_LINE,
    maxLines: BUSINESS.MAX_LINES,
  });
});

// Price a cart without placing it. Fulfilment is optional (the cart page
// prices items before delivery is chosen).
router.post('/quote', async (req, res) => {
  try {
    const { items, fulfilment } = req.body || {};
    const productsById = await loadProducts(items);
    const priced = priceOrder({
      items,
      productsById,
      fulfilment: fulfilment ? { method: str(fulfilment.method), county: str(fulfilment.county) } : null,
    });
    res.json({
      errors: priced.errors,
      lineErrors: priced.lineErrors,
      lines: priced.lines,
      delivery: priced.delivery,
      totals: priced.totals,
      paymentPlan: priced.paymentPlan,
      dueNow: priced.dueNow,
    });
  } catch (err) {
    console.error('Error pricing cart:', err);
    res.status(500).json({ message: 'We could not check your cart. Please try again.' });
  }
});

// Place an order — as a guest, signed in (P10-4: linked to the account), or
// creating an account in the same step.
router.post('/', placeLimiter, attachCustomer, async (req, res) => {
  let newUser = null;
  try {
    const body = req.body || {};
    const errors = [];

    const name = str(body.customer?.name);
    const phone = normalizeKenyanPhone(body.customer?.phone);
    const email = str(body.customer?.email).toLowerCase();
    if (name.length < 2 || name.length > 80) errors.push('Enter your full name.');
    if (!phone) errors.push('Enter a valid Kenyan mobile number, e.g. 0712 345 678.');
    if (email && (email.length > 120 || !EMAIL.test(email))) errors.push('Enter a valid email address, or leave it blank.');

    const method = str(body.fulfilment?.method);
    const fulfilment = { method, notes: str(body.fulfilment?.notes) };
    if (method === 'delivery') {
      fulfilment.county = str(body.fulfilment?.county);
      fulfilment.town = str(body.fulfilment?.town);
      fulfilment.address = str(body.fulfilment?.address);
      if (fulfilment.town.length < 2 || fulfilment.town.length > 80) errors.push('Enter your town or area.');
      if (fulfilment.address.length < 3 || fulfilment.address.length > 200) errors.push('Enter your street, building or a nearby landmark.');
    }
    if (fulfilment.notes.length > 300) errors.push('Delivery notes must be 300 characters or fewer.');

    let mpesaCode = null;
    if (str(body.mpesaCode)) {
      mpesaCode = normalizeMpesaCode(body.mpesaCode);
      if (!mpesaCode) {
        errors.push("That M-Pesa code doesn't look right. It's the 10 letters and numbers at the start of your M-Pesa SMS — or leave it blank and pay later.");
      }
    }

    // "Create an account" (guests only). Checked with everything else, before
    // anything is saved, so a problem never leaves a half-placed order.
    const wantsAccount = !req.customer && body.createAccount === true;
    if (wantsAccount) {
      if (!email) errors.push('Enter your email address to create an account.');
      const problem = passwordProblem(body.password);
      if (problem) errors.push(problem);
    }

    const productsById = await loadProducts(body.items);
    const priced = priceOrder({ items: body.items, productsById, fulfilment });
    errors.push(...priced.errors);

    // The cart is out of date (price, stock or a retired product). Send the
    // customer back to it rather than placing a different order than they saw.
    if (priced.lineErrors.length) {
      return res.status(409).json({
        message: 'Some items in your cart have changed. Please review your cart.',
        lineErrors: priced.lineErrors,
      });
    }
    if (errors.length || !priced.lines.length) {
      return res.status(400).json({ message: errors[0] || 'Your cart is empty.', errors });
    }

    // An existing account is never attached silently (owner, P10-4): the
    // customer is asked to sign in, and nothing is placed.
    if (wantsAccount) {
      const taken = { code: 'EMAIL_TAKEN', message: `${EMAIL_TAKEN_MESSAGE} Or untick "Create an account" to order as a guest.` };
      if (await emailTaken(email)) return res.status(409).json(taken);
      try {
        newUser = await createCustomer({ name, email, phone, password: body.password });
      } catch (e) {
        if (e.code === 'EMAIL_TAKEN') return res.status(409).json(taken);
        throw e;
      }
    }
    const account = req.customer || newUser;

    const order = new Order({
      orderNumber: `SC-${ORDER_NUMBER_OFFSET + (await nextSeq('order'))}`,
      user: account ? account._id : null,
      customer: { name, phone, email: email || undefined },
      items: priced.lines,
      fulfilment: {
        method: priced.delivery.method,
        county: priced.delivery.county || undefined,
        town: fulfilment.town || undefined,
        address: fulfilment.address || undefined,
        notes: fulfilment.notes || undefined,
      },
      totals: {
        subtotal: priced.totals.subtotal,
        itemsDiscount: priced.totals.itemsDiscount,
        deliveryFee: priced.totals.deliveryFee,
        deliveryDiscount: priced.totals.deliveryDiscount,
        total: priced.totals.total,
      },
      deliveryStatus: priced.delivery.status,
      paymentPlan: priced.paymentPlan,
      payments: [],
      status: 'pending',
      statusHistory: [{ status: 'pending', note: 'Order placed online' }],
    });
    if (mpesaCode) {
      await recordPayment(order, { kind: priced.paymentPlan === 'split' ? 'items' : 'full', mpesaCode, by: 'customer' });
    }
    await order.save();
    // The order exists from here on, so the account it references must stay.
    const createdUser = newUser;
    newUser = null;

    if (account) {
      // The first delivery address becomes the account's default for next
      // time. A convenience only: a failure here must not fail the order.
      if (order.fulfilment.method === 'delivery' && !account.defaultAddress?.county) {
        const defaultAddress = { county: order.fulfilment.county, town: order.fulfilment.town, address: order.fulfilment.address };
        try {
          await account.constructor.updateOne({ _id: account._id }, { $set: { defaultAddress } });
          account.defaultAddress = defaultAddress;
        } catch (e) {
          console.warn('Could not save default address:', e.message);
        }
      }
      if (createdUser) setCustomerCookie(res, createdUser);
    }

    res.status(201).json({ order: publicOrder(order), ...(createdUser ? { account: publicUser(createdUser) } : {}) });
  } catch (err) {
    // An account made in this request is removed again if the order failed, so
    // a retry doesn't hit "email already registered".
    if (newUser) await newUser.constructor.deleteOne({ _id: newUser._id }).catch(() => {});
    console.error('Error placing order:', err);
    res.status(500).json({ message: 'We could not place your order. Please try again, or contact us.' });
  }
});

// Look up an order with its number + the phone it was placed with.
router.post('/track', lookupLimiter, async (req, res) => {
  try {
    const order = await findCustomerOrder(req.body);
    if (!order) return res.status(404).json({ message: NOT_FOUND });
    res.json({ order: publicOrder(order) });
  } catch (err) {
    console.error('Error tracking order:', err);
    res.status(500).json({ message: 'We could not look up your order. Please try again.' });
  }
});

// Give (or correct) the M-Pesa code for a payment.
router.post('/payment', lookupLimiter, async (req, res) => {
  try {
    const order = await findCustomerOrder(req.body);
    if (!order) return res.status(404).json({ message: NOT_FOUND });

    const mpesaCode = normalizeMpesaCode(req.body?.mpesaCode);
    if (!mpesaCode) {
      return res.status(400).json({ message: "That M-Pesa code doesn't look right. It's the 10 letters and numbers at the start of your M-Pesa SMS." });
    }
    const requested = ['full', 'items', 'delivery'].includes(req.body?.kind) ? req.body.kind : null;
    const target = resolvePaymentKind(order, requested);
    if (target.error) return res.status(409).json({ message: target.error });
    if ((order.payments || []).length >= MAX_PAYMENT_ENTRIES) {
      return res.status(429).json({ message: 'Please contact us to update the payment on this order.' });
    }

    await recordPayment(order, { kind: target.kind, mpesaCode, by: 'customer' });
    await order.save();
    res.json({ message: "Thanks — we'll check your payment and update your order.", order: publicOrder(order) });
  } catch (err) {
    console.error('Error recording payment code:', err);
    res.status(500).json({ message: 'We could not save your M-Pesa code. Please try again.' });
  }
});

// ─── ADMIN ───────────────────────────────────────────────────────────────

// For the sidebar badge, polled by the admin portal.
router.get('/pending-count', requireAdmin, async (req, res) => {
  try {
    const [pending, paymentsToCheck] = await Promise.all([
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: { $ne: 'cancelled' }, 'payments.status': 'submitted' }),
    ]);
    res.json({ pending, paymentsToCheck });
  } catch (err) {
    console.error('Error counting orders:', err);
    res.status(500).json({ message: 'Failed to count orders' });
  }
});

// GET /api/orders?status=&search=&page=&limit=
router.get('/', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const filter = {};
    const status = str(req.query.status);
    if (Order.ORDER_STATUSES.includes(status)) filter.status = status;
    else if (status === 'payment-check') {
      filter.status = { $ne: 'cancelled' };
      filter['payments.status'] = 'submitted';
    }
    const search = str(req.query.search).slice(0, 60);
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      const phone = normalizeKenyanPhone(search);
      filter.$or = [
        { orderNumber: rx },
        { 'customer.name': rx },
        { 'customer.phone': phone || rx },
        { phone: rx }, // legacy orders
        { 'payments.mpesaCode': search.toUpperCase() },
      ];
    }
    const [orders, count] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    res.json({
      orders: orders.map((o) => ({ ...o, payment: o.orderNumber ? paymentSummary(o) : null })),
      count,
      page,
      pages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Error listing orders:', err);
    res.status(500).json({ message: 'Failed to load orders' });
  }
});

router.get('/:id', requireAdmin, async (req, res) => {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(400).json({ message: 'Invalid order id' });
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order: { ...order, payment: order.orderNumber ? paymentSummary(order) : null } });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Failed to load order' });
  }
});

// PATCH /api/orders/:id — any of:
//   { status, statusNote }                       move the order along
//   { deliveryFee }                              confirm a Nairobi/Machakos fee
//   { payment: { id, action: verify|reject } }   after checking the Till statement
//   { addPayment: { mpesaCode, kind } }          a code the customer gave by phone
//   { adminNotes }
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(400).json({ message: 'Invalid order id' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!order.orderNumber) {
      return res.status(409).json({ message: 'This is a legacy order from before online checkout and cannot be edited here.' });
    }
    const body = req.body || {};
    const history = (status, note) => order.statusHistory.push({ status, note });

    if (body.deliveryFee !== undefined) {
      const fee = Number(body.deliveryFee);
      if (order.fulfilment?.method !== 'delivery' || !['tbc', 'confirmed'].includes(order.deliveryStatus)) {
        return res.status(409).json({ message: 'Only Nairobi/Machakos delivery fees are set by hand.' });
      }
      const zone = zoneForCounty(order.fulfilment.county)?.zone;
      const min = zone?.feeMinKES ?? 0;
      const max = zone?.feeMaxKES ?? 0;
      if (!Number.isInteger(fee) || fee < min || fee > max) {
        return res.status(400).json({ message: `The delivery fee for ${order.fulfilment.county} must be a whole number from KSh ${min.toLocaleString('en-KE')} to KSh ${max.toLocaleString('en-KE')} — the range published on the site.` });
      }
      const totals = computeTotals(order.totals.subtotal, fee, order.coupon?.code ? order.coupon : null);
      order.totals.deliveryFee = totals.deliveryFee;
      order.totals.deliveryDiscount = totals.deliveryDiscount;
      order.totals.total = totals.total;
      order.deliveryStatus = 'confirmed';
      history(order.status, `Delivery fee set to KSh ${fee.toLocaleString('en-KE')}`);
    }

    if (body.addPayment) {
      const mpesaCode = normalizeMpesaCode(body.addPayment.mpesaCode);
      if (!mpesaCode) return res.status(400).json({ message: 'That M-Pesa code is not valid.' });
      const requested = ['full', 'items', 'delivery'].includes(body.addPayment.kind) ? body.addPayment.kind : null;
      const target = resolvePaymentKind(order, requested);
      if (target.error) return res.status(409).json({ message: target.error });
      // Entered by the shop after checking the statement, so verified at once.
      await recordPayment(order, { kind: target.kind, mpesaCode, by: 'admin', verified: true });
      history(order.status, `M-Pesa code ${mpesaCode} recorded for the ${target.kind} payment`);
    }

    if (body.payment) {
      const entry = order.payments.id(str(body.payment.id));
      if (!entry) return res.status(404).json({ message: 'Payment not found on this order.' });
      if (!['verify', 'reject'].includes(body.payment.action)) return res.status(400).json({ message: 'Unknown payment action.' });
      entry.status = body.payment.action === 'verify' ? 'verified' : 'rejected';
      entry.reviewedAt = new Date();
      history(order.status, `M-Pesa code ${entry.mpesaCode} ${entry.status}`);
    }

    // Everything owed is verified: the order is paid. Only ever moves forward
    // from pending/confirmed — it never pulls back a dispatched order.
    if ((body.addPayment || body.payment) && ['pending', 'confirmed'].includes(order.status)
        && allPaid(paymentSummary(order))) {
      order.status = 'paid';
      history('paid', 'All payments verified');
    }

    if (body.status !== undefined) {
      const status = str(body.status);
      if (!Order.ORDER_STATUSES.includes(status)) return res.status(400).json({ message: 'Unknown status.' });
      if (status !== order.status) {
        order.status = status;
        history(status, str(body.statusNote).slice(0, 200) || undefined);
      }
    }

    if (body.adminNotes !== undefined) {
      const notes = str(body.adminNotes);
      if (notes.length > 2000) return res.status(400).json({ message: 'Notes must be 2000 characters or fewer.' });
      order.adminNotes = notes;
    }

    await order.save();
    const saved = order.toObject();
    res.json({ order: { ...saved, payment: paymentSummary(saved) } });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// DELETE: Remove an order by ID (ADMIN ONLY). Prefer cancelling — a deleted
// order is gone from the records.
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(400).json({ message: 'Invalid order id' });
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
