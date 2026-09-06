# Deployment — Skin By Dr. Fizza G (web)

Full stack on the Hostinger VPS **31.97.50.29** (`srv1806471`), under
`/opt/skinbyfizza`.

```
browser ──HTTPS──► host nginx ──► skin_web  (127.0.0.1:8120)  static SPA
                        │
                        └───────► skin_api  (127.0.0.1:8121)  Node/Express
                                       │
                                       ├─► skin_db  (internal only)  Postgres 16
                                       └─► n8n_app:5678  AI consultant
```

## Port policy — no conflicts by construction

Nothing binds `0.0.0.0`. The host's nginx is the only public listener, so this
stack cannot collide with anything already on the box:

| Port | Owner | Binding |
|---|---|---|
| 80 / 443 | host nginx | public |
| 3000 | agent-crm | 127.0.0.1 |
| 5678 | n8n | 127.0.0.1 |
| 5432 / 6543 | Supabase db / pooler | 127.0.0.1 |
| 8000 | Supabase gateway | 127.0.0.1 |
| **8120** | **skin_web** | **127.0.0.1** |
| **8121** | **skin_api** | **127.0.0.1** |
| — | **skin_db** | **not published at all** |

## First deploy

```bash
cd /opt/skinbyfizza/deploy
cp .env.example .env && chmod 600 .env   # fill in secrets
docker compose build
docker compose up -d
```

Seed the doctor/manager/patient plus a starter catalogue (idempotent — re-running
resets the seeded passwords rather than duplicating users):

```bash
cd /opt/skinbyfizza/deploy
PGPASS=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)
docker run --rm --network skinbyfizza_skin_net \
  --env-file /opt/skinbyfizza/deploy/.env \
  -e DATABASE_URL="postgres://skin:$PGPASS@skin_db:5432/skinbyfizza" \
  -v /opt/skinbyfizza/deploy/seed.js:/app/seed.js:ro \
  skinbyfizza-skin_api node /app/seed.js
```

`--env-file` is used rather than `compose exec` because the seed values contain
spaces, which a shell `source` would split.

## TLS

DNS must point at `31.97.50.29` first, then:

```bash
certbot --nginx -d skin.5kassi.com -d skinapi.5kassi.com \
  --non-interactive --agree-tos -m 5kassillc@gmail.com --redirect
```

Renewal is handled by the existing `certbot.timer`.

## Redeploying a change

```bash
cd /opt/skinbyfizza/deploy
docker compose build skin_web    # or skin_api
docker compose up -d
```

**The web image bakes `VITE_API_BASE_URL` at build time** (Vite inlines env into
the bundle). Changing the API URL means rebuilding `skin_web`, not just
restarting it.

## Schema changes

`db/schema.sql` runs only on an *empty* data directory. To apply a change to a
running database, run the SQL directly:

```bash
docker exec -i skin_db psql -U skin -d skinbyfizza < changes.sql
```

## Backups

```bash
docker exec skin_db pg_dump -U skin skinbyfizza | gzip > skin-$(date +%F).sql.gz
```

Chat media lives in the `skin_uploads` volume and is not covered by `pg_dump`.

## Logs / health

```bash
docker compose ps
docker compose logs -f skin_api
curl -s http://127.0.0.1:8121/health
```
