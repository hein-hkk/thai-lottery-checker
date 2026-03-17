# Slice 1: Results Browsing Core

## Summary

Slice 1 delivers the first end-to-end public feature in the Thai Lottery Checker project:

- latest result browsing
- result history browsing
- result detail by draw date
- published-only visibility
- multilingual-ready web UI

This slice is intentionally **read-only**. It does not include admin entry, corrections, checker logic, auth, or caching.

## Implemented Result Model

Slice 1 uses the canonical Thai Government Lottery public result structure with these prize groups:

- `FIRST_PRIZE`
- `NEAR_FIRST_PRIZE`
- `SECOND_PRIZE`
- `THIRD_PRIZE`
- `FOURTH_PRIZE`
- `FIFTH_PRIZE`
- `FRONT_THREE`
- `LAST_THREE`
- `LAST_TWO`

Canonical counts per published draw:

- `FIRST_PRIZE`: 1
- `NEAR_FIRST_PRIZE`: 2
- `SECOND_PRIZE`: 5
- `THIRD_PRIZE`: 10
- `FOURTH_PRIZE`: 50
- `FIFTH_PRIZE`: 100
- `FRONT_THREE`: 2
- `LAST_THREE`: 2
- `LAST_TWO`: 1

Rules:

- numbers are stored as strings
- leading zeros are preserved
- `prize_index` defines stable order within a prize group
- public browsing exposes only `status = published` draws

## Database Scope

Slice 1 activates the minimal result-domain schema:

- `lottery_draws`
- `lottery_results`

Supporting practical assumption:

- a bootstrap seeded admin row is used to satisfy `created_by_admin_id` and `updated_by_admin_id` until later admin slices implement full result-entry workflows

Seeded local development data includes:

- 1 bootstrap admin
- 2 published draws
- 1 draft draw

## Public API

Base path:

```text
/api/v1/results
```

Endpoints:

- `GET /api/v1/results/latest`
- `GET /api/v1/results`
- `GET /api/v1/results/:drawDate`

### Latest / detail response

```json
{
  "drawDate": "2026-03-01",
  "drawCode": "2026-03-01",
  "publishedAt": "2026-03-01T09:30:00.000Z",
  "prizeGroups": [
    { "type": "FIRST_PRIZE", "numbers": ["820866"] },
    { "type": "NEAR_FIRST_PRIZE", "numbers": ["820865", "820867"] },
    { "type": "SECOND_PRIZE", "numbers": ["328032", "716735", "320227", "000001", "999999"] },
    { "type": "THIRD_PRIZE", "numbers": ["123456", "234567", "345678", "456789", "567890", "678901", "789012", "890123", "901234", "012345"] },
    { "type": "FOURTH_PRIZE", "numbers": ["..."] },
    { "type": "FIFTH_PRIZE", "numbers": ["..."] },
    { "type": "FRONT_THREE", "numbers": ["068", "837"] },
    { "type": "LAST_THREE", "numbers": ["054", "479"] },
    { "type": "LAST_TWO", "numbers": ["06"] }
  ]
}
```

### History response

```json
{
  "items": [
    {
      "drawDate": "2026-03-01",
      "drawCode": "2026-03-01",
      "firstPrize": "820866",
      "lastTwo": "06"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 2
}
```

### Error contract

```json
{
  "code": "RESULT_NOT_FOUND",
  "message": "Result draw was not found"
}
```

Implemented error behaviors:

- invalid `drawDate` -> `400`, `INVALID_DRAW_DATE`
- invalid `page` / `limit` -> `400`, `INVALID_QUERY`
- missing or unpublished draw -> `404`, `RESULT_NOT_FOUND`
- invalid published draw data -> `500`, `RESULT_DATA_INVALID`

## Web Routes

Slice 1 web routes are locale-prefixed and API-first:

- `/[locale]/results`
- `/[locale]/results/history`
- `/[locale]/results/[drawDate]`

Behavior:

- latest page renders the newest published draw
- history page renders paginated published draws only
- detail page renders the full grouped result
- missing or unpublished draw detail uses Next `notFound()`
- static labels are localized for `en`, `th`, and `my`
- result numbers are displayed exactly as returned by the API

## Verification

Automated checks:

- `pnpm db:generate`
- `pnpm db:migrate:deploy`
- `pnpm db:seed`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build:packages`
- `pnpm --filter @thai-lottery-checker/api build`
- `pnpm --filter @thai-lottery-checker/web build`

Manual checks:

- `/en/results`
- `/en/results/history`
- `/en/results/2026-03-01`
- `/en/results/2026-03-16` -> not-found
- `/th/results`
- `/my/results`

## Out of Scope

The following are explicitly not part of Slice 1:

- admin UI
- result input workflow
- result corrections
- ticket checker
- prize calculation beyond public result presentation
- authentication
- Redis caching
- rate limiting
- search/indexing work
