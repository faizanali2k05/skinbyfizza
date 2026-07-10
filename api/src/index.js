'use strict';

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { pool } = require('./db');
const { startReminderLoop } = require('./lib/reminders');

const app = express();

app.use(cors()); // public API guarded by JWT; allow app + web origins
app.use(express.json({ limit: '12mb' })); // room for base64 chat images

// Chat media: ensure the folder exists and serve it publicly.
try {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
} catch {
  /* ignore */
}
app.use('/uploads', express.static(config.uploadsDir, { maxAge: '30d' }));

// Health probe (used by uptime checks / Caddy).
app.get('/health', (_req, res) => res.json({ ok: true, service: 'skinbyfizza-backend' }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/profile')); //         GET /me, POST /profile/update
app.use('/procedures', require('./routes/procedures'));
app.use('/appointments', require('./routes/appointments'));
app.use('/notifications', require('./routes/notifications'));
app.use('/push', require('./routes/push'));
app.use('/prescriptions', require('./routes/prescriptions'));
app.use('/chat', require('./routes/chat'));
app.use('/users', require('./routes/users'));
app.use('/ai', require('./routes/ai'));
app.use('/wa', require('./routes/wa'));
app.use('/about', require('./routes/about'));
app.use('/instructions', require('./routes/instructions'));

// 404
app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

// Central error handler — never leak stack traces to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

async function start() {
  try {
    await pool.query('SELECT 1'); // fail fast if DB is unreachable
    console.log('[db] connected');
  } catch (e) {
    console.error('[db] connection failed:', e.message);
  }
  app.listen(config.port, () => console.log(`[api] listening on :${config.port}`));
  startReminderLoop(); // hourly nudge for unanswered patient messages
}

start();
