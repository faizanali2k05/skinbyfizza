# Skin By Dr. Fizza G — Web App Architecture

> Engineering companion to `docs/WEB_PRD.md`. Defines the stack, the folder
> layout, the API contract as it exists today, the platform-abstraction layer
> that makes the Capacitor wrap a configuration step, and the deploy path.
>
> `docs/ARCHITECTURE.md` remains the record for the **Expo** client; this file
> governs the new `web/` client. Both talk to the same backend.

---

## 1. System context

```
                       ┌──────────────────────────────┐
   browser / PWA ─────►│                              │
                       │  web/  React + Vite SPA      │
   Capacitor Android ─►│  (one bundle, three targets) │
   Capacitor iOS ─────►│                              │
                       └───────────────┬──────────────┘
                                       │ HTTPS + Bearer JWT
                                       ▼
                       ┌──────────────────────────────┐
   Expo app ──────────►│  api/  Node 20 + Express     │
                       │  https://skinapi.seemaai.co.uk│
                       └───┬───────────┬───────────┬──┘
                           │           │           │
                  ┌────────▼──┐  ┌─────▼──────┐ ┌──▼───────────┐
                  │ Postgres  │  │ n8n AI     │ │ WhatsApp     │
                  │ 16        │  │ workflow   │ │ Cloud API    │
                  │skin-postgres│ │→ OpenAI   │ └──────────────┘
                  └───────────┘  └────────────┘
                           │
                     ┌─────▼──────────────┐
                     │ Push: Expo (app)   │
                     │ + VAPID (web)      │
                     │ + FCM/APNs (native)│
                     └────────────────────┘
```

The web client is **additive**. The Expo app keeps working against the same API
throughout the web build; nothing is switched off until the Capacitor binaries
replace it.

**Infrastructure (unchanged):** Docker `skin-backend` on the VPS at
`172.17.0.1:8095`, network `n8n_default`; Caddy (`seema-caddy-1`,
`/opt/seema/deploy/Caddyfile`) terminates TLS for `skinapi.seemaai.co.uk`; DNS
`skinapi` A → `69.62.110.2` at Hostinger. The web app adds one more Caddy site
block serving static files (§9).

---

## 2. Stack decisions

| Concern | Choice | Why this one |
|---|---|---|
| Framework | **React 18 + TypeScript** | The Expo app is already React + TS — components, types, and i18n strings port over almost literally. |
| Build | **Vite 5** | Static SPA output, which is exactly what Capacitor's `webDir` needs. Fast HMR. |
| **Not** Next.js | — | SSR/route handlers cannot ship inside a Capacitor bundle; a static export would forfeit the reason to pick Next in the first place. |
| Routing | **React Router 6** (`createBrowserRouter`) | Nested layouts map cleanly onto the expo-router groups: `(auth)` → `/`, `(patient)` → `/app`, `(staff)` → `/staff`. |
| Server state | **TanStack Query v5** | Replaces the app's `useQuery` hook, with polling, focus-refetch, optimistic mutations, and cache invalidation built in — exactly what chat needs. |
| Client state | **React Context** (auth, theme, i18n) + **Zustand** for the chat draft/selection store | Matches the existing provider shape; Zustand only where cross-tree state (multi-select tagging) would otherwise cause re-render churn. |
| Styling | **Tailwind CSS + CSS custom properties** | Tokens from `mobile/src/theme/palettes.ts` become CSS variables; Tailwind maps them to utilities. Theme switch = swapping variables on `<html>`, no re-render. |
| Primitives | **Radix UI** (dialog, sheet, dropdown, tabs, toast) | Accessible, unstyled, RTL-aware — a11y (PRD §8) without hand-rolling focus traps. |
| Forms | **react-hook-form + zod** | The 5-step intake form needs per-step validation, draft persistence, and typed output. |
| i18n | **i18next + react-i18next** | Direct port of `translations.ts`; handles plurals and `dir` switching. |
| Dates | **date-fns** + `date-fns-tz` | Appointment times pinned to `Asia/Karachi`. |
| Icons | **lucide-react** | Closest match to the Ionicons set in use. |
| Native shell | **Capacitor 6** | Wraps the same static build; plugins for push, camera, filesystem, preferences. |
| Tests | **Vitest + Testing Library**, **Playwright** for the two flagship flows | Triage and booking are the flows that break silently. |

