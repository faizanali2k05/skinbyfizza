# Skin By Dr. Fizza G — Backend API

Node/Express API for the mobile app. Owns **auth + all data** (users,
procedures, appointments, chat, notifications, prescriptions). The **AI
consultant is delegated to n8n** (`/ai/chat` proxies to the n8n AI-agent
webhook).

- **Runtime:** Node 20, Express, `pg`. JWT (HS256) + scrypt passwords — no
  external auth deps.
- **DB:** `skin-postgres` (Postgres 16) on the VPS `n8n_default` docker network.
- **Public URL:** `https://skinapi.seemaai.co.uk` (Caddy → `172.17.0.1:8095`).

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/signup` | — | email/phone + password |
| POST | `/auth/login` | — | login by email **or** WhatsApp number |
| POST | `/auth/refresh` | — | refresh → new access token |
| GET | `/me` | 🔒 | current user |
| POST | `/profile/update` | 🔒 | edit own profile |
| GET | `/procedures` | — | public catalogue |
| POST/PUT/DELETE | `/procedures[/:id]` | 🔒 doctor | manage treatments |
| GET | `/appointments` | 🔒 | own (patient) / all (staff, `?city=&status=`) |
| POST | `/appointments/book` | 🔒 | patient books |
| POST | `/appointments/assign` | 🔒 staff | assign to a user |
| POST | `/appointments/:id/reschedule` | 🔒 | keeps original time |
| POST | `/appointments/:id/status` | 🔒 staff | confirm/complete/cancel |
| GET | `/notifications` | 🔒 | in-app feed |
| POST | `/push/register-token` | 🔒 | save Expo push token |
| GET/POST | `/prescriptions` | 🔒 (POST doctor) | products/services + price |
| GET | `/chat/threads` | 🔒 | role-aware (triage) |
| GET | `/chat/poll` | 🔒 | new messages since cursor |
| POST | `/chat/send` | 🔒 | send message |
| POST | `/chat/set-primary` | 🔒 mgr/doctor | promote thread |
| POST | `/chat/tag-doctor` | 🔒 mgr/doctor | tag messages |
| GET | `/users` | 🔒 staff | list/search |
| POST | `/users/:id/{register,rating,vip}` | 🔒 | manager may register/rate/vip |
| POST | `/users/:id/{status,role}`, DELETE | 🔒 **doctor only** | manager blocked |
| POST | `/ai/chat` | 🔒 | proxy to n8n AI agent |

## Env (`.env` on the VPS — not committed)

```
PORT=3000
DATABASE_URL=postgres://skin:<password>@skin-postgres:5432/skinbyfizza
JWT_SECRET=<long random string>
N8N_AI_URL=http://n8n:5678/webhook/ai/chat
```

## Deploy (on the VPS, in /opt/skin-backend)

```bash
docker compose build
docker compose up -d
docker compose logs -f skin-backend
```
