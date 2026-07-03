'use strict';

const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../auth/middleware');
const { USER_COLS } = require('./auth');

const router = express.Router();

/** GET /me — current user. */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await query(`SELECT ${USER_COLS} FROM users WHERE id = $1 LIMIT 1`, [req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/** POST /profile/update — edit own editable fields. */
router.post('/profile/update', requireAuth, async (req, res, next) => {
  try {
    const b = req.body || {};
    // Whitelist editable fields only.
    const fields = [];
    const values = [];
    let i = 1;
    for (const key of ['full_name', 'email', 'city', 'photo_url']) {
      if (b[key] !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(key === 'email' && b[key] ? String(b[key]).toLowerCase() : b[key]);
      }
    }
    if (fields.length === 0) return res.status(400).json({ message: 'Nothing to update' });
    values.push(req.user.id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING ${USER_COLS}`,
      values,
    );
    return res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'That email is already in use' });
    next(err);
  }
});

module.exports = router;
