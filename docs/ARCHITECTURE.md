# Skin By Dr. Fizza G — Rebuild Architecture & Plan

> **Rebuild target:** React Native (Expo) app + **PostgreSQL** database.
> Replaces the previous Flutter + Flask + Supabase stack.

---

## ⭐ CURRENT LIVE ARCHITECTURE (v2 — authoritative)

The backend was split out of n8n. **n8n now hosts only the AI consultant.**

```
Expo app ──HTTPS──► Node/Express backend ──► PostgreSQL (skin-postgres)
   │                (skinapi.seemaai.co.uk)
   │                        │
   └────────────────────────┴──► POST /ai/chat ──► n8n AI workflow ──► OpenAI
```

| Layer | What | Where |
|---|---|---|
| **App** | Expo SDK 54, expo-router, dark-luxury UI | `mobile/` → base URL `https://skinapi.seemaai.co.uk` |
| **Backend** | Node/Express, JWT (HS256) + scrypt, `pg` | `backend/` → Docker `skin-backend` on VPS, `172.17.0.1:8095`, network `n8n_default` |
| **Database** | Postgres 16, schema in `db/schema.sql` | Docker `skin-postgres` on VPS (`n8n_default`) |
| **AI** | n8n workflow **skinbyfizza** (webhook `/ai/chat` → OpenAI agent `gpt-5-mini`) | n8n `n8n.seemaai.co.uk`; backend proxies to `http://n8n:5678/webhook/ai/chat` |
| **Proxy/TLS** | Caddy (`skinapi.seemaai.co.uk` block) | `seema-caddy-1`, `/opt/seema/deploy/Caddyfile` |
| **DNS** | `skinapi` A → `69.62.110.2` | Hostinger (seemaai.co.uk) |

Backend endpoints + deploy steps: see `backend/README.md`. Everything below
(sections 0–10) is the original design record; the API contract still holds,
but auth/data are served by the Node backend, not n8n.

---

## 0. Decisions locked for this build

| Decision | Choice | Why |
|---|---|---|
| Frontend | **React Native + Expo (managed)** | One codebase iOS/Android, OTA updates, easy push via Expo. |
| Backend | **Self-hosted n8n** (webhook workflows) | You already run it; orchestrates auth, chat, WhatsApp, AI, push, DB. |
| Database | **PostgreSQL** (self-hosted, the same n8n DB host or a separate one) | n8n talks to it via the Postgres node. |
| Auth | **n8n-issued JWT** + bcrypt creds in Postgres | Fully self-hosted; supports WhatsApp-number login. |
| Realtime chat | **Client polling** an n8n webhook (~3–5s) | n8n has no websockets; polling keeps it 100% n8n. Schema lets us add realtime later. |
| Push | **Expo Push Notifications** (n8n → Expo push API) | Trivial from n8n; no Firebase server SDK needed. |
| File storage | **n8n + object storage** (S3-compatible / MinIO / local disk on the VPS) | Chat media, profile photos, procedure/AI images. |
| AI consultant | n8n → OpenAI (or any LLM) via HTTP Request node | Keeps API keys server-side in n8n credentials. |

---

## 1. High-level architecture

