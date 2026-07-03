'use strict';

const express = require('express');
const { query } = require('../db');
const { hashPassword, verifyPassword } = require('../auth/password');
const { issueTokens, verify, sign } = require('../auth/jwt');
const config = require('../config');

const router = express.Router();

// Columns returned to the client (never password_hash).
const USER_COLS =
  'id, full_name, email, phone_e164, role, customer_type, status, interest_rating, city, photo_url, created_at';

/** POST /auth/signup — register a patient. */
router.post('/signup', async (req, res, next) => {
  try {
    const b = req.body || {};
    const fullName = String(b.full_name || '').trim();
    const phone = String(b.phone_e164 || '').replace(/\s/g, '');
    const email = b.email ? String(b.email).trim().toLowerCase() : null;
    const city = b.city ? String(b.city).trim() : null;
    const password = String(b.password || '');

    const errors = [];
    if (!fullName) errors.push('Full name is required');
    if (!/^\+\d{8,15}$/.test(phone)) errors.push('WhatsApp number with country code is required');
    if (password.length < 6) errors.push('Password must be at least 6 characters');
    if (errors.length) return res.status(400).json({ message: errors.join('. ') });

    const passwordHash = hashPassword(password);
    const result = await query(
      `INSERT INTO users (full_name, email, phone_e164, city, password_hash, role, customer_type, status)
       VALUES ($1,$2,$3,$4,$5,'user','regular','active')
       ON CONFLICT (phone_e164) DO NOTHING
       RETURNING ${USER_COLS}`,
      [fullName, email, phone, city, passwordHash],
    );
    if (result.rowCount === 0) {
      return res.status(409).json({ message: 'This WhatsApp number is already registered' });
    }
    const user = result.rows[0];
    return res.json({ ...issueTokens(user.id, user.role), user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'That email or number is already registered' });
    }
    next(err);
  }
});

/** POST /auth/login — by email OR WhatsApp number. */
router.post('/login', async (req, res, next) => {
  try {
    const identifier = String((req.body || {}).identifier || '').trim();
    const password = String((req.body || {}).password || '');
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Enter your credentials' });
    }
    const result = await query(
      `SELECT ${USER_COLS}, password_hash FROM users
       WHERE (lower(email) = lower($1) OR phone_e164 = $1) AND status = 'active'
       LIMIT 1`,
      [identifier],
    );
    const row = result.rows[0];
    if (!row || !verifyPassword(password, row.password_hash)) {
      return res.status(401).json({ message: 'Invalid email/number or password' });
    }
    delete row.password_hash;
    return res.json({ ...issueTokens(row.id, row.role), user: row });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/refresh — exchange a refresh token for a new access token. */
router.post('/refresh', async (req, res, next) => {
  try {
    const payload = verify(String((req.body || {}).refresh || ''));
    if (!payload || payload.type !== 'refresh' || !payload.sub) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const result = await query(
      `SELECT id, role FROM users WHERE id = $1 AND status = 'active' LIMIT 1`,
      [payload.sub],
    );
    const row = result.rows[0];
    if (!row) return res.status(401).json({ message: 'User not found' });
    const token = sign({ sub: row.id, role: row.role, type: 'access' }, config.accessTtl);
    return res.json({ token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.USER_COLS = USER_COLS;
