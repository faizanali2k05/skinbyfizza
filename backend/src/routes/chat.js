'use strict';

const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = express.Router();

/**
 * GET /chat/threads — role-aware thread list.
 *  - patient : their own conversation
 *  - manager : every conversation (to triage)
 *  - doctor  : only PRIMARY threads + all VIP customers' threads
 */
router.get('/threads', requireAuth, async (req, res, next) => {
  try {
    const cols = `c.id, c.user_id, c.platform, c.triage, c.last_message, c.last_sender_id,
                  c.unread_count, c.updated_at, u.full_name, u.customer_type, u.phone_e164, u.photo_url`;
    const join = `FROM conversations c JOIN users u ON u.id = c.user_id`;
    let rows;
    if (req.user.role === 'manager') {
      rows = (await query(`SELECT ${cols} ${join} ORDER BY c.updated_at DESC`)).rows;
    } else if (req.user.role === 'doctor') {
      rows = (
        await query(
          `SELECT ${cols} ${join} WHERE c.triage = 'primary' OR u.customer_type = 'vip'
           ORDER BY c.updated_at DESC`,
        )
      ).rows;
    } else {
      rows = (await query(`SELECT ${cols} ${join} WHERE c.user_id = $1 ORDER BY c.updated_at DESC`, [req.user.id])).rows;
    }
    return res.json({ threads: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /chat/poll?conversation_id=&since= — new messages (the realtime substitute).
 * For a doctor, non-VIP threads only expose messages tagged to the doctor.
 */
router.get('/poll', requireAuth, async (req, res, next) => {
  try {
    const convId = req.query.conversation_id;
    if (!convId) return res.status(400).json({ message: 'conversation_id is required' });

    // Access control: patient can only read their own thread.
    const conv = (await query(
      `SELECT c.id, c.user_id, c.triage, u.customer_type
       FROM conversations c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
      [convId],
    )).rows[0];
    if (!conv) return res.status(404).json({ message: 'Thread not found' });
    if (req.user.role === 'user' && conv.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const since = req.query.since || '1970-01-01';
    const params = [convId, since];
    // Doctor on a non-VIP thread only sees tagged messages.
    const doctorTagFilter =
      req.user.role === 'doctor' && conv.customer_type !== 'vip'
        ? 'AND (tagged_to_doctor = true OR sender_id = $3)'
        : '';
    if (doctorTagFilter) params.push(req.user.id);

    const result = await query(
      `SELECT id, conversation_id, sender_id, body, type, media_url, tagged_to_doctor, is_read, created_at
       FROM messages
       WHERE conversation_id = $1 AND created_at > $2 ${doctorTagFilter}
       ORDER BY created_at ASC`,
      params,
    );
    return res.json({ messages: result.rows });
  } catch (err) {
    next(err);
  }
});

/** POST /chat/send — patient sends to own thread; staff send to a given thread. */
router.post('/send', requireAuth, async (req, res, next) => {
  try {
    const b = req.body || {};
    const body = String(b.body || '').trim();
    if (!body) return res.status(400).json({ message: 'Message is empty' });

    let convId = b.conversation_id;
    if (req.user.role === 'user') {
      // Patients always write to their own (auto-created) conversation.
      const existing = await query(
        `SELECT id FROM conversations WHERE user_id = $1 AND platform = 'app' LIMIT 1`,
        [req.user.id],
      );
      convId = existing.rowCount
        ? existing.rows[0].id
        : (await query(`INSERT INTO conversations (user_id, platform) VALUES ($1,'app') RETURNING id`, [req.user.id])).rows[0].id;
    } else if (!convId) {
      return res.status(400).json({ message: 'conversation_id is required' });
    }

    const msg = (
      await query(
        `INSERT INTO messages (conversation_id, sender_id, body, type)
         VALUES ($1,$2,$3,'text')
         RETURNING id, conversation_id, sender_id, body, type, created_at`,
        [convId, req.user.id, body],
      )
    ).rows[0];

    // Bump the conversation summary.
    await query(
      `UPDATE conversations SET last_message = $2, last_sender_id = $3, updated_at = now() WHERE id = $1`,
      [convId, body, req.user.id],
    );
    return res.status(201).json({ message: msg });
  } catch (err) {
    next(err);
  }
});

/** POST /chat/set-primary — manager promotes a thread so the doctor sees it. */
router.post('/set-primary', requireAuth, requireRole('manager', 'doctor'), async (req, res, next) => {
  try {
    const convId = (req.body || {}).conversation_id;
    if (!convId) return res.status(400).json({ message: 'conversation_id is required' });
    const result = await query(
      `UPDATE conversations SET triage = 'primary', assigned_doctor_id = $2 WHERE id = $1 RETURNING id, triage`,
      [convId, req.user.role === 'doctor' ? req.user.id : null],
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Thread not found' });
    return res.json({ conversation: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/** POST /chat/tag-doctor — manager tags specific messages for the doctor. */
router.post('/tag-doctor', requireAuth, requireRole('manager', 'doctor'), async (req, res, next) => {
  try {
    const ids = (req.body || {}).message_ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'message_ids array is required' });
    }
    await query(`UPDATE messages SET tagged_to_doctor = true WHERE id = ANY($1::uuid[])`, [ids]);
    return res.json({ ok: true, tagged: ids.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
