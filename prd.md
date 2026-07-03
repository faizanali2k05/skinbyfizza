# Skin By Dr. Fizza G — Product Requirements Document

> Single source of truth for the clinic app: what it does, how every feature
> behaves, the visual design system (colors, fonts, icon, splash), the data
> model, and the backend. Update this file whenever a feature or color changes.

---

## 1. Overview

**Skin By Dr. Fizza G** is a dual-role clinic application for a
dermatology / aesthetic-skin practice. It pairs a **Flutter mobile app**
(one binary that serves both patients and the admin) with a **Flask backend**
(`app.py`, hosted on Render) that integrates:

- **Supabase** — Postgres database, Auth, Storage, and Realtime.
- **OpenAI** (`gpt-4o-mini`) — the in-app AI skin consultant.
- **WhatsApp Cloud API** — so patients can message the clinic from WhatsApp
  and the admin replies from inside the app.
- **Firebase Cloud Messaging (FCM)** — push notifications.

The core idea: **one unified inbox**. In-app chats, WhatsApp messages, and the
AI consultant all live in the same system, so Dr. Fizza manages every
conversation, appointment, procedure, and patient from a single admin console.

---

## 2. Roles & primary flows

| Role | What they do |
|---|---|
| **Admin** (Dr. Fizza) | One admin per deployment. Replies to patients across app + WhatsApp, registers WhatsApp leads as app users, sets/resets passwords, manages procedures, books/confirms/reschedules appointments, edits clinic info, reviews AI chat history. |
| **Patient** (user) | Browses procedures, books appointments, chats with the doctor or the AI consultant, manages their profile and photo, views notifications. |
| **WhatsApp lead** | Anyone who messages the clinic's WhatsApp number. Auto-provisioned as a profile (no login yet); shown to the admin as a **"WhatsApp only"** user until registered. |

### 2.1 Flagship flow — WhatsApp lead → app user (this is the product's spine)

1. A person sends a WhatsApp message to the clinic number.
2. Meta delivers it to the Flask `/webhook`, which:
   - finds or **creates a profile** for that phone number (role `user`, **no
     email** → "unregistered"),
   - finds/creates a **conversation**, downloads any media to the `chat_files`
     storage bucket, stores the message, and **pushes an FCM alert to the admin**.
3. The admin opens **Admin Dashboard → Chats** and sees the conversation in
   real time; they can reply, and the reply is sent back out over WhatsApp via
   `/send-message`.
4. The admin opens **Users**, finds the lead (tagged **"WhatsApp only"**), and
   taps **"Register & Set Password"** — entering an email + password.
5. The backend `/admin/create-user` creates a Supabase Auth account, **merges**
   the WhatsApp-only profile and its conversations onto the new login, and
   deletes the orphan profile (no duplicates).
6. From then on the user can log into the app, and the same menu shows
   **"Change Password"** (backend `/admin/update-password`).

> **Important operational note:** you can only *Change Password* for a user who
> has been **Registered** first. A raw WhatsApp-only profile has no `auth.users`
> row, so the backend returns a friendly "register them first" message instead
> of changing a password that doesn't exist.

---

## 3. Architecture

```
┌────────────────────────┐         ┌─────────────────────────┐
│  Flutter app (lib/)    │◀───────▶│  Supabase (DB+Auth+RT)  │
│  patient + admin UI    │  RLS    │  profiles, conversations│
│  Provider state mgmt   │         │  messages, appointments │
└────────────┬───────────┘         │  procedures, notifs,    │
             │                     │  ai_conversations,      │
             │                     │  ai_messages, about_us, │
             │                     │  clinic_locations       │
             │                     └────────────┬────────────┘
             │  /chat  /send-message             ▲ webhook events
             │  /webhook  /admin/create-user     │ (service-role key)
             │  /admin/update-password           │
             │  /register-fcm-token              │
             ▼                                   │
┌────────────────────────┐         ┌─────────────┴───────────┐
│  Flask backend (app.py)│◀───────▶│  WhatsApp Cloud API     │
│  hosted on Render      │         └─────────────────────────┘
│                        │         ┌─────────────────────────┐
│                        │◀───────▶│  OpenAI (gpt-4o-mini)   │
│                        │         └─────────────────────────┘
│                        │         ┌─────────────────────────┐
│                        │◀───────▶│  Firebase Admin SDK     │
└────────────────────────┘         │  (FCM push)             │
                                   └─────────────────────────┘
```

