# Skin By Dr. Fizza G — Web App PRD

> **Scope of this document:** the requirements for a **responsive web
> application** that delivers the full product currently shipped in the Expo
> app, built so it can be wrapped as Android + iOS binaries with **Capacitor**
> once every feature is done.
>
> **Backend is not rewritten.** The web app is a new client against the existing
> Node/Express API at `https://skinapi.seemaai.co.uk` (see `api/README.md`).
> Backend work is limited to the gaps listed in §11.
>
> Supersedes the root `prd.md`, which describes the retired Flutter + Flask +
> Supabase stack and is kept only as a historical record.

---

## 1. Product summary

**Skin By Dr. Fizza G** is a single application serving a Karachi dermatology /
aesthetic-skin practice, with three roles in one codebase: **patient**,
**manager**, and **doctor**. Its spine is a **unified inbox** — in-app chat,
WhatsApp messages, and an AI skin consultant all resolve into one triaged
conversation system, so the clinic runs every patient relationship (chat,
appointment, prescription, instruction) from one console.

### 1.1 Why web first

| Goal | How web-first serves it |
|---|---|
| Ship faster | No store review loop; deploy on every push. |
| One codebase for 3 targets | React build → web + Capacitor Android + Capacitor iOS. |
| Staff work on desktop | Doctor/manager triage a chat inbox far better on a large screen than on a phone. |
| Patients arrive from links | WhatsApp/Instagram links open the web app directly — no install friction. |

### 1.2 Success criteria

1. Every feature in §5 works in a mobile browser and on desktop.
2. Patients can complete: register → browse → book with intake form → chat → see prescriptions, without a native app.
3. Staff can run a full day (triage, reply, book, prescribe) from the web console.
4. The build passes the **Capacitor-readiness checklist** (§10) at all times, so the native wrap is configuration, not a rewrite.

### 1.3 Non-goals for the web phase

- Payments / e-commerce checkout.
- Multi-clinic tenancy (single practice, Karachi-limited access).
- Replacing the n8n AI workflow or the Node API.
- Offline-first sync (read-cache only; see §9.5).

---

## 2. Roles & permissions

| Capability | Patient | Manager | Doctor |
|---|:--:|:--:|:--:|
| Browse treatments, book appointments | ✅ own | ✅ any | ✅ any |
| Chat with clinic | ✅ own thread | ✅ all threads | ⚠️ primary + tagged + all VIP |
| AI consultant | ✅ | ✅ | ✅ |
| See own prescriptions / follow-ups | ✅ | — | — |
| Promote thread `general → primary` | ❌ | ✅ | ✅ |
| Tag messages to the doctor | ❌ | ✅ | ✅ |
| Read a VIP's **raw, untriaged** chat | ❌ | ✅ | ✅ |
| Create / edit / delete treatments | ❌ | ✅ | ✅ |
| Assign, reschedule, set appointment status | ❌ | ✅ | ✅ |
| Register a WhatsApp lead (give them a login) | ❌ | ✅ | ✅ |
| Set interest rating (1–5) | ❌ | ❌ | ✅ |
| Toggle VIP customer type | ❌ | ❌ | ✅ |
| Activate / deactivate a user | ❌ | ❌ | ✅ |
| Change a user's role (make manager/doctor) | ❌ | ❌ | ✅ |
| Delete a user | ❌ | ❌ | ✅ |
| Write instructions (team-facing + doctor-self) | ❌ | 👁 read | ✅ write |

> **Manager restrictions are a hard requirement:** a manager can never delete,
> deactivate, or promote a user. The API already enforces this
> (`requireRole('doctor')` on `/users/:id/{status,role}` and `DELETE /users/:id`);
> the web UI must hide those controls as well, never rely on the API alone.

**Customer types:** `regular` | `vip`. VIP is visible to the patient (a badge on
their own profile) and to staff, and unlocks doctor access to the full raw thread.

---

## 3. Flagship flows

### 3.1 WhatsApp lead → app user

1. A person messages the clinic WhatsApp number → Meta → `POST /wa/inbound`.
2. The API upserts a `users` row (email `NULL`, `password_hash` = hash of their phone), finds/creates a conversation with `triage = 'general'`, dedupes on `whatsapp_message_id`, stores the message, and pushes staff.
3. Manager sees the thread in **Chats → General**, replies (reply routes back out over WhatsApp).
4. Manager opens **Users**, finds the lead badged **"WhatsApp only"**, taps **Register** and sets an email + password → `POST /users/:id/register`.
5. The person can now log in on the web app with **email or WhatsApp number**.

### 3.2 Chat triage