---

## 3. Repository layout

```
skinbyfizza/
├── api/                     ← unchanged Node/Express backend
├── db/schema.sql            ← unchanged Postgres schema
├── mobile/                  ← existing Expo app (kept until the wrap ships)
├── docs/
│   ├── ARCHITECTURE.md      ← Expo-era record
│   ├── WEB_PRD.md           ← product requirements (web)
│   └── WEB_ARCHITECTURE.md  ← this file
└── web/                     ← NEW: the React web client
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── capacitor.config.ts  ← added in phase W8
    ├── .env.example
    ├── public/
    │   ├── manifest.webmanifest
    │   ├── sw.js                     # push + asset cache (web only)
    │   └── fonts/                    # Outfit + Plus Jakarta Sans, self-hosted
    └── src/
        ├── main.tsx                  # providers + router mount
        ├── router.tsx                # route tree + role guards
        ├── api/
        │   ├── client.ts             # fetch wrapper, JWT attach, refresh queue
        │   ├── config.ts             # API_BASE_URL + endpoint map
        │   ├── types.ts              # ported from mobile/src/api/types.ts
        │   └── services.ts           # typed endpoint wrappers
        ├── platform/                 # ★ the Capacitor seam — see §7
        │   ├── index.ts              # picks web vs native at build time
        │   ├── storage.ts            # localStorage  → Preferences
        │   ├── push.ts               # VAPID         → PushNotifications
        │   ├── camera.ts             # <input file>  → Camera
        │   ├── files.ts              # Blob/objectURL→ Filesystem
        │   ├── share.ts              # Web Share API → Share
        │   ├── network.ts            # navigator.onLine → Network
        │   └── app.ts                # back button, app state, external links
        ├── auth/
        │   ├── AuthContext.tsx       # session, role, refresh, sign-out
        │   └── guards.tsx            # <RequireAuth>, <RequireRole>
        ├── theme/
        │   ├── tokens.css            # CSS variables, dark + light
        │   └── ThemeContext.tsx
        ├── i18n/
        │   ├── index.ts
        │   └── locales/{en,ur,ar}.json
        ├── components/               # Button, Card, Badge, TextField, Sheet,
        │                             # EmptyState, SectionHeader, Avatar, Stepper,
        │                             # ChatBubble, ChatComposer, StatusChip
        ├── layouts/
        │   ├── AuthLayout.tsx
        │   ├── PatientLayout.tsx     # bottom tabs < lg, left rail ≥ lg
        │   └── StaffLayout.tsx       # tabs < lg, two-pane inbox ≥ lg
        ├── features/
        │   ├── auth/                 # sign-in, sign-up, welcome
        │   ├── discover/
        │   ├── treatments/
        │   ├── booking/              # BookingWizard + 5 steps + draft store
        │   ├── appointments/
        │   ├── chat/                 # useChatPoll, ThreadList, Thread, triage
        │   ├── ai/                   # consultant + before/after
        │   ├── prescriptions/
        │   ├── instructions/
        │   ├── users/
        │   ├── notifications/
        │   └── profile/
        └── lib/                      # formatters, phone (E.164), validators, cn()
```

**Rule:** `features/*` never imports from `platform/*` implementations directly —
only from `platform/index.ts`. That single seam is what keeps the Capacitor phase
from touching feature code.

---

## 4. API contract (as implemented today)

