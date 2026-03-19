# Thai Lottery Checker

Thai Lottery Checker is a monorepo for a multilingual lottery product with a public web experience and a protected admin area.

The current shipped baseline includes:

- public Thai lottery results browsing
- admin auth/session with HTTP-only cookie handling
- invitation-based admin onboarding
- admin password reset
- super-admin account management
- admin result draft, publish, and correction flows

Repo structure:

- `apps/api`: Express API for public and admin endpoints
- `apps/web`: Next.js web app for public routes and protected `/admin` routes
- `packages/{types,schemas,domain,i18n,utils}`: shared contracts and domain helpers
- Prisma 7 + PostgreSQL for canonical data storage

For deeper product and architecture details, see:

- [Implementation roadmap](docs/roadmap/implementation-roadmap.md)
- [Slice 2 plan](docs/roadmap/slice-2-admin-platform-foundation-and-result-management.md)
- [System architecture](docs/architecture/system-architecture.md)

## Requirements

- Node.js 24+
- pnpm 10+
- PostgreSQL running locally or remotely

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create a local environment file:

```bash
cp .env.example .env
```

3. Update `.env` with your local values.

At minimum, check:

- `DATABASE_URL`
- `ADMIN_SESSION_SECRET`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`
- `ADMIN_BOOTSTRAP_NAME`

See [.env.example](.env.example) for the full local-development baseline.

4. Generate the Prisma client:

```bash
pnpm db:generate
```

5. Apply migrations:

```bash
pnpm db:migrate:deploy
```

6. Seed development data:

```bash
pnpm db:seed
```

The seed creates:

- 1 bootstrap `super_admin` from env
- 2 published draws for public browsing
- 1 draft draw for admin workflows

## Run the apps

Start both apps together from the repo root:

```bash
pnpm dev
```

Or start them individually:

```bash
pnpm build:packages
pnpm --filter @thai-lottery-checker/api dev
pnpm --filter @thai-lottery-checker/web dev
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

## Public Web Routes

Assuming the web app runs at `http://localhost:3000`:

- `/en/results`
- `/en/results/history`
- `/en/results/2026-03-01`
- `/th/results`
- `/my/results`

The seeded draft draw `2026-03-16` should not appear publicly and should resolve to not-found on the public detail route.

## Admin Web Routes

Main admin routes:

- `/admin/login`
- `/admin`
- `/admin/admins`
- `/admin/results`
- `/admin/invitations/accept`
- `/admin/reset-password/request`
- `/admin/reset-password/confirm`

Use the seeded bootstrap admin credentials from `.env` to sign in at `/admin/login`.

## Public API

Base URL:

```text
http://localhost:4000/api/v1/results
```

Endpoints:

- `GET /latest`
- `GET /`
- `GET /:drawDate`

Examples:

```bash
curl http://localhost:4000/api/v1/results/latest
curl "http://localhost:4000/api/v1/results?page=1&limit=20"
curl http://localhost:4000/api/v1/results/2026-03-01
```

Error examples:

```bash
curl http://localhost:4000/api/v1/results/not-a-date
curl "http://localhost:4000/api/v1/results?page=0&limit=200"
curl http://localhost:4000/api/v1/results/2026-03-16
```

## Admin API

Main admin route groups:

- `/api/v1/admin/auth/*`
- `/api/v1/admin/invitations/*`
- `/api/v1/admin/password-resets/*`
- `/api/v1/admin/admins`
- `/api/v1/admin/results*`

These endpoints are protected by the admin auth and permission model. Public result endpoints continue to expose published draws only.

## Verification

Run the current baseline verification flow:

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm typecheck
pnpm test
pnpm build:packages
pnpm --filter @thai-lottery-checker/api build
pnpm --filter @thai-lottery-checker/web build
```

Manual checks:

- Open `http://localhost:3000/en/results`
- Open `http://localhost:3000/en/results/history`
- Open `http://localhost:3000/en/results/2026-03-01`
- Open `http://localhost:3000/en/results/2026-03-16` and confirm not-found
- Open `http://localhost:3000/admin/login`
- Sign in with the bootstrap admin from `.env`
- Open `http://localhost:3000/admin/admins`
- Open `http://localhost:3000/admin/results`
- Request `GET http://localhost:4000/health`

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm build:packages
pnpm lint
pnpm typecheck
pnpm test
pnpm db:generate
pnpm db:migrate:dev
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:studio
```

## Workspace Layout

```text
apps/
  api/
  web/
packages/
  domain/
  i18n/
  schemas/
  types/
  utils/
```

## Notes

- PostgreSQL remains the source of truth.
- Slice 2 includes a cache-invalidation abstraction for result publish/correct flows; full Redis-backed performance hardening remains a later slice.
- Number checker, blog management, mobile features, and analytics remain outside the currently shipped baseline.
- The API handles `SIGINT` and `SIGTERM` with graceful shutdown, including Prisma disconnect.
