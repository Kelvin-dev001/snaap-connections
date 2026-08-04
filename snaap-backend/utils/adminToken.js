// Admin auth token transport (P6-D). The token lives in an httpOnly cookie so
// page JavaScript (and therefore XSS) can't read it. No cookie-parser dependency:
// res.cookie() is native Express, and we read the cookie by hand.

const COOKIE_NAME = 'admin_token';

// Prefer the httpOnly cookie; fall back to a Bearer header so a cached pre-migration
// frontend keeps working during rollout. Remove the header fallback once every
// client is on the cookie.
function getTokenFromReq(req) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]+)'));
  if (m) return decodeURIComponent(m[1]);
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1];
  return null;
}

// In production, COOKIE_DOMAIN (e.g. ".snaapconnections.co.ke") makes the API
// subdomain and the site same-site, so SameSite=Lax + Secure yields a first-party
// cookie that works in every browser. In local dev (no COOKIE_DOMAIN, plain http)
// we relax to a host-only, non-secure cookie so login works over http://localhost.
function cookieOptions() {
  const domain = process.env.COOKIE_DOMAIN || undefined;
  const isProd = Boolean(domain) || process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 2 * 60 * 60 * 1000, // 2h — matches the JWT expiry
    ...(domain ? { domain } : {}),
  };
}

module.exports = { COOKIE_NAME, getTokenFromReq, cookieOptions };
