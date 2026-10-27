// Kenyan mobile numbers, normalised to +2547XXXXXXXX / +2541XXXXXXXX (P10-3).
// Accepts what people actually type: 0712 345 678, 712345678, 254712345678,
// +254 712-345-678. Anything else is null — the caller decides the message.
function normalizeKenyanPhone(input) {
  if (input == null) return null;
  const digits = String(input).replace(/[\s\-().]/g, '').replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) return null;

  let national;
  if (/^254[17]\d{8}$/.test(digits)) national = digits.slice(3);
  else if (/^0[17]\d{8}$/.test(digits)) national = digits.slice(1);
  else if (/^[17]\d{8}$/.test(digits)) national = digits;
  else return null;

  return `+254${national}`;
}

// M-Pesa confirmation codes are 10 letters/digits (e.g. "SJ12AB3CDE"). The
// shop checks every code against its own statement before marking an order
// paid, so this is a typo guard, not proof of payment — a little leeway on
// length keeps a format change at Safaricom from locking customers out.
function normalizeMpesaCode(input) {
  if (input == null) return null;
  const code = String(input).trim().toUpperCase().replace(/\s+/g, '');
  return /^[A-Z0-9]{8,12}$/.test(code) ? code : null;
}

module.exports = { normalizeKenyanPhone, normalizeMpesaCode };
