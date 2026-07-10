-- Skin By Dr. Fizza G — PostgreSQL schema
-- Idempotent: safe to run multiple times in your n8n Postgres database.
-- Backs the skinbydrfizzag n8n auth workflow (and future endpoints).

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- for gen_random_uuid()

-- ─────────────────────────────────────────────────────────────
-- USERS  (patients, managers, doctor) + WhatsApp leads
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       text        NOT NULL,
  email           text        UNIQUE,                 -- nullable (WA leads have none)
  phone_e164      text        NOT NULL UNIQUE,        -- WhatsApp number WITH country code
  password_hash   text,                               -- scrypt$salt$hash
  role            text        NOT NULL DEFAULT 'user'
                              CHECK (role IN ('user', 'manager', 'doctor')),
  customer_type   text        NOT NULL DEFAULT 'regular'
                              CHECK (customer_type IN ('regular', 'vip')),
  status          text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'inactive')),
  interest_rating int         CHECK (interest_rating BETWEEN 1 AND 5),  -- doctor-set
  city            text,
  photo_url       text,
  expo_push_token text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone_e164);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));

-- keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- REFRESH TOKENS  (optional — for /auth/refresh + logout)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens (user_id);

-- ─────────────────────────────────────────────────────────────
-- CONVERSATIONS + MESSAGES  (chat + triage)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform          text NOT NULL DEFAULT 'app' CHECK (platform IN ('app', 'whatsapp')),
  triage            text NOT NULL DEFAULT 'general' CHECK (triage IN ('general', 'primary')),
  assigned_doctor_id uuid REFERENCES users(id),
  last_message      text,
  last_sender_id    uuid,
  unread_count      int  NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conv_triage ON conversations (triage);

-- Reminder escalation: when the last message is from the patient (last_sender_id
-- = user_id) and stays unanswered, staff get an hourly push until they reply.
-- last_reminder_at throttles those pushes to once an hour per thread.
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_conv_awaiting ON conversations (last_sender_id, updated_at);

CREATE TABLE IF NOT EXISTS messages (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id           uuid REFERENCES users(id),
  body                text,
  type                text NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','audio','file')),
  media_url           text,
  whatsapp_message_id text UNIQUE,            -- dedupe inbound WhatsApp
  tagged_to_doctor    boolean NOT NULL DEFAULT false,
  is_read             boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_msg_conv_created ON messages (conversation_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- PROCEDURES  (no price field — per requirements)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS procedures (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title              text NOT NULL,
  description        text,
  category           text,
  duration           text,
  sessions           int,
  visits_per_session int,
  session_gap        text,        -- time between sessions/visits
  key_features       text[],
  image_url          text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- APPOINTMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  procedure_id         uuid REFERENCES procedures(id),
  scheduled_at         timestamptz NOT NULL,
  original_scheduled_at timestamptz,
  status               text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','confirmed','completed','cancelled')),
  city                 text,
  assigned_by          uuid REFERENCES users(id),
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appt_user ON appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_appt_city ON appointments (city);

-- ─────────────────────────────────────────────────────────────
-- PRESCRIPTIONS  (doctor adds product/service + price)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id  uuid REFERENCES users(id),
  item_name  text NOT NULL,        -- product OR service (e.g. Botox)
  price      numeric(10,2),
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rx_user ON prescriptions (user_id);

-- ─────────────────────────────────────────────────────────────
-- INSTRUCTIONS  (team vs doctor-self, multi-language)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instructions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audience   text NOT NULL CHECK (audience IN ('team','doctor')),
  body       text NOT NULL,
  lang       text NOT NULL DEFAULT 'en' CHECK (lang IN ('en','ur','ar')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instr_user ON instructions (user_id);

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  body       text,
  data       jsonb,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- CONSULTATIONS  (client intake form filled while booking)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  full_name      text,
  date_of_birth  date,
  address        text,
  phone          text,
  email          text,
  referred_by    text,
  main_goal      text,
  form           jsonb,     -- detailed skincare + medical answers
  signature      text,      -- typed name as e-signature
  agreed         boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consultations_user ON consultations (user_id);

-- ─────────────────────────────────────────────────────────────
-- CLINIC INFO + LOCATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS about_us (
  id          int PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- single row
  description text,
  email       text,
  phone       text,
  instagram   text,
  facebook    text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinic_locations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  city       text,
  address    text,
  phone      text,
  email      text,
  map_url    text,
  sort_order int NOT NULL DEFAULT 0,
  active     boolean NOT NULL DEFAULT true
);

-- ─────────────────────────────────────────────────────────────
-- SEED  (optional starter rows — edit as needed)
-- ─────────────────────────────────────────────────────────────
INSERT INTO about_us (id, description, email, phone)
VALUES (1, 'Skin By Dr. Fizza G — expert dermatology & aesthetic care.', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO clinic_locations (name, city, active, sort_order)
VALUES ('Karachi Clinic', 'Karachi', true, 0)
ON CONFLICT DO NOTHING;
