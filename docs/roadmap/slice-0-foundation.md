# Slice 0 Plan: Foundation Skeleton

## Summary

Implement a docs-to-code bootstrap for a new `pnpm` monorepo with two apps and five shared TypeScript packages:

- `apps/web`: Next.js 16 App Router app with locale-prefixed routing for `/en`, `/th`, `/my`
- `apps/api`: Express 5 + TypeScript API exposing `GET /health`
- `packages/{types,schemas,domain,i18n,utils}`: importable workspace packages with minimal placeholder exports only
- PostgreSQL foundation using Prisma 7 for connection management and migrations
- `.env`-driven configuration, local developer docs, and runnable acceptance checks

This slice must stop at platform scaffolding only. No lottery/result/blog/auth/checker business behavior, no domain tables, and no feature UI beyond locale shell pages and health verification.

## Implementation Changes

### Monorepo and shared tooling

- Create root workspace files for `pnpm` workspaces, root `package.json`, shared `tsconfig` base, and common scripts for `dev`, `build`, `lint`, `typecheck`, `db:*`.
- Keep orchestration simple with `pnpm` workspace scripts rather than adding an extra task runner in Slice 0.
- Set up package naming/import aliases so both apps can import from all shared packages through normal workspace package names.
- Add each shared package with:
  - `package.json`
  - `tsconfig.json`
  - `src/index.ts`
  - minimal placeholder exports that prove cross-package imports work
- Add one cross-package smoke usage:
  - web imports locale constants/helpers from `packages/i18n`
  - api imports a shared type or utility from a shared package

### Web app foundation

- Initialize `apps/web` as a TypeScript Next.js 16 app using the App Router.
- Configure TailwindCSS 4 for the web app as the baseline styling system.
- Implement locale segment routing via `app/[locale]` and middleware/route guards so only `en`, `th`, and `my` are accepted.
- Provide a minimal localized shell page for each locale route and a root redirect to the default locale.
- Add shared config for reading public env values safely in the web app.
- Keep styling minimal; TailwindCSS is added only as foundation, not for full feature UI in Slice 0.

### API, database, and migrations

- Initialize `apps/api` with Express 5, TypeScript, startup script, and a health router exposing `GET /health`
- Design the API bootstrap to support graceful shutdown.
- Handle `SIGINT` and `SIGTERM` by closing the HTTP server cleanly and disconnecting Prisma before exit.
- Add centralized env parsing for API and database config, including required PostgreSQL connection string(s).
- Standardize on Prisma 7 for Slice 0:
  - Prisma schema and client generation setup
  - database connection module used by the API
  - initial migration workflow
- Keep the initial database schema foundation-only:
  - include only the minimum schema needed to verify migration execution and DB connectivity
  - do not create feature/domain tables such as lottery/blog/auth entities yet
- Add a lightweight startup or health-path DB connectivity check strategy so acceptance can confirm the API can reach PostgreSQL without making the health endpoint brittle in normal local use.

### Developer experience and documentation

- Add `.env.example` covering web URL, API port, default locale, and PostgreSQL connection values.
- Write a root `README` with exact setup steps:
  - install dependencies
  - configure `.env`
  - run Prisma migration commands
  - start web and API
  - verify `/en`, `/th`, `/my`, `GET /health`, and DB connectivity
- Document that local development assumes an externally provided PostgreSQL instance.

## Public APIs / Interfaces

- Web routes:
  - `/` redirects to default locale
  - `/en`
  - `/th`
  - `/my`
- API route:
  - `GET /health` returns service health status, and includes DB status if reachable without exposing secrets
- Shared package interfaces:
  - stable workspace package entrypoints for `types`, `schemas`, `domain`, `i18n`, `utils`
- Environment contract:
  - root-level `.env` variables for API port, web base URL/default locale, and PostgreSQL connection string

## Test Plan

- Install and typecheck all workspaces successfully.
- Start web app and verify:
  - `/en`, `/th`, `/my` render
  - unsupported locale path is rejected or redirected per middleware behavior
  - `/` redirects to the chosen default locale
- Start API and verify:
  - `GET /health` returns `200`
  - health response reflects service readiness and DB status
- Run Prisma migration commands against PostgreSQL successfully on a fresh database.
- Verify the API can establish a database connection using the configured env values.
- Verify shared workspace packages resolve correctly from both apps during build/typecheck.

## Assumptions and Defaults

- TailwindCSS 4 is only for the web app in Slice 0, not yet for a shared ui package or admin design system.
- Database/migration tooling: Prisma 7.
- Local database provisioning: developers provide an external PostgreSQL instance; Slice 0 will not add Docker Compose.
- Default locale: `en` unless the repo owner wants a different default later.
- No feature-domain tables are created in this slice; the initial migration is only for bootstrap/database validation.
- `pnpm` workspace scripts are sufficient for Slice 0; no Turborepo/Nx layer is added yet.
