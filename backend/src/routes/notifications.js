'use strict';

const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../auth/middleware');

const router = express.Router();

/** GET /notifications — current user's in-app feed. */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, title, body, data, is_read, created_at
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.user.id],
    );
    return res.json({ notifications: result.rows });
  } catch (err) {
    next(err);
  }
});

/** POST /notifications/:id/read — mark one as read. */
router.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