```
┌─────────────────────────────┐
│  Expo React Native app      │
│  (expo-router)              │
│  roles: patient / manager / │
│         doctor(admin)       │
│                             │
│  • JWT in SecureStore       │
│  • polls /chat/poll for     │
│    new messages (3–5s)      │
│  • Expo push token register │
└───────────────┬─────────────┘
                │  HTTPS (JWT in Authorization header)
                │  one base URL: https://n8n.<your-domain>/webhook/...
                ▼
┌─────────────────────────────────────────────────────────────┐
│  Self-hosted n8n  (each workflow = one webhook endpoint)     │
│                                                              │
│  Auth:    /auth/signup  /auth/login  /auth/refresh           │
│  Profile: /me  /profile/update  /profile/photo               │
│  Chat:    /chat/send  /chat/poll  /chat/threads              │
│  Triage:  /chat/set-primary  /chat/tag-doctor                │
│  Appts:   /appointments ... (list/book/assign/reschedule)    │
│  Procs:   /procedures ... (CRUD)                             │
│  Rx:      /prescriptions ... (doctor adds product+price)     │
│  Notif:   /notifications  /push/register-token               │
│  AI:      /ai/chat   /ai/before-after                        │
│  WhatsApp:/wa/webhook (in)   internal WA-send (out)          │
└───────┬───────────────┬───────────────┬─────────────┬────────┘
        │               │               │             │
        ▼               ▼               ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────┐
│ PostgreSQL   │ │ WhatsApp     │ │ OpenAI /   │ │ Expo Push +  │
│ (all tables) │ │ Cloud API    │ │ LLM + image│ │ object store │
└──────────────┘ └──────────────┘ └────────────┘ └──────────────┘
```

**Single API base URL** the app uses: `https://n8n.<your-domain>/webhook`.
Each endpoint below is an n8n **Production Webhook** path.

---

## 2. Roles (updated per new requirements)