- **State management:** `provider` (`MultiProvider` in `main.dart`) exposes
  `AuthService`, `ProcedureService`, `AppointmentService`, `ChatService`,
  `ClinicLocationService`, `NotificationService`.
- **Routing:** `routes/app_routes.dart`; `widgets/auth_wrapper.dart` decides
  the landing screen by auth state + role.
- **Config:** `constants/config.dart` holds `backendBaseUrl`
  (`https://skinbydrfizzag.onrender.com`), Supabase URL + anon key, all
  overridable at build time with `--dart-define`.

---

## 4. Visual design system

### 4.1 App icon & splash screen

- **Background: WHITE (`#FFFFFF`).** Both the launcher icon and the cold-start
  splash use a clean white background (previously brand-gold `#C9A24B`).
- **Icon source:** `lib/assets/logo_square_white.png` (logo on white) for the
  iOS / legacy Android icon; `lib/assets/icon_foreground.png` (transparent
  wordmark) as the Android adaptive-icon foreground over a white background.
- **Config:** `pubspec.yaml → flutter_launcher_icons` (`adaptive_icon_background:
  "#FFFFFF"`). Android background color lives in
  `android/.../res/values/colors.xml` (`ic_launcher_background = #FFFFFF`),
  which also drives the Android splash via `drawable/launch_background.xml`.
- **iOS splash:** `ios/Runner/Base.lproj/LaunchScreen.storyboard` (white
  background + centered `LaunchImage`).
- **Regenerate after changing the icon:** `dart run flutter_launcher_icons`.

### 4.2 Color palette (`lib/constants/colors.dart`)

Brand identity is a **refined rose-gold** on warm off-white surfaces.

| Token | Hex | Use |
|---|---|---|
| `primary` | `#C9A24B` | Warm gold — primary brand, buttons, gradients |
| `primaryDark` | `#9A7A2D` | Deeper gold — gradient end |
| `primaryLight` | `#F5E5B0` | Cream / vanilla |
| `primarySoft` | `#FBF4E1` | Tinted background wash |
| `secondary` | `#6FB7A0` | Sage teal — medical/health accents |
| `accent` | `#E48BA1` | Soft rose — beauty accents |
| `accentDark` | `#B7536F` | Deep rose |
| `background` | `#FAF7F2` | App background (warm off-white) |
| `surface` | `#FFFFFF` | Cards / sheets |
| `surfaceMuted` | `#F3EFE7` | Muted surface |
| `divider` | `#EDE6D6` | Borders / dividers |
| `textPrimary` | `#1F1B16` | Primary text |
| `textSecondary` | `#6B6457` | Secondary text |
| `textLight` | `#A9A294` | Hint / tertiary text |
| `success` | `#4CAF50` | Success states |
| `error` | `#D64545` | Errors / destructive |
| `warning` | `#E0A02C` | Warnings, "WhatsApp only" badge |
| `info` | `#4A90E2` | Info / Chats tile |
| `cardProcedures` | `#FFF3D6` | Quick-access tile (procedures) |
| `cardShop` | `#FCE4EC` | Quick-access tile (shop) |
| `cardAiChat` | `#DDF1EC` | Quick-access tile (AI chat) |
| `cardMedical` | `#EAF3E5` | Quick-access tile (medical) |

**Gradients:** `primaryGradient` (gold→deep gold), `subtlePrimaryGradient`
(cream→white), `errorGradient` (red→deep rose).

> Note: the *brand* color is still gold inside the app UI (buttons, hero
> headers, gradients). Only the **launcher icon and splash background** were
> changed to white per requirement. To make the in-app theme white-dominant
> too, change `primary` / gradients in `colors.dart`.

### 4.3 Typography & shared styles

- **Font:** Poppins (Regular 400, Medium 500, SemiBold 600, Bold 700),
  bundled in `assets/fonts/`, declared in `pubspec.yaml`.
- **Shared text/decoration styles:** `lib/constants/styles.dart` (`AppStyles.h3`,
  `bodySmall`, `inputDecoration(...)`, etc.).
- **Reusable widgets:** `soft_card`, `custom_button`, `chat_bubble`,
  `status_chip`, `empty_state`, `section_header`, `procedure_card`,
  `appointment_card`, `bottom_nav_bar`, `app_logo`.

---

## 5. Feature modules

