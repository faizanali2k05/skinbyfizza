'use strict';

const express = require('express');
const { query } = require('../db');
const config = require('../config');
const { pushStaff } = require('../lib/notify');

const router = express.Router();

/**
 * POST /wa/inbound — called by the n8n WhatsApp workflow for each inbound
 * message. Secured by a shared secret header (not JWT). Upserts a WhatsApp
 * lead, finds/creates their WhatsApp conversation and stores the message —
 * so the manager sees it in the app inbox (/chat/threads).
 * Body: { from, name, text, wa_message_id }
 */
router.post('/inbound', async (req, res, next) => {
  try {
    if ((req.headers['x-wa-secret'] || '') !== config.waInboundSecret || !config.waInboundSecret) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const b = req.body || {};
    const digits = String(b.from || '').replace(/\D/g, '');
    if (!digits) return res.json({ ok: false });
    const phone = `+${digits}`;
    const text = String(b.text || '').trim();
    const name = String(b.name || 'WhatsApp Lead').trim() || 'WhatsApp Lead';
    const waId = b.wa_message_id || null;
    if (!text) return res.json({ ok: false });

    // Upsert the WhatsApp lead (no email/password — logs in later by number).
    const user = (
      await query(
        `INSERT INTO users (full_name, phone_e164, role, customer_type, status)
         VALUES ($1,$2,'user','regular','active')
         ON CONFLICT (phone_e164) DO UPDATE SET full_name = COALESCE(NULLIF(users.full_name, ''), EXCLUDED.full_name)
         RETURNING id`,
        [name, phone],
      )
    ).rows[0];

    // Find or create the WhatsApp conversation for this lead.
    let conv = (
      await query(`SELECT id FROM conversations WHERE user_id = $1 AND platform = 'whatsapp' LIMIT 1`, [user.id])
    ).rows[0];
    if (!conv) {
      conv = (
        await query(`INSERT INTO conversations (user_id, platform) VALUES ($1,'whatsapp') RETURNING id`, [user.id])
      ).rows[0];
    }

    // Store the message (dedupe by WhatsApp message id).
    await query(
      `INSERT INTO messages (conversation_id, sender_id, body, type, whatsapp_message_id)
       VALUES ($1,$2,$3,'text',$4)
       ON CONFLICT (whatsapp_message_id) DO NOTHING`,
      [conv.id, user.id, text, waId],
    );
    await query(
      `UPDATE conversations SET last_message = $2, last_sender_id = $3, unread_count = unread_count + 1,
              updated_at = now(), last_reminder_at = NULL WHERE id = $1`,
      [conv.id, text, user.id],
    );

    // Alert staff of the new WhatsApp message.
    pushStaff('New WhatsApp message', `${name}: ${text}`, { conversation_id: conv.id });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
