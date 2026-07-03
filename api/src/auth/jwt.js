'use strict';

const crypto = require('crypto');
const config = require('../config');

/** base64url encode a string/buffer. */
function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/** Sign a HS256 JWT with the given payload + ttl (seconds). */
function sign(payload, ttl) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + ttl }));
  const data = `${header}.${body}`;
  const sig = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(data)
    .digest('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
}

/** Verify + decode a JWT. Returns the payload, or null if invalid/expired. */
function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  const expected = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(data)
    .digest('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  // constant-time compare
  const a = Buffer.from(expected);
  const b = Buffer.from(parts[2]);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(),
    );
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Issue an access + refresh pair for a user id/role. */
function issueTokens(userId, role) {
  return {
    token: sign({ sub: userId, role, type: 'access' }, config.accessTtl),
    refresh: sign({ sub: userId, type: 'refresh' }, config.refreshTtl),
  };
}

module.exports = { sign, verify, issueTokens };
