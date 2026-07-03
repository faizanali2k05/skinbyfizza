'use strict';

const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../auth/middleware');
const { hashPassword } = require('../auth/password');

const router = express.Router();

const USER_COLS =
  'id, full_name, email, phone_e164, role, customer_type, status, interest_rating, city, photo_url, created_at';

/** GET /users?q= — staff list/search (by name or number). */
router.get('/', requireAuth, requireRole('doctor', 'manager'), async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    let result;
    if (q) {
      result = await query(
        `SELECT ${USER_COLS} FROM users
         WHERE full_name ILIKE $1 OR phone_e164 ILIKE $1 OR email ILIKE $1
         ORDER BY created_at DESC LIMIT 100`,
        [`%${q}%`],
      );
    } else {
      result = await query(`SELECT ${USER_COLS} FROM users ORDER BY created_at DESC LIMIT 100`);
    }
    return res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
});

/** POST /users/:id/register — give a WhatsApp lead a login (email + password). */
router.post('/:id/register', requireAuth, requireRole('doctor', 'manager'), async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.email || !b.password) return res.status(400).json({ message: 'email and password are required' });
    const result = await query(
      `UPDATE users SET email = $2, password_hash = $3, status = 'active'
       WHERE id = $1 RETURNING ${USER_COLS}`,
      [req.params.id, String(b.email).toLowerCase(), hashPassword(b.password)],
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'That email is already in use' });
    next(err);
  }
});

/** POST /users/:id/rating — doctor sets the 1–5 interest rating. */
router.post('/:id/rating', requireAuth, requireRole('doctor'), async (req, res, next) => {
  try {
    const rating = parseInt((req.body || {}).interest_rating, 10);
    if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ message: 'Rating must be 1–5' });
    const result = await query(
      `UPDATE users SET interest_rating = $2 WHERE id = $1 RETURNING ${USER_COLS}`,
      [req.params.id, rating],
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/** POST /users/:id/vip — doctor toggles VIP customer type. */
router.post('/:id/vip', requireAuth, requireRole('doctor'), async (req, res, next) => {
  try {
    const type = (req.body || {}).customer_type === 'vip' ? 'vip' : 'regular';
    const result = await query(
      `UPDATE users SET customer_type = $2 WHERE id = $1 RETURNING ${USER_COLS}`,
      [req.params.id, type],
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── Doctor-only, restricted from managers (per requirements) ──────────────

/** POST /users/:id/status — activate/deactivate (DOCTOR only). */
router.post('/:id/status', requireAuth, requireRole('doctor'), async (req, res, next) => {
  try {
    const status = (req.body || {}).status === 'inactive' ? 'inactive' : 'active';
    const result = await query(
      `UPDATE users SET status = $2 WHERE id = $1 RETURNING ${USER_COLS}`,
      [req.params.id, status],
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/** POST /users/:id/role — change role incl. make admin/doctor (DOCTOR only). */
router.post('/:id/role', requireAuth, requireRole('doctor'), async (req, res, next) => {
  try {
    const role = (req.body || {}).role;
    if (!['user', 'manager', 'doctor'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const result = await query(
      `UPDATE users SET role = $2 WHERE id = $1 RETURNING ${USER_COLS}`,
      [req.params.id, role],
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/** DELETE /users/:id — remove a user (DOCTOR only). */
router.delete('/:id', requireAuth, requireRole('doctor'), async (req, res, next) => {
  try {
    const result = await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    return res.json({ ok: result.rowCount > 0 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