```
patient message ──► conversation.triage = 'general'  ──► MANAGER sees it
                                   │
                    manager taps "Set primary"
                                   ▼
                         triage = 'primary'          ──► DOCTOR sees the thread
                    manager taps "Tag to doctor" on
                    one or many messages             ──► DOCTOR sees those messages
                    customer_type = 'vip'            ──► DOCTOR sees the RAW thread
```

The doctor's inbox is deliberately narrow: primary threads, tagged messages, and
VIP threads in full. Everything else is the manager's queue.

### 3.3 Unanswered-message escalation

When `conversation.last_sender_id = conversation.user_id` (the patient spoke
last) and no staff reply lands within `REMINDER_AFTER_MIN` (default 60 min), the
backend sweep nudges **every manager**, plus **the doctor if the patient is VIP**,
once per hour until someone replies. The web app surfaces these as notifications
and as the **"Need a reply"** stat on the staff dashboard.

---

## 4. Information architecture (web routes)

Mobile-first layout; the staff console expands to a two-pane desktop layout at
`≥1024px`.

### 4.1 Public / auth

| Route | Screen |
|---|---|
| `/welcome` | Brand splash, Log in / Register |
| `/sign-in` | Email **or** WhatsApp number + password |
| `/sign-up` | Full name, WhatsApp number (country code required), email, password |
| `/about` | Clinic info + locations (public) |

### 4.2 Patient (`/app/*`, bottom tab bar on mobile, left rail on desktop)

| Route | Screen |
|---|---|
| `/app/discover` | Greeting, hero, Most Wanted, Trending treatments |
| `/app/treatments` | Category browse + search |
| `/app/treatments/:id` | Treatment detail sheet → **Book** |
| `/app/book/:procedureId` | Multi-step booking + consultation intake form |
| `/app/chat` | Clinic thread |
| `/app/ai` | AI skin consultant (+ before/after generator) |
| `/app/appointments` | **Follow Up** (upcoming) and Past |
| `/app/prescriptions` | Products/services + prices added by the doctor |
| `/app/profile` · `/app/profile/edit` | Profile, VIP badge, photo, language, theme |
| `/app/notifications` | In-app feed |

### 4.3 Staff (`/staff/*`)

| Route | Screen |
|---|---|
| `/staff` | Dashboard: Need a reply · Today's visits · Patients |
| `/staff/chats` | Inbox — General / Primary / VIP filters (desktop: list + thread panes) |
| `/staff/chats/:conversationId` | Thread; set-primary, multi-select tag-to-doctor |
| `/staff/appointments` | List with **city filter** + status filter |
| `/staff/appointments/new` | Assign new: Full name → City → Treatment; search user by number |
| `/staff/users` | Search, register lead, rating, VIP, status, role, delete |
| `/staff/users/:id` | Patient record: profile, appointments, prescriptions, instructions, chat link |
| `/staff/treatments` · `/staff/treatments/new` · `/staff/treatments/:id` | Treatment CRUD |
| `/staff/prescriptions/new?user=:id` | Add item + price + notes |

**Redirect rule:** `/` sends an unauthenticated visitor to `/welcome`, a patient
to `/app/discover`, and a manager/doctor to `/staff`.

---

## 5. Feature requirements

Each block lists behaviour and its **acceptance criteria (AC)**.

### 5.1 Authentication

- Login accepts **email or `phone_e164`** in one field; the API decides which.
- Sign-up requires a WhatsApp number **with country code** (`+92…`); validate E.164 and show a country-code picker defaulting to `+92`.
- WhatsApp leads' default password is their phone number — sign-in copy must hint at this.
- Access token (short-lived) + refresh token; a 401 triggers one silent refresh, then a redirect to `/sign-in`.
- Deactivated (`status = 'inactive'`) users are refused at login with a clear message.

**AC:** login by email works · login by phone works · a wrong password shows a
field-level error, not a toast-only failure · refresh happens without the user
noticing · reloading the page keeps the session · logging out clears both tokens.

### 5.2 Treatments catalogue

- Public read (`GET /procedures`, no auth) so `/about` and Discover render pre-login.
- Fields: title, description, category, duration, sessions, visits per session, **`session_gap` (time between sessions/visits)**, key features (list), image.
- **No price field anywhere in treatments** — pricing lives only in prescriptions.
- Staff CRUD with image upload.

**AC:** patient sees the catalogue without logging in · staff create/edit/delete
reflects immediately · the create form has no price input · `session_gap` is
captured and displayed on the detail screen.

### 5.3 Appointments