Base: `https://skinapi.seemaai.co.uk`. Auth: `Authorization: Bearer <access>`.
Sourced from `api/src/routes/*`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | — | Liveness |
| POST | `/auth/signup` | — | `{full_name, phone_e164, email?, password}` → `{token, refresh, user}` |
| POST | `/auth/login` | — | `{identifier, password}` — email **or** phone |
| POST | `/auth/refresh` | — | `{refresh}` → new access token |
| GET | `/me` | 🔒 | Current user |
| POST | `/profile/update` | 🔒 | Own profile (staff may edit others) |
| GET | `/about` | — | `{about, locations[]}` |
| GET | `/procedures` | — | Public catalogue |
| POST | `/procedures` | 🔒 doctor·manager | Create |
| PUT | `/procedures/:id` | 🔒 doctor·manager | Update |
| DELETE | `/procedures/:id` | 🔒 doctor·manager | Delete |
| GET | `/appointments` | 🔒 | Own (patient) / all (staff) — `?city=&status=` |
| POST | `/appointments/book` | 🔒 | Patient books; accepts a `consultation` object written to `consultations` |
| POST | `/appointments/assign` | 🔒 doctor·manager | Assign to a user |
| POST | `/appointments/:id/reschedule` | 🔒 | Keeps `original_scheduled_at` |
| POST | `/appointments/:id/status` | 🔒 doctor·manager | pending·confirmed·completed·cancelled |
| GET | `/chat/threads` | 🔒 | Role-aware: patient own · manager all · doctor primary + tagged + VIP |
| GET | `/chat/poll` | 🔒 | `?conversation_id=&since=` — the realtime substitute |
| POST | `/chat/send` | 🔒 | `{conversation_id?, body, media_base64?, media_mime?}` |
| POST | `/chat/set-primary` | 🔒 manager·doctor | Promote a thread |
| POST | `/chat/tag-doctor` | 🔒 manager·doctor | `{message_ids[]}` |
| GET | `/users` | 🔒 doctor·manager | `?q=` search |
| POST | `/users/:id/register` | 🔒 doctor·manager | Give a WA lead a login |
| POST | `/users/:id/rating` | 🔒 **doctor** | `interest_rating` 1–5 |
| POST | `/users/:id/vip` | 🔒 **doctor** | `customer_type` |
| POST | `/users/:id/status` | 🔒 **doctor** | active·inactive |
| POST | `/users/:id/role` | 🔒 **doctor** | user·manager·doctor |
| DELETE | `/users/:id` | 🔒 **doctor** | Delete |
| GET | `/prescriptions` | 🔒 | `?user_id=` (staff) / own |
| POST | `/prescriptions` | 🔒 **doctor** | `{user_id, item_name, price?, notes?}` |
| GET | `/instructions` | 🔒 doctor·manager | `?user_id=` |
| POST | `/instructions` | 🔒 **doctor** | `{user_id, audience: team\|doctor, body, lang}` |
| GET | `/notifications` | 🔒 | Feed |
| POST | `/notifications/:id/read` | 🔒 | Mark read |
| POST | `/push/register-token` | 🔒 | Currently stores an **Expo** token in `users.expo_push_token` |
| POST | `/ai/chat` | 🔒 | Calls OpenAI directly when `OPENAI_API_KEY` is set; falls back to the n8n webhook (`N8N_AI_URL`) when it isn't |
| POST | `/wa/inbound` | — | WhatsApp inbound webhook |
| GET | `/uploads/*` | — | Static media, 30-day cache |

**Not yet implemented** but referenced by the client config: `/profile/photo`,
`/ai/before-after`, `GET /wa/webhook`, `GET /consultations`, `POST /auth/logout`.
See PRD §11.

### 4.1 API client

```ts
// src/api/client.ts — single fetch wrapper
// • attaches the access token
// • on 401: one refresh attempt, queues concurrent calls, replays them,
//   and signs out if the refresh itself fails
// • 20s timeout via AbortController
// • throws ApiError { status, body } so features render field-level errors
```

Ported from `mobile/src/api/client.ts` — the `configureApi({getToken,
onUnauthorized, refreshSession})` wiring stays identical, so `services.ts` and
`types.ts` transfer with no edits.

---

## 5. Data model

Unchanged; `db/schema.sql` is authoritative.

