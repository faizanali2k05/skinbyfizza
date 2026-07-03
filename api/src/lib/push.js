'use strict';

/**
 * Send Expo push notifications. Accepts one token or an array; silently
 * ignores empties and never throws (push is best-effort).
 */
async function sendExpoPush(tokens, title, body, data) {
  const list = (Array.isArray(tokens) ? tokens : [tokens]).filter(Boolean);
  if (!list.length) return;
  const messages = list.map((to) => ({ to, title, body, sound: 'default', data: data || {} }));
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (e) {
    console.error('[push] send failed:', e.message);
  }
}

module.exports = { sendExpoPush };