### 5.1 Authentication & profiles
- Supabase Auth email/password: **sign-up, sign-in, password recovery**
  (`auth/welcome_screen`, `sign_in_screen`, `sign_up_screen`,
  `password_recovery_screen`).
- DB trigger `on_auth_user_created` mirrors every `auth.users` row into
  `public.profiles` (role `user`). Profile id **==** auth user id (this is what
  makes admin password changes resolve correctly).
- Roles: `user`, `admin`. SQL helper `is_admin()` underpins all RLS.
- Admin user management (`admin/manage_users_screen`): search, **view, edit,
  register (WhatsApp lead → login), change password, assign appointment,
  promote/demote admin, activate/deactivate, delete**.
- `widgets/auth_wrapper.dart` routes by session + role on launch.

### 5.2 Unified chat (`conversations` + `messages`)
- One screen, `chat/unified_chat_screen.dart`, used by both patient and admin.
- **Realtime** message stream via Supabase Realtime (no manual refresh).
- Message types: **text, image, audio (record in-app), and files**.
  Attachments go to the `chat_files` storage bucket.
- **Admin side** (`admin/admin_chat_manager_screen`, `admin_chat_screen`):
  a unified list of all patient threads (app + WhatsApp) with unread badges.
- **WhatsApp out:** admin replies route through Flask `/send-message`, which
  calls the WhatsApp Cloud API and stores the message under the same thread.
- **WhatsApp in:** `/webhook` validates Meta's signature, dedupes by
  `whatsapp_message_id`, downloads media, persists, and FCM-notifies the admin.
- `last_message`, `last_sender_id`, `unread_count` maintained by DB trigger
  `handle_new_message_logic`.

### 5.3 AI skin consultant (`ai_conversations` + `ai_messages`)
- Patient-facing AI mode toggle inside `unified_chat_screen`.
- Flask `/chat` calls OpenAI `gpt-4o-mini` with a clinic system prompt; certain
  keywords (contact/services/locations/hours) return a **hard-coded clinic info
  card** without hitting OpenAI.
- AI turns are stored only in `ai_messages` (never in `messages`, whose
  `sender_id` FK requires a real profile).
- Admin can review any patient's AI history in `admin/ai_agent_record_screen`.

### 5.4 Procedures catalogue (`procedures`)
- Admin CRUD: `admin/manage_procedures_screen`.
- Patient browse + search: `procedures/procedures_list_screen`,
  `procedure_detail_screen`.
- Fields: title, description, category, price, duration, sessions,
  visits-per-session, key features (array), image (`procedure_images` bucket).

### 5.5 Appointments (`appointments`)
- Patient books a procedure at a date/time; admin can also assign one to a user
  (`appointments/book_appointment_screen`, `appointments_list_screen`,
  `appointment_detail_screen`, `reschedule_screen`, `user_appointments_screen`;
  admin: `manage_appointments_screen`).
- Statuses: `pending`, `confirmed`, `completed`, `cancelled`.
- Reschedule preserves the original time in `original_scheduled_at`.
- DB trigger `handle_appointment_notification` creates notifications on insert
  and on status change.

### 5.6 Notifications (`notifications` + FCM)
- In-app feed (`home/notifications_screen`) backed by the `notifications` table.
- Push via FCM v1 (Firebase Admin SDK server-side) for new chat messages and
  admin replies. Device token stored per profile (`fcm_token`), refreshed via
  `/register-fcm-token`. Client wiring in `services/notification_manager.dart`
  and `notification_service.dart`.

### 5.7 Clinic info & locations (`about_us`, `clinic_locations`)
- Single-row clinic info (description, email, phone, Instagram, Facebook)
  editable by admin (`admin/manage_about_us_screen`), shown to patients
  (`profile/about_us_screen`).
- Multiple clinic locations (name, address, phone, email, map URL, sort order,
  active flag) via `clinic_location_service`.

### 5.8 Home / dashboard / profile
- Patient home (`home/home_screen`, `dashboard`) with quick-access tiles
  (Procedures / Shop / AI Chat / Medical), bottom nav (`widgets/bottom_nav_bar`).
- Admin landing: `admin/simple_admin_screen` — the live admin console with
  five tiles: **Chats, Appointments, Users, Procedures, About the clinic**
  (Chats tile shows a live unread badge).
- Profile: view/edit profile + photo (`profile/profile_screen`,
  `edit_profile_screen`, `user_profile_screen`; `profile_photos` bucket).

---

## 6. Data model