| Table | Role in the web app |
|---|---|
| `users` | Identity + role + `customer_type` + `interest_rating` + `city` + push token. WhatsApp leads: `email NULL`. |
| `refresh_tokens` | Refresh/logout. |
| `conversations` | One per patient × platform; `triage`, `last_sender_id`, `unread_count`, `last_reminder_at`. |
| `messages` | `type` text·image·audio·file, `media_url`, `whatsapp_message_id` (dedupe), `tagged_to_doctor`. |
| `procedures` | No price; has `session_gap`, `key_features text[]`. |
| `appointments` | Status + `original_scheduled_at` + `city` + `assigned_by`. |
| `consultations` | Intake form: identity columns + `form jsonb` + `signature` + `agreed`, linked to an appointment. |
| `prescriptions` | Item (product or service) + price + notes. |
| `instructions` | `audience` team·doctor, `lang` en·ur·ar. |
| `notifications` | In-app feed. |
| `about_us` (single row), `clinic_locations` | Clinic info. |

No schema change is required for the web phase, unless push tokens gain a type
column (recommended when web/native push lands — see §7.2).

---

## 6. Frontend architecture

### 6.1 Route tree and guards

```tsx
createBrowserRouter([
  { path: '/',        element: <RootRedirect /> },          // by session + role
  { element: <AuthLayout />, children: [
      '/welcome', '/sign-in', '/sign-up', '/about' ] },
  { element: <RequireAuth><RequireRole role="user"><PatientLayout/></RequireRole></RequireAuth>,
    children: [ '/app/discover', '/app/treatments', '/app/treatments/:id',
                '/app/book/:procedureId', '/app/appointments', '/app/chat',
                '/app/ai', '/app/prescriptions', '/app/profile',
                '/app/profile/edit', '/app/notifications' ] },
  { element: <RequireAuth><RequireRole role={['manager','doctor']}><StaffLayout/></RequireRole></RequireAuth>,
    children: [ '/staff', '/staff/chats', '/staff/chats/:conversationId',
                '/staff/appointments', '/staff/appointments/new',
                '/staff/users', '/staff/users/:id',
                '/staff/treatments', '/staff/treatments/new',
                '/staff/treatments/:id', '/staff/prescriptions/new' ] },
])
```

Every route is `React.lazy`-loaded. Guards render a branded skeleton while the
session restores — never a flash of the sign-in screen for a logged-in user.

### 6.2 Permission gating

One `usePermissions()` hook derives booleans from `user.role`, mirroring the
server checks exactly:

```ts
const can = {
  deleteUser:     role === 'doctor',
  setUserStatus:  role === 'doctor',
  setUserRole:    role === 'doctor',
  setRating:      role === 'doctor',
  setVip:         role === 'doctor',
  writeRx:        role === 'doctor',
  writeInstruction: role === 'doctor',
  triage:         role === 'doctor' || role === 'manager',
  manageProcedures: role === 'doctor' || role === 'manager',
};
```

Forbidden controls are **not rendered** (PRD §5.9 AC), and the server rejects
them anyway — two layers, no reliance on either alone.

### 6.3 Chat polling

```ts
useQuery({
  queryKey: ['chat', conversationId, 'since', cursor],
  queryFn:  () => api.pollMessages(conversationId, cursor),
  refetchInterval: () => (document.visibilityState === 'visible' ? 4000 : false),
  refetchIntervalInBackground: false,
})
```

- The cursor is the newest `created_at` already held; the response appends.
- On failure the interval backs off 4s → 8s → 16s → 30s, resetting on success.
- The thread list polls at 10s; the unread badge polls at 30s.
- **Migration path:** when the API gains SSE or WebSockets, only `useChatPoll`
  changes — the cursor-based schema already supports it, and no component moves.

### 6.4 Optimistic mutations

Send-message, set-primary, tag-doctor, appointment status, and rating all use
TanStack `onMutate` → cache patch → `onError` rollback → `onSettled` invalidate.
A pending message bubble shows a clock; a failed one shows a retry.

### 6.5 Booking wizard

`BookingWizard` holds a `zod`-typed draft in a Zustand store, mirrored to
`platform.storage` under `booking-draft:<procedureId>` on every step change.
Submit posts once to `/appointments/book` with `{scheduled_at, city,
procedure_id, consultation: {...}}`; a success clears the draft. Steps 3–4 are
serialized into `consultation.form` as JSON, so adding questions is a
translation-file change plus a step schema edit — no migration.

