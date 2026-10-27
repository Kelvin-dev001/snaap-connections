// Customer account rules (P10-4), shared by /api/customer and checkout's
// "Create an account" tick box so the two can't drift.
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const BCRYPT_COST = 10; // bcryptjs is pure JS; 10 keeps login quick on the Render instance
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Compared against when the email isn't registered, so "no such account" and
// "wrong password" take the same time and can't be told apart by timing.
const DUMMY_HASH = bcrypt.hashSync('snaap-no-such-account', BCRYPT_COST);

function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    return `Use a password of at least ${PASSWORD_MIN} characters.`;
  }
  if (password.length > PASSWORD_MAX) return 'That password is too long.';
  return null;
}

const emailOk = (email) => typeof email === 'string' && email.length <= 120 && EMAIL.test(email);

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_COST);

async function emailTaken(email) {
  return Boolean(await User.exists({ email }));
}

// Throws an error with code EMAIL_TAKEN if the email is registered meanwhile.
async function createCustomer({ name, email, phone, password }) {
  try {
    return await User.create({
      name,
      email,
      phone: phone || undefined,
      password: await hashPassword(password),
      role: 'customer',
    });
  } catch (err) {
    if (err && err.code === 11000) {
      const taken = new Error('EMAIL_TAKEN');
      taken.code = 'EMAIL_TAKEN';
      throw taken;
    }
    throw err;
  }
}

// True only for the right password. Always runs one bcrypt comparison.
async function checkPassword(user, password) {
  const ok = await bcrypt.compare(typeof password === 'string' ? password : '', user ? user.password : DUMMY_HASH);
  return Boolean(user) && ok;
}

// What the customer's own browser may see about their account.
function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    defaultAddress: user.defaultAddress?.county ? {
      county: user.defaultAddress.county,
      town: user.defaultAddress.town || '',
      address: user.defaultAddress.address || '',
    } : null,
    mustChangePassword: Boolean(user.mustChangePassword),
    createdAt: user.createdAt,
  };
}

const EMAIL_TAKEN_MESSAGE = 'An account with this email already exists. Sign in instead.';

module.exports = {
  PASSWORD_MIN,
  passwordProblem,
  emailOk,
  hashPassword,
  emailTaken,
  createCustomer,
  checkPassword,
  publicUser,
  EMAIL_TAKEN_MESSAGE,
};
