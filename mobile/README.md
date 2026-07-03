# Skin By Dr. Fizza G — Mobile App (Expo / React Native)

Dark-luxury clinic app (Ounass-inspired UI) on **Expo SDK 56** with
**expo-router**. Backend is self-hosted **n8n** (see `../docs/ARCHITECTURE.md`).

## Run

```bash
npm install            # uses .npmrc (legacy-peer-deps) for React 19 compatibility
npx expo start         # press i / a, or scan the QR in Expo Go
```

> Node note: install ran on Node 25. If you hit odd native errors, use the
> Expo-recommended LTS (Node 20/22).

## Point the app at the backend

The app talks to the **Node backend** (`backend/`), which owns auth + data and
proxies the AI consultant to n8n. Base URL resolves in this order
(`src/api/config.ts`):

1. `EXPO_PUBLIC_API_BASE_URL` env var
2. `app.json → expo.extra.apiBaseUrl`
3. fallback `https://skinapi.seemaai.co.uk`  ← live backend

Override for local dev:

```bash
# .env (not committed)
EXPO_PUBLIC_API_BASE_URL=https://skinapi.seemaai.co.uk
```

Endpoint paths live in `src/api/config.ts → endpoints` and map 1:1 to the
backend routes in `backend/README.md`. AI (`/ai/chat`) is proxied by the
backend to the n8n **skinbyfizza** workflow.

## Structure

```
app/                       expo-router routes
  _layout.tsx              fonts + providers (Auth, i18n) + root Stack
  index.tsx                auth-gated redirect
  (auth)/                  welcome, sign-in (email/WhatsApp), sign-up
  (patient)/               tab shell: discover, categories, featured, appointments, more
src/
  theme/                   dark-luxury palette, Playfair+Poppins type, spacing
  i18n/                    en / ur / ar with RTL
  api/                     client (JWT, timeouts, 401 handling), config, types
  auth/                    AuthContext (SecureStore) + storage
  components/              Screen, Text, Button, Card, TextField, Badge, …
  data/                    mock content (replace with n8n fetches)
```

## Status

- ✅ Scaffolds, typechecks, and bundles (verified via `expo export`).
- 🔌 Screens render with mock data; wire each to n8n endpoints next.
- ⏳ Not yet built: chat + polling, appointments booking flow, procedures
  detail, prescriptions, staff (manager/doctor) consoles, push registration.
```