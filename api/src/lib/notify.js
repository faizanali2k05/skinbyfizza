'use strict';

const { query } = require('../db');
const { sendExpoPush } = require('./push');

/** Notify one user: write an in-app notification + push (if they have a token). */
async function notifyUser(userId, title, body, data) {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, body, data) VALUES ($1,$2,$3,$4)`,
      [userId, title, body || null, data ? JSON.stringify(data) : null],
    );
    const r = await query(`SELECT expo_push_token FROM users WHERE id = $1`, [userId]);
    const token = r.rows[0] && r.rows[0].expo_push_token;
    if (token) await sendExpoPush(token, title, body, data);
  } catch (e) {
    console.error('[notify] user:', e.message);
  }
}

/** Push to all staff (doctor + manager) who registered a device token. */
async function pushStaff(title, body, data) {
  try {
    const r = await query(
      `SELECT expo_push_token FROM users WHERE role IN ('doctor','manager') AND expo_push_token IS NOT NULL`,
    );
    await sendExpoPush(r.rows.map((x) => x.expo_push_token), title, body, data);
  } catch (e) {
    console.error('[notify] staff:', e.message);
  }
}

module.exports = { notifyUser, pushStaff };