### 6.6 Theming

`tokens.css` defines both palettes as custom properties; `<html data-theme>`
selects one, `<html dir>` selects direction, and both persist through
`platform.storage`. Tailwind consumes the variables
(`colors: { gold: 'var(--gold)' }`), so a theme switch is a single attribute
change with no React re-render.

---

## 7. The platform layer (the Capacitor seam)

`src/platform/index.ts` exports one interface with two implementations, selected
by `Capacitor.isNativePlatform()` at runtime (both are tree-shaken per build via
`import.meta.env.VITE_TARGET` where the native SDK would otherwise bloat the web
bundle).

| Module | Web implementation | Native implementation (W8) |
|---|---|---|
| `storage` | `localStorage` (async-wrapped) | `@capacitor/preferences` |
| `push` | Service Worker + VAPID subscription | `@capacitor/push-notifications` → FCM / APNs |
| `camera` | `<input type="file" accept="image/*" capture>` | `@capacitor/camera` |
| `files` | `Blob` + object URLs | `@capacitor/filesystem` |
| `share` | `navigator.share` with a copy-link fallback | `@capacitor/share` |
| `network` | `navigator.onLine` + online/offline events | `@capacitor/network` |
| `app` | no-op back handler, `window.open` for external links | `@capacitor/app` back button, `@capacitor/browser` |
| `haptics` | no-op | `@capacitor/haptics` |

**Every module is async-first** (`get(): Promise<string|null>`), because the
native APIs are — writing the web implementation synchronously is the single
most common thing that forces a rewrite later.

### 7.1 Auth storage

Access token in memory, refresh token via `platform.storage`. **No httpOnly
cookies:** a Capacitor app's origin is `capacitor://localhost` (iOS) or
`http://localhost` (Android), so cookies scoped to the API domain never attach.
Bearer tokens work identically on all three targets, which is why the API's
existing `Authorization` header scheme carries over untouched.

### 7.2 Push across three targets

`POST /push/register-token` currently writes a single `users.expo_push_token`
and `lib/push.js` only speaks the Expo push API. To serve web + native:

