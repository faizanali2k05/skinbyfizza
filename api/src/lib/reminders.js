'use strict';

const { query } = require('../db');
const { notifyUser } = require('./notify');

/**
 * Unanswered-message reminders.
 *
 * When the last message in a conversation is from the patient (i.e.
 * `last_sender_id = user_id`) and no staff member has replied for a while, we
 * nudge the responsible staff once an hour until someone answers:
 *   - manager  → every unanswered thread (managers triage the whole inbox)
 *   - doctor   → only VIP customers' unanswered threads
 * `last_reminder_at` throttles the nudges to one per hour per thread; it is
 * reset to NULL whenever a new message arrives (see chat.js / wa.js), so the
 * hour is always measured from the patient's latest message, and a staff reply
 * flips `last_sender_id` away from the patient so the thread drops out entirely.
 */

const REMINDER_AFTER_MIN = parseInt(process.env.REMINDER_AFTER_MIN || '60', 10); // first + repeat gap
const SWEEP_EVERY_MS = parseInt(process.env.REMINDER_SWEEP_MS || String(10 * 60 * 1000), 10); // 10 min

async function runReminderSweep() {
  // Threads awaiting a staff reply, due for a (fresh or repeat) nudge.
  const due = await query(
    `SELECT c.id, c.user_id, c.last_message, u.full_name, u.customer_type,
            floor(extract(epoch FROM now() - c.updated_at) / 3600)::int AS waiting_hours
     FROM conversations c
     JOIN users u ON u.id = c.user_id
     WHERE c.last_sender_id = c.user_id
       AND u.status = 'active'
       AND c.updated_at < now() - ($1 || ' minutes')::interval
       AND (c.last_reminder_at IS NULL OR c.last_reminder_at < now() - ($1 || ' minutes')::interval)
     ORDER BY c.updated_at ASC
     LIMIT 200`,
    [REMINDER_AFTER_MIN],
  );
  if (!due.rowCount) return;

  // Pre-fetch staff once per sweep (small team).
  const staff = (
    await query(`SELECT id, role FROM users WHERE role IN ('doctor','manager') AND status = 'active'`)
  ).rows;
  const managers = staff.filter((s) => s.role === 'manager');
  const doctors = staff.filter((s) => s.role === 'doctor');

  for (const conv of due.rows) {
    // VIP threads escalate to the doctor as well; everything else is the manager's.
    const targets = conv.customer_type === 'vip' ? [...managers, ...doctors] : managers;
    if (!targets.length) continue;

    const hrs = conv.waiting_hours || 1;
    const title = 'Unanswered message ⏰';
    const body = `${conv.full_name} has been waiting ${hrs}h for a reply — ${conv.last_message || 'new message'}`;
    const data = { conversation_id: conv.id, kind: 'reminder' };

    await Promise.all(targets.map((s) => notifyUser(s.id, title, body, data)));
    await query(`UPDATE conversations SET last_reminder_at = now() WHERE id = $1`, [conv.id]);
  }
  console.log(`[reminders] nudged ${due.rowCount} unanswered thread(s)`);
}

/** Kick off the recurring sweep (call once at startup). */
function startReminderLoop() {
  const tick = () => runReminderSweep().catch((e) => console.error('[reminders]', e.message));
  setTimeout(tick, 30 * 1000); // first sweep 30s after boot
  setInterval(tick, SWEEP_EVERY_MS);
  console.log(`[reminders] loop started — every ${Math.round(SWEEP_EVERY_MS / 60000)}m, threshold ${REMINDER_AFTER_MIN}m`);
}

module.exports = { startReminderLoop, runReminderSweep };