| Table | Purpose |
|---|---|
| `profiles` | Mirrors `auth.users`; `role`, `status`, `phone`, `email`, `fcm_token`, `photo_url`, soft-delete. WhatsApp leads live here with no email until registered. |
| `conversations` | One human thread per (user × platform); `platform`, `last_message`, `last_sender_id`, `unread_count`. |
| `messages` | Chat messages (text/image/audio/file); `platform`, `whatsapp_message_id` (dedupe), `is_read`. |
| `ai_conversations` / `ai_messages` | Separate AI chat history (kept out of `messages`). |
| `procedures` | Treatments offered; pricing, sessions, features, image. |
| `appointments` | Bookings with status + reschedule history. |
| `notifications` | In-app feed for users and admin. |
| `about_us` | Single clinic-info row. |
| `clinic_locations` | Clinic branches. |

**Storage buckets:** `chat_files` (50 MB; image/audio/video/docs),
`profile_photos` (5 MB; images), `procedure_images` (10 MB; images). All public
read; writes gated by RLS (`security definer` `is_admin()` for admin-only).

**Schema script:** `skinbydrfizzag/database.sql` — idempotent, safe to re-run
in the Supabase SQL Editor. Creates tables, columns, indexes, triggers, RLS
policies, buckets, the realtime publication, and refreshes the PostgREST cache.

---

## 7. Backend endpoints (Flask `app.py`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | — | Liveness (also hit by an external keep-alive pinger). |
| GET | `/webhook` | verify token | Meta webhook verification handshake. |
| POST | `/webhook` | HMAC signature | Inbound WhatsApp message handler. |
| POST | `/send-message` | admin JWT | Admin → WhatsApp send + DB persist. |
| POST | `/chat` | — | OpenAI proxy for the AI consultant. |
| POST | `/admin/create-user` | admin JWT | Create login for a (WhatsApp) user + merge profile. |
| POST | `/admin/update-password` | admin JWT | Reset a registered user's password. |
| POST | `/register-fcm-token` | — | Save device token to a profile. |

Admin endpoints are guarded by `@admin_required`, which validates the caller's
Supabase JWT and confirms `role == 'admin'`.

---

## 8. External services & secrets (env vars)

Set these in **Render → Environment** (the local `.env` is not deployed):

`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_ANON_KEY`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
`WHATSAPP_APP_SECRET`, `VERIFY_TOKEN`, `ADMIN_ID`, `FIREBASE_PROJECT_ID`,
`FIREBASE_PRIVATE_KEY_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`,
`PORT`.

**WhatsApp webhook config (Meta dashboard):**
- Callback URL: `https://skinbydrfizzag.onrender.com/webhook`
- Verify token: must equal `VERIFY_TOKEN`.
- Subscribe to the **`messages`** field only.
- App must be **Live** (not Development) for real-phone delivery.

> **`WHATSAPP_TOKEN` must be a permanent System User token.** The temporary
> token on the API-setup page expires every 24h; when it does, `/send-message`
> fails with WhatsApp error **code 190** (HTTP 401) and the backend returns 502.

---

## 9. Non-functional requirements

- **Realtime:** chat + notifications update without manual refresh (Supabase
  realtime publication includes all relevant tables; several tables use
  `replica identity full`).
- **Security:** RLS restricts patients to their own data; admins bypass via
  `is_admin()`. Service-role key is server-side only; anon key (RLS-protected)
  ships in the client. Webhook bodies are HMAC-verified when
  `WHATSAPP_APP_SECRET` is set.
- **Multi-channel inbox:** WhatsApp and in-app conversations for the same
  patient collapse into one thread.
- **Resilience:** WhatsApp messages are deduped (Meta retries until it gets a
  200); upstream Meta failures are normalized to HTTP 502 with an actionable
  hint so they don't masquerade as client auth errors.

---

## 10. Known constraints / decisions

- **One admin per deployment** (Dr. Fizza). `ADMIN_ID` env points to the single
  admin profile UUID; WhatsApp threads are assigned to that admin.
- AI messages live in their own tables and never appear in `messages`.
- WhatsApp phone lookup: exact match first, then a suffix match on the last 10
  digits (anchored `%suffix`) to tolerate country-code formatting.
- A user must be **Registered** (given a login) before their password can be
  changed — WhatsApp-only profiles have no `auth.users` row.
- In-app brand color remains gold; only the launcher icon + splash background
  are white.
```