```sql
CREATE TABLE push_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      text NOT NULL UNIQUE,
  kind       text NOT NULL CHECK (kind IN ('expo','web','fcm','apns')),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

`notifyUser()` then fans out per `kind`. Until that lands, web push is a no-op
and the in-app notification feed carries the load.

---

## 8. Environment & configuration

`web/.env.example`:

```
VITE_API_BASE_URL=https://skinapi.seemaai.co.uk
VITE_APP_NAME=Skin By Dr. Fizza G
VITE_DEFAULT_LOCALE=en
VITE_DEFAULT_CITY=Karachi
VITE_VAPID_PUBLIC_KEY=            # web push, once §7.2 lands
VITE_SENTRY_DSN=                  # optional
```

Only `VITE_`-prefixed values reach the bundle — **never put a secret here**; the
bundle is public on all three targets.

`vite.config.ts` essentials:

```ts
export default defineConfig({
  base: './',                      // required for capacitor:// and file:// origins
  build: { outDir: 'dist', sourcemap: true, target: 'es2020' },
  server: { port: 5173 },
});
```

Backend CORS must allow, at minimum:

```
http://localhost:5173          # dev
https://<web-domain>           # production web
capacitor://localhost          # Capacitor iOS
http://localhost               # Capacitor Android
```

---

## 9. Build & deploy

**Web.** `npm run build` → `web/dist` (static). Serve behind a new Caddy site
block alongside the existing API block, with SPA fallback:

```
app.seemaai.co.uk {
    root * /opt/skin-web/dist
    encode gzip zstd
    try_files {path} /index.html      # SPA fallback
    file_server
    header /assets/* Cache-Control "public, max-age=31536000, immutable"
    header /index.html Cache-Control "no-cache"
}
```

Add the `app` A record at Hostinger → `69.62.110.2`. Deploy = build, rsync
`dist/` to `/opt/skin-web/dist`, reload Caddy. CI: typecheck → lint → unit tests
→ build → deploy on `master`.

**Native (W8).**

```bash
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Skin By Dr. Fizza G" co.uk.seemaai.skinbyfizza --web-dir=dist
npm run build && npx cap sync
npx cap open android   # / ios
```

`capacitor.config.ts`:

```ts
export default {
  appId: 'co.uk.seemaai.skinbyfizza',
  appName: 'Skin By Dr. Fizza G',
  webDir: 'dist',
  server: { androidScheme: 'https' },   // https origin on Android → secure-context APIs work
  plugins: {
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
    SplashScreen: { backgroundColor: '#0A0A0C', showSpinner: false },
  },
};
```

Native additions in W8, all outside feature code: FCM `google-services.json` /
APNs key, native implementations in `src/platform/*`, safe-area CSS, hardware
back handling, icon + splash generation, and store metadata.

---

## 10. Porting map — Expo → Web

| Expo | Web | Effort |
|---|---|---|
| `src/api/{client,config,types,services}.ts` | `src/api/*` | **Copy**; swap SecureStore for `platform.storage` |
| `src/theme/palettes.ts` | `src/theme/tokens.css` | Mechanical: object → CSS variables |
| `src/theme/typography.ts` | Tailwind type scale | Mechanical |
| `src/i18n/translations.ts` | `src/i18n/locales/*.json` | Split by locale |
| `src/auth/AuthContext.tsx` | `src/auth/AuthContext.tsx` | ~Copy; storage swap |
| `src/hooks/useQuery.ts` | TanStack Query | Replace |
| `src/hooks/usePushToken.ts` | `platform/push.ts` | Rewrite |
| `src/components/*` (RN primitives) | `src/components/*` (DOM + Tailwind) | Rewrite, same API surface |
| `app/(patient)/*`, `app/(staff)/*` | `src/features/*` + layouts | Rewrite layout, port logic |
| `expo-router` groups | React Router nested routes | Direct mapping |

Roughly **40% of the code ports as-is** (API layer, types, i18n, auth logic,
business rules); the rest is presentation rewritten from React Native primitives
to DOM.

---

## 11. Cross-cutting concerns

- **Error handling:** a route-level `<ErrorBoundary>` per feature; `ApiError` renders field errors for 400/422, a "session expired" redirect for 401, a "not allowed" notice for 403, and a retry for 5xx.
- **Loading:** skeletons matching final layout — no spinners on list screens, no layout shift.
- **Logging:** Sentry optional; **never** log message bodies, media URLs, or intake-form answers.
- **Security headers** (Caddy): `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a CSP allowing `self` plus the API origin and `blob:`/`data:` for media previews.
- **Timezone:** all appointment rendering pinned to `Asia/Karachi` regardless of device timezone.
- **Phone handling:** one E.164 helper for parse/format/validate; `+92` default. Login sends the raw identifier and lets the API disambiguate.

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| Base64 media in a 12MB JSON body fails from browsers sooner than from the app | Client-side image downscale before upload; add the multipart endpoint (PRD §11 #7) before W3 ships |
| 4s polling × staff × open tabs raises API load | Poll only the focused thread; back off when hidden; consider SSE at W7 |
| iOS web push needs an installed PWA and iOS 16.4+ | Treat web push as best-effort; the native wrap is the real push channel |
| Two clients (Expo + web) drift against one API | Freeze Expo feature work at W0; the web client is the only place new features land |
| Open CORS today becomes a real exposure with a browser client | Close it (PRD §11 #1) before the first public web deploy |

---

## 13. Definition of done (web phase)

1. Every AC in PRD §5 passes on mobile Safari, mobile Chrome, and desktop Chrome.
2. Playwright covers: patient books with intake form; manager triages a thread to primary and the doctor sees it.
3. Lighthouse ≥ 90 performance / ≥ 95 accessibility on Discover and the staff inbox.
4. All ten boxes in PRD §10 checked.
5. P0 and P1 backend gaps (PRD §11) closed and deployed.
