# Slice 1 Implementation Plan: Public Results Browsing

## Summary

Implement the first real domain slice on top of the finished foundation skeleton by adding canonical Thai lottery result browsing end to end:

- PostgreSQL schema for `lottery_draws` and `lottery_results`
- read-only public results module in the Express API
- shared result domain/types/schemas packages
- locale-aware web pages for latest, history, and draw detail
- development seed data and a lightweight test harness

The implementation should follow the updated [project-spec.md](/Users/hkk/Documents/Playground/thai-lottery-checker/docs/architecture/project-spec.md) and [database-schema.md](/Users/hkk/Documents/Playground/thai-lottery-checker/docs/architecture/database-schema.md), keep the modular monolith shape, and make the web app consume the public API rather than reading the database directly.

## Key Changes

### Data model and database bootstrap

- Extend `apps/api/prisma/schema.prisma` from the current foundation-only heartbeat model to include:
  - `PublishStatus` enum
  - `PrizeType` enum with all 9 canonical prize groups
  - `AdminRole` enum only if needed to satisfy the existing schema references
  - `Admin` model with the minimum fields needed for foreign keys and seed/bootstrap use
  - `LotteryDraw` model
  - `LotteryResult` model
- Preserve the result-domain rules from the updated docs:
  - `draw_date` unique
  - public reads only from `status = published`
  - `published_at` set for published draws
  - `number` stored as string
  - unique `(draw_id, prize_type, prize_index)`
- Keep the schema limited to what Slice 1 needs plus the minimal seeded admin row required by the documented foreign keys. Do not add audit logs, checker tables, or cache tables yet.
- Add a seed entrypoint for local development with:
  - 1 complete published draw minimum, preferably 2 published + 1 draft so latest/history/detail and visibility behavior can all be exercised
  - full canonical counts for published draws
  - at least one leading-zero value in a 6-digit group and one tail group

### Shared result domain, types, and schemas

- Add `packages/types` exports for:
  - `PrizeType`
  - `PrizeGroup`
  - `ResultDetailResponse`
  - `ResultHistoryItem`
  - `ResultHistoryResponse`
  - optional internal DTOs for grouped result data if needed by both API and web
- Add `packages/domain` result helpers for:
  - canonical prize metadata table with label key, digit length, expected count, and display order
  - grouping flat result rows into ordered `prizeGroups`
  - validating prize numbers against canonical rules
  - completeness check for published draws
- Add `packages/schemas` Zod schemas for:
  - `drawDate` route param
  - history query params with defaults and caps
  - detail/latest response
  - history response
- Export these through existing package entrypoints so both apps can consume them without deep imports.

### API module and public contract

- Create the first feature module under `apps/api/src/modules/results` with:
  - `results.routes.ts`
  - `results.controller.ts`
  - `results.service.ts`
  - `results.repository.ts`
  - `results.mapper.ts`
  - `results.errors.ts` or equivalent small error module
- Register the results router in `apps/api/src/app.ts` under `/api/v1/results`.
- Repository responsibilities:
  - fetch latest published draw with enough data to determine detail payload
  - fetch published draw by `draw_date`
  - fetch paginated published draw history ordered by `draw_date DESC`
  - fetch result rows for one draw ordered by `prize_type` and `prize_index`
- Service responsibilities:
  - validate request params
  - enforce published-only visibility
  - map Prisma rows to shared DTOs
  - group detail/latest prize rows into canonical `prizeGroups`
  - summarize history rows using `firstPrize` and `lastTwo`
  - optionally assert completeness for published draws and fail fast if seed/data is internally inconsistent
- Public API contract:
  - `GET /api/v1/results/latest` returns latest published draw detail payload
  - `GET /api/v1/results` returns `{ items, page, limit, total }`
  - `GET /api/v1/results/:drawDate` returns published draw detail payload
- Error contract:
  - `400` for invalid `drawDate`, `page`, or `limit`
  - `404` for missing or unpublished draw
  - use stable machine-readable codes such as `INVALID_DRAW_DATE` and `RESULT_NOT_FOUND`

### Web app routes and UI

- Keep the web app API-first: pages fetch from `NEXT_PUBLIC_API_BASE_URL` using the public results endpoints.
- Recommended route structure:
  - `/[locale]/results` for latest result
  - `/[locale]/results/history` for paginated history
  - `/[locale]/results/[drawDate]` for detail
