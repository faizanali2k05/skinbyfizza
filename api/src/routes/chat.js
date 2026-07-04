'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { query } = require('../db');
const config = require('../config');
const { requireAuth, requireRole } = require('../auth/middleware');
const { sendWhatsAppText, sendWhatsAppImage } = require('../lib/whatsapp');
const { notifyUser, pushStaff } = require('../lib/notify');

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

    // Optional image attachment (base64) — saved and served publicly so it can
    // also be forwarded to WhatsApp as an image link.
    let mediaUrl = null;
    let msgType = 'text';
    if (b.media_base64) {
      const ext = String(b.media_mime || '').includes('png') ? 'png' : 'jpg';
      const fname = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
      const buf = Buffer.from(String(b.media_base64).replace(/^data:[^,]+,/, ''), 'base64');
      fs.writeFileSync(path.join(config.uploadsDir, fname), buf);
      mediaUrl = `${config.publicBase}/uploads/${fname}`;
      msgType = 'image';
    }
    if (!body && !mediaUrl) return res.status(400).json({ message: 'Message is empty' });

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
        `INSERT INTO messages (conversation_id, sender_id, body, type, media_url)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, conversation_id, sender_id, body, type, media_url, created_at`,
        [convId, req.user.id, body, msgType, mediaUrl],
      )
    ).rows[0];

    // Bump the conversation summary.
    const summary = body || (mediaUrl ? '📷 Photo' : '');
    await query(
      `UPDATE conversations SET last_message = $2, last_sender_id = $3, updated_at = now() WHERE id = $1`,
      [convId, summary, req.user.id],
    );

    // Deliver notifications + WhatsApp outbound (best-effort, after responding).
    const conv = (
      await query(
        `SELECT c.platform, c.user_id, u.phone_e164, u.full_name
         FROM conversations c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
        [convId],
      )
    ).rows[0];
    res.status(201).json({ message: msg });
    if (conv) {
      if (req.user.role === 'user') {
        pushStaff('New message', `${conv.full_name}: ${body}`, { conversation_id: convId });
      } else {
        notifyUser(conv.user_id, 'New reply from the clinic', summary, { conversation_id: convId });
        // If this is a WhatsApp lead, deliver the reply to their WhatsApp.
        if (conv.platform === 'whatsapp' && conv.phone_e164) {
          if (mediaUrl) {
            sendWhatsAppImage(conv.phone_e164, mediaUrl, body).catch((e) => console.error('[wa-out]', e.message));
          } else {
            sendWhatsAppText(conv.phone_e164, body).catch((e) => console.error('[wa-out]', e.message));
          }
        }
      }
    }
    return;
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