| Role | Description |
|---|---|
| **Doctor / Admin** (Dr. Fizza) | Full control. Sees only **primary** chats + messages **tagged** to her by a manager. Sees **all raw chat for VIP** customers. Writes 2 instruction types per patient (team-facing + doctor's own). Sets patient **interest rating 1–5**. Manages procedures, appointments, prescriptions. |
| **Manager** | Triages chat: all inbound lands in **General**; manager promotes a thread to **Primary** so the doctor sees it, and **tags** specific messages to the doctor. **Cannot**: delete users, deactivate users, or make someone admin. |
| **Patient (user)** | Books appointments, chats, uses AI consultant, sees own profile, prescriptions, follow-ups. Can be flagged **VIP** (visible to patient + doctor). |

**Customer types:** `regular`, `VIP`. VIP is shown to the customer and the doctor; doctor can read the VIP's full raw chat regardless of triage.

---

## 3. Data model (PostgreSQL)

Ported from the old Supabase schema + new requirements. All tables in `public`.

| Table | Key columns / notes |
|---|---|
| `users` | `id (uuid pk)`, `full_name`, `email (unique, nullable)`, `phone_e164 (unique)` — WhatsApp number **with country code**, `password_hash (bcrypt)`, `role (user/manager/doctor)`, `customer_type (regular/vip)`, `status (active/inactive)`, `interest_rating (int 1–5, doctor-set)`, `city`, `photo_url`, `expo_push_token`, `created_at`. **WhatsApp leads** live here with `email=null` and `password_hash` defaulting to a hash of their phone number. |
| `conversations` | `id`, `user_id`, `platform (app/whatsapp)`, `triage (general/primary)`, `assigned_doctor_id`, `last_message`, `last_sender_id`, `unread_count`, `updated_at`. Triage drives doctor visibility. |
| `messages` | `id`, `conversation_id`, `sender_id`, `body`, `type (text/image/audio/file)`, `media_url`, `whatsapp_message_id (dedupe)`, `tagged_to_doctor (bool)`, `is_read`, `created_at`. |
| `ai_conversations` / `ai_messages` | Separate AI chat history (never mixed into `messages`). |
| `procedures` | `id`, `title`, `description`, `category`, `duration`, `sessions`, `visits_per_session`, **`session_gap` (time between sessions/visits)**, `key_features (text[])`, `image_url`. **No price field** (removed per new requirement). |
| `appointments` | `id`, `user_id`, `procedure_id`, `scheduled_at`, `original_scheduled_at`, `status (pending/confirmed/completed/cancelled)`, `city`, `assigned_by`. |
| `prescriptions` | `id`, `user_id`, `doctor_id`, `item_name` (product **or** service e.g. Botox), `price`, `notes`, `created_at`. Shown in patient profile. |
| `instructions` | `id`, `user_id`, `audience (team/doctor)`, `body`, `lang`, `created_at`. Doctor writes both kinds. |
| `notifications` | `id`, `user_id`, `title`, `body`, `data (jsonb)`, `is_read`, `created_at`. |
| `about_us` | single clinic-info row. |
| `clinic_locations` | `id`, `name`, `city`, `address`, `phone`, `email`, `map_url`, `sort_order`, `active`. Karachi-limited access enforced at query/role level. |
| `refresh_tokens` | `id`, `user_id`, `token_hash`, `expires_at` — for JWT refresh + logout. |

**Storage:** object store buckets `chat-media`, `profile-photos`, `procedure-images`, `ai-images`. n8n writes via the S3/HTTP node; public-read URLs returned to the app.

`schema.sql` (idempotent) will create all of the above with indexes, the
`updated_at` triggers, and seed the single doctor + about_us row.

---

## 4. n8n workflows (the API contract)

Each row = one n8n workflow with a Webhook trigger. `🔒` = requires valid JWT;
role checks happen in a Function/IF node right after the webhook.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | — | Create patient. Hash password (bcrypt), insert `users`, return JWT + refresh. |
| POST | `/auth/login` | — | Login by **email OR phone_e164**; verify bcrypt; default password = phone number for WA leads. Return JWT. |
| POST | `/auth/refresh` | — | Exchange refresh token for new JWT. |
| GET | `/me` | 🔒 | Current user profile (+ prescriptions, follow-ups, customer_type). |
| POST | `/profile/update` | 🔒 | Edit own profile / doctor edits any. |
| POST | `/profile/photo` | 🔒 | Upload avatar to object store. |
| GET | `/chat/threads` | 🔒 | List threads; **doctor** sees only `triage=primary` + VIP + tagged; **manager** sees all; **patient** sees own. |
| GET | `/chat/poll` | 🔒 | New messages since `?since=<ts>` for a thread (the realtime substitute). |
| POST | `/chat/send` | 🔒 | Send message (app or WhatsApp-out). Persist + push. |
| POST | `/chat/set-primary` | 🔒 manager | Promote a thread `general → primary`. |
| POST | `/chat/tag-doctor` | 🔒 manager | Tag one/more messages for the doctor. |
| GET/POST | `/appointments` | 🔒 | List/book. Patient books; doctor/manager assign. Filter by **city**. |
| POST | `/appointments/assign` | 🔒 doctor/manager | Assign-new UI: full_name, city, procedure; search user by number. |
| POST | `/appointments/reschedule` | 🔒 | Keeps `original_scheduled_at`. |
| GET | `/procedures` / CRUD | 🔒 | Browse (patient) / manage (doctor). No price field. |
| GET/POST | `/prescriptions` | 🔒 doctor | Add item (product/service) + price to a user; patient reads own. |
| GET/POST | `/instructions` | 🔒 doctor | Team + doctor-self instructions, multi-language. |
| GET | `/notifications` | 🔒 | In-app feed. |
| POST | `/push/register-token` | 🔒 | Save Expo push token to `users`. |
| POST | `/ai/chat` | 🔒 | LLM consultant proxy; keyword → hardcoded clinic-info card. |
| POST | `/ai/before-after` | 🔒 | AI before/after image generation. |
| GET | `/wa/webhook` | verify token | WhatsApp verification handshake. |
| POST | `/wa/webhook` | HMAC | Inbound WhatsApp → upsert user (WA lead) → conversation (general) → message → push doctor/manager. |

**Shared sub-workflows** (called by others): `verify-jwt`, `sign-jwt`,
`send-expo-push`, `wa-send`, `upload-media`.

---

## 5. Expo app structure

```
app/                      # expo-router file-based routes
  (auth)/                 # welcome, sign-in (email or WhatsApp#), sign-up, recovery
  (patient)/              # home, procedures, book, chat, ai-chat, profile, notifications
  (staff)/                # manager + doctor consoles
    chats/                # triage list (manager) / primary+tagged (doctor)
    appointments/
    users/                # manage (manager: no delete/deactivate/make-admin)
    procedures/
    prescriptions/
  _layout.tsx             # role-based routing guard
src/
  api/                    # one client.ts -> n8n base URL, attaches JWT, refresh logic
  auth/                   # token storage (expo-secure-store), AuthContext
  theme/                  # rose-gold palette + Poppins (ported from old PRD §4)
  components/             # SoftCard, CustomButton, ChatBubble, StatusChip, EmptyState ...
  hooks/                  # useChatPoll, useNotifications, usePushToken
  i18n/                   # en / ur / ar  (stepped form is multi-language)
constants/                # colors.ts, config.ts (N8N_BASE_URL via app config / env)
```

**Theme** carries over from the old PRD: rose-gold `#C9A24B` primary on warm
off-white `#FAF7F2`, Poppins font, the same component vocabulary.

**i18n:** English / Urdu / Arabic, with RTL handling for Arabic/Urdu. The
intake form is **multi-step** and localized.

---

## 6. Cross-cutting concerns

- **Auth flow:** app sends creds → `/auth/login` → n8n verifies bcrypt, signs
  JWT (HS256, secret in n8n credentials), returns `{token, refresh, user}`. App
  stores in SecureStore, attaches `Authorization: Bearer` to every call. A
  `verify-jwt` sub-workflow guards protected endpoints.
- **Polling chat:** `useChatPoll` calls `/chat/poll?thread=&since=` on a 3–5s
  timer while a chat screen is focused; backs off when backgrounded. Schema
  (`messages.created_at`) supports a clean `since` cursor so we can swap in true
  realtime later with no app changes.
- **Push:** on login, app gets Expo push token → `/push/register-token`. n8n
  `send-expo-push` POSTs to `https://exp.host/--/api/v2/push/send` on new
  message / appointment status change.
- **WhatsApp:** unchanged concept — Meta → `/wa/webhook`. n8n dedupes by
  `whatsapp_message_id`, downloads media to object store, lands the thread in
  **General** for the manager to triage.
- **Security:** Postgres role checks in n8n IF nodes; service creds live only in
  n8n. Manager is explicitly blocked from delete/deactivate/make-admin at the
  endpoint. WhatsApp webhook HMAC-verified.

---

## 7. Milestone roadmap

1. **M0 – Foundations:** `schema.sql` for Postgres; n8n `verify-jwt` / `sign-jwt`
   sub-workflows; `/auth/signup` + `/auth/login`; Expo app scaffold with theme,
   i18n, SecureStore auth + role routing. → *Login works end to end.*
2. **M1 – Profiles & roles:** `/me`, `/profile/*`, user management screens
   (manager restrictions), interest rating, customer_type/VIP.
3. **M2 – Chat + triage:** threads, polling, send, manager set-primary &
   tag-doctor, doctor primary/VIP view. Push on new message.
4. **M3 – WhatsApp inbound/outbound** via n8n; unified inbox.
5. **M4 – Procedures (no price) + appointments** (city filter, assign-new UI,
   reschedule) + notifications.
6. **M5 – Prescriptions + instructions (multi-lang)** + Follow-Up section.
7. **M6 – AI consultant + AI before/after images.**
8. **M7 – Polish:** splash/icon (white bg), OTA updates, store builds (EAS).

---

## 8. What I need from you to start M0

1. **n8n base URL** (e.g. `https://n8n.yourdomain.com`) and confirmation you can
   create workflows there (or that I should hand you importable workflow JSON).
2. **Postgres connection** details for n8n (host/db/user) — or confirm it's the
   same DB n8n already uses.
3. **Object storage** choice: S3/MinIO/local disk on the VPS?
4. Confirm **LLM provider** for the AI consultant (OpenAI `gpt-4o-mini`, or
   something else self-hosted).
5. WhatsApp Cloud API creds (can come later, at M4).

Once you confirm #1–#4, I'll start M0: write `schema.sql`, the first n8n
workflow JSON files (importable), and scaffold the Expo app.
```