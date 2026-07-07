'use strict';

const express = require('express');
const { query } = require('../db');

const router = express.Router();

/** GET /about — public clinic info + active locations (About screen). */
router.get('/', async (_req, res, next) => {
  try {
    const about = (await query('SELECT description, email, phone, instagram, facebook FROM about_us WHERE id = 1')).rows[0] || null;
    const locations = (
      await query(
        `SELECT id, name, city, address, phone, email, map_url
         FROM clinic_locations WHERE active = true ORDER BY sort_order ASC`,
      )
    ).rows;
    return res.json({ about, locations });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