- Patient books from a treatment: date + time picker, city, then the intake form (§5.4).
- Staff **Assign new**: Full name → City → Treatment; a user search by phone number resolves the patient (and offers "create as new lead" when no match).
- Statuses `pending → confirmed → completed | cancelled`; staff-only transitions.
- Reschedule preserves `original_scheduled_at` and shows "Rescheduled from …".
- Staff list filters by **city** and status; patients see **Follow Up** (upcoming) and **Past**.

**AC:** the patient-facing label is "Follow Up", never "Upcoming" · the city
filter narrows the staff list · a rescheduled appointment still shows its
original time · a patient cannot change a status.

### 5.4 Consultation intake form

A **multi-step, fully localized** (English / Urdu / Arabic) form completed during
booking, persisted to `consultations` and linked to the appointment.

| Step | Fields |
|---|---|
| 1 · Identity | Full name, date of birth, phone, email, address, referred by |
| 2 · Goal | Main goal / concern (free text + common chips) |
| 3 · Skincare | Current routine, products, prior treatments, sun exposure |
| 4 · Medical | Conditions, medications, allergies, pregnancy/nursing, prior reactions |
| 5 · Consent | Summary, agreement checkbox, typed name as e-signature |

- A step is only passable when its required fields validate; progress is preserved on back-navigation and on an accidental reload (draft in local storage).
- Steps 3–4 are stored as JSON in `consultations.form`, so questions can change without a migration.
- Urdu and Arabic render **RTL**, including the stepper direction.

**AC:** all five steps localize · RTL layout is correct in `ur`/`ar` · submitting
creates both the appointment and the consultation row · a reload mid-form
restores the answers · the consent step blocks submit until agreed + signed.

### 5.5 Chat (unified inbox)

- One thread per patient; `platform` marks `app` vs `whatsapp` per message.
- Message types: text, image, audio, file. Web capture uses `getUserMedia` for voice notes and a file input for images/documents.
- **Near-real-time by polling** `GET /chat/poll?conversation_id=&since=` every 4s while the tab is visible and focused; pause when hidden, resume with an immediate fetch.
- Optimistic send: the bubble appears instantly with a pending state, reconciles or shows a retry affordance.
- Manager: **Set primary** on a thread; **multi-select messages → Tag to doctor**.
- Doctor inbox: primary threads + threads containing tagged messages + all VIP threads (raw).
- Thread list shows name, VIP badge, WhatsApp badge, last message, waiting time, and a "needs reply" marker when the patient spoke last.

**AC:** a message sent from one browser appears in the other within ~5s · polling
stops on a hidden tab · a manager promoting a thread makes it visible to the
doctor · tagged messages are visibly marked · a doctor sees a VIP's full thread
without triage · an image and a voice note both send and play back.

### 5.6 AI skin consultant

- Separate conversation surface from the human chat; history never mixes into `messages`.
- `POST /ai/chat` proxies to the n8n **skinbyfizza** workflow; the UI streams or shows a typing indicator, and handles the n8n timeout with a retry.
- Keyword questions (contact, services, locations, hours) return a clinic-info card.
- **AI before/after:** the patient uploads a photo and picks a treatment; the result renders as a before/after comparison slider with a visible **"AI-generated illustration, not a guaranteed outcome"** disclaimer.

**AC:** consultant answers persist across a reload · a backend/n8n failure shows
a retry, not a blank screen · the before/after result always carries the
disclaimer · the uploaded photo is never shown to other patients.

### 5.7 Prescriptions

- Doctor adds an item (product **or** service, e.g. Botox) with price and notes to a patient.
- Rendered inside the patient's profile and inside the staff patient record.
- Patients read their own only.

**AC:** doctor-only create (manager sees no add button) · price formats as PKR ·
the patient sees their own list and no one else's.

### 5.8 Instructions

- Doctor writes two kinds per patient: **team-facing** and **doctor-self**, in `en` / `ur` / `ar`.
- Manager can read team instructions; doctor-self notes are visible to the doctor only.

**AC:** the audience toggle is explicit at write time · a manager never sees a
`doctor` audience note · language is stored with the note and rendered RTL where needed.

### 5.9 Users management

- Search by name / phone / email; badges for role, VIP, "WhatsApp only" (no email), inactive.
- Register a lead (email + password). Interest rating 1–5 (doctor). VIP toggle (doctor). Activate/deactivate, role change, delete (doctor).
- Manager sees a reduced action set (§2).

**AC:** manager-forbidden actions are absent from the DOM, not merely disabled ·
registering a lead lets them log in immediately · rating persists and shows in the list.

### 5.10 Notifications

