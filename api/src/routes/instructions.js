'use strict';

const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = express.Router();

/**
 * GET /instructions?user_id= — per-patient care instructions.
 * Doctor sees both kinds; manager sees only the team-facing ones (per PRD).
 */
router.get('/', requireAuth, requireRole('doctor', 'manager'), async (req, res, next) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ message: 'user_id is required' });
    const audienceFilter = req.user.role === 'manager' ? `AND audience = 'team'` : '';
    const result = await query(
      `SELECT id, audience, body, lang, created_at
       FROM instructions WHERE user_id = $1 ${audienceFilter} ORDER BY created_at DESC`,
      [userId],
    );
    return res.json({ instructions: result.rows });
  } catch (err) {
    next(err);
  }
});

/** POST /instructions — doctor writes a team-facing or self note. */
router.post('/', requireAuth, requireRole('doctor'), async (req, res, next) => {
  try {
    const b = req.body || {};
    const audience = b.audience === 'doctor' ? 'doctor' : 'team';
    if (!b.user_id || !b.body) return res.status(400).json({ message: 'user_id and body are required' });
    const result = await query(
      `INSERT INTO instructions (user_id, audience, body, lang)
       VALUES ($1,$2,$3,$4) RETURNING id, audience, body, lang, created_at`,
      [b.user_id, audience, String(b.body).trim(), b.lang || 'en'],
    );
    return res.status(201).json({ instruction: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
