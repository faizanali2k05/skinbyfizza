'use strict';

const express = require('express');
const { requireAuth } = require('../auth/middleware');
const config = require('../config');

const router = express.Router();

/**
 * POST /ai/chat — the AI consultant is delegated to n8n.
 * We forward { message, history } to the n8n AI-agent webhook and normalise
 * the reply back to { reply }. Node 20 provides a global fetch.
 */
router.post('/chat', requireAuth, async (req, res) => {
  const message = String((req.body || {}).message || '').trim();
  const history = Array.isArray((req.body || {}).history) ? req.body.history : [];
  if (!message) return res.status(400).json({ message: 'Message is empty' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const upstream = await fetch(config.n8nAiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, user_id: req.user.id }),
      signal: controller.signal,
    });
    const text = await upstream.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { reply: text };
    }
    const reply = data.reply || data.output || data.text || data.message || '';
    if (!upstream.ok || !reply) {
      return res.status(502).json({ message: 'The consultant is unavailable right now.' });
    }
    return res.json({ reply });
  } catch {
    return res.status(502).json({ message: 'The consultant is unavailable right now.' });
  } finally {
    clearTimeout(timeout);
  }
});

module.exports = router;