- In-app feed with unread badge; mark-as-read on open.
- Web push (VAPID) with an explicit opt-in prompt — never on first load, requested after a meaningful action.
- Sources: new message, appointment status change, unanswered-thread reminder.

**AC:** the badge count matches unread rows · denying push leaves the app fully
usable · the token is registered once per browser and re-registered after a change.

### 5.11 Clinic info & locations

Single `about_us` row plus `clinic_locations`; publicly readable, doctor-editable.
Access is **Karachi-limited** — non-Karachi cities are not offered in booking or
assignment pickers.

### 5.12 Settings

Theme (dark default / light), language (`en` / `ur` / `ar` with RTL), push
preference, log out.

---

## 6. Design system

The web app carries the **dark-luxury** identity of the current app verbatim, so
the native wrap looks identical.

| Token | Dark | Light |
|---|---|---|
| `background` | `#0A0A0C` | `#F4F1EA` |
| `surface` | `#18181B` | `#FFFFFF` |
| `surfaceMuted` | `#202024` | `#F3EFE7` |
| `gold` (primary) | `#C9A24B` | `#C9A24B` |
| `goldLight` | `#E4C77A` | `#9A7A2D` |
| `rose` | `#E48BA1` | `#C56B84` |
| `sage` | `#6FB7A0` | `#4E9B84` |
| `textPrimary` | `#F5F2EC` | `#1F1B16` |
| `textSecondary` | `#B9B3A8` | `#6B6457` |
| `divider` | `#2A2A2E` | `#EDE6D6` |
| `success` / `error` / `warning` / `info` | `#5BBF7B` / `#E5604D` / `#E0A02C` / `#5B9DE5` | `#3E9E5C` / `#D64C3A` / `#C8871F` / `#3E7ED0` |

Glass surfaces use `rgba(255,255,255,0.045→0.14)` tints on dark and
`rgba(255,255,255,0.55→0.85)` on light, with a `1px` translucent border.

**Type:** display/headings **Outfit** (400/500/600/700), body/UI **Plus Jakarta
Sans** (400/500/600/700), self-hosted (no Google Fonts request at runtime, so the
Capacitor build works offline). Scale: display 32 · h1 27 · h2 22 · h3 18 ·
title 16 · body 15 · small 13 · caption 12 · overline 11 uppercase / 1.5 tracking.

**Spacing** 4-pt scale (4 · 8 · 12 · 16 · 20 · 24 · 32 · 48); **radius** 8 · 12 ·
16 · 22 · pill; screen gutter 20px.

**Breakpoints:** `sm 480` · `md 768` · `lg 1024` · `xl 1280`. Below `lg`, staff
screens are single-column with a bottom tab bar; at `lg+` the chat inbox becomes
list + thread, and forms cap at ~720px.

---

## 7. Localization

- Locales `en`, `ur`, `ar`; `dir="rtl"` for `ur` and `ar` set on `<html>`.
- Every user-facing string comes from the catalogue — no literals in components.
- Numbers, dates, and currency use `Intl` with the active locale; appointment times render in `Asia/Karachi`.
- The intake form (§5.4) is the priority translation surface.

---

## 8. Accessibility

WCAG 2.1 AA: visible focus rings on the gold accent, 4.5:1 text contrast in both
themes, full keyboard operation of the chat inbox and the multi-step form, labelled
inputs, `aria-live` for incoming messages and toasts, and a respected
`prefers-reduced-motion`.

---

## 9. Non-functional requirements

1. **Performance:** first contentful paint < 2s on 4G mid-tier Android; route-level code splitting; initial JS ≤ 250KB gzip; images lazy with intrinsic sizing.
2. **Security:** tokens in the storage abstraction (§10), never in a URL; no secrets in the bundle; all traffic HTTPS; every role check enforced server-side with the UI mirroring it; uploaded media size-capped client-side (12MB request limit on the API).
3. **Reliability:** every network call has a loading, empty, error-with-retry state; polling backs off on repeated failure; optimistic writes roll back visibly.
4. **Privacy:** patient photos and chat media are treated as medical data — no third-party analytics on those screens, no media URLs in logs.
5. **Caching:** TanStack Query caches reads; a stale cache renders while revalidating. True offline write queueing is out of scope.
6. **Browsers:** last 2 versions of Chrome, Safari, Edge, Firefox; iOS Safari 16+ (the Capacitor iOS floor).

---

## 10. Capacitor-readiness checklist

Enforced from the first commit, so the native wrap in §12 is configuration only.

