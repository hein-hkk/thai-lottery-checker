# Thai Lottery Checker

Thai Lottery Checker is a monorepo for a multilingual lottery product with a public web experience and a protected admin area.

The current shipped baseline includes:

- public Thai lottery results browsing
- public locale landing page with latest preview and history entry point
- public embedded number checker with draw-detail overlay results
- public multilingual blog list and detail reading
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
- [Slice 5 plan](docs/roadmap/slice-5-blog-public-reading.md)
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
- 2 published blog posts for public reading
- 1 draft blog post for admin/blog workflow preparation

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

- `/en`
- `/en/results`
- `/en/results/history`
- `/en/results/2026-03-01`
- `/en/blog`
- `/en/blog/how-to-check-thai-lottery`
- `/th`
- `/th/results`
- `/th/blog`
- `/my`
- `/my/results`
- `/my/blog`

Current public route roles:

- `/{locale}`: primary landing page with the official latest-result preview and a published-history preview
- `/{locale}/results`: dedicated bookmarkable latest-results page
- `/{locale}/results/history`: secondary full archive page
- `/{locale}/results/{drawDate}`: result detail page for a specific draw date
- `/{locale}/results/{drawDate}?checker=1&ticket=123456`: draw detail page with checker-result overlay state
- `/{locale}/blog`: localized public blog list page
- `/{locale}/blog/{slug}`: localized public blog detail page by shared slug

The public checker is embedded on the public pages above and navigates to the selected draw detail page for result presentation.

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

Results base URL:

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

Blog base URL:

```text
http://localhost:4000/api/v1/blogs
```

Endpoints:

- `GET /?locale={locale}&page={page}&limit={limit}`
- `GET /:slug?locale={locale}`

Examples:

```bash
curl "http://localhost:4000/api/v1/blogs?locale=en&page=1&limit=12"
curl "http://localhost:4000/api/v1/blogs/how-to-check-thai-lottery?locale=en"
curl "http://localhost:4000/api/v1/blogs/how-to-check-thai-lottery?locale=th"
```

Blog behavior:

- only `published` posts with non-null `publishedAt` are public
- blog detail requires a translation for the requested locale
- no locale fallback is applied for public blog pages
- blog body content is paragraph-block JSON in the current Slice 5 public contract

## Checker API

Base URL:

```text
http://localhost:4000/api/v1/checker
```

Endpoints:

- `GET /draws`
- `POST /check`

Examples:

```bash
curl http://localhost:4000/api/v1/checker/draws
curl -X POST http://localhost:4000/api/v1/checker/check \
  -H "Content-Type: application/json" \
  -d '{"ticketNumber":"820866","drawDate":"2026-03-01"}'
```

Checker behavior:

- ticket numbers must be exactly 6 digits
- omitted `drawDate` resolves to the latest public draw
- Bangkok-today public drafts may return `checkStatus: "partial"`
- checker responses include per-match prize amounts and `totalWinningAmount`

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

- Open `http://localhost:3000/en`
- Confirm the primary public header shows `Home`, `Latest results`, and `Blog`
- Confirm the landing page latest section shows a trust-focused localized title/description with latest draw metadata below it
- Open `http://localhost:3000/en/results`
- Confirm the latest page shows the same localized trust-focused title/description plus latest draw metadata
- Open `http://localhost:3000/en/results/history`
- Confirm history remains directly reachable but is no longer a primary nav item
- Open `http://localhost:3000/en/blog`
- Confirm the blog list page renders published English posts with localized metadata and pagination controls
- Open `http://localhost:3000/th/blog`
- Confirm locale-specific filtering hides English-only posts from the Thai blog list
- Open `http://localhost:3000/en/blog/how-to-check-thai-lottery`
- Confirm the blog detail page renders paragraph content, banner image, and localized metadata fallback behavior
- Open `http://localhost:3000/en/results/2026-03-01`
- Use the embedded checker on a public page and confirm it navigates to the selected draw detail page with `checker` and `ticket` query params
- Confirm the draw detail page opens the checker overlay and keeps the official draw numbers visible behind it
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
- Blog management, mobile features, and analytics remain outside the currently shipped baseline.
- The API handles `SIGINT` and `SIGTERM` with graceful shutdown, including Prisma disconnect.

## License

This project is licensed under the MIT License.

You are free to use, modify, and distribute the source code.

---

## Brand & Trademark

"LottoKai" and all related branding (logo, design, identity) are NOT open source.

They are protected and may NOT be used without permission.

See:
- TRADEMARK.md
- BRAND_LICENSE.md
