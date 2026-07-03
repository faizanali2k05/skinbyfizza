'use strict';

const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = express.Router();

const PROC_COLS =
  'id, title, description, category, duration, sessions, visits_per_session, session_gap, key_features, image_url, created_at';

/** GET /procedures — public catalogue. */
router.get('/', async (_req, res, next) => {
  try {
    const result = await query(`SELECT ${PROC_COLS} FROM procedures ORDER BY created_at DESC`);
    return res.json({ procedures: result.rows });
  } catch (err) {
    next(err);
  }
});

/** POST /procedures — create (doctor only). No price field per requirements. */
router.post('/', requireAuth, requireRole('doctor'), async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.title) return res.status(400).json({ message: 'Title is required' });
    const result = await query(
      `INSERT INTO procedures (title, description, category, duration, sessions, visits_per_session, session_gap, key_features, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${PROC_COLS}`,
      [
        b.title,
        b.description || null,
        b.category || null,
        b.duration || null,
        b.sessions || null,
        b.visits_per_session || null,
        b.session_gap || null,
        Array.isArray(b.key_features) ? b.key_features : null,
        b.image_url || null,
      ],
    );
    return res.status(201).json({ procedure: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/** PUT /procedures/:id — update (doctor only). */
router.put('/:id', requireAuth, requireRole('doctor'), async (req, res, next) => {
  try {
    const b = req.body || {};
    const fields = [];
    const values = [];
    let i = 1;
    for (const key of ['title', 'description', 'category', 'duration', 'sessions', 'visits_per_session', 'session_gap', 'key_features', 'image_url']) {
      if (b[key] !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(b[key]);
      }
    }
    if (fields.length === 0) return res.status(400).json({ message: 'Nothing to update' });
    values.push(req.params.id);
    const result = await query(
      `UPDATE procedures SET ${fields.join(', ')} WHERE id = $${i} RETURNING ${PROC_COLS}`,
      values,
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Procedure not found' });
    return res.json({ procedure: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/** DELETE /procedures/:id — delete (doctor only). */
router.delete('/:id', requireAuth, requireRole('doctor'), async (req, res, next) => {
  try {
    const result = await query('DELETE FROM procedures WHERE id = $1', [req.params.id]);
    return res.json({ ok: result.rowCount > 0 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
