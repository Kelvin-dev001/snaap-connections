const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { requireCustomer } = require('../middleware/requireCustomer');
const { setCustomerCookie, clearCustomerCookie } = require('../utils/customerToken');
const {
  passwordProblem, emailOk, hashPassword, emailTaken, createCustomer, checkPassword, publicUser, EMAIL_TAKEN_MESSAGE,
} = require('../utils/accounts');
const { normalizeKenyanPhone } = require('../utils/phone');
const { zoneForCounty } = require('../utils/pricing');
const { publicOrder } = require('../utils/orderView');

// Customer accounts (P10-4). Email + password (owner's choice). There is no
// self-service reset — the shop resets a password from the admin portal and
// the customer sets a new one at their next sign-in.

const str = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');
const normEmail = (v) => str(v).toLowerCase();
const OBJECT_ID = /^[a-f0-9]{24}$/i;

// Limits key on the email, never the IP: Kenyan carrier NAT puts many real
// customers behind one address.
const perEmail = ({ message, ...options }) =>
  rateLimit({
    ...options,
    keyGenerator: (req) => normEmail(req.body?.email),
    skip: (req) => !normEmail(req.body?.email),
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: { message },
  });

// Counts wrong passwords only; signing in successfully never uses it up.
const loginLimiter = perEmail({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Too many sign-in attempts for this email. Please wait 15 minutes, or contact us.',
});
const registerLimiter = perEmail({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many attempts. Please try again later.',
});

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const name = str(req.body?.name);
    const email = normEmail(req.body?.email);
    const phoneInput = str(req.body?.phone);
    const phone = phoneInput ? normalizeKenyanPhone(phoneInput) : null;

    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Enter your full name.' });
    if (!emailOk(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (phoneInput && !phone) return res.status(400).json({ message: 'Enter a valid Kenyan mobile number, or leave it blank.' });
    const problem = passwordProblem(req.body?.password);
    if (problem) return res.status(400).json({ message: problem });
    if (await emailTaken(email)) return res.status(409).json({ code: 'EMAIL_TAKEN', message: EMAIL_TAKEN_MESSAGE });

    const user = await createCustomer({ name, email, phone, password: req.body.password });
    setCustomerCookie(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    if (err.code === 'EMAIL_TAKEN') return res.status(409).json({ code: 'EMAIL_TAKEN', message: EMAIL_TAKEN_MESSAGE });
    console.error('Error registering customer:', err);
    res.status(500).json({ message: 'We could not create your account. Please try again.' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = normEmail(req.body?.email);
    const user = email ? await User.findOne({ email, role: 'customer' }) : null;
    // One generic answer for "no such account" and "wrong password".
    if (!(await checkPassword(user, req.body?.password))) {
      return res.status(401).json({ message: 'That email and password don’t match an account.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been blocked. Please contact us.' });
    }
    user.lastLoginAt = new Date();
    await user.save();
    setCustomerCookie(res, user);
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('Error signing in customer:', err);
    res.status(500).json({ message: 'We could not sign you in. Please try again.' });
  }
});

router.post('/logout', (req, res) => {
  clearCustomerCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireCustomer, (req, res) => {
  res.json({ user: publicUser(req.customer) });
});

// Name, phone and the default delivery address used to pre-fill checkout.
router.patch('/me', requireCustomer, async (req, res) => {
  try {
    const user = req.customer;
    const body = req.body || {};
    if (body.name !== undefined) {
      const name = str(body.name);
      if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Enter your full name.' });
      user.name = name;
    }
    if (body.phone !== undefined) {
      const input = str(body.phone);
      const phone = input ? normalizeKenyanPhone(input) : null;
      if (input && !phone) return res.status(400).json({ message: 'Enter a valid Kenyan mobile number, or leave it blank.' });
      user.phone = phone || undefined;
    }
    if (body.defaultAddress !== undefined) {
      if (body.defaultAddress === null) {
        user.defaultAddress = undefined;
      } else {
        const found = zoneForCounty(body.defaultAddress?.county);
        const town = str(body.defaultAddress?.town);
        const address = str(body.defaultAddress?.address);
        if (!found) return res.status(400).json({ message: 'Choose one of the counties we deliver to.' });
        if (town.length < 2 || town.length > 80) return res.status(400).json({ message: 'Enter your town or area.' });
        if (address.length < 3 || address.length > 200) return res.status(400).json({ message: 'Enter your street, building or a nearby landmark.' });
        user.defaultAddress = { county: found.county, town, address };
      }
    }
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ message: 'We could not save your details. Please try again.' });
  }
});

// Change password. Also how a customer replaces a temporary password the shop
// gave them. Ends every other session (the token version moves on).
router.post('/password', requireCustomer, async (req, res) => {
  try {
    const user = await User.findById(req.customer._id);
    if (!(await checkPassword(user, req.body?.currentPassword))) {
      return res.status(400).json({ message: 'Your current password is not right.' });
    }
    const problem = passwordProblem(req.body?.newPassword);
    if (problem) return res.status(400).json({ message: problem });
    if (req.body.newPassword === req.body.currentPassword) {
      return res.status(400).json({ message: 'Choose a new password that is different from the current one.' });
    }
    user.password = await hashPassword(req.body.newPassword);
    user.mustChangePassword = false;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    setCustomerCookie(res, user); // this device stays signed in
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'We could not change your password. Please try again.' });
  }
});

// The customer's own orders — those placed while signed in or when the
// account was created. Guest orders are never attached by phone (owner).
router.get('/orders', requireCustomer, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.customer._id }).sort({ createdAt: -1 }).limit(50).lean();
    // The phone the order was placed with lets the owner send an M-Pesa code.
    res.json({ orders: orders.map((o) => ({ ...publicOrder(o), phone: o.customer?.phone || null })) });
  } catch (err) {
    console.error('Error listing customer orders:', err);
    res.status(500).json({ message: 'We could not load your orders. Please try again.' });
  }
});

router.get('/wishlist', requireCustomer, (req, res) => {
  res.json({ ids: (req.customer.wishlist || []).map(String) });
});

// Replace the saved wishlist (the device merges first, then sends the result).
router.put('/wishlist', requireCustomer, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const clean = [...new Set(ids.map(str).filter((id) => OBJECT_ID.test(id)))].slice(0, 100);
    await User.updateOne({ _id: req.customer._id }, { $set: { wishlist: clean } });
    res.json({ ids: clean });
  } catch (err) {
    console.error('Error saving wishlist:', err);
    res.status(500).json({ message: 'We could not save your wishlist.' });
  }
});

module.exports = router;
