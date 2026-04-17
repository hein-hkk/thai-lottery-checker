# Thai Lottery Checker

Thai Lottery Checker is a monorepo for a multilingual lottery product with a public web experience and a protected admin area.

The current shipped baseline includes:

- public Thai lottery results browsing
- public locale landing page with latest preview, history preview, and blog teasers
- public embedded number checker with draw-detail overlay results
- public multilingual blog list and detail reading
- admin auth/session with signed HTTP-only cookies plus server-side expiry and revocation
- invitation-based admin onboarding
- admin password reset
- super-admin account management
- admin result draft, publish, and correction flows
- admin blog draft, managed banner upload, translation, publish, and unpublish flows

Repo structure:

- `apps/api`: Express API for public and admin endpoints
- `apps/web`: Next.js web app for public routes and protected `/admin` routes
- `packages/{types,schemas,domain,i18n,utils}`: shared contracts and domain helpers
- Prisma 7 + PostgreSQL for canonical data storage

For deeper product and architecture details, see:

- [Implementation roadmap](docs/roadmap/implementation-roadmap.md)
- [Slice 8 delivery notes](docs/roadmap/slice-8-web-refinement-and-production-readiness.md)
- [Slice 7 plan](docs/roadmap/slice-7-blog-banner-uploads-and-home-page-teasers.md)
- [Slice 5 plan](docs/roadmap/slice-5-blog-public-reading.md)
- [Slice 6 plan](docs/roadmap/slice-6-admin-blog-management.md)
- [Slice 2 plan](docs/roadmap/slice-2-admin-platform-foundation-and-result-management.md)
- [Blog banner storage setup](docs/architecture/blog-banner-storage.md)
- [Production security runbook](docs/operations/production-security-runbook.md)
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
- `APP_URL`
- `ADMIN_SESSION_SECRET`
- `ADMIN_SESSION_TTL_HOURS`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`
- `ADMIN_BOOTSTRAP_NAME`
- `API_TRUST_PROXY`

See [.env.example](.env.example) for the full local-development baseline.

If you want managed blog banner uploads in admin, also configure the `BLOG_BANNER_STORAGE_*` variables.
For AWS S3, leave `BLOG_BANNER_STORAGE_ENDPOINT` blank and set `BLOG_BANNER_STORAGE_PUBLIC_BASE_URL`.

If you want production invitation and password-reset emails, also configure:

- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- optional `EMAIL_REPLY_TO_ADDRESS`

Behavior notes:

- `EMAIL_PROVIDER=disabled` keeps local/dev manual-link behavior for admin invitations and password resets.
- In production, the API does not expose live invitation/reset URLs in responses.
- With `EMAIL_PROVIDER=resend`, the API sends invitation and password-reset links by email and requires `APP_URL` to point at the deployed HTTPS web origin.

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
- 32 published draws for public browsing and checker/history pagination
- 1 draft draw for admin workflows
- 27 published multilingual blog posts for public reading
- 3 draft multilingual blog posts for admin/blog workflow preparation

For a production-like empty database with only the bootstrap `super_admin`, use:

```bash
pnpm db:seed:admin
```

This removes lottery results, blog posts, admin audit/reset/invitation records, and non-bootstrap admins, then upserts the bootstrap `super_admin` from `.env`.

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

Development compiler note:

- The web app intentionally runs `next dev --webpack` in local development.
- Next 16's Turbopack dev server was observed to get stuck showing `Compiling...` on `/admin/blogs`, with the `next-server` Node process CPU and memory growing over time.
- The same admin blog workflow was stable under `next start`, so this was treated as a dev-compiler/HMR issue rather than an API or production runtime leak.
- The admin blog list also disables prefetching to editor routes and keeps its list API query limited to table fields to reduce unnecessary dev compile pressure.
- Re-test Turbopack explicitly with `pnpm --filter @thai-lottery-checker/web exec dotenv -e ../../.env -- next dev` before removing `--webpack`.

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

- `/{locale}`: primary landing page with the official latest-result preview, a published-history preview, and localized blog teasers when available
- `/{locale}/results`: dedicated bookmarkable latest-results page
- `/{locale}/results/history`: secondary full archive page
- `/{locale}/results/{drawDate}`: result detail page for a specific draw date
- `/{locale}/results/{drawDate}?checker=1&ticket=123456`: draw detail page with checker-result overlay state
- `/{locale}/blog`: localized public blog list page
- `/{locale}/blog/{slug}`: localized public blog detail page by shared slug

The public checker is embedded on the public pages above and navigates to the selected draw detail page for result presentation.

Current public shell behavior:

- public routes render a shared header, main content shell, and footer
- the footer appears on public pages only, not in `/admin`
- below `768px`, the footer centers its content and stacks nav links above the copyright line
- from `768px` upward, the footer uses a split row with legal copy on the left and links on the right
- route-level metadata now exists for:
  - `/{locale}`
  - `/{locale}/results`
  - `/{locale}/results/{drawDate}`
  - `/{locale}/blog`
  - `/{locale}/blog/{slug}`

## Admin Web Routes

Main admin routes:

- `/admin/login`
- `/admin`
- `/admin/admins`
- `/admin/blogs`
- `/admin/blogs/new`
- `/admin/results`
- `/admin/invitations/accept`
- `/admin/reset-password/request`
- `/admin/reset-password/confirm`

Use the seeded bootstrap admin credentials from `.env` to sign in at `/admin/login`.

Admin onboarding and recovery delivery:

- local/dev with `EMAIL_PROVIDER=disabled`: the API may return manual invitation/reset URLs
- staging/production with `EMAIL_PROVIDER=resend`: invitations and password resets are delivered by email instead

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
- `/api/v1/admin/blogs*`
- `/api/v1/admin/results*`

These endpoints are protected by the admin auth and permission model. Public result endpoints continue to expose published draws only.

Admin result endpoints:

- `GET /api/v1/admin/results?page={page}&limit={limit}`
- `GET /api/v1/admin/results/:id`
- `POST /api/v1/admin/results`
- `PATCH /api/v1/admin/results/:id`
- `POST /api/v1/admin/results/:id/prize-groups/:prizeType/release`
- `POST /api/v1/admin/results/:id/prize-groups/:prizeType/unrelease`
- `POST /api/v1/admin/results/:id/publish`
- `PATCH /api/v1/admin/results/:id/correct`

Admin result behavior:

- every endpoint requires admin auth and `manage_results`
- list pagination defaults to `page=1` and `limit=5`, with `limit` capped at `50`

Admin blog endpoints:

- `GET /api/v1/admin/blogs?status={all|draft|published}&page={page}&limit={limit}`
- `GET /api/v1/admin/blogs/:id`
- `POST /api/v1/admin/blogs`
- `PATCH /api/v1/admin/blogs/:id`
- `POST /api/v1/admin/blogs/:id/banner/upload-init`
- `POST /api/v1/admin/blogs/:id/banner/complete`
- `DELETE /api/v1/admin/blogs/:id/banner`
- `PUT /api/v1/admin/blogs/:id/translations/:locale`
- `POST /api/v1/admin/blogs/:id/publish`
- `POST /api/v1/admin/blogs/:id/unpublish`

Admin blog behavior:

- every endpoint requires admin auth and `manage_blogs`
- list pagination defaults to `page=1` and `limit=5`, with `limit` capped at `50`
- drafts start with `status: "draft"` and `publishedAt: null`
- metadata writes are slug-only; banner uploads use dedicated endpoints
- publishing requires at least one valid translation with a title and paragraph body
- unpublishing returns the post to draft state and removes it from public blog visibility immediately
- banner upload endpoints require blog banner storage configuration and return `503` when storage is unavailable

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

If any of the database commands fail locally, confirm that PostgreSQL is running and that `DATABASE_URL` points to a reachable database before retrying migration, seed, and tests.

Manual checks:

- Open `http://localhost:3000/en`
- Confirm the primary public header shows `Home`, `Latest results`, and `Blog`
- Confirm the landing page latest section shows the refined title `Check the Latest Thai Lottery Results` and description `View official results and check your ticket instantly.`
- Confirm the landing page latest section still shows latest draw metadata below the section copy
- Confirm the landing page history preview appears before the blog teaser section
- Confirm the checker panel uses `Check Your Ticket` and `Check Ticket`
- Confirm the landing page blog teaser section shows the refined helper copy `Learn how Thai lottery works and how to check results`, uses `View more` for the section CTA, and links to `/{locale}/blog`
- Confirm the public footer appears below the main content on public pages and does not appear on `/admin`
- Confirm on narrow screens the footer centers its content, shows nav links above the copyright line, and keeps desktop split layout from `768px` upward
- Inspect the page source or browser metadata for `/{locale}` and confirm it has explicit localized title, description, and canonical URL
- Open `http://localhost:3000/en/results`
- Confirm the latest page shows the same localized trust-focused title/description plus latest draw metadata
- Inspect the page source or browser metadata for `/{locale}/results` and confirm it has explicit localized title, description, and canonical URL
- Open `http://localhost:3000/en/results/history`
- Confirm history remains directly reachable but is no longer a primary nav item
- Open `http://localhost:3000/en/blog`
- Confirm the blog list page title reads `Thai Lottery Guides & Tips`
- Confirm the blog list page description reads `Learn how Thai lottery results work, how to check your ticket, and what each prize means.`
- Confirm the blog list page renders published English posts with localized metadata and pagination controls
- Open `http://localhost:3000/th/blog`
- Confirm locale-specific filtering hides English-only posts from the Thai blog list
- Open `http://localhost:3000/en/blog/how-to-check-thai-lottery`
- Confirm the blog detail page renders paragraph content, banner image, and localized metadata fallback behavior
- Open `http://localhost:3000/en/results/2026-03-01`
- Inspect the page source or browser metadata for `/{locale}/results/{drawDate}` and confirm it has a draw-specific title, description, and canonical URL
- Use the embedded checker on a public page and confirm it navigates to the selected draw detail page with `checker` and `ticket` query params
- Confirm the draw detail page opens the checker overlay and keeps the official draw numbers visible behind it
- Open `http://localhost:3000/my`
- Confirm the page renders without a hydration mismatch and that localized dates stay stable between server render and client hydration
- Open `http://localhost:3000/admin/login`
- Sign in with the bootstrap admin from `.env`
- Open `http://localhost:3000/admin/admins`
- Open `http://localhost:3000/admin/results`
- Open `http://localhost:3000/admin/blogs`
- Create a draft post, save an English translation, publish it, then unpublish it again
- If banner storage is configured, upload a banner from `/admin/blogs/:id`, confirm it renders on the public blog card/detail pages, then remove or replace it
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
pnpm db:seed:admin
pnpm db:studio
pnpm test:security
```

## Security Checks

Run the practical MVP security suite before production-like verification:

```bash
pnpm test:security
```

The suite covers admin authentication, session expiry and revocation, permission boundaries, public/admin data visibility, validation errors, CORS/origin behavior, admin and public-route rate limiting, production secret validation, and blog banner upload safety.

Before a release, also run a dependency audit and review production secrets/configuration:

```bash
pnpm audit --prod
```

Confirm committed files do not contain real secrets, `ADMIN_SESSION_SECRET` and `ADMIN_BOOTSTRAP_PASSWORD` are not using development defaults, `APP_URL` matches the deployed web origin, and any configured blog banner bucket has the expected CORS policy.

The API now also enforces:

- signed admin sessions with explicit server-checked expiry and logout revocation
- rate limits for login, password reset, invitation acceptance, and authenticated admin writes
- rate limits for public result/blog reads and checker submissions
- origin validation for admin `POST`/`PUT`/`PATCH`/`DELETE` routes
- stricter HTTP response headers and request IDs in security logs
- production env validation that rejects development-default admin secrets

Production configuration should set:

- `APP_URL` and/or `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin
- `API_TRUST_PROXY` for the production reverse proxy/load balancer
- session, admin rate-limit, and public/checker rate-limit env values appropriate for your threat model and traffic

For the non-code operational checklist, use the [production security runbook](docs/operations/production-security-runbook.md).

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
- Blog banner storage is optional infrastructure; when it is not configured, the admin banner upload endpoints return `503` while the rest of the app continues working.
- Mobile features and analytics remain outside the currently shipped baseline.
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
