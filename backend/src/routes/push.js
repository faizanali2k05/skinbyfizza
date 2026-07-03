'use strict';

const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../auth/middleware');

const router = express.Router();

/** POST /push/register-token — store the Expo push token on the user. */
router.post('/register-token', requireAuth, async (req, res, next) => {
  try {
    const token = (req.body || {}).expo_push_token;
    if (!token) return res.status(400).json({ message: 'expo_push_token is required' });
    await query('UPDATE users SET expo_push_token = $2 WHERE id = $1', [req.user.id, token]);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
