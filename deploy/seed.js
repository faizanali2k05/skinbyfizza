'use strict';

/**
 * One-shot seed for a fresh deployment.
 *
 * Creates the doctor, a manager, and a demo patient, plus the clinic info row
 * and a small starter treatment catalogue. Idempotent: re-running updates the
 * seeded passwords rather than creating duplicates (users.phone_e164 is unique).
 *
 * Run inside the API container so it reuses the same scrypt hashing the login
 * endpoint verifies against:
 *   docker compose exec skin_api node /app/seed.js
 *
 * Credentials come from the environment so they are never committed:
 *   SEED_DOCTOR_EMAIL / SEED_DOCTOR_PASSWORD / SEED_DOCTOR_PHONE  (etc.)
 */

const { query, pool } = require('/app/src/db');
const { hashPassword } = require('/app/src/auth/password');

const people = [
  {
    label: 'doctor',
    full_name: process.env.SEED_DOCTOR_NAME || 'Dr. Fizza G',
    email: process.env.SEED_DOCTOR_EMAIL,
    phone: process.env.SEED_DOCTOR_PHONE,
    password: process.env.SEED_DOCTOR_PASSWORD,
    role: 'doctor',
  },
  {
    label: 'manager',
    full_name: process.env.SEED_MANAGER_NAME || 'Clinic Manager',
    email: process.env.SEED_MANAGER_EMAIL,
    phone: process.env.SEED_MANAGER_PHONE,
    password: process.env.SEED_MANAGER_PASSWORD,
    role: 'manager',
  },
  {
    label: 'patient',
    full_name: process.env.SEED_PATIENT_NAME || 'Demo Patient',
    email: process.env.SEED_PATIENT_EMAIL,
    phone: process.env.SEED_PATIENT_PHONE,
    password: process.env.SEED_PATIENT_PASSWORD,
    role: 'user',
  },
];

const treatments = [
  {
    title: 'HydraFacial',
    category: 'Facials',
    description:
      'A medical-grade deep cleanse, exfoliation and hydration in one session. Leaves skin clear, plump and glowing with no downtime.',
    duration: '45 minutes',
    sessions: 4,
    visits_per_session: 1,
    session_gap: '3 weeks',
    key_features: ['No downtime', 'Instant glow', 'Suits sensitive skin'],
  },
  {
    title: 'Botox — Wrinkle Softening',
    category: 'Injectables',
    description:
      'Precisely placed injections that relax the muscles causing forehead lines, frown lines and crow’s feet.',
    duration: '30 minutes',
    sessions: 1,
    visits_per_session: 1,
    session_gap: '4 months',
    key_features: ['Results in 5–7 days', 'Lasts 3–4 months', 'Doctor-administered'],
  },
  {
    title: 'Laser Hair Reduction',
    category: 'Laser',
    description:
      'Long-term hair reduction using a diode laser calibrated for South Asian skin tones.',
    duration: '20–60 minutes',
    sessions: 6,
    visits_per_session: 1,
    session_gap: '4 weeks',
    key_features: ['Safe for darker skin', 'Minimal discomfort', 'Lasting reduction'],
  },
  {
    title: 'Chemical Peel',
    category: 'Skin Care',
    description:
      'A tailored peel that resurfaces dull, congested or pigmented skin and evens out tone.',
    duration: '30 minutes',
    sessions: 3,
    visits_per_session: 1,
    session_gap: '2 weeks',
    key_features: ['Targets pigmentation', 'Smooths texture', 'Customised strength'],
  },
];

async function main() {
  const missing = people.filter((p) => !p.email || !p.phone || !p.password);
  if (missing.length) {
    console.error(
      `[seed] missing env for: ${missing.map((m) => m.label).join(', ')}. ` +
        'Set SEED_<ROLE>_EMAIL / _PHONE / _PASSWORD.',
    );
    process.exit(1);
  }

  for (const p of people) {
    const hash = hashPassword(p.password);
    const res = await query(
      `INSERT INTO users (full_name, email, phone_e164, password_hash, role, customer_type, status, city)
       VALUES ($1, $2, $3, $4, $5, 'regular', 'active', 'Karachi')
       ON CONFLICT (phone_e164) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             email         = EXCLUDED.email,
             full_name     = EXCLUDED.full_name,
             role          = EXCLUDED.role,
             status        = 'active'
       RETURNING id, role, email`,
      [p.full_name, p.email.toLowerCase(), p.phone, hash, p.role],
    );
    console.log(`[seed] ${p.label}: ${res.rows[0].email} (${res.rows[0].role})`);
  }

  for (const t of treatments) {
    const exists = await query('SELECT 1 FROM procedures WHERE title = $1 LIMIT 1', [t.title]);
    if (exists.rowCount) continue;
    await query(
      `INSERT INTO procedures
         (title, description, category, duration, sessions, visits_per_session, session_gap, key_features)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        t.title,
        t.description,
        t.category,
        t.duration,
        t.sessions,
        t.visits_per_session,
        t.session_gap,
        t.key_features,
      ],
    );
    console.log(`[seed] treatment: ${t.title}`);
  }

  await query(
    `UPDATE about_us
        SET description = COALESCE($1, description),
            email       = COALESCE($2, email),
            phone       = COALESCE($3, phone),
            instagram   = COALESCE($4, instagram)
      WHERE id = 1`,
    [
      'Skin By Dr. Fizza G — expert dermatology & aesthetic care in Karachi.',
      process.env.SEED_DOCTOR_EMAIL || null,
      process.env.SEED_CLINIC_PHONE || null,
      process.env.SEED_CLINIC_INSTAGRAM || null,
    ],
  );

  const counts = await query(
    `SELECT (SELECT count(*) FROM users)      AS users,
            (SELECT count(*) FROM procedures) AS procedures`,
  );
  console.log('[seed] done —', counts.rows[0]);
  await pool.end();
}

main().catch((e) => {
  console.error('[seed] failed:', e.message);
  process.exit(1);
});
