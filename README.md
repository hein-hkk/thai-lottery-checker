# Thai Lottery Checker

Slice 1 is now implemented for the Thai Lottery Checker monorepo. The repo currently includes:

- `apps/api`: Express API with public results browsing endpoints
- `apps/web`: Next.js web app with locale-prefixed results pages
- `packages/{types,schemas,domain,i18n,utils}`: shared contracts and helpers
- Prisma 7 + PostgreSQL for canonical result storage

The current shipped Slice 1 feature is **public Thai lottery results browsing**:

- latest results
- result history
- result detail by draw date
- published-only visibility
- multilingual-ready web UI for `en`, `th`, and `my`

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

3. Update `DATABASE_URL` in `.env` so it points to your PostgreSQL instance.

4. Generate the Prisma client:

```bash
pnpm db:generate
```

5. Apply migrations:

```bash
pnpm db:migrate:deploy
```

6. Seed Slice 1 development data:

```bash
pnpm db:seed
```

The seed creates:

- 1 bootstrap admin
- 2 published draws
- 1 draft draw

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

## Slice 1 API

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

## Slice 1 Web Routes

Assuming the web app runs at `http://localhost:3000`:

- `/en/results`
- `/en/results/history`
- `/en/results/2026-03-01`
- `/th/results`
- `/my/results`

The seeded draft draw `2026-03-16` should not appear publicly and should resolve to not-found on the detail route.

## Verification

Run the full Slice 1 verification flow:

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
- Open `http://localhost:3000/th/results`
- Open `http://localhost:3000/my/results`
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
- Redis, checker logic, admin workflows, and caching are not part of Slice 1.
- The API handles `SIGINT` and `SIGTERM` with graceful shutdown, including Prisma disconnect.
