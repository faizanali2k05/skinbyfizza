'use strict';

const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../auth/middleware');
const { notifyUser, pushStaff } = require('../lib/notify');

const router = express.Router();

const isStaff = (role) => role === 'doctor' || role === 'manager';

/**
 * GET /appointments — patients see their own; staff see all
 * (optionally filtered by ?city= and ?status=).
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const base = `SELECT a.id, a.scheduled_at, a.original_scheduled_at, a.status, a.city,
                         a.procedure_id, a.user_id, p.title AS procedure_title, u.full_name, u.phone_e164
                  FROM appointments a
                  LEFT JOIN procedures p ON p.id = a.procedure_id
                  LEFT JOIN users u ON u.id = a.user_id`;
    let rows;
    if (isStaff(req.user.role)) {
      const where = [];
      const params = [];
      let i = 1;
      if (req.query.city) { where.push(`a.city = $${i++}`); params.push(req.query.city); }
      if (req.query.status) { where.push(`a.status = $${i++}`); params.push(req.query.status); }
      const sql = `${base} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY a.scheduled_at DESC`;
      rows = (await query(sql, params)).rows;
    } else {
      rows = (await query(`${base} WHERE a.user_id = $1 ORDER BY a.scheduled_at DESC`, [req.user.id])).rows;
    }
    return res.json({ appointments: rows });
  } catch (err) {
    next(err);
  }
});

/** POST /appointments/book — patient books a treatment. */
router.post('/book', requireAuth, async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.scheduled_at) return res.status(400).json({ message: 'A date/time is required' });
    const result = await query(
      `INSERT INTO appointments (user_id, procedure_id, scheduled_at, city, status)
       VALUES ($1,$2,$3,$4,'pending')
       RETURNING id, scheduled_at, status, city, procedure_id`,
      [req.user.id, b.procedure_id || null, b.scheduled_at, b.city || null],
    );
    const appt = result.rows[0];

    // Optional consultation intake captured during booking.
    const c = b.consultation;
    if (c && typeof c === 'object') {
      await query(
        `INSERT INTO consultations
           (user_id, appointment_id, full_name, date_of_birth, address, phone, email, referred_by, main_goal, form, signature, agreed)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          req.user.id, appt.id,
          c.full_name || null, c.date_of_birth || null, c.address || null,
          c.phone || null, c.email || null, c.referred_by || null, c.main_goal || null,
          c.form ? JSON.stringify(c.form) : null, c.signature || null, !!c.agreed,
        ],
      );
    }
    pushStaff('New appointment request', 'A patient requested a booking.', { appointment_id: appt.id });
    return res.status(201).json({ appointment: appt });
  } catch (err) {
    next(err);
  }
});

/** POST /appointments/assign — staff assigns a booking to a user. */
router.post('/assign', requireAuth, requireRole('doctor', 'manager'), async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.user_id || !b.scheduled_at) {
      return res.status(400).json({ message: 'user_id and scheduled_at are required' });
    }
    const result = await query(
      `INSERT INTO appointments (user_id, procedure_id, scheduled_at, city, status, assigned_by)
       VALUES ($1,$2,$3,$4,'confirmed',$5)
       RETURNING id, scheduled_at, status, city, procedure_id, user_id`,
      [b.user_id, b.procedure_id || null, b.scheduled_at, b.city || null, req.user.id],
    );
    return res.status(201).json({ appointment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/** POST /appointments/:id/reschedule — keeps the original time. */
router.post('/:id/reschedule', requireAuth, async (req, res, next) => {
  try {
    const when = (req.body || {}).scheduled_at;
    if (!when) return res.status(400).json({ message: 'scheduled_at is required' });
    const owner = isStaff(req.user.role) ? '' : 'AND user_id = $3';
    const params = [when, req.params.id];
    if (!isStaff(req.user.role)) params.push(req.user.id);
    const result = await query(
      `UPDATE appointments
       SET original_scheduled_at = COALESCE(original_scheduled_at, scheduled_at),
           scheduled_at = $1
       WHERE id = $2 ${owner}
       RETURNING id, scheduled_at, original_scheduled_at, status, city, procedure_id`,
      params,
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Appointment not found' });
    return res.json({ appointment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/** POST /appointments/:id/status — staff updates status. */
router.post('/:id/status', requireAuth, requireRole('doctor', 'manager'), async (req, res, next) => {
  try {
    const status = (req.body || {}).status;
    const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const result = await query(
      `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING id, status, user_id`,
      [status, req.params.id],
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Appointment not found' });
    const appt = result.rows[0];
    notifyUser(appt.user_id, `Appointment ${status}`, `Your appointment is now ${status}.`, { appointment_id: appt.id });
    return res.json({ appointment: { id: appt.id, status: appt.status } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