- [ ] **Static SPA output** — no SSR, no server-only routes, no Node runtime at request time.
- [ ] **Relative asset base** (`base: './'` in Vite) so `capacitor://` and `file://` origins resolve assets.
- [ ] **Absolute API base URL** from env — never a same-origin `/api` path.
- [ ] **Bearer-token auth, never cookies** — the native origin is `capacitor://localhost` / `http://localhost`, so cookie auth breaks. CORS on the API must allow those origins.
- [ ] **All platform access behind `src/platform/*`** — storage, push, camera, file, share, haptics, network status. No direct `localStorage`/`navigator.*` in features.
- [ ] **Safe-area insets** — `env(safe-area-inset-*)` on the app shell for the notch and home indicator.
- [ ] **No browser-only navigation assumptions** — no reliance on `window.history` beyond React Router, no `window.open` for in-app destinations, external links via the platform layer.
- [ ] **Self-hosted fonts and no runtime CDN fetches.**
- [ ] **Hardware back button** handled through the router (Android).
- [ ] **Touch targets ≥ 44px**, no hover-only affordances.

---

## 11. Backend gaps to close

The existing API covers most of this PRD. These are the deltas the web build needs:

| # | Gap | Where | Priority |
|---|---|---|---|
| 1 | **CORS allowlist** — currently `cors()` open; restrict to the web origin + `capacitor://localhost` + `http://localhost` | `api/src/index.js:12` | P0 |
| 2 | **Web push** — `lib/push.js` only sends Expo push; add a VAPID sender (and later FCM/APNs for the Capacitor builds) keyed by token type | `api/src/lib/push.js` | P0 |
| 3 | **`POST /profile/photo`** — declared in the client config, not implemented | `api/src/routes/profile.js` | P1 |
| 4 | **`GET /consultations?user_id=`** — intake forms are written on booking but cannot be read back by staff | `api/src/routes/` (new) | P1 |
| 5 | **`POST /ai/before-after`** — declared in the client config, not implemented | `api/src/routes/ai.js` | P1 |
| 6 | **`GET /wa/webhook`** verification handshake + HMAC signature check on inbound | `api/src/routes/wa.js` | P1 |
| 7 | **Multipart upload endpoint** — chat media is base64 inside a 12MB JSON body; browsers hit this ceiling sooner than the app did | `api/src/routes/chat.js` | P2 |
| 8 | **Read receipts / unread clearing** — `unread_count` is only bumped by WhatsApp inbound and never cleared | `api/src/routes/chat.js` | P2 |
| 9 | **`POST /auth/logout`** — refresh-token revocation (`refresh_tokens` table exists, unused for logout) | `api/src/routes/auth.js` | P2 |

---

## 12. Delivery plan

| Phase | Deliverable | Done when |
|---|---|---|
| **W0 · Foundation** | Vite + React + TS scaffold, design tokens, theme + i18n providers, platform layer stubs, API client with refresh, auth screens, role routing | A patient and a doctor can log in and land on the right shell |
| **W1 · Patient core** | Discover, treatments, detail, profile, about, notifications | A patient can browse and manage their profile end to end |
| **W2 · Booking** | Multi-step localized intake form, booking, Follow Up / Past lists | A booking creates the appointment + consultation row |
| **W3 · Chat** | Patient thread, staff inbox, polling, media, triage (set-primary, tag-doctor), VIP raw access | Two browsers hold a live conversation; triage gates the doctor's view |
| **W4 · Staff console** | Dashboard, users management with role gating, treatments CRUD, appointments manage + assign-new + city filter | Staff run a full day from the web |
| **W5 · Clinical** | Prescriptions, instructions (team/self, multi-lang), staff patient record | Doctor prescribes and instructs; patient sees prescriptions |
| **W6 · AI** | Consultant, before/after with disclaimer | Both AI surfaces work against n8n |
| **W7 · Polish** | Web push, PWA manifest, a11y pass, performance budget, error boundaries | Checklist §10 fully green |
| **W8 · Capacitor** | `@capacitor/core` + android/ios, native platform implementations, FCM/APNs push, splash + icon, store builds | Both binaries install and pass the same acceptance criteria |

---

## 13. Open questions

1. **Web push vs. app-only push** — do patients get browser push in the web phase, or is push deferred to the native wrap? (Affects gap #2 priority.)
2. **Media storage** — chat media currently lands on the API host under `/uploads`. Move to S3/MinIO before web traffic, or keep local disk?
3. **AI before/after** — which image model, and what retention policy for patient photos?
4. **Web domain** for the app (e.g. `app.seemaai.co.uk` or a clinic domain) — needed for CORS, push VAPID origin, and the Capacitor `server.hostname`.
5. **Karachi limit** — enforced as a hard server-side rule, or a UI default the doctor can override?
