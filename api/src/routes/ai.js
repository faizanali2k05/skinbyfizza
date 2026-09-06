'use strict';

const express = require('express');
const { requireAuth } = require('../auth/middleware');
const config = require('../config');

const router = express.Router();

const SYSTEM_PROMPT = `You are the AI skin consultant for Skin By Dr. Fizza G, a dermatology and
aesthetic clinic in Karachi, Pakistan.

Your role:
- Answer questions about skincare, treatments, routines and common skin concerns
  in a warm, professional, judgement-free tone.
- Keep replies short and practical — two or three short paragraphs at most.
- Prices are never quoted: pricing is decided by the doctor and shared as a
  prescription inside the app.

Boundaries:
- You do not diagnose. For anything that needs assessment, medication, or sounds
  urgent, tell the patient to book a consultation with Dr. Fizza through the app.
- Never suggest prescription-only treatments as self-care.
- If asked about clinic hours, location or contact details, say the clinic is in
  Karachi, open Mon-Sat 11:00-20:00, and that the team can be reached through the
  chat in this app.

If the patient writes in Urdu or Arabic, reply in that language.`;

const TIMEOUT_MS = 30000;

/** Call OpenAI directly. Returns { reply } or throws with a useful message. */
async function askOpenAI(message, history, signal) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    // Trust only well-formed prior turns; cap the window to keep cost bounded.
    ...history
      .filter((h) => h && typeof h.content === 'string' && h.content.trim())
      .slice(-10)
      .map((h) => ({
        role: h.role === 'assistant' || h.role === 'ai' ? 'assistant' : 'user',
        content: String(h.content).slice(0, 4000),
      })),
    { role: 'user', content: message },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    // max_completion_tokens (not max_tokens) is the parameter the gpt-5 family
    // requires, and the gpt-4o family accepts it too — so one shape works for
    // whichever model OPENAI_MODEL names.
    body: JSON.stringify({
      model: config.openaiModel,
      messages,
      max_completion_tokens: 600,
    }),
    signal,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = data.error || {};
    // Surface the real reason in the server log — the previous version
    // swallowed this, which made a missing workflow look like a bad API key.
    throw new Error(
      `OpenAI ${res.status} ${err.type || ''} ${err.code || ''}: ${err.message || text.slice(0, 200)}`,
    );
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('OpenAI returned an empty completion');
  return reply;
}

/** Forward to the n8n AI-agent webhook (the original design). */
async function askN8n(message, history, userId, signal) {
  const upstream = await fetch(config.n8nAiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, user_id: userId }),
    signal,
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
    throw new Error(`n8n ${upstream.status}: ${text.slice(0, 200)}`);
  }
  return reply;
}

/**
 * POST /ai/chat — the AI skin consultant.
 *
 * Uses OpenAI directly when OPENAI_API_KEY is set (fewer moving parts, and the
 * key stays server-side either way). Falls back to the n8n AI-agent webhook
 * when it isn't — that workflow is optional, not required.
 */
router.post('/chat', requireAuth, async (req, res) => {
  const message = String((req.body || {}).message || '').trim();
  const history = Array.isArray((req.body || {}).history) ? req.body.history : [];
  if (!message) return res.status(400).json({ message: 'Message is empty' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const reply = config.openaiApiKey
      ? await askOpenAI(message, history, controller.signal)
      : await askN8n(message, history, req.user.id, controller.signal);
    return res.json({ reply });
  } catch (err) {
    const aborted = err.name === 'AbortError';
    console.error('[ai]', aborted ? `timed out after ${TIMEOUT_MS}ms` : err.message);
    return res.status(502).json({
      message: aborted
        ? 'The consultant took too long to respond. Please try again.'
        : 'The consultant is unavailable right now.',
    });
  } finally {
    clearTimeout(timeout);
  }
});

module.exports = router;
