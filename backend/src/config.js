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

  // n8n AI-agent webhook — the app's AI consultant is delegated here.
  // e.g. https://n8n.seemaai.co.uk/webhook/ai/chat  (or the docker gateway URL)
  n8nAiUrl: process.env.N8N_AI_URL || 'https://n8n.seemaai.co.uk/webhook/ai/chat',
};
