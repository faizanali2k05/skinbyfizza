# Skin By Dr. Fizza G

Dual-role clinic app (patients + doctor/manager) with a dark-luxury UI.

## Repository structure

```
skinbyfizza/
├── mobile/        Expo (React Native) app — the patient & staff app
│   ├── app/       expo-router routes
│   │   ├── (auth)/       welcome, sign-in, sign-up
│   │   ├── (patient)/    tabs: discover, categories, featured, appointments, more
│   │   ├── (staff)/      doctor/manager console: chats, users, procedures, appointments
│   │   ├── procedure/ book/ chat, clinic-chat, notifications, prescriptions …
│   │   └── _layout.tsx   providers (theme, i18n, auth) + root stack
│   └── src/
│       ├── api/         client + typed service wrappers (points at the api backend)
│       ├── auth/        JWT session (SecureStore) + AuthContext
│       ├── components/  themed UI kit (Screen, Text, Button, Card, ChatThread …)
│       ├── theme/       dark + light palettes, ThemeContext, typography, spacing
│       ├── i18n/        English / Urdu / Arabic
│       └── hooks/       useQuery (optimistic), usePushToken
│
├── api/           Node/Express backend  →  https://skinapi.seemaai.co.uk
│   └── src/        auth, profile, procedures, appointments, chat, notifications,
│                   push, prescriptions, users, ai (proxy to n8n)
│
├── db/            PostgreSQL schema (schema.sql)
└── docs/          ARCHITECTURE.md, PRD
```

## Architecture (live)

```
mobile app ──HTTPS──► api (Node/Express) ──► PostgreSQL (skin-postgres)
                          │
                          └─► /ai/chat ──► n8n (skinbyfizza) ──► OpenAI
```

- **App base URL:** `https://skinapi.seemaai.co.uk` (`mobile/src/api/config.ts`)
- **AI consultant:** delegated to the n8n `skinbyfizza` workflow
- Deploy + endpoint reference: `api/README.md`

## Run the app

```bash
cd mobile
npm install
npm start          # opens Expo Go (QR) — scan with the Expo Go app
```
