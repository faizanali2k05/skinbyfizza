'use strict';

/**
 * Central configuration, read from environment variables.
 * On the VPS these are injected by docker-compose (from backend/.env there).
 */
module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),

  // Postgres connection string, e.g. postgres://skin:PASS@skin-postgres:5432/skinbyfizza
  databaseUrl: process.env.DATABASE_URL,

  // HS256 secret used to sign app JWTs. MUST be a long random string in prod.
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',

  // Access + refresh token lifetimes (seconds)
  accessTtl: 60 * 60 * 24 * 7, // 7 days
  refreshTtl: 60 * 60 * 24 * 60, // 60 days

  // AI consultant. When OPENAI_API_KEY is set the backend calls OpenAI
  // directly; otherwise it falls back to the n8n AI-agent webhook below.
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',

  // n8n AI-agent webhook — used only when OPENAI_API_KEY is unset.
  n8nAiUrl: process.env.N8N_AI_URL || 'http://n8n_app:5678/webhook/ai/chat',

  // Shared secret the n8n WhatsApp workflow presents to POST /wa/inbound.
  waInboundSecret: process.env.WA_INBOUND_SECRET || '',

  // WhatsApp Cloud API — for outbound replies from staff to a WhatsApp lead.
  whatsappToken: process.env.WHATSAPP_TOKEN || '',
  whatsappPhoneId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',

  // Chat media uploads (served at /uploads and used as WhatsApp image links).
  uploadsDir: process.env.UPLOADS_DIR || '/app/uploads',
  publicBase: process.env.PUBLIC_BASE_URL || 'https://skinapi.seemaai.co.uk',
};
