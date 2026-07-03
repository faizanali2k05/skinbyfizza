'use strict';

const config = require('../config');

/**
 * Send a plain-text WhatsApp message via the WhatsApp Cloud API.
 * Free-form text is only delivered inside the 24h customer service window
 * (i.e. after the user messaged the clinic) — which is exactly the reply case.
 */
async function sendWhatsAppText(to, body) {
  if (!config.whatsappToken || !config.whatsappPhoneId) return;
  const phone = String(to).replace(/\D/g, '');
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${config.whatsappPhoneId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: String(body).slice(0, 4096) },
      }),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${t.slice(0, 200)}`);
  }
}

module.exports = { sendWhatsAppText };
