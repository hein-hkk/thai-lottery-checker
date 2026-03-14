# Thai Lottery Checker

Slice 0 sets up the monorepo foundation for the Thai Lottery Checker project. It includes a Next.js web app with Tailwind CSS 4, an Express API, shared TypeScript packages, Prisma-based PostgreSQL access, and minimal locale-aware routing.

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

5. Run the initial migration against a fresh database:

```bash
pnpm db:migrate:dev
```

## Run the apps

Start both apps together from the repo root:

```bash
pnpm dev
```

Or start them individually:

```bash
pnpm build:packages
pnpm --filter @thai-lottery-checker/web dev
pnpm --filter @thai-lottery-checker/api dev
```

## Verification

- Web app:
  - Open `http://localhost:3000/en`
  - Open `http://localhost:3000/th`
  - Open `http://localhost:3000/my`
  - Open `http://localhost:3000/` and confirm it redirects to the default locale
  - Confirm the locale shell page is styled through Tailwind CSS
- API:
  - Request `GET http://localhost:4000/health`
  - Confirm the response reports API status and database reachability
  - Stop the API with `Ctrl+C` and confirm it shuts down cleanly
- Database:
  - Confirm `pnpm db:migrate:dev` completes successfully
  - Confirm the API health response reports the database as reachable

## Useful commands

```bash
pnpm build:packages
pnpm build
pnpm lint
pnpm typecheck
pnpm db:generate
pnpm db:migrate:dev
pnpm db:migrate:deploy
pnpm db:studio
```

## Workspace layout

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

- This slice intentionally excludes lottery result features, blog features, auth, and ticket-checking business logic.
- Local development expects an externally provided PostgreSQL instance.
- The API handles `SIGINT` and `SIGTERM` with graceful shutdown, including Prisma disconnect.