- This is better than collapsing history into the index route because it matches the existing docs and keeps latest vs history UX distinct.
- Add a small results component set under `apps/web/src/components/results` or an equivalent app-local component path already consistent with the repo:
  - result header/meta block
  - prize group section
  - grouped number grid/table
  - history list
  - shared empty/error state
- Page behavior:
  - latest page shows draw metadata, all prize groups, and link to history
  - history page shows paginated published draws with `firstPrize`, `lastTwo`, and detail links
  - detail page shows the full ordered grouped result for one draw date
- Preserve number strings exactly as returned; do not localize digits.
- Keep styling simple and consistent with the existing web shell rather than trying to design a full branded results UI in this slice.

### Localization and copy

- Add result label/message support into `packages/i18n` using the current locale helpers pattern.
- Include keys for:
  - latest results
  - result history
  - draw date
  - published at
  - each prize group label
  - not found / unavailable states
  - history pagination labels if included
- Keep the i18n surface limited to static UI copy; result numbers remain unchanged across locales.

### Testing and verification

- Add a lightweight test runner for the first feature slice. Recommendation: use `vitest` workspace-wide for shared package and API tests; do not add full browser/E2E tooling yet.
- Cover:
  - domain grouping preserves canonical order
  - digit/count metadata matches documented rules
  - leading-zero values survive grouping and mapping
  - latest query excludes draft draws
  - detail query returns `404` for draft/missing draws
  - history returns published draws only in descending order
  - controller/service validation returns `400` for invalid date/query params
- For web, rely on typecheck plus manual smoke verification in this slice unless a minimal server-component test emerges naturally from the chosen setup.
- Manual acceptance should verify:
  - `/en/results`
  - `/en/results/history`
  - `/en/results/2026-03-01`
  - locale switching
  - draft draw never appears publicly

## Public APIs / Interfaces

- Prisma additions:
  - `PublishStatus`
  - `PrizeType`
  - `Admin`
  - `LotteryDraw`
  - `LotteryResult`
- Shared interfaces:
  - `PrizeType`
  - `PrizeGroup { type, numbers }`
  - `ResultDetailResponse { drawDate, drawCode, publishedAt, prizeGroups }`
  - `ResultHistoryItem { drawDate, drawCode, firstPrize, lastTwo }`
  - `ResultHistoryResponse { items, page, limit, total }`
- Public API endpoints:
  - `GET /api/v1/results/latest`
  - `GET /api/v1/results`
  - `GET /api/v1/results/:drawDate`
- Web routes:
  - `/[locale]/results`
  - `/[locale]/results/history`
  - `/[locale]/results/[drawDate]`

## Test Plan

- Database:
  - migration applies cleanly on top of the foundation schema
  - seed inserts bootstrap admin, published draws, and at least one draft draw
  - uniqueness on `(draw_id, prize_type, prize_index)` holds
- Domain/package tests:
  - canonical prize metadata table matches docs exactly
  - grouping returns all groups in the documented order
  - string values such as `000001`, `012345`, and `06` remain unchanged
- API tests:
  - latest returns the newest published draw only
  - history paginates and orders by `draw_date DESC`
  - detail returns grouped result data for a published draw
  - invalid date returns `400`
  - draft or missing draw returns `404`
- Web/manual tests:
  - latest, history, and detail pages render against the API
  - history links reach detail pages correctly
  - unsupported locale still 404s through the existing locale guard
  - pages render in all three locales with translated labels

## Assumptions and Defaults

- Web data path: API-first. The Next app should not access Prisma directly in Slice 1.
- Testing level: minimal test harness now, not full end-to-end coverage.
- Seed data should include 2 published draws and 1 draft draw by default because that gives better coverage than the single-draw minimum with little extra cost.
- `Admin` is included only as the minimum practical bootstrap dependency for documented result foreign keys.
- History pagination should default to `page=1` and `limit=20`, with a server-side max cap to prevent accidental large responses.
- Slice 1 stays read-only. No admin workflows, checker logic, Redis caching, or rate limiting are added.
- The existing [docs/roadmap/slice-1-results-browsing.md](/Users/hkk/Documents/Playground/thai-lottery-checker/docs/roadmap/slice-1-results-browsing.md) is now partially stale versus the updated spec/schema; implementation should follow the updated architecture docs first, and that roadmap doc should be revised afterward.
