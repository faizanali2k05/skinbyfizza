'use strict';

const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = express.Router();

/**
 * GET /prescriptions — patient sees own; doctor can pass ?user_id= to view a
 * patient's list.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const targetId =
      req.user.role === 'doctor' && req.query.user_id ? req.query.user_id : req.user.id;
    const result = await query(
      `SELECT id, user_id, item_name, price, notes, created_at
       FROM prescriptions WHERE user_id = $1 ORDER BY created_at DESC`,
      [targetId],
    );
    return res.json({ prescriptions: result.rows });
  } catch (err) {
    next(err);
  }
});

/** POST /prescriptions — doctor adds a product/service (+ price) for a patient. */
router.post('/', requireAuth, requireRole('doctor'), async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.user_id || !b.item_name) {
      return res.status(400).json({ message: 'user_id and item_name are required' });
    }
    const result = await query(
      `INSERT INTO prescriptions (user_id, doctor_id, item_name, price, notes)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, user_id, item_name, price, notes, created_at`,
      [b.user_id, req.user.id, b.item_name, b.price ?? null, b.notes || null],
    );
    return res.status(201).json({ prescription: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